/** PRD §9 default rates when no ExchangeRate row exists. */
export const DEFAULT_USD_TO_ETB = 132.5;
export const DEFAULT_CHF_TO_ETB = 151.2;

/** Default crypto to CHF rates for mock purposes */
export const DEFAULT_CRYPTO_TO_CHF: Record<string, number> = {
  USDC: 0.815,
  USDT: 0.815,
  ETH: 2500,
};

export const DEFAULT_CRYPTO_TO_USD: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  ETH: 3100,
};

/** In-memory cache TTL for getCurrentRate(). */
export const FX_CACHE_TTL_MS = 60_000;
