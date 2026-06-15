import crypto from "node:crypto";
import { AssetType, type Transfer, type Wallet } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";

/** Public deposit address shape — documented in CONTRACTS.md. */
export const toDepositAddress = (wallet: Wallet) => ({
  id: wallet.id,
  transferId: wallet.transferId,
  asset: wallet.asset,
  address: wallet.address,
  createdAt: wallet.createdAt,
});

export type DepositAddress = ReturnType<typeof toDepositAddress>;

/** Deposit instructions for a transfer — documented in CONTRACTS.md. */
export interface DepositInstructions {
  transferId: string;
  reference: string;
  asset: AssetType;
  address: string;
  expectedAmount: string;
  network: string;
}

const getOwnedTransfer = async (userId: string, transferId: string): Promise<Transfer> => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  return transfer;
};

/** Deterministic mock Ethereum-style address for the prototype. */
export const generateMockAddress = (
  userId: string,
  transferId: string,
  asset: AssetType,
): string => {
  const hash = crypto
    .createHash("sha256")
    .update(`${userId}:${transferId}:${asset}`)
    .digest("hex");
  return `0x${hash.slice(0, 40)}`;
};

/**
 * Get or create a deposit wallet for a transfer. Exported for Module 8/9.
 * Does not move funds — confirmation is handled by mock blockchain + orchestrator.
 */
export const getOrCreateDepositAddress = async (
  userId: string,
  transferId: string,
  assetOverride?: AssetType,
): Promise<{ depositAddress: DepositAddress; created: boolean }> => {
  const transfer = await getOwnedTransfer(userId, transferId);
  const asset = assetOverride ?? transfer.asset;

  if (assetOverride && assetOverride !== transfer.asset) {
    throw AppError.badRequest("Asset does not match the transfer asset");
  }

  const existing = await prisma.wallet.findUnique({
    where: { transferId },
  });

  if (existing) {
    if (existing.userId !== userId) {
      throw AppError.forbidden("Transfer wallet belongs to another user");
    }
    return { depositAddress: toDepositAddress(existing), created: false };
  }

  const wallet = await prisma.wallet.create({
    data: {
      userId,
      transferId,
      asset,
      address: generateMockAddress(userId, transferId, asset),
    },
  });

  return { depositAddress: toDepositAddress(wallet), created: true };
};

export const getDepositInstructions = async (
  userId: string,
  transferId: string,
): Promise<DepositInstructions> => {
  const transfer = await getOwnedTransfer(userId, transferId);
  const { depositAddress } = await getOrCreateDepositAddress(userId, transferId);

  return {
    transferId: transfer.id,
    reference: transfer.reference,
    asset: depositAddress.asset,
    address: depositAddress.address,
    expectedAmount: transfer.sendAmount.toString(),
    network: "Ethereum",
  };
};
