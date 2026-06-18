import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  AssetType,
  ConversionStatus,
  ConversionType,
  Role,
} from "@prisma/client";
import { quoteTransfer } from "../transfers/transfers.service.js";
import {
  convertCryptoToChf,
  getTransferConversionStatus,
} from "./conversions.service.js";
import { clearCryptoPriceCache } from "./providers/cryptoPrice.provider.js";
import { clearFiatRateCache } from "./providers/fiatRate.provider.js";

afterEach(() => {
  clearCryptoPriceCache();
  clearFiatRateCache();
});

test("transfer quote uses one live crypto to CHF to ETB path for principal and fee", async () => {
  const quote = await quoteTransfer(
    "user-1",
    {
      asset: AssetType.USDC,
      amount: 10,
      beneficiaryId: "beneficiary-1",
    },
    {
      assertOwnedBeneficiary: async () => undefined,
      getCryptoRate: async () => ({
        asset: AssetType.USDC,
        usdRate: 1,
        usdToChf: 0.8,
        chfRate: 0.8,
        source: "CoinGecko + ExchangeRate-API",
        fetchedAt: "2026-06-18T10:00:00.000Z",
      }),
      getFiatRate: async () => ({
        from: "CHF",
        to: "ETB",
        rate: 200,
        usdToChf: 0.8,
        usdToEtb: 160,
        source: "ExchangeRate-API",
        fetchedAt: "2026-06-18T10:00:00.000Z",
      }),
    },
  );

  assert.equal(quote.cryptoToUsd, 1);
  assert.equal(quote.usdValue, 10);
  assert.equal(quote.usdToChf, 0.8);
  assert.equal(quote.chfAmount, 8);
  assert.equal(quote.chfToEtb, 200);
  assert.equal(quote.grossEtb, 1600);
  assert.equal(quote.feeCrypto, 2);
  assert.equal(quote.feeEtb, 320);
  assert.equal(quote.payoutEtb, 1280);
  assert.equal(quote.rateSource, "CoinGecko + ExchangeRate-API");
});

test("crypto conversion returns the accepted snapshot instead of fetching a new rate", async () => {
  const existingConversion = {
    id: "conversion-1",
    transferId: "transfer-1",
    type: ConversionType.CRYPTO_TO_CHF,
    status: ConversionStatus.COMPLETED,
    fromCurrency: "USDC",
    toCurrency: "CHF",
    fromAmount: { toString: () => "10" },
    toAmount: { toString: () => "8" },
    rate: { toString: () => "0.8" },
    source: "CoinGecko + ExchangeRate-API",
    fetchedAt: new Date("2026-06-18T10:00:00.000Z"),
    createdAt: new Date("2026-06-18T10:00:00.000Z"),
    updatedAt: new Date("2026-06-18T10:00:00.000Z"),
  };
  let rateCalls = 0;

  const result = await convertCryptoToChf(
    { id: "user-1", role: Role.SENDER },
    {
      transferId: "transfer-1",
      asset: AssetType.USDC,
      cryptoAmount: 10,
    },
    {
      findTransfer: async () => ({
        id: "transfer-1",
        senderId: "user-1",
        reference: "TX0001",
        asset: AssetType.USDC,
        sendAmount: { toString: () => "10" },
      }),
      findConversion: async () => existingConversion as never,
      getRate: async () => {
        rateCalls += 1;
        throw new Error("rate provider should not be called");
      },
    },
  );

  assert.equal(result.chfAmount, 8);
  assert.equal(result.marketRate, 0.8);
  assert.equal(rateCalls, 0);
});

test("conversion status hides transfers not owned by the sender", async () => {
  await assert.rejects(
    () =>
      getTransferConversionStatus(
        "user-1",
        "other-transfer",
        async () => null,
      ),
    (error: unknown) =>
      error instanceof Error &&
      error.message === "Transfer not found",
  );
});
