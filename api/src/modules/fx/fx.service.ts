import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { getFiatRateSnapshot } from "../conversions/providers/fiatRate.provider.js";
import {
  DEFAULT_CHF_TO_ETB,
  DEFAULT_CRYPTO_TO_CHF,
  DEFAULT_USD_TO_ETB,
  FX_CACHE_TTL_MS,
} from "./fx.constants.js";

export interface FxRate {
  usdToEtb: number;
  chfToEtb: number;
  timestamp: Date;
  source: string;
}

/** How fees are applied in quote() — Transfer module (8) supplies this. */
export type FeeMode =
  | { type: "crypto"; amount: number }
  | { type: "etb"; amount: number }
  | { type: "percent"; percent: number };

export interface QuoteInput {
  cryptoAmount: number;
  /** USD value of 1 unit of crypto (1 for USDC/USDT, market price for ETH). */
  cryptoToUsd: number;
  feeMode: FeeMode;
  /** Live USD→ETB from ExchangeRate-API; when omitted, uses DB/default via getCurrentRate(). */
  usdToEtb?: number;
  rateTimestamp?: string;
}

/** Quote breakdown returned by fxService.quote() — documented in CONTRACTS.md. */
export interface FxQuote {
  grossEtb: number;
  feeEtb: number;
  payoutEtb: number;
  usdToEtb: number;
  rateTimestamp: string;
}

interface CachedRate extends FxRate {
  expiresAt: number;
}

let rateCache: CachedRate | null = null;

const round2 = (value: number): number => Math.round(value * 100) / 100;

const fetchLatestRate = async (): Promise<FxRate> => {
  try {
    const live = await getFiatRateSnapshot();
    return {
      usdToEtb: live.usdToEtb,
      chfToEtb: live.chfToEtb,
      timestamp: live.fetchedAt,
      source: live.source,
    };
  } catch {
    /* fall through to DB/default */
  }

  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!latest) {
    return {
      usdToEtb: DEFAULT_USD_TO_ETB,
      chfToEtb: DEFAULT_CHF_TO_ETB,
      timestamp: new Date(),
      source: "DEFAULT",
    };
  }

  return {
    usdToEtb: Number(latest.usdToEtb),
    chfToEtb: Number(latest.chfToEtb),
    timestamp: latest.createdAt,
    source: latest.source,
  };
};

const computeFeeEtb = (
  input: QuoteInput,
  grossEtb: number,
  usdToEtb: number,
): number => {
  switch (input.feeMode.type) {
    case "crypto":
      return round2(input.feeMode.amount * input.cryptoToUsd * usdToEtb);
    case "etb":
      return round2(input.feeMode.amount);
    case "percent":
      return round2(grossEtb * (input.feeMode.percent / 100));
    default:
      throw AppError.badRequest("Unsupported fee mode");
  }
};

export const fxService = {
  /** Returns the latest FX rate, with a short in-memory cache. */
  async getCurrentRate(): Promise<FxRate> {
    const now = Date.now();
    if (rateCache && rateCache.expiresAt > now) {
      return rateCache;
    }

    const rate = await fetchLatestRate();
    rateCache = { ...rate, expiresAt: now + FX_CACHE_TTL_MS };
    return rate;
  },

  /** Clears the in-memory cache (used when admin inserts a new rate — Step 5.2). */
  invalidateCache(): void {
    rateCache = null;
  },

  /** Insert a new ExchangeRate row and invalidate cache so getCurrentRate() picks it up immediately. */
  async setRate(input: {
    usdToEtb: number;
    chfToEtb: number;
    source?: string;
  }): Promise<FxRate> {
    const row = await prisma.exchangeRate.create({
      data: {
        usdToEtb: input.usdToEtb,
        chfToEtb: input.chfToEtb,
        source: input.source ?? "ADMIN",
      },
    });

    this.invalidateCache();

    return {
      usdToEtb: Number(row.usdToEtb),
      chfToEtb: Number(row.chfToEtb),
      timestamp: row.createdAt,
      source: row.source,
    };
  },

  /**
   * PRD §9: ETB = (CryptoValue × CryptoToUSD × USDToETB) − Fees
   */
  async quote(input: QuoteInput): Promise<FxQuote> {
    if (input.cryptoAmount <= 0) {
      throw AppError.badRequest("Crypto amount must be greater than zero");
    }
    if (input.cryptoToUsd <= 0) {
      throw AppError.badRequest("cryptoToUsd must be greater than zero");
    }

    const rate = input.usdToEtb
      ? {
          usdToEtb: input.usdToEtb,
          chfToEtb: DEFAULT_CHF_TO_ETB,
          timestamp: input.rateTimestamp ? new Date(input.rateTimestamp) : new Date(),
          source: "LIVE_QUOTE",
        }
      : await this.getCurrentRate();
    const grossEtb = round2(
      input.cryptoAmount * input.cryptoToUsd * rate.usdToEtb,
    );
    const feeEtb = computeFeeEtb(input, grossEtb, rate.usdToEtb);
    const payoutEtb = round2(Math.max(0, grossEtb - feeEtb));

    if (payoutEtb <= 0) {
      throw AppError.badRequest(
        "Send amount is too small after corridor fees. Increase the amount to receive a positive ETB payout.",
        { grossEtb, feeEtb, payoutEtb },
      );
    }

    return {
      grossEtb,
      feeEtb,
      payoutEtb,
      usdToEtb: rate.usdToEtb,
      rateTimestamp: rate.timestamp.toISOString(),
    };
  },

  /** Get crypto to CHF rate */
  async getCryptoToChfRate(asset: string): Promise<{
    asset: string;
    chfRate: number;
    source: string;
  }> {
    const rate = DEFAULT_CRYPTO_TO_CHF[asset];
    if (!rate) {
      throw AppError.badRequest(`Unsupported asset: ${asset}`);
    }

    return {
      asset,
      chfRate: rate,
      source: "CoinGecko",
    };
  },

  /** Convert crypto to CHF */
  async convertCryptoToChf(input: {
    asset: string;
    cryptoAmount: number;
  }): Promise<{
    asset: string;
    cryptoAmount: number;
    marketRate: number;
    chfAmount: number;
    source: string;
    convertedAt: string;
  }> {
    const rateData = await this.getCryptoToChfRate(input.asset);
    const chfAmount = round2(input.cryptoAmount * rateData.chfRate);

    return {
      asset: input.asset,
      cryptoAmount: input.cryptoAmount,
      marketRate: rateData.chfRate,
      chfAmount,
      source: rateData.source,
      convertedAt: new Date().toISOString(),
    };
  },

  /** Convert CHF to ETB */
  async convertChfToEtb(input: { chfAmount: number }): Promise<{
    chfAmount: number;
    rate: number;
    etbAmount: number;
    source: string;
    convertedAt: string;
  }> {
    const rateData = await this.getCurrentRate();
    const etbAmount = round2(input.chfAmount * rateData.chfToEtb);

    return {
      chfAmount: input.chfAmount,
      rate: rateData.chfToEtb,
      etbAmount,
      source: "Swiss FX Provider",
      convertedAt: new Date().toISOString(),
    };
  },

  /** Get CHF to ETB rate */
  async getChfToEtbRate(): Promise<{
    from: string;
    to: string;
    rate: number;
    source: string;
  }> {
    const rateData = await this.getCurrentRate();

    return {
      from: "CHF",
      to: "ETB",
      rate: rateData.chfToEtb,
      source: "Swiss FX Provider",
    };
  },
};
