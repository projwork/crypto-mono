import { TransferStatus, type Beneficiary, type Transfer, type User, type Wallet } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { toPublicBeneficiary } from "../beneficiaries/beneficiaries.service.js";
import { logEvent } from "../audit/audit.service.js";
import { notify } from "../notifications/notifications.service.js";
import { emitTransferStatus } from "../transfers/transfers.events.js";
import { toDepositAddress } from "../wallet/wallet.service.js";
import { transition } from "../transfers/transfers.state-machine.js";
import type { AdminOverrideTransferInput, AdminTransferListQuery } from "./admin.schemas.js";

type TransferWithRelations = Transfer & {
  beneficiary: Beneficiary;
  sender: Pick<User, "id" | "firstName" | "lastName" | "email">;
  wallet: Wallet | null;
};

const transferInclude = {
  beneficiary: true,
  sender: { select: { id: true, firstName: true, lastName: true, email: true } },
  wallet: true,
} as const;

export const toAdminTransfer = (transfer: TransferWithRelations) => ({
  id: transfer.id,
  reference: transfer.reference,
  status: transfer.status,
  asset: transfer.asset,
  sendAmount: transfer.sendAmount.toString(),
  feeCrypto: transfer.feeCrypto.toString(),
  usdValue: transfer.usdValue.toString(),
  payoutEtb: transfer.payoutEtb.toString(),
  grossEtb: transfer.grossEtb.toString(),
  feeEtb: transfer.feeEtb.toString(),
  txHash: transfer.txHash,
  swissReference: transfer.swissReference,
  payoutReference: transfer.payoutReference,
  failureReason: transfer.failureReason,
  createdAt: transfer.createdAt,
  updatedAt: transfer.updatedAt,
  completedAt: transfer.completedAt,
  sender: {
    id: transfer.sender.id,
    name: `${transfer.sender.firstName} ${transfer.sender.lastName}`,
    email: transfer.sender.email,
  },
  beneficiary: toPublicBeneficiary(transfer.beneficiary),
  depositAddress: transfer.wallet ? toDepositAddress(transfer.wallet) : null,
});

export type AdminTransfer = ReturnType<typeof toAdminTransfer>;

export const listAdminTransfers = async (filters: AdminTransferListQuery) => {
  const transfers = await prisma.transfer.findMany({
    where: {
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.asset ? { asset: filters.asset } : {}),
      ...(filters.reference
        ? { reference: { contains: filters.reference, mode: "insensitive" } }
        : {}),
    },
    include: transferInclude,
    orderBy: { createdAt: "desc" },
    take: filters.limit,
  });

  return transfers.map(toAdminTransfer);
};

export const getAdminTransfer = async (transferId: string) => {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    include: transferInclude,
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  return toAdminTransfer(transfer);
};

/** Admin override for failed transfers — reverse (state machine) or force complete. */
export const overrideFailedTransfer = async (
  adminId: string,
  transferId: string,
  input: AdminOverrideTransferInput,
) => {
  const transfer = await prisma.transfer.findUnique({ where: { id: transferId } });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  if (transfer.status !== TransferStatus.FAILED) {
    throw AppError.badRequest("Only failed transfers can be overridden", {
      status: transfer.status,
    });
  }

  if (input.action === "reverse") {
    await transition(transferId, TransferStatus.REVERSED, {
      actorId: adminId,
      note: input.note ?? "Admin reversed failed transfer",
    });
    await logEvent({
      actorId: adminId,
      action: "ADMIN_TRANSFER_OVERRIDE_REVERSE",
      entityType: "Transfer",
      entityId: transferId,
      transferId,
      metadata: { note: input.note },
    });
  } else {
    const updated = await prisma.transfer.update({
      where: { id: transferId },
      data: {
        status: TransferStatus.COMPLETED,
        failureReason: null,
        completedAt: new Date(),
        payoutReference: transfer.payoutReference ?? `ADMIN-${transfer.reference}`,
      },
      include: transferInclude,
    });

    await logEvent({
      actorId: adminId,
      action: "ADMIN_TRANSFER_OVERRIDE_COMPLETE",
      entityType: "Transfer",
      entityId: transferId,
      transferId,
      metadata: { from: TransferStatus.FAILED, to: TransferStatus.COMPLETED, note: input.note },
    });

    await notify({
      userId: transfer.senderId,
      message: `Transfer ${transfer.reference}: manually completed by admin`,
      transferId,
      data: { status: TransferStatus.COMPLETED, reference: transfer.reference },
    });

    emitTransferStatus({
      transferId,
      reference: transfer.reference,
      status: TransferStatus.COMPLETED,
      timestamp: new Date().toISOString(),
      metadata: input.note ? { note: input.note } : undefined,
    });

    return toAdminTransfer(updated);
  }

  return getAdminTransfer(transferId);
};
