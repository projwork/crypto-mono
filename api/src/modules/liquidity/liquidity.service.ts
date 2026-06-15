import { LiquidityPoolType, LiquidityTransactionType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";

const getEthiopiaPool = async () => {
  const pool = await prisma.liquidityPool.findUnique({
    where: { type: LiquidityPoolType.ETHIOPIA },
  });

  if (!pool) {
    throw AppError.notFound("Ethiopia liquidity pool is not configured");
  }

  return pool;
};

/** Reserve ETB for an in-flight payout (Module 9 / 10). */
export const reserveEtb = async (amount: number, referenceId: string): Promise<void> => {
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
      data: {
        poolId: pool.id,
        type: LiquidityTransactionType.RESERVE,
        currency: "ETB",
        amount,
        balanceAfter: etbAvailable,
        referenceId,
        note: "ETB reserved for payout",
      },
    }),
  ]);
};

/** Release reserved ETB after a failed payout. */
export const releaseEtb = async (amount: number, referenceId: string): Promise<void> => {
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
      data: {
        poolId: pool.id,
        type: LiquidityTransactionType.RELEASE,
        currency: "ETB",
        amount,
        balanceAfter: etbAvailable,
        referenceId,
        note: "ETB released after failed payout",
      },
    }),
  ]);
};

/** Disburse reserved ETB on successful payout. */
export const disburseEtb = async (amount: number, referenceId: string): Promise<void> => {
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
      data: {
        poolId: pool.id,
        type: LiquidityTransactionType.DISBURSE,
        currency: "ETB",
        amount,
        balanceAfter: Number(pool.etbAvailable),
        referenceId,
        note: "ETB disbursed to recipient",
      },
    }),
  ]);
};
