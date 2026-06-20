import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { toPublicUser } from "../auth/auth.service.js";
import { toPublicBeneficiary } from "../beneficiaries/beneficiaries.service.js";
import { toPublicTransfer } from "../transfers/transfers.service.js";
import { logEvent } from "../audit/audit.service.js";
import { notify } from "../notifications/notifications.service.js";
import { AssetType, NotificationType, type Prisma } from "@prisma/client";
import type { AdminUserListQuery } from "./admin.schemas.js";

export const listAdminUsers = async (filters: AdminUserListQuery) => {
  const where: Prisma.UserWhereInput = {};

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: "insensitive" } },
      { firstName: { contains: filters.search, mode: "insensitive" } },
      { lastName: { contains: filters.search, mode: "insensitive" } },
      { phone: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    include: {
      _count: {
        select: {
          beneficiaries: true,
          transfers: true,
          connectedWallets: true,
          kycVerifications: true,
        },
      },
    },
  });

  return users.map((user) => ({
    ...toPublicUser(user),
    beneficiariesCount: user._count.beneficiaries,
    transfersCount: user._count.transfers,
    connectedWalletsCount: user._count.connectedWallets,
    kycSubmissionsCount: user._count.kycVerifications,
  }));
};

export const getAdminUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      connectedWallets: true,
      beneficiaries: true,
      transfers: { include: { beneficiary: true, wallet: true } },
    },
  });

  if (!user) {
    throw AppError.notFound("User not found");
  }

  return {
    user: toPublicUser(user),
    wallets: user.connectedWallets.map((wallet) => ({
      id: wallet.id,
      address: wallet.address,
      chain: wallet.chain,
      active: wallet.active,
    })),
    beneficiaries: user.beneficiaries.map(toPublicBeneficiary),
    transfers: user.transfers.map((transfer) =>
      toPublicTransfer(transfer as any)
    ),
  };
};

export const getHotWalletBalance = async () => {
  return {
    walletAddress: "0xCOMPANYHOTWALLET",
    usdcBalance: 100000,
    usdtBalance: 50000,
    ethBalance: 25,
  };
};

export const getBlockchainTransactions = async () => {
  return [];
};

export const sweepCrypto = async (adminId: string, asset: AssetType, amount: number) => {
  await logEvent({
    actorId: adminId,
    action: "ADMIN_TREASURY_SWEEP",
    entityType: "Treasury",
    metadata: { asset, amount },
  });
  return { status: "SWEEP_INITIATED" };
};

export const broadcastNotification = async (adminId: string, title: string, message: string) => {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const user of users) {
    await notify({
      userId: user.id,
      type: NotificationType.SYSTEM,
      title,
      message,
    });
  }
  await logEvent({
    actorId: adminId,
    action: "ADMIN_NOTIFICATION_BROADCAST",
    entityType: "Notification",
    metadata: { title, message },
  });
  return { sent: true };
};

export const getSystemHealth = async () => {
  return {
    database: true,
    blockchainListener: true,
    conversionService: true,
    liquidityService: true,
    payoutService: true,
  };
};
