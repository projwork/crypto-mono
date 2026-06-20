import { KycStatus, KycTier, type KycVerification, TransferStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../lib/apiResponse.js";
import { logEvent } from "../audit/audit.service.js";
import { TIER_MONTHLY_LIMIT_USD, TIER_REQUIREMENTS } from "./kyc.limits.js";
import type { SubmitKycInput } from "./kyc.schemas.js";

/** Uploaded file URLs resolved from multipart fields (overrides body URLs). */
export interface KycFileUrls {
  passportUrl?: string;
  nationalIdUrl?: string;
  selfieUrl?: string;
}

/** Derive verification tier from submitted documents (never downgrade below doc evidence). */
export const resolveVerificationTier = (
  input: SubmitKycInput,
  files: KycFileUrls,
): KycTier => {
  const hasId = Boolean(
    files.passportUrl ?? files.nationalIdUrl ?? input.passportUrl ?? input.nationalIdUrl,
  );
  const hasSelfie = Boolean(files.selfieUrl ?? input.selfieUrl);
  const hasTier3Extras = Boolean(
    input.proofOfAddressUrl?.trim() && input.sourceOfFunds?.trim(),
  );

  if (hasId && hasSelfie) {
    return hasTier3Extras ? KycTier.TIER_3 : KycTier.TIER_2;
  }

  return input.tier ?? KycTier.TIER_1;
};

export const toPublicKyc = (kyc: KycVerification) => ({
  id: kyc.id,
  tier: kyc.tier,
  status: kyc.status,
  passportUrl: kyc.passportUrl,
  nationalIdUrl: kyc.nationalIdUrl,
  selfieUrl: kyc.selfieUrl,
  proofOfAddressUrl: kyc.proofOfAddressUrl,
  sourceOfFunds: kyc.sourceOfFunds,
  rejectionReason: kyc.rejectionReason,
  reviewedAt: kyc.reviewedAt,
  createdAt: kyc.createdAt,
});

/**
 * Monthly transfer limit info for a user (PRD §11). Exported so the Transfer
 * module (Module 8) can enforce limits before creating a transfer.
 */
export interface TransferLimit {
  tier: KycTier;
  kycStatus: KycStatus;
  unlimited: boolean;
  limitUsd: number | null;
  usedUsd: number;
  remainingUsd: number | null;
}

export const getUserTransferLimit = async (userId: string): Promise<TransferLimit> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const aggregate = await prisma.transfer.aggregate({
    where: {
      senderId: userId,
      status: TransferStatus.COMPLETED,
      createdAt: { gte: startOfMonth },
    },
    _sum: { usdValue: true },
  });

  const usedUsd = Number(aggregate._sum.usdValue ?? 0);
  const limitUsd = TIER_MONTHLY_LIMIT_USD[user.kycTier];
  const unlimited = limitUsd === null;
  const remainingUsd = unlimited ? null : Math.max(0, (limitUsd ?? 0) - usedUsd);

  return {
    tier: user.kycTier,
    kycStatus: user.kycStatus,
    unlimited,
    limitUsd,
    usedUsd,
    remainingUsd,
  };
};

export const getMyKyc = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const latest = await prisma.kycVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const approvedVerification = await prisma.kycVerification.findFirst({
    where: { userId, status: KycStatus.APPROVED },
    orderBy: { reviewedAt: "desc" },
  });

  const limit = await getUserTransferLimit(userId);

  let verification = latest;
  let latestApplication: KycVerification | null = null;

  if (user.kycStatus === KycStatus.APPROVED && approvedVerification) {
    verification = approvedVerification;
    if (
      latest &&
      latest.id !== approvedVerification.id &&
      (latest.status === KycStatus.PENDING || latest.status === KycStatus.REJECTED)
    ) {
      latestApplication = latest;
    }
  } else if (latest && latest.status !== KycStatus.APPROVED) {
    latestApplication = latest;
  }

  return {
    verification: verification ? toPublicKyc(verification) : null,
    latestApplication: latestApplication ? toPublicKyc(latestApplication) : null,
    tier: limit.tier,
    status: limit.kycStatus,
    limit,
    tiers: Object.values(KycTier).map((tier) => ({
      tier,
      monthlyLimitUsd: TIER_MONTHLY_LIMIT_USD[tier],
      requirements: TIER_REQUIREMENTS[tier],
    })),
  };
};

