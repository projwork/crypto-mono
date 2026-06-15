import { z } from "zod";
import { BankName, PayoutMethod } from "@prisma/client";
import { AppError } from "../../lib/apiResponse.js";

const payoutMethodEnum = z.nativeEnum(PayoutMethod);
const bankEnum = z.nativeEnum(BankName);

const beneficiaryFields = {
  fullName: z.string().min(1, "Full name is required").max(200),
  country: z.string().min(2, "Country is required").max(100),
  payoutMethod: payoutMethodEnum,
  bank: bankEnum.nullable().optional(),
  accountNumber: z.string().max(50).nullable().optional(),
  phoneNumber: z.string().max(30).nullable().optional(),
};

/** Validates payout-method-specific required fields (PRD §6 Step 3). */
export const validatePayoutFields = (data: {
  payoutMethod: PayoutMethod;
  bank?: BankName | null;
  accountNumber?: string | null;
  phoneNumber?: string | null;
}): void => {
  if (data.payoutMethod === PayoutMethod.BANK) {
    if (!data.bank) {
      throw AppError.badRequest("Bank is required when payout method is BANK");
    }
    if (!data.accountNumber?.trim()) {
      throw AppError.badRequest("Account number is required when payout method is BANK");
    }
  }

  if (data.payoutMethod === PayoutMethod.TELEBIRR) {
    if (!data.phoneNumber?.trim()) {
      throw AppError.badRequest("Phone number is required when payout method is TELEBIRR");
    }
  }
};

export const createBeneficiarySchema = z
  .object({
    ...beneficiaryFields,
    country: beneficiaryFields.country.default("Ethiopia"),
  })
  .superRefine((data, ctx) => {
    try {
      validatePayoutFields(data);
    } catch (err) {
      if (err instanceof AppError) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err.message });
        return;
      }
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid payout fields",
      });
    }
  });

export const updateBeneficiarySchema = z
  .object({
    fullName: beneficiaryFields.fullName.optional(),
    country: beneficiaryFields.country.optional(),
    payoutMethod: beneficiaryFields.payoutMethod.optional(),
    bank: beneficiaryFields.bank,
    accountNumber: beneficiaryFields.accountNumber,
    phoneNumber: beneficiaryFields.phoneNumber,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export type CreateBeneficiaryInput = z.infer<typeof createBeneficiarySchema>;
export type UpdateBeneficiaryInput = z.infer<typeof updateBeneficiarySchema>;
