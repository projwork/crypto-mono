-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SENDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "KycTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3');

-- CreateEnum
CREATE TYPE "PayoutMethod" AS ENUM ('BANK', 'TELEBIRR');

-- CreateEnum
CREATE TYPE "BankName" AS ENUM ('CBE', 'AWASH', 'DASHEN');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('USDC', 'USDT', 'ETH');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('INITIATED', 'AWAITING_CRYPTO', 'BLOCKCHAIN_PENDING', 'BLOCKCHAIN_CONFIRMED', 'SWISS_FUNDS_RECEIVED', 'FX_CONVERTED', 'PAYOUT_PROCESSING', 'PAYOUT_SENT', 'COMPLETED', 'FAILED', 'REVERSED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "LiquidityPoolType" AS ENUM ('SWISS', 'ETHIOPIA');

-- CreateEnum
CREATE TYPE "LiquidityTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'RESERVE', 'RELEASE', 'DISBURSE', 'SETTLEMENT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TRANSFER_UPDATE', 'KYC_UPDATE', 'LIQUIDITY_ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SENDER',
    "kycTier" "KycTier" NOT NULL DEFAULT 'TIER_1',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KycVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "KycTier" NOT NULL DEFAULT 'TIER_1',
    "status" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "passportUrl" TEXT,
    "nationalIdUrl" TEXT,
    "selfieUrl" TEXT,
    "proofOfAddressUrl" TEXT,
    "sourceOfFunds" TEXT,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KycVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Ethiopia',
    "payoutMethod" "PayoutMethod" NOT NULL,
    "bank" "BankName",
    "accountNumber" TEXT,
    "phoneNumber" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beneficiary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "asset" "AssetType" NOT NULL,
    "address" TEXT NOT NULL,
    "transferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transfer" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "beneficiaryId" TEXT NOT NULL,
    "asset" "AssetType" NOT NULL,
    "sendAmount" DECIMAL(38,18) NOT NULL,
    "feeCrypto" DECIMAL(38,18) NOT NULL DEFAULT 0,
    "usdValue" DECIMAL(20,2) NOT NULL,
    "usdToEtb" DECIMAL(20,6) NOT NULL,
    "grossEtb" DECIMAL(20,2) NOT NULL,
    "feeEtb" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "payoutEtb" DECIMAL(20,2) NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'INITIATED',
    "txHash" TEXT,
    "swissReference" TEXT,
    "payoutReference" TEXT,
    "failureReason" TEXT,
    "rateTimestamp" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Transfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" TEXT NOT NULL,
    "type" "LiquidityPoolType" NOT NULL,
    "name" TEXT NOT NULL,
    "chfBalance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "usdBalance" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "incomingDeposits" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "pendingSettlements" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "etbAvailable" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "etbReserved" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "etbDisbursed" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "etbCapacity" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityTransaction" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "type" "LiquidityTransactionType" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "balanceAfter" DECIMAL(20,2) NOT NULL,
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "usdToEtb" DECIMAL(20,6) NOT NULL,
    "chfToEtb" DECIMAL(20,6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'MOCK',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "transferId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM',
    "message" TEXT NOT NULL,
    "data" JSONB,
    "transferId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "KycVerification_userId_idx" ON "KycVerification"("userId");

-- CreateIndex
CREATE INDEX "KycVerification_status_idx" ON "KycVerification"("status");

-- CreateIndex
CREATE INDEX "Beneficiary_userId_idx" ON "Beneficiary"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_transferId_key" ON "Wallet"("transferId");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_address_idx" ON "Wallet"("address");

-- CreateIndex
CREATE UNIQUE INDEX "Transfer_reference_key" ON "Transfer"("reference");

-- CreateIndex
CREATE INDEX "Transfer_senderId_idx" ON "Transfer"("senderId");

-- CreateIndex
CREATE INDEX "Transfer_status_idx" ON "Transfer"("status");

-- CreateIndex
CREATE INDEX "Transfer_reference_idx" ON "Transfer"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_type_key" ON "LiquidityPool"("type");

-- CreateIndex
CREATE INDEX "LiquidityTransaction_poolId_idx" ON "LiquidityTransaction"("poolId");

-- CreateIndex
CREATE INDEX "LiquidityTransaction_referenceId_idx" ON "LiquidityTransaction"("referenceId");

-- CreateIndex
CREATE INDEX "ExchangeRate_createdAt_idx" ON "ExchangeRate"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_transferId_idx" ON "AuditLog"("transferId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- AddForeignKey
ALTER TABLE "KycVerification" ADD CONSTRAINT "KycVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KycVerification" ADD CONSTRAINT "KycVerification_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiary" ADD CONSTRAINT "Beneficiary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transfer" ADD CONSTRAINT "Transfer_beneficiaryId_fkey" FOREIGN KEY ("beneficiaryId") REFERENCES "Beneficiary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityTransaction" ADD CONSTRAINT "LiquidityTransaction_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "Transfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
