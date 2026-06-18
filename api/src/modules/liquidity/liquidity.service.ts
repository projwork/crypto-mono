import {
  LiquidityPoolType,
  LiquidityTransactionType,
  type LiquidityPool,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";

const LOW_ETB_THRESHOLD = 500_000;
const LOW_ETB_PERCENT = 0.2;

const getSwissPool = async (): Promise<LiquidityPool> => {
  const pool = await prisma.liquidityPool.findUnique({
    where: { type: LiquidityPoolType.SWISS },
  });

  if (!pool) {
    throw AppError.notFound("Swiss liquidity pool is not configured");
  }

  return pool;
};

const getEthiopiaPool = async (): Promise<LiquidityPool> => {
  const pool = await prisma.liquidityPool.findUnique({
    where: { type: LiquidityPoolType.ETHIOPIA },
  });

  if (!pool) {
    throw AppError.notFound("Ethiopia liquidity pool is not configured");
  }

  return pool;
};

type LedgerInput = {
  poolId: string;
  type: LiquidityTransactionType;
  currency: string;
  amount: number;
  balanceAfter: number;
  referenceId?: string;
  note?: string;
};

/** Credit the Swiss pool (USD or CHF) and append a ledger row. */
export const creditSwiss = async (input: {
  amount: number;
  currency: "USD" | "CHF";
  referenceId: string;
  note?: string;
  trackIncomingDeposit?: boolean;
}): Promise<{ balanceAfter: number }> => {
  const pool = await getSwissPool();

  if (input.currency === "USD") {
    const usdBalance = Number(pool.usdBalance) + input.amount;
    const incomingDeposits =
      Number(pool.incomingDeposits) +
      (input.trackIncomingDeposit !== false ? input.amount : 0);

    await prisma.$transaction([
      prisma.liquidityPool.update({
        where: { id: pool.id },
        data: { usdBalance, incomingDeposits },
      }),
      prisma.liquidityTransaction.create({
        data: ledgerData(pool.id, {
          type: LiquidityTransactionType.CREDIT,
          currency: "USD",
          amount: input.amount,
          balanceAfter: usdBalance,
          referenceId: input.referenceId,
          note: input.note ?? "Swiss USD credit",
        }),
      }),
    ]);

    return { balanceAfter: usdBalance };
  }

  const chfBalance = Number(pool.chfBalance) + input.amount;

  await prisma.$transaction([
    prisma.liquidityPool.update({
      where: { id: pool.id },
      data: { chfBalance },
    }),
    prisma.liquidityTransaction.create({
      data: ledgerData(pool.id, {
        type: LiquidityTransactionType.CREDIT,
        currency: "CHF",
        amount: input.amount,
        balanceAfter: chfBalance,
        referenceId: input.referenceId,
        note: input.note ?? "Swiss CHF credit",
      }),
    }),
  ]);

  return { balanceAfter: chfBalance };
};

/** Reserve ETB for an in-flight payout. */
export const reserveEtb = async (
  amount: number,
  referenceId: string,
): Promise<void> => {
  const pool = await getEthiopiaPool();
  const available = Number(pool.etbAvailable);
  const reserved = Number(pool.etbReserved);

  if (available < amount) {
    throw AppError.badRequest("Insufficient ETB liquidity available");
  }

  const etbAvailable = available - amount;
  const etbReserved = reserved + amount;

  await prisma.$transaction([
    prisma.liquidityPool.update({
      where: { id: pool.id },
      data: { etbAvailable, etbReserved },
    }),
    prisma.liquidityTransaction.create({
      data: ledgerData(pool.id, {
        type: LiquidityTransactionType.RESERVE,
        currency: "ETB",
        amount,
        balanceAfter: etbAvailable,
        referenceId,
        note: "ETB reserved for payout",
      }),
    }),
  ]);
};

/** Release reserved ETB after a failed payout. */
export const releaseEtb = async (
  amount: number,
  referenceId: string,
): Promise<void> => {
  const pool = await getEthiopiaPool();
  const available = Number(pool.etbAvailable);
  const reserved = Number(pool.etbReserved);
  const etbAvailable = available + amount;
  const etbReserved = Math.max(0, reserved - amount);

  await prisma.$transaction([
    prisma.liquidityPool.update({
      where: { id: pool.id },
      data: { etbAvailable, etbReserved },
    }),
    prisma.liquidityTransaction.create({
      data: ledgerData(pool.id, {
        type: LiquidityTransactionType.RELEASE,
        currency: "ETB",
        amount,
        balanceAfter: etbAvailable,
        referenceId,
        note: "ETB released after failed payout",
      }),
    }),
  ]);
};

/** Disburse reserved ETB on successful payout. */
export const disburseEtb = async (
  amount: number,
  referenceId: string,
): Promise<void> => {
  const pool = await getEthiopiaPool();
  const reserved = Number(pool.etbReserved);
  const disbursed = Number(pool.etbDisbursed);
  const etbReserved = Math.max(0, reserved - amount);
  const etbDisbursed = disbursed + amount;

  await prisma.$transaction([
    prisma.liquidityPool.update({
      where: { id: pool.id },
      data: { etbReserved, etbDisbursed },
    }),
    prisma.liquidityTransaction.create({
      data: ledgerData(pool.id, {
        type: LiquidityTransactionType.DISBURSE,
        currency: "ETB",
        amount,
        balanceAfter: Number(pool.etbAvailable),
        referenceId,
        note: "ETB disbursed to recipient",
      }),
    }),
  ]);
};

/** Reserve CHF liquidity for a conversion */
export const reserveChf = async (
  amount: number,
  referenceId: string,
): Promise<void> => {
  const pool = await getSwissPool();
  const available = Number(pool.chfBalance);

  if (available < amount) {
    throw AppError.badRequest("Insufficient CHF liquidity available");
  }

  await prisma.liquidityTransaction.create({
    data: ledgerData(pool.id, {
      type: LiquidityTransactionType.RESERVE,
      currency: "CHF",
      amount,
      balanceAfter: available - amount,
      referenceId,
      note: "CHF reserved for conversion",
    }),
  });
};

const ledgerData = (poolId: string, input: Omit<LedgerInput, "poolId">) => ({
  poolId,
  type: input.type,
  currency: input.currency,
  amount: input.amount,
  balanceAfter: input.balanceAfter,
  referenceId: input.referenceId ?? null,
  note: input.note ?? null,
});

export interface LiquidityAlert {
  lowLiquidityWarning: boolean;
  reasons: string[];
}

export const evaluateLowLiquidityAlert = (
  pool: LiquidityPool,
): LiquidityAlert => {
  const available = Number(pool.etbAvailable);
  const capacity = Number(pool.etbCapacity);
  const reasons: string[] = [];

  if (available < LOW_ETB_THRESHOLD) {
    reasons.push(`Available ETB (${available}) is below ${LOW_ETB_THRESHOLD}`);
  }

  if (capacity > 0 && available / capacity < LOW_ETB_PERCENT) {
    reasons.push(
      `Available ETB (${available}) is below ${LOW_ETB_PERCENT * 100}% of capacity (${capacity})`,
    );
  }

  return {
    lowLiquidityWarning: reasons.length > 0,
    reasons,
  };
};

export const getPoolsSnapshot = async () => {
  const [swiss, ethiopia] = await Promise.all([
    getSwissPool(),
    getEthiopiaPool(),
  ]);
  const alerts = evaluateLowLiquidityAlert(ethiopia);

  return {
    pools: {
      swiss: {
        type: swiss.type,
        name: swiss.name,
        chfBalance: Number(swiss.chfBalance),
        usdBalance: Number(swiss.usdBalance),
        incomingDeposits: Number(swiss.incomingDeposits),
        pendingSettlements: Number(swiss.pendingSettlements),
      },
      ethiopia: {
        type: ethiopia.type,
        name: ethiopia.name,
        etbAvailable: Number(ethiopia.etbAvailable),
        etbReserved: Number(ethiopia.etbReserved),
        etbDisbursed: Number(ethiopia.etbDisbursed),
        etbCapacity: Number(ethiopia.etbCapacity),
      },
    },
    alerts,
  };
};

export const getLiquidityLedger = async (limit = 100) => {
  const entries = await prisma.liquidityTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { pool: { select: { type: true, name: true } } },
  });

  return entries.map((entry) => ({
    id: entry.id,
    date: entry.createdAt,
    poolType: entry.pool.type,
    poolName: entry.pool.name,
    type: entry.type,
    currency: entry.currency,
    amount: Number(entry.amount),
    balance: Number(entry.balanceAfter),
    referenceId: entry.referenceId,
    note: entry.note,
  }));
};

