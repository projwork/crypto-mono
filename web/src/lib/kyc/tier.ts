import type { KycTier } from "@/lib/api/types";

/** Initial onboarding wizard always targets Tier 2 (government ID + selfie). */
export const ONBOARDING_KYC_TIER: KycTier = "TIER_2";
