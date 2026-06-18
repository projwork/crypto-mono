import { AppError } from "../../../lib/apiResponse.js";
import { config } from "../../../config/index.js";
import { prisma } from "../../../lib/prisma.js";
import { DEFAULT_CHF_TO_ETB, DEFAULT_USD_TO_ETB } from "../../fx/fx.constants.js";

const EXCHANGE_RATE_API_URL = "https://open.er-api.com/v6/latest/USD";

interface ExchangeRateApiResponse {
  result: "success" | "error";
  time_last_update_unix?: number;
  rates?: Record<string, number>;
}

export interface FiatRateSnapshot {
  usdToChf: number;
  usdToEtb: number;
  chfToEtb: number;
  source: string;
  fetchedAt: Date;
}

let cachedSnapshot: (FiatRateSnapshot & { expiresAt: number }) | null = null;

const fetchExchangeRates = async (): Promise<ExchangeRateApiResponse> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.conversions.requestTimeoutMs);

  try {
    const res = await fetch(EXCHANGE_RATE_API_URL, { signal: controller.signal });
    if (!res.ok) {
      throw AppError.badRequest(`ExchangeRate-API request failed with status ${res.status}`);
    }
    return (await res.json()) as ExchangeRateApiResponse;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.badRequest("Unable to fetch fiat exchange rates");
  } finally {
    clearTimeout(timeout);
  }
};

const getLocalFallbackSnapshot = async (): Promise<FiatRateSnapshot> => {
  const latest = await prisma.exchangeRate.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const usdToEtb = latest ? Number(latest.usdToEtb) : DEFAULT_USD_TO_ETB;
  const chfToEtb = latest ? Number(latest.chfToEtb) : DEFAULT_CHF_TO_ETB;

  return {
    usdToChf: usdToEtb / chfToEtb,
    usdToEtb,
    chfToEtb,
    source: latest ? `${latest.source}_LOCAL_FALLBACK` : "DEFAULT_LOCAL_FALLBACK",
    fetchedAt: latest?.createdAt ?? new Date(),
  };
};

export const getFiatRateSnapshot = async (): Promise<FiatRateSnapshot> => {
  const now = Date.now();
  if (cachedSnapshot && cachedSnapshot.expiresAt > now) {
    return cachedSnapshot;
  }

  let json: ExchangeRateApiResponse;
  try {
    json = await fetchExchangeRates();
  } catch {
    const fallback = await getLocalFallbackSnapshot();
    cachedSnapshot = {
      ...fallback,
      expiresAt: now + config.conversions.rateCacheTtlMs,
    };
    return fallback;
  }
  const usdToChf = json.rates?.CHF;
  const usdToEtb = json.rates?.ETB;

  if (json.result !== "success" || !usdToChf || !usdToEtb || usdToChf <= 0 || usdToEtb <= 0) {
    throw AppError.badRequest("Fiat provider did not return CHF and ETB rates");
  }

  const snapshot = {
    usdToChf,
    usdToEtb,
    chfToEtb: usdToEtb / usdToChf,
    source: "ExchangeRate-API",
    fetchedAt: json.time_last_update_unix
      ? new Date(json.time_last_update_unix * 1000)
      : new Date(),
  };

  cachedSnapshot = {
    ...snapshot,
    expiresAt: now + config.conversions.rateCacheTtlMs,
  };

  return snapshot;
};

export const clearFiatRateCache = (): void => {
  cachedSnapshot = null;
};
