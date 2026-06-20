import {
  AssetType,
  ConversionStatus,
  ConversionType,
  type Role,
} from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import type { ChfToEtbInput, CryptoToChfInput } from "./conversions.schemas.js";
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

export const conversionService = {
  getCryptoToChfRate,
  getChfToEtbRate,
  convertCryptoToChf,
  convertChfToEtb,
};
