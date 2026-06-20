import { AssetType } from "@prisma/client";
import { AppError } from "../../../lib/apiResponse.js";
import { config } from "../../../config/index.js";

const COINGECKO_SIMPLE_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price";

const COINGECKO_IDS: Record<AssetType, string> = {
  [AssetType.USDC]: "usd-coin",
  [AssetType.USDT]: "tether",
  [AssetType.ETH]: "ethereum",
};

const STABLECOIN_USD_FALLBACK: Partial<Record<AssetType, number>> = {
  [AssetType.USDC]: 1,
  [AssetType.USDT]: 1,
  [AssetType.ETH]: 3500,
};

export interface CryptoUsdPrice {
  asset: AssetType;
  usdRate: number;
  source: string;
  fetchedAt: Date;
}

const fetchJson = async <T>(url: string, headers: Record<string, string>): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.conversions.requestTimeoutMs);

  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) {
      throw AppError.badRequest(`CoinGecko request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw AppError.badRequest("Unable to fetch crypto market rate from CoinGecko");
  } finally {
    clearTimeout(timeout);
  }
};

export const getCryptoUsdPrice = async (asset: AssetType): Promise<CryptoUsdPrice> => {
  const id = COINGECKO_IDS[asset];
  const url = new URL(COINGECKO_SIMPLE_PRICE_URL);
  url.searchParams.set("ids", id);
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_last_updated_at", "true");

  const headers: Record<string, string> = {};
  if (config.conversions.coinGeckoApiKey) {
    headers["x-cg-demo-api-key"] = config.conversions.coinGeckoApiKey;
  }

  try {
    const json = await fetchJson<Record<string, { usd?: number; last_updated_at?: number }>>(
      url.toString(),
      headers,
    );
    const price = json[id]?.usd;
    if (!price || price <= 0) {
      throw AppError.badRequest(`CoinGecko did not return a USD price for ${asset}`);
    }

    return {
      asset,
      usdRate: price,
      source: "CoinGecko",
      fetchedAt: json[id]?.last_updated_at
        ? new Date(json[id].last_updated_at * 1000)
        : new Date(),
    };
  } catch (error) {
    const fallback = STABLECOIN_USD_FALLBACK[asset];
    if (fallback) {
      return {
        asset,
        usdRate: fallback,
        source: asset === AssetType.ETH ? "MOCK_ETH_FALLBACK" : "STABLECOIN_FALLBACK",
        fetchedAt: new Date(),
      };
    }
    throw error;
  }
};
