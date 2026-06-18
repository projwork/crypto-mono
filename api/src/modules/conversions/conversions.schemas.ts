import { z } from "zod";
import {
  AssetType,
  ConversionStatus,
  ConversionType,
} from "@prisma/client";

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

export const adminConversionListSchema = z.object({
  transferId: z.string().trim().min(1).optional(),
  type: z.nativeEnum(ConversionType).optional(),
  status: z.nativeEnum(ConversionStatus).optional(),
  source: z.string().trim().min(1).optional(),
  asset: z.nativeEnum(AssetType).optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
}).refine(
  ({ dateFrom, dateTo }) => !dateFrom || !dateTo || dateFrom <= dateTo,
  {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateFrom"],
  },
);

export type CryptoToChfRateInput = z.infer<typeof cryptoToChfRateSchema>;
export type CryptoToChfInput = z.infer<typeof cryptoToChfSchema>;
export type ChfToEtbInput = z.infer<typeof chfToEtbSchema>;
export type AdminConversionListQuery = z.infer<typeof adminConversionListSchema>;
