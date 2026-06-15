import { PrismaClient, Role, KycTier, KycStatus, PayoutMethod, BankName } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

// Default password for every seeded account (prototype only).
const DEFAULT_PASSWORD = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // --- Users (idempotent via unique email) -------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@remittance.test" },
    update: {},
    create: {
      firstName: "System",
      lastName: "Admin",
      email: "admin@remittance.test",
      phone: "+251900000000",
      country: "Ethiopia",
      passwordHash,
      role: Role.ADMIN,
      kycTier: KycTier.TIER_3,
      kycStatus: KycStatus.APPROVED,
    },
  });

  const sender1 = await prisma.user.upsert({
    where: { email: "abel@diaspora.test" },
    update: {},
    create: {
      firstName: "Abel",
      lastName: "Tesfaye",
      email: "abel@diaspora.test",
      phone: "+41790000001",
      country: "Switzerland",
      passwordHash,
      role: Role.SENDER,
      kycTier: KycTier.TIER_2,
      kycStatus: KycStatus.APPROVED,
    },
  });

  const sender2 = await prisma.user.upsert({
    where: { email: "sara@diaspora.test" },
    update: {},
    create: {
      firstName: "Sara",
      lastName: "Bekele",
      email: "sara@diaspora.test",
      phone: "+14160000002",
      country: "Canada",
      passwordHash,
      role: Role.SENDER,
      kycTier: KycTier.TIER_1,
      kycStatus: KycStatus.PENDING,
    },
  });

  // --- KYC verification record for the approved sender (idempotent by id) -
  await prisma.kycVerification.upsert({
    where: { id: "seed-kyc-abel" },
    update: {},
    create: {
      id: "seed-kyc-abel",
      userId: sender1.id,
      tier: KycTier.TIER_2,
      status: KycStatus.APPROVED,
      passportUrl: "https://files.test/abel-passport.jpg",
      nationalIdUrl: "https://files.test/abel-id.jpg",
      selfieUrl: "https://files.test/abel-selfie.jpg",
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  // --- Initial exchange rate (idempotent by fixed id) --------------------
  await prisma.exchangeRate.upsert({
    where: { id: "seed-rate-initial" },
    update: { usdToEtb: 132.5, chfToEtb: 151.2, source: "SEED" },
    create: {
      id: "seed-rate-initial",
      usdToEtb: 132.5,
      chfToEtb: 151.2,
      source: "SEED",
    },
  });

  // --- Liquidity pools (idempotent via unique type) ----------------------
  await prisma.liquidityPool.upsert({
    where: { type: "SWISS" },
    update: {},
    create: {
      type: "SWISS",
      name: "Swiss Liquidity Pool",
      chfBalance: 500000,
      usdBalance: 250000,
      incomingDeposits: 0,
      pendingSettlements: 0,
    },
  });

  await prisma.liquidityPool.upsert({
    where: { type: "ETHIOPIA" },
    update: {},
    create: {
      type: "ETHIOPIA",
      name: "Ethiopia Liquidity Pool",
      etbAvailable: 5000000,
      etbReserved: 0,
      etbDisbursed: 0,
      etbCapacity: 5000000,
    },
  });

  // --- Sample beneficiaries (idempotent by fixed ids) --------------------
  await prisma.beneficiary.upsert({
    where: { id: "seed-ben-abebe" },
    update: {},
    create: {
      id: "seed-ben-abebe",
      userId: sender1.id,
      fullName: "Abebe Kebede",
      country: "Ethiopia",
      payoutMethod: PayoutMethod.BANK,
      bank: BankName.CBE,
      accountNumber: "1000123456789",
      isFavorite: true,
    },
  });

  await prisma.beneficiary.upsert({
    where: { id: "seed-ben-mulu" },
    update: {},
    create: {
      id: "seed-ben-mulu",
      userId: sender1.id,
      fullName: "Mulu Alemu",
      country: "Ethiopia",
      payoutMethod: PayoutMethod.TELEBIRR,
      phoneNumber: "251912345678",
      isFavorite: false,
    },
  });

  await prisma.beneficiary.upsert({
    where: { id: "seed-ben-dawit" },
    update: {},
    create: {
      id: "seed-ben-dawit",
      userId: sender2.id,
      fullName: "Dawit Haile",
      country: "Ethiopia",
      payoutMethod: PayoutMethod.BANK,
      bank: BankName.AWASH,
      accountNumber: "2000987654321",
      isFavorite: false,
    },
  });

  console.log("Seed complete:");
  console.log(`  Admin:   ${admin.email}`);
  console.log(`  Senders: ${sender1.email}, ${sender2.email}`);
  console.log(`  Default password for all: ${DEFAULT_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
