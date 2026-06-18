import {
  BankName,
  PayoutMethod,
  TransferStatus,
  type Beneficiary,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { creditSwissDeposit } from "../mock/mock.swiss.service.js";
import { processPayout, type PayoutBank } from "../mock/mock.payout.service.js";
import { disburseEtb, releaseEtb, reserveEtb } from "../liquidity/liquidity.service.js";
import { getTransferById } from "./transfers.service.js";
import { generateTxHash, transition } from "./transfers.state-machine.js";

const payoutBankForBeneficiary = (beneficiary: Beneficiary): PayoutBank => {
  if (beneficiary.payoutMethod === PayoutMethod.TELEBIRR) {
    return "telebirr";
  }

  switch (beneficiary.bank) {
    case BankName.CBE:
      return "cbe";
    case BankName.AWASH:
      return "awash";
    case BankName.DASHEN:
      return "dashen";
    default:
      throw AppError.badRequest("Unsupported beneficiary bank for payout");
  }
};

const getTransferForOrchestration = async (userId: string, transferId: string) => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
    include: { beneficiary: true },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  return transfer;
};

/**
 * Demo orchestration: simulates crypto deposit through payout completion (PRD §6, §7).
 */
export const simulateDeposit = async (userId: string, transferId: string) => {
  const transfer = await getTransferForOrchestration(userId, transferId);

  if (transfer.status !== TransferStatus.AWAITING_CRYPTO) {
    throw AppError.badRequest(
      `Transfer must be in AWAITING_CRYPTO to simulate deposit (current: ${transfer.status})`,
    );
  }

  const payoutEtb = Number(transfer.payoutEtb);
  let etbReserved = false;

  try {
    await transition(transferId, TransferStatus.BLOCKCHAIN_PENDING, { actorId: userId });

    const txHash = generateTxHash();
    await transition(transferId, TransferStatus.BLOCKCHAIN_CONFIRMED, {
      actorId: userId,
      txHash,
    });

    const swiss = await creditSwissDeposit({
      referenceId: transfer.reference,
      asset: transfer.asset,
      amount: Number(transfer.sendAmount),
    });

    await transition(transferId, TransferStatus.SWISS_FUNDS_RECEIVED, {
      actorId: userId,
      swissReference: swiss.swissReference,
    });

    await transition(transferId, TransferStatus.FX_CONVERTED, {
      actorId: userId,
      note: transfer.chfAmount
        ? `Using transfer snapshot: ${transfer.chfAmount.toString()} CHF -> ${transfer.grossEtb.toString()} ETB`
        : "Using legacy USD-to-ETB transfer snapshot",
    });

    await reserveEtb(payoutEtb, transfer.reference);
    etbReserved = true;

    await transition(transferId, TransferStatus.PAYOUT_PROCESSING, { actorId: userId });

    const bank = payoutBankForBeneficiary(transfer.beneficiary);
    const payoutResult = processPayout(
      bank,
      {
        referenceId: transfer.reference,
        amount: payoutEtb,
        accountNumber: transfer.beneficiary.accountNumber ?? undefined,
        phone: transfer.beneficiary.phoneNumber ?? undefined,
      },
      false,
    );

    if (!payoutResult.success) {
      throw AppError.badRequest(payoutResult.message);
    }

    const payoutReference =
      "reference" in payoutResult ? payoutResult.reference : payoutResult.transactionId;

    await transition(transferId, TransferStatus.PAYOUT_SENT, {
      actorId: userId,
      payoutReference,
    });

    await disburseEtb(payoutEtb, transfer.reference);
    etbReserved = false;

    await transition(transferId, TransferStatus.COMPLETED, { actorId: userId });

    return getTransferById(userId, transferId);
  } catch (error) {
    if (etbReserved) {
      await releaseEtb(payoutEtb, transfer.reference).catch(() => undefined);
    }

    const message =
      error instanceof Error ? error.message : "Transfer orchestration failed";

    if (
      (await prisma.transfer.findUnique({ where: { id: transferId } }))?.status !==
      TransferStatus.FAILED
    ) {
      await transition(transferId, TransferStatus.FAILED, {
        actorId: userId,
        failureReason: message,
      }).catch(() => undefined);
    }

    throw error instanceof AppError
      ? error
      : AppError.badRequest(message);
  }
};
