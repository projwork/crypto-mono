import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { AssetType } from "@prisma/client";
import {
  clearCryptoPriceCache,
  getCryptoUsdPrice,
} from "./cryptoPrice.provider.js";
import {
  clearFiatRateCache,
  getFiatRateSnapshot,
} from "./fiatRate.provider.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  clearCryptoPriceCache();
  clearFiatRateCache();
});

test("crypto provider returns CoinGecko USD price", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        ethereum: {
          usd: 4200.5,
          last_updated_at: 1_750_000_000,
        },
      }),
      { status: 200 },
    );

  const result = await getCryptoUsdPrice(AssetType.ETH);

  assert.equal(result.asset, AssetType.ETH);
  assert.equal(result.usdRate, 4200.5);
  assert.equal(result.source, "CoinGecko");
  assert.equal(result.fetchedAt.toISOString(), "2025-06-15T15:06:40.000Z");
});

test("crypto provider uses stablecoin fallback when CoinGecko fails", async () => {
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };

  const result = await getCryptoUsdPrice(AssetType.USDC);

  assert.equal(result.usdRate, 1);
  assert.equal(result.source, "STABLECOIN_FALLBACK");
});

test("crypto provider caches a rate within the configured TTL", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        "usd-coin": {
          usd: 0.9998,
          last_updated_at: 1_750_000_000,
        },
      }),
      { status: 200 },
    );
  };

  const first = await getCryptoUsdPrice(AssetType.USDC);
  const second = await getCryptoUsdPrice(AssetType.USDC);

  assert.equal(first.usdRate, 0.9998);
  assert.equal(second.usdRate, 0.9998);
  assert.equal(calls, 1);
});

test("fiat provider derives CHF to ETB from USD-based rates", async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        result: "success",
        time_last_update_unix: 1_750_000_000,
        rates: {
          CHF: 0.8,
          ETB: 160,
        },
      }),
      { status: 200 },
    );

  const result = await getFiatRateSnapshot();

  assert.equal(result.usdToChf, 0.8);
  assert.equal(result.usdToEtb, 160);
  assert.equal(result.chfToEtb, 200);
  assert.equal(result.source, "ExchangeRate-API");
});

test("fiat provider caches a snapshot within the configured TTL", async () => {
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response(
      JSON.stringify({
        result: "success",
        rates: {
          CHF: 0.8,
          ETB: 160,
        },
      }),
      { status: 200 },
    );
  };

  await getFiatRateSnapshot();
  await getFiatRateSnapshot();

  assert.equal(calls, 1);
});
