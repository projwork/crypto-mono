import { z } from "zod";
import { AssetType } from "@prisma/client";

export const transferQuoteSchema = z.object({
  asset: z.nativeEnum(AssetType),
  amount: z.number().positive("Amount must be greater than zero"),
  beneficiaryId: z.string().min(1, "beneficiaryId is required"),
});

export const createTransferSchema = transferQuoteSchema;

export type TransferQuoteInput = z.infer<typeof transferQuoteSchema>;
export type CreateTransferInput = z.infer<typeof createTransferSchema>;
