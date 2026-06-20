import { z } from "zod";
import { AssetType } from "@prisma/client";

export const updateFxRateSchema = z.object({
  usdToEtb: z.number().positive("usdToEtb must be greater than zero"),
  chfToEtb: z.number().positive("chfToEtb must be greater than zero"),
  source: z.string().max(50).optional(),
});

export const cryptoToChfSchema = z.object({
  transferId: z.string().min(1, "transferId is required"),
  asset: z.nativeEnum(AssetType),
  cryptoAmount: z.number().positive("cryptoAmount must be greater than zero"),
});

export const chfToEtbSchema = z.object({
  transferId: z.string().min(1, "transferId is required"),
  chfAmount: z.number().positive("chfAmount must be greater than zero"),
});

export type UpdateFxRateInput = z.infer<typeof updateFxRateSchema>;
export type CryptoToChfInput = z.infer<typeof cryptoToChfSchema>;
export type ChfToEtbInput = z.infer<typeof chfToEtbSchema>;
