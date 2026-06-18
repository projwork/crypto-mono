import dotenv from "dotenv";

dotenv.config();

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: toNumber(process.env.PORT, 4000),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS) ,
  databaseUrl: process.env.DATABASE_URL ?? "",
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  maxUploadBytes: toNumber(process.env.MAX_UPLOAD_BYTES, 5 * 1024 * 1024),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? "dev-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret",
    accessTtl: process.env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: process.env.JWT_REFRESH_TTL ?? "7d",
  },
  conversions: {
    coinGeckoApiKey: process.env.COINGECKO_DEMO_API_KEY ?? "",
    rateCacheTtlMs: toNumber(process.env.CONVERSION_RATE_CACHE_TTL_MS, 60_000),
    requestTimeoutMs: toNumber(process.env.CONVERSION_REQUEST_TIMEOUT_MS, 8_000),
  },
} as const;

export const isProduction = config.env === "production";
