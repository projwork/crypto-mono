import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { TransferStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import type { BlockchainConfirmInput } from "./mock.schemas.js";

/** Events emitted for Module 9 orchestrator to subscribe to. */
export const mockEvents = new EventEmitter();

export interface BlockchainConfirmedEvent {
  transferId: string;
  reference: string;
  txHash: string;
}

/** PRD §4 blockchain confirm response shape (returned as-is, not wrapped in API envelope). */
export interface BlockchainConfirmResponse {
  txHash: string;
  confirmations: 12;
  status: "CONFIRMED";
}

const generateTxHash = (): string =>
  `0x${crypto.randomBytes(32).toString("hex")}`;

export const confirmBlockchainDeposit = async (
  input: BlockchainConfirmInput,
): Promise<BlockchainConfirmResponse> => {
  const transfer = await prisma.transfer.findFirst({
    where: input.transferId
      ? { id: input.transferId }
      : { reference: input.referenceId },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found for blockchain confirmation");
  }

  const txHash = input.txHash ?? transfer.txHash ?? generateTxHash();

  const allowedStatuses: TransferStatus[] = [
    TransferStatus.INITIATED,
    TransferStatus.AWAITING_CRYPTO,
    TransferStatus.BLOCKCHAIN_PENDING,
  ];

  await prisma.transfer.update({
    where: { id: transfer.id },
    data: {
      txHash,
      status: allowedStatuses.includes(transfer.status)
        ? TransferStatus.BLOCKCHAIN_CONFIRMED
        : transfer.status,
    },
  });

  const payload: BlockchainConfirmedEvent = {
    transferId: transfer.id,
    reference: transfer.reference,
    txHash,
  };

  mockEvents.emit("blockchain:confirmed", payload);

  return {
    txHash,
    confirmations: 12,
    status: "CONFIRMED",
  };
};
