-- CreateEnum
CREATE TYPE "ChainType" AS ENUM ('ETHEREUM', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM');

-- CreateTable
CREATE TABLE "ConnectedWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "chain" "ChainType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "signature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConnectedWallet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConnectedWallet_userId_idx" ON "ConnectedWallet"("userId");

-- CreateIndex
CREATE INDEX "ConnectedWallet_address_idx" ON "ConnectedWallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectedWallet_userId_address_chain_key" ON "ConnectedWallet"("userId", "address", "chain");

-- AddForeignKey
ALTER TABLE "ConnectedWallet" ADD CONSTRAINT "ConnectedWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
