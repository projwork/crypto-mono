-- Add conversion audit records for crypto -> CHF and CHF -> ETB steps.
CREATE TYPE "ConversionType" AS ENUM ('CRYPTO_TO_CHF', 'CHF_TO_ETB');

CREATE TYPE "ConversionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE "Conversion" (
    "id" TEXT NOT NULL,
    "transferId" TEXT NOT NULL,
    "type" "ConversionType" NOT NULL,
    "status" "ConversionStatus" NOT NULL DEFAULT 'PENDING',
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "fromAmount" DECIMAL(38,18) NOT NULL,
    "toAmount" DECIMAL(20,2) NOT NULL,
    "rate" DECIMAL(20,8) NOT NULL,
    "source" TEXT NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Conversion_transferId_type_key" ON "Conversion"("transferId", "type");
CREATE INDEX "Conversion_transferId_idx" ON "Conversion"("transferId");
CREATE INDEX "Conversion_type_idx" ON "Conversion"("type");

ALTER TABLE "Conversion"
ADD CONSTRAINT "Conversion_transferId_fkey"
FOREIGN KEY ("transferId") REFERENCES "Transfer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