export const submitKyc = async (
  userId: string,
  input: SubmitKycInput,
  files: KycFileUrls,
) => {
  const tier = resolveVerificationTier(input, files);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const verification = await prisma.kycVerification.create({
    data: {
      userId,
      tier,
      status: KycStatus.PENDING,
      passportUrl: files.passportUrl ?? input.passportUrl ?? null,
      nationalIdUrl: files.nationalIdUrl ?? input.nationalIdUrl ?? null,
      selfieUrl: files.selfieUrl ?? input.selfieUrl ?? null,
      proofOfAddressUrl: input.proofOfAddressUrl ?? null,
      sourceOfFunds: input.sourceOfFunds ?? null,
    },
  });

  // Tier upgrades: keep the user APPROVED at their current tier while admin reviews.
  if (user.kycStatus !== KycStatus.APPROVED) {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: KycStatus.PENDING },
    });
  }

  return toPublicKyc(verification);
};

export const chooseTier = async (userId: string, tier: KycTier) => {
  const pending = await prisma.kycVerification.findFirst({
    where: { userId, status: KycStatus.PENDING },
    orderBy: { createdAt: "desc" },
  });

  const verification = pending
    ? await prisma.kycVerification.update({ where: { id: pending.id }, data: { tier } })
    : await prisma.kycVerification.create({
        data: { userId, tier, status: KycStatus.PENDING },
      });

  return toPublicKyc(verification);
};

export const listPendingKyc = async () => {
  const pending = await prisma.kycVerification.findMany({
    where: { status: KycStatus.PENDING },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true, country: true },
      },
    },
  });

  return pending.map((kyc) => ({ ...toPublicKyc(kyc), user: kyc.user }));
};

export const approveKyc = async (adminId: string, verificationId: string) => {
  const verification = await prisma.kycVerification.findUnique({ where: { id: verificationId } });
  if (!verification) {
    throw AppError.notFound("KYC verification not found");
  }

  const [updated] = await prisma.$transaction([
    prisma.kycVerification.update({
      where: { id: verificationId },
      data: {
        status: KycStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
      },
    }),
    prisma.user.update({
      where: { id: verification.userId },
      data: { kycStatus: KycStatus.APPROVED, kycTier: verification.tier },
    }),
  ]);

  await logEvent({
    actorId: adminId,
    action: "KYC_APPROVED",
    entityType: "KycVerification",
    entityId: verificationId,
    metadata: { userId: verification.userId, tier: verification.tier },
  });

  return toPublicKyc(updated);
};

export const rejectKyc = async (adminId: string, verificationId: string, reason: string) => {
  const verification = await prisma.kycVerification.findUnique({ where: { id: verificationId } });
  if (!verification) {
    throw AppError.notFound("KYC verification not found");
  }

  const priorApproved = await prisma.kycVerification.findFirst({
    where: {
      userId: verification.userId,
      status: KycStatus.APPROVED,
      id: { not: verificationId },
    },
    orderBy: { reviewedAt: "desc" },
  });

  const updated = await prisma.$transaction(async (tx) => {
    const rejected = await tx.kycVerification.update({
      where: { id: verificationId },
      data: {
        status: KycStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    if (priorApproved) {
      await tx.user.update({
        where: { id: verification.userId },
        data: {
          kycStatus: KycStatus.APPROVED,
          kycTier: priorApproved.tier,
        },
      });
    } else {
      await tx.user.update({
        where: { id: verification.userId },
        data: { kycStatus: KycStatus.REJECTED },
      });
    }

    return rejected;
  });

  await logEvent({
    actorId: adminId,
    action: "KYC_REJECTED",
    entityType: "KycVerification",
    entityId: verificationId,
    metadata: {
      userId: verification.userId,
      reason,
      upgradeRejection: Boolean(priorApproved),
    },
  });

  return toPublicKyc(updated);
};
