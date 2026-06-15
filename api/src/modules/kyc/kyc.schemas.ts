import { z } from "zod";
import { KycTier } from "@prisma/client";

const tierEnum = z.nativeEnum(KycTier);

/**
 * KYC submission body. Files are normally uploaded as multipart (passport,
 * nationalId, selfie). As a fallback, URLs can be supplied directly in the body.
 */
export const submitKycSchema = z.object({
  tier: tierEnum.optional(),
  passportUrl: z.string().url().optional(),
  nationalIdUrl: z.string().url().optional(),
  selfieUrl: z.string().url().optional(),
  proofOfAddressUrl: z.string().url().optional(),
  sourceOfFunds: z.string().max(2000).optional(),
});

export const chooseTierSchema = z.object({
  tier: tierEnum,
});

export const rejectKycSchema = z.object({
  reason: z.string().min(1, "A rejection reason is required").max(500),
});

export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export type ChooseTierInput = z.infer<typeof chooseTierSchema>;
export type RejectKycInput = z.infer<typeof rejectKycSchema>;
