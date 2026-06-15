import { KycTier } from "@prisma/client";

/**
 * Monthly transfer limits in USD per KYC tier (PRD §11).
 * `null` = unlimited.
 */
export const TIER_MONTHLY_LIMIT_USD: Record<KycTier, number | null> = {
  [KycTier.TIER_1]: 500,
  [KycTier.TIER_2]: 5000,
  [KycTier.TIER_3]: null,
};

/** Requirements per tier (PRD §11), surfaced to the UI. */
export const TIER_REQUIREMENTS: Record<KycTier, string[]> = {
  [KycTier.TIER_1]: ["Email", "Phone"],
  [KycTier.TIER_2]: ["Government ID", "Selfie"],
  [KycTier.TIER_3]: ["Proof of Address", "Source of Funds"],
};
