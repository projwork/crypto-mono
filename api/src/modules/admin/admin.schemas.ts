import { z } from "zod";
import { AssetType, Role, TransferStatus } from "@prisma/client";

export const adminUserListSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  search: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(50),
});

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

export const liquidityTopupSchema = z.object({
  amount: z.number().positive(),
  reference: z.string().min(1),
});

export const sweepCryptoSchema = z.object({
  asset: z.nativeEnum(AssetType),
  amount: z.number().positive(),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
});

export type AdminTransferListQuery = z.infer<typeof adminTransferListSchema>;
export type AdminUserListQuery = z.infer<typeof adminUserListSchema>;
export type AdminOverrideTransferInput = z.infer<
  typeof adminOverrideTransferSchema
>;
export type LiquidityTopupInput = z.infer<typeof liquidityTopupSchema>;
export type SweepCryptoInput = z.infer<typeof sweepCryptoSchema>;
export type BroadcastNotificationInput = z.infer<
  typeof broadcastNotificationSchema
>;
