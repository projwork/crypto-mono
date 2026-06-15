import crypto from "node:crypto";
import { TransferStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { logEvent } from "../audit/audit.service.js";
import { notify } from "../notifications/notifications.service.js";
import { emitTransferStatus } from "./transfers.events.js";

/** Allowed status transitions (PRD §7). Documented in CONTRACTS.md. */
export const ALLOWED_TRANSITIONS: Record<TransferStatus, TransferStatus[]> = {
  [TransferStatus.INITIATED]: [
    TransferStatus.AWAITING_CRYPTO,
    TransferStatus.FAILED,
    TransferStatus.EXPIRED,
  ],
  [TransferStatus.AWAITING_CRYPTO]: [
    TransferStatus.BLOCKCHAIN_PENDING,
    TransferStatus.FAILED,
    TransferStatus.EXPIRED,
  ],
  [TransferStatus.BLOCKCHAIN_PENDING]: [
    TransferStatus.BLOCKCHAIN_CONFIRMED,
    TransferStatus.FAILED,
    TransferStatus.EXPIRED,
  ],
  [TransferStatus.BLOCKCHAIN_CONFIRMED]: [
    TransferStatus.SWISS_FUNDS_RECEIVED,
    TransferStatus.FAILED,
  ],
  [TransferStatus.SWISS_FUNDS_RECEIVED]: [
    TransferStatus.FX_CONVERTED,
    TransferStatus.FAILED,
  ],
  [TransferStatus.FX_CONVERTED]: [
    TransferStatus.PAYOUT_PROCESSING,
    TransferStatus.FAILED,
  ],
  [TransferStatus.PAYOUT_PROCESSING]: [
    TransferStatus.PAYOUT_SENT,
    TransferStatus.FAILED,
  ],
  [TransferStatus.PAYOUT_SENT]: [TransferStatus.COMPLETED, TransferStatus.FAILED],
  [TransferStatus.COMPLETED]: [],
  [TransferStatus.FAILED]: [TransferStatus.REVERSED],
  [TransferStatus.REVERSED]: [],
  [TransferStatus.EXPIRED]: [],
};

export interface TransitionMeta {
  actorId?: string;
  txHash?: string;
  swissReference?: string;
  payoutReference?: string;
  failureReason?: string;
  note?: string;
}

const statusMessage = (status: TransferStatus, reference: string): string => {
  const messages: Partial<Record<TransferStatus, string>> = {
    [TransferStatus.BLOCKCHAIN_PENDING]: `Transfer ${reference}: awaiting blockchain confirmation`,
    [TransferStatus.BLOCKCHAIN_CONFIRMED]: `Transfer ${reference}: crypto deposit confirmed`,
    [TransferStatus.SWISS_FUNDS_RECEIVED]: `Transfer ${reference}: Swiss liquidity received`,
    [TransferStatus.FX_CONVERTED]: `Transfer ${reference}: FX conversion complete`,
    [TransferStatus.PAYOUT_PROCESSING]: `Transfer ${reference}: ETB payout processing`,
    [TransferStatus.PAYOUT_SENT]: `Transfer ${reference}: payout sent to recipient`,
    [TransferStatus.COMPLETED]: `Transfer ${reference}: completed successfully`,
    [TransferStatus.FAILED]: `Transfer ${reference}: failed`,
    [TransferStatus.EXPIRED]: `Transfer ${reference}: expired`,
    [TransferStatus.REVERSED]: `Transfer ${reference}: reversed`,
  };
  return messages[status] ?? `Transfer ${reference}: status updated to ${status}`;
};

export const generateTxHash = (): string =>
  `0x${crypto.randomBytes(32).toString("hex")}`;

export const transition = async (
  transferId: string,
  toStatus: TransferStatus,
  meta: TransitionMeta = {},
): Promise<void> => {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  const allowed = ALLOWED_TRANSITIONS[transfer.status];
  if (!allowed.includes(toStatus)) {
    throw AppError.badRequest(
      `Invalid transition from ${transfer.status} to ${toStatus}`,
      { from: transfer.status, to: toStatus },
    );
  }

  await prisma.transfer.update({
    where: { id: transferId },
    data: {
      status: toStatus,
      txHash: meta.txHash ?? transfer.txHash,
      swissReference: meta.swissReference ?? transfer.swissReference,
      payoutReference: meta.payoutReference ?? transfer.payoutReference,
      failureReason: meta.failureReason ?? transfer.failureReason,
      completedAt: toStatus === TransferStatus.COMPLETED ? new Date() : transfer.completedAt,
    },
  });

  await logEvent({
    actorId: meta.actorId ?? null,
    action: `TRANSFER_${toStatus}`,
    entityType: "Transfer",
    entityId: transferId,
    transferId,
    metadata: { from: transfer.status, to: toStatus, ...meta },
  });

  await notify({
    userId: transfer.senderId,
    message: statusMessage(toStatus, transfer.reference),
    transferId,
    data: { status: toStatus, reference: transfer.reference },
  });

  emitTransferStatus({
    transferId,
    reference: transfer.reference,
    status: toStatus,
    timestamp: new Date().toISOString(),
    metadata: meta.note ? { note: meta.note } : undefined,
  });
};
