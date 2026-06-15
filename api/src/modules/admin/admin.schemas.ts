import { z } from "zod";
import { AssetType, TransferStatus } from "@prisma/client";

export const adminTransferListSchema = z.object({
  status: z.nativeEnum(TransferStatus).optional(),
  asset: z.nativeEnum(AssetType).optional(),
  reference: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

export const adminOverrideTransferSchema = z.object({
  action: z.enum(["reverse", "complete"]),
  note: z.string().max(500).optional(),
});

export type AdminTransferListQuery = z.infer<typeof adminTransferListSchema>;
export type AdminOverrideTransferInput = z.infer<typeof adminOverrideTransferSchema>;
