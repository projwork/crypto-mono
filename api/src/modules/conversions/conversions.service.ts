import {
  AssetType,
  ConversionStatus,
  ConversionType,
  type Conversion,
  type Prisma,
  type Role,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import type { ChfToEtbInput, CryptoToChfInput } from "./conversions.schemas.js";
import type { AdminConversionListQuery } from "./conversions.schemas.js";
import { getCryptoUsdPrice } from "./providers/cryptoPrice.provider.js";
import { getFiatRateSnapshot } from "./providers/fiatRate.provider.js";

const round2 = (value: number): number => Math.round(value * 100) / 100;
const round8 = (value: number): number => Math.round(value * 100_000_000) / 100_000_000;

export interface CryptoToChfRate {
  asset: AssetType;
  usdRate: number;
  usdToChf: number;
  chfRate: number;
  source: string;
  fetchedAt: string;
}

export interface ChfToEtbRate {
  from: "CHF";
  to: "ETB";
  rate: number;
  usdToChf: number;
  usdToEtb: number;
  source: string;
  fetchedAt: string;
}

export interface CryptoToChfConversion {
  transferId: string;
  asset: AssetType;
  cryptoAmount: number;
  marketRate: number;
  chfAmount: number;
  source: string;
  convertedAt: string;
}

export interface ChfToEtbConversion {
  transferId: string;
  chfAmount: number;
  rate: number;
  etbAmount: number;
  source: string;
  convertedAt: string;
}

const sourceLabel = (...sources: string[]): string => Array.from(new Set(sources)).join(" + ");

export const toPublicConversion = (conversion: Conversion) => ({
  id: conversion.id,
  transferId: conversion.transferId,
  type: conversion.type,
  status: conversion.status,
  fromCurrency: conversion.fromCurrency,
  toCurrency: conversion.toCurrency,
  fromAmount: conversion.fromAmount.toString(),
  toAmount: conversion.toAmount.toString(),
  rate: conversion.rate.toString(),
  source: conversion.source,
  fetchedAt: conversion.fetchedAt,
  createdAt: conversion.createdAt,
  updatedAt: conversion.updatedAt,
});

const assertTransferAccess = async (
  transferId: string,
  user: { id: string; role: Role },
) => {
  const transfer = await prisma.transfer.findUnique({
    where: { id: transferId },
    select: {
      id: true,
      senderId: true,
      reference: true,
      asset: true,
      sendAmount: true,
    },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  if (user.role !== "ADMIN" && transfer.senderId !== user.id) {
    throw AppError.notFound("Transfer not found");
  }

  return transfer;
};

export const getCryptoToChfRate = async (asset: AssetType): Promise<CryptoToChfRate> => {
  const [crypto, fiat] = await Promise.all([
    getCryptoUsdPrice(asset),
    getFiatRateSnapshot(),
  ]);

  return {
    asset,
    usdRate: round8(crypto.usdRate),
    usdToChf: round8(fiat.usdToChf),
    chfRate: round8(crypto.usdRate * fiat.usdToChf),
    source: sourceLabel(crypto.source, fiat.source),
    fetchedAt: new Date(Math.max(crypto.fetchedAt.getTime(), fiat.fetchedAt.getTime())).toISOString(),
  };
};

export const getChfToEtbRate = async (): Promise<ChfToEtbRate> => {
  const fiat = await getFiatRateSnapshot();

  return {
    from: "CHF",
    to: "ETB",
    rate: round8(fiat.chfToEtb),
    usdToChf: round8(fiat.usdToChf),
    usdToEtb: round8(fiat.usdToEtb),
    source: fiat.source,
    fetchedAt: fiat.fetchedAt.toISOString(),
  };
};

export const convertCryptoToChf = async (
  user: { id: string; role: Role },
  input: CryptoToChfInput,
): Promise<CryptoToChfConversion> => {
  const transfer = await assertTransferAccess(input.transferId, user);
  if (transfer.asset !== input.asset) {
    throw AppError.badRequest("Conversion asset must match the transfer asset");
  }

  const expectedAmount = Number(transfer.sendAmount);
  if (Math.abs(expectedAmount - input.cryptoAmount) > 0.000001) {
    throw AppError.badRequest("cryptoAmount must match the transfer send amount");
  }

  const existing = await prisma.conversion.findUnique({
    where: {
      transferId_type: {
        transferId: transfer.id,
        type: ConversionType.CRYPTO_TO_CHF,
      },
    },
  });

  if (existing) {
    return {
      transferId: transfer.id,
      asset: input.asset,
      cryptoAmount: Number(existing.fromAmount),
      marketRate: Number(existing.rate),
      chfAmount: Number(existing.toAmount),
      source: existing.source,
      convertedAt: existing.fetchedAt.toISOString(),
    };
  }

  const rate = await getCryptoToChfRate(input.asset);
  const chfAmount = round2(input.cryptoAmount * rate.chfRate);
  const convertedAt = new Date();

  await prisma.conversion.upsert({
    where: {
      transferId_type: {
        transferId: transfer.id,
        type: ConversionType.CRYPTO_TO_CHF,
      },
    },
    create: {
      transferId: transfer.id,
      type: ConversionType.CRYPTO_TO_CHF,
      status: ConversionStatus.COMPLETED,
      fromCurrency: input.asset,
      toCurrency: "CHF",
      fromAmount: input.cryptoAmount,
      toAmount: chfAmount,
      rate: rate.chfRate,
      source: rate.source,
      fetchedAt: convertedAt,
    },
    update: {
      status: ConversionStatus.COMPLETED,
      fromCurrency: input.asset,
      toCurrency: "CHF",
      fromAmount: input.cryptoAmount,
      toAmount: chfAmount,
      rate: rate.chfRate,
      source: rate.source,
      fetchedAt: convertedAt,
    },
  });

  return {
    transferId: transfer.id,
    asset: input.asset,
    cryptoAmount: input.cryptoAmount,
    marketRate: rate.chfRate,
    chfAmount,
    source: rate.source,
    convertedAt: convertedAt.toISOString(),
  };
};

export const convertChfToEtb = async (
  user: { id: string; role: Role },
  input: ChfToEtbInput,
): Promise<ChfToEtbConversion> => {
  const transfer = await assertTransferAccess(input.transferId, user);
  const previous = await prisma.conversion.findUnique({
    where: {
      transferId_type: {
        transferId: transfer.id,
        type: ConversionType.CRYPTO_TO_CHF,
      },
    },
  });

  if (previous && Math.abs(Number(previous.toAmount) - input.chfAmount) > 0.01) {
    throw AppError.badRequest("chfAmount must match the transfer crypto-to-CHF conversion");
  }

  const existing = await prisma.conversion.findUnique({
    where: {
      transferId_type: {
        transferId: transfer.id,
        type: ConversionType.CHF_TO_ETB,
      },
    },
  });

  if (existing) {
    return {
      transferId: transfer.id,
      chfAmount: Number(existing.fromAmount),
      rate: Number(existing.rate),
      etbAmount: Number(existing.toAmount),
      source: existing.source,
      convertedAt: existing.fetchedAt.toISOString(),
    };
  }

  const rate = await getChfToEtbRate();
  const etbAmount = round2(input.chfAmount * rate.rate);
  const convertedAt = new Date();

  await prisma.conversion.upsert({
    where: {
      transferId_type: {
        transferId: transfer.id,
        type: ConversionType.CHF_TO_ETB,
      },
    },
    create: {
      transferId: transfer.id,
      type: ConversionType.CHF_TO_ETB,
      status: ConversionStatus.COMPLETED,
      fromCurrency: "CHF",
      toCurrency: "ETB",
      fromAmount: input.chfAmount,
      toAmount: etbAmount,
      rate: rate.rate,
      source: rate.source,
      fetchedAt: convertedAt,
    },
    update: {
      status: ConversionStatus.COMPLETED,
      fromCurrency: "CHF",
      toCurrency: "ETB",
      fromAmount: input.chfAmount,
      toAmount: etbAmount,
      rate: rate.rate,
      source: rate.source,
      fetchedAt: convertedAt,
    },
  });

  return {
    transferId: transfer.id,
    chfAmount: input.chfAmount,
    rate: rate.rate,
    etbAmount,
    source: rate.source,
    convertedAt: convertedAt.toISOString(),
  };
};

export const getTransferConversionStatus = async (
  userId: string,
  transferId: string,
) => {
  const transfer = await prisma.transfer.findFirst({
    where: { id: transferId, senderId: userId },
    select: {
      id: true,
      reference: true,
      status: true,
      asset: true,
      sendAmount: true,
      payoutEtb: true,
      rateSource: true,
      rateTimestamp: true,
      conversions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!transfer) {
    throw AppError.notFound("Transfer not found");
  }

  const conversions = transfer.conversions.map(toPublicConversion);

  return {
    transferId: transfer.id,
    reference: transfer.reference,
    transferStatus: transfer.status,
    asset: transfer.asset,
    sendAmount: transfer.sendAmount.toString(),
    payoutEtb: transfer.payoutEtb.toString(),
    rateSource: transfer.rateSource,
    rateTimestamp: transfer.rateTimestamp,
    cryptoToChf:
      conversions.find((conversion) => conversion.type === ConversionType.CRYPTO_TO_CHF) ?? null,
    chfToEtb:
      conversions.find((conversion) => conversion.type === ConversionType.CHF_TO_ETB) ?? null,
  };
};

const adminConversionInclude = {
  transfer: {
    select: {
      id: true,
      reference: true,
      status: true,
      asset: true,
      sendAmount: true,
      payoutEtb: true,
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      beneficiary: {
        select: {
          id: true,
          fullName: true,
          payoutMethod: true,
        },
      },
    },
  },
} satisfies Prisma.ConversionInclude;

const toAdminConversion = (
  conversion: Prisma.ConversionGetPayload<{ include: typeof adminConversionInclude }>,
) => ({
  ...toPublicConversion(conversion),
  transfer: {
    id: conversion.transfer.id,
    reference: conversion.transfer.reference,
    status: conversion.transfer.status,
    asset: conversion.transfer.asset,
    sendAmount: conversion.transfer.sendAmount.toString(),
    payoutEtb: conversion.transfer.payoutEtb.toString(),
    sender: {
      id: conversion.transfer.sender.id,
      name: `${conversion.transfer.sender.firstName} ${conversion.transfer.sender.lastName}`,
      email: conversion.transfer.sender.email,
    },
    beneficiary: conversion.transfer.beneficiary,
  },
});

export const listAdminConversions = async (
  filters: AdminConversionListQuery,
) => {
  const where: Prisma.ConversionWhereInput = {
    transferId: filters.transferId,
    type: filters.type,
    status: filters.status,
    source: filters.source
      ? { contains: filters.source, mode: "insensitive" }
      : undefined,
    fromCurrency: filters.asset,
    createdAt:
      filters.dateFrom || filters.dateTo
        ? {
            gte: filters.dateFrom,
            lte: filters.dateTo,
          }
        : undefined,
  };

  const conversions = await prisma.conversion.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    include: adminConversionInclude,
  });

  return conversions.map(toAdminConversion);
};

export const getAdminConversion = async (conversionId: string) => {
  const conversion = await prisma.conversion.findUnique({
    where: { id: conversionId },
    include: adminConversionInclude,
  });

  if (!conversion) {
    throw AppError.notFound("Conversion not found");
  }

  return toAdminConversion(conversion);
};

export const conversionService = {
  getCryptoToChfRate,
  getChfToEtbRate,
  convertCryptoToChf,
  convertChfToEtb,
  getTransferConversionStatus,
  listAdminConversions,
  getAdminConversion,
};
