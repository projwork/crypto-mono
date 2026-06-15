import { Role, TransferStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { getPoolsSnapshot } from "../liquidity/liquidity.service.js";

/** Confirmed crypto deposit statuses (funds received on-chain or later). */
const CRYPTO_RECEIVED_STATUSES: TransferStatus[] = [
  TransferStatus.BLOCKCHAIN_CONFIRMED,
  TransferStatus.SWISS_FUNDS_RECEIVED,
  TransferStatus.FX_CONVERTED,
  TransferStatus.PAYOUT_PROCESSING,
  TransferStatus.PAYOUT_SENT,
  TransferStatus.COMPLETED,
];

export interface AdminStats {
  totalTransfers: number;
  totalEtbPaid: number;
  totalCryptoReceivedUsd: number;
  swissLiquidity: {
    usdBalance: number;
    chfBalance: number;
  };
  ethiopiaLiquidity: {
    etbAvailable: number;
    etbReserved: number;
    etbCapacity: number;
  };
  activeUsers: number;
}

export const getAdminStats = async (): Promise<AdminStats> => {
  const [totalTransfers, etbPaidAgg, cryptoUsdAgg, activeUsers, pools] = await Promise.all([
    prisma.transfer.count(),
    prisma.transfer.aggregate({
      where: { status: TransferStatus.COMPLETED },
      _sum: { payoutEtb: true },
    }),
    prisma.transfer.aggregate({
      where: { status: { in: CRYPTO_RECEIVED_STATUSES } },
      _sum: { usdValue: true },
    }),
    prisma.user.count({ where: { role: Role.SENDER } }),
    getPoolsSnapshot(),
  ]);

  return {
    totalTransfers,
    totalEtbPaid: Number(etbPaidAgg._sum.payoutEtb ?? 0),
    totalCryptoReceivedUsd: Number(cryptoUsdAgg._sum.usdValue ?? 0),
    swissLiquidity: {
      usdBalance: pools.pools.swiss.usdBalance,
      chfBalance: pools.pools.swiss.chfBalance,
    },
    ethiopiaLiquidity: {
      etbAvailable: pools.pools.ethiopia.etbAvailable,
      etbReserved: pools.pools.ethiopia.etbReserved,
      etbCapacity: pools.pools.ethiopia.etbCapacity,
    },
    activeUsers,
  };
};
