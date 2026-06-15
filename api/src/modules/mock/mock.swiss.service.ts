import crypto from "node:crypto";
import { LiquidityTransactionType, LiquidityPoolType } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import type { SwissDepositInput, SwissWithdrawInput } from "./mock.schemas.js";

const getSwissPool = async () => {
  const pool = await prisma.liquidityPool.findUnique({
    where: { type: LiquidityPoolType.SWISS },
  });

  if (!pool) {
    throw AppError.notFound("Swiss liquidity pool is not configured");
  }

  return pool;
};

const genRef = (prefix: string): string =>
  `${prefix}-${crypto.randomInt(10000, 99999)}`;

/** PRD §13.1 response shape. */
export interface SwissDepositResponse {
  success: true;
  swissReference: string;
  status: "FUNDS_RECEIVED";
  receivedAmount: number;
}

/** PRD §13.2 response shape. */
export interface SwissBalanceResponse {
  chfBalance: number;
  usdBalance: number;
}

export interface SwissWithdrawResponse {
  success: true;
  swissReference: string;
  status: "WITHDRAWN";
  amount: number;
  currency: "USD" | "CHF";
}

export const swissDepositConfirmation = async (
  input: SwissDepositInput,
): Promise<SwissDepositResponse> => {
  const transfer = await prisma.transfer.findFirst({
    where: { reference: input.referenceId },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found for Swiss deposit confirmation");
  }

  const { swissReference, receivedAmount } = await creditSwissDeposit(input);

  await prisma.transfer.update({
    where: { id: transfer.id },
    data: { swissReference, status: "SWISS_FUNDS_RECEIVED" },
  });

  return {
    success: true,
    swissReference,
    status: "FUNDS_RECEIVED",
    receivedAmount,
  };
};

/** Credits the Swiss pool without changing transfer status (Module 9 orchestrator). */
export const creditSwissDeposit = async (
  input: SwissDepositInput,
): Promise<{ swissReference: string; receivedAmount: number }> => {
  const transfer = await prisma.transfer.findFirst({
    where: { reference: input.referenceId },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found for Swiss deposit confirmation");
  }

  const receivedAmount = input.amount;
  const pool = await getSwissPool();
  const usdBalance = Number(pool.usdBalance) + receivedAmount;
  const incomingDeposits = Number(pool.incomingDeposits) + receivedAmount;
  const swissReference = genRef("SWISS");

  await prisma.$transaction([
    prisma.liquidityPool.update({
      where: { id: pool.id },
      data: { usdBalance, incomingDeposits },
    }),
    prisma.liquidityTransaction.create({
      data: {
        poolId: pool.id,
        type: LiquidityTransactionType.CREDIT,
        currency: "USD",
        amount: receivedAmount,
        balanceAfter: usdBalance,
        referenceId: input.referenceId,
        note: `Swiss deposit ${input.asset} ${swissReference}`,
      },
    }),
  ]);

  return { swissReference, receivedAmount };
};

export const getSwissBalance = async (): Promise<SwissBalanceResponse> => {
  const pool = await getSwissPool();
  return {
    chfBalance: Number(pool.chfBalance),
    usdBalance: Number(pool.usdBalance),
  };
};

export const swissWithdraw = async (
  input: SwissWithdrawInput,
): Promise<SwissWithdrawResponse> => {
  const pool = await getSwissPool();
  const swissReference = genRef("SWISS-WD");

  if (input.currency === "USD") {
    const current = Number(pool.usdBalance);
    if (current < input.amount) {
      throw AppError.badRequest("Insufficient USD balance in Swiss pool");
    }
    const usdBalance = current - input.amount;
    const pendingSettlements = Number(pool.pendingSettlements) + input.amount;

    await prisma.$transaction([
      prisma.liquidityPool.update({
        where: { id: pool.id },
        data: { usdBalance, pendingSettlements },
      }),
      prisma.liquidityTransaction.create({
        data: {
          poolId: pool.id,
          type: LiquidityTransactionType.SETTLEMENT,
          currency: "USD",
          amount: input.amount,
          balanceAfter: usdBalance,
          referenceId: input.referenceId ?? swissReference,
          note: `Swiss withdrawal ${swissReference}`,
        },
      }),
    ]);
  } else {
    const current = Number(pool.chfBalance);
    if (current < input.amount) {
      throw AppError.badRequest("Insufficient CHF balance in Swiss pool");
    }
    const chfBalance = current - input.amount;
    const pendingSettlements = Number(pool.pendingSettlements) + input.amount;

    await prisma.$transaction([
      prisma.liquidityPool.update({
        where: { id: pool.id },
        data: { chfBalance, pendingSettlements },
      }),
      prisma.liquidityTransaction.create({
        data: {
          poolId: pool.id,
          type: LiquidityTransactionType.SETTLEMENT,
          currency: "CHF",
          amount: input.amount,
          balanceAfter: chfBalance,
          referenceId: input.referenceId ?? swissReference,
          note: `Swiss withdrawal ${swissReference}`,
        },
      }),
    ]);
  }

  return {
    success: true,
    swissReference,
    status: "WITHDRAWN",
    amount: input.amount,
    currency: input.currency,
  };
};
