import { z } from "zod";
import { AssetType } from "@prisma/client";

export const depositAddressSchema = z.object({
  transferId: z.string().min(1, "transferId is required"),
  asset: z.nativeEnum(AssetType).optional(),
});

export type DepositAddressInput = z.infer<typeof depositAddressSchema>;