// Add topup functions for admin
export const topupChfLiquidity = async (amount: number, reference: string) => {
  const pool = await getSwissPool();
  const updatedPool = await prisma.liquidityPool.update({
    where: { id: pool.id },
    data: { chfBalance: { increment: amount } },
  });
  await prisma.liquidityTransaction.create({
    data: ledgerData(pool.id, {
      type: LiquidityTransactionType.CREDIT,
      currency: "CHF",
      amount,
      balanceAfter: Number(updatedPool.chfBalance),
      referenceId: reference,
      note: "CHF liquidity topup",
    }),
  });
  return { chfBalance: Number(updatedPool.chfBalance) };
};

export const topupEtbLiquidity = async (amount: number, reference: string) => {
  const pool = await getEthiopiaPool();
  const updatedPool = await prisma.liquidityPool.update({
    where: { id: pool.id },
    data: { etbAvailable: { increment: amount } },
  });
  await prisma.liquidityTransaction.create({
    data: ledgerData(pool.id, {
      type: LiquidityTransactionType.CREDIT,
      currency: "ETB",
      amount,
      balanceAfter: Number(updatedPool.etbAvailable),
      referenceId: reference,
      note: "ETB liquidity topup",
    }),
  });
  return { etbAvailable: Number(updatedPool.etbAvailable) };
};

export const liquidityService = {
  creditSwiss,
  reserveEtb,
  reserveChf,
  releaseEtb,
  disburseEtb,
  getPoolsSnapshot,
  getLiquidityLedger,
  evaluateLowLiquidityAlert,
  topupChfLiquidity,
  topupEtbLiquidity,
};
