import { z } from "zod";
import { AssetType } from "@prisma/client";

export const blockchainConfirmSchema = z.object({
  referenceId: z.string().min(1).optional(),
  transferId: z.string().min(1).optional(),
  txHash: z.string().min(1).optional(),
}).refine((data) => data.referenceId || data.transferId, {
  message: "referenceId or transferId is required",
});

export const swissDepositSchema = z.object({
  referenceId: z.string().min(1),
  asset: z.nativeEnum(AssetType),
  amount: z.number().positive(),
});

export const swissWithdrawSchema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "CHF"]).default("USD"),
  referenceId: z.string().optional(),
});

export const payoutSchema = z.object({
  referenceId: z.string().min(1),
  amount: z.number().positive(),
  accountNumber: z.string().optional(),
  phone: z.string().optional(),
});

export type BlockchainConfirmInput = z.infer<typeof blockchainConfirmSchema>;
export type SwissDepositInput = z.infer<typeof swissDepositSchema>;
export type SwissWithdrawInput = z.infer<typeof swissWithdrawSchema>;
export type PayoutInput = z.infer<typeof payoutSchema>;
