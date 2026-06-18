import { z } from "zod";
import { AssetType } from "@prisma/client";

export const cryptoToChfRateSchema = z.object({
  asset: z.nativeEnum(AssetType),
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

export type CryptoToChfRateInput = z.infer<typeof cryptoToChfRateSchema>;
export type CryptoToChfInput = z.infer<typeof cryptoToChfSchema>;
export type ChfToEtbInput = z.infer<typeof chfToEtbSchema>;
