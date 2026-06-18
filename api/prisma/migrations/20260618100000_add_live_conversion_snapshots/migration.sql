-- Store the live conversion rates accepted when a transfer is created.
-- Nullable fields preserve compatibility with transfers created before this migration.
ALTER TABLE "Transfer"
ADD COLUMN "cryptoToUsd" DECIMAL(20,8),
ADD COLUMN "usdToChf" DECIMAL(20,8),
ADD COLUMN "chfAmount" DECIMAL(20,2),
ADD COLUMN "chfToEtb" DECIMAL(20,8),
ADD COLUMN "rateSource" TEXT;
