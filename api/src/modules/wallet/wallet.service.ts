import crypto from "node:crypto";
import {
  AssetType,
  TransferStatus,
  type Transfer,
  type Wallet,
  type ConnectedWallet,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import type { ConnectWalletInput, SendFromWalletInput } from "./wallet.schemas.js";
import { confirmBlockchainDeposit } from "../mock/mock.blockchain.service.js";

/** Public deposit address shape — documented in CONTRACTS.md. */
export const toDepositAddress = (wallet: Wallet) => ({
  id: wallet.id,
  transferId: wallet.transferId,
  asset: wallet.asset,
  address: wallet.address,
  createdAt: wallet.createdAt,
});

export type DepositAddress = ReturnType<typeof toDepositAddress>;

/** Public connected wallet shape */
export const toConnectedWallet = (wallet: ConnectedWallet) => ({
  id: wallet.id,
  address: wallet.address,
  chain: wallet.chain,
  active: wallet.active,
  createdAt: wallet.createdAt,
});

export type PublicConnectedWallet = ReturnType<typeof toConnectedWallet>;

/** Deposit instructions for a transfer — documented in CONTRACTS.md. */
export interface DepositInstructions {
  transferId: string;
  reference: string;
  asset: AssetType;
  address: string;
  expectedAmount: string;
  network: string;
}

const getOwnedTransfer = async (
  userId: string,
  transferId: string,
): Promise<Transfer> => {
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
  const { depositAddress } = await getOrCreateDepositAddress(
    userId,
    transferId,
  );

  return {
    transferId: transfer.id,
    reference: transfer.reference,
    asset: depositAddress.asset,
    address: depositAddress.address,
    expectedAmount: transfer.sendAmount.toString(),
    network: "Ethereum",
  };
};

// --- Connected Wallet Functions ---

export const connectWallet = async (
  userId: string,
  input: ConnectWalletInput,
) => {
  // Normalize address to lowercase for consistency
  const normalizedAddress = input.address.toLowerCase();

  // Check if wallet already exists for user
  const existingWallet = await prisma.connectedWallet.findFirst({
    where: {
      userId,
      address: normalizedAddress,
      chain: input.chain,
    },
  });

  if (existingWallet) {
    // If exists, reactivate it and update signature
    const updatedWallet = await prisma.connectedWallet.update({
      where: { id: existingWallet.id },
      data: {
        active: true,
        signature: input.signature,
      },
    });
    return toConnectedWallet(updatedWallet);
  }

  // Create new connected wallet
  const newWallet = await prisma.connectedWallet.create({
    data: {
      userId,
      address: normalizedAddress,
      chain: input.chain,
      signature: input.signature,
      active: true,
    },
  });

  return toConnectedWallet(newWallet);
};

export const getMyWallets = async (userId: string) => {
  const wallets = await prisma.connectedWallet.findMany({
    where: { userId, active: true },
    orderBy: { createdAt: "desc" },
  });

  return wallets.map(toConnectedWallet);
};

/** @deprecated Use getMyWallets — kept for internal callers expecting a single wallet. */
export const getMyWallet = async (userId: string) => {
  const wallets = await getMyWallets(userId);
  return wallets[0] ?? null;
};

export const sendFromConnectedWallet = async (
  userId: string,
  input: SendFromWalletInput,
) => {
  const normalizedFrom = input.fromAddress.toLowerCase();

  const connectedWallet = await prisma.connectedWallet.findFirst({
    where: {
      userId,
      address: normalizedFrom,
      active: true,
    },
  });

  if (!connectedWallet) {
    throw AppError.badRequest(
      "Connected wallet not found or inactive. Connect MetaMask via POST /api/wallet/connect first.",
    );
  }

  const transfer = await prisma.transfer.findFirst({
    where: { id: input.transferId, senderId: userId },
    include: { wallet: true },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  if (transfer.status !== TransferStatus.AWAITING_CRYPTO) {
    throw AppError.badRequest(
      `Transfer must be AWAITING_CRYPTO to send (current: ${transfer.status})`,
    );
  }

  const { depositAddress } = await getOrCreateDepositAddress(userId, input.transferId);

  const send = {
    transferId: transfer.id,
    reference: transfer.reference,
    fromAddress: connectedWallet.address,
    toAddress: depositAddress.address,
    amount: transfer.sendAmount.toString(),
    asset: depositAddress.asset,
    chain: connectedWallet.chain,
    network: "Ethereum",
  };

  if (!input.txHash) {
    return {
      status: "READY_TO_SEND" as const,
      send,
    };
  }

  const confirmation = await confirmBlockchainDeposit({
    transferId: transfer.id,
    txHash: input.txHash,
  });

  return {
    status: "SENT" as const,
    send,
    confirmation,
  };
};

export const disconnectWallet = async (userId: string) => {
  // Deactivate all user's active connected wallets
  await prisma.connectedWallet.updateMany({
    where: {
      userId,
      active: true,
    },
    data: {
      active: false,
    },
  });

  return { disconnected: true };
};
