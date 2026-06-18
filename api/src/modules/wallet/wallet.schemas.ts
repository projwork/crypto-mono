import { z } from "zod";
import { AssetType, ChainType } from "@prisma/client";

export const depositAddressSchema = z.object({
  transferId: z.string().min(1, "transferId is required"),
  asset: z.nativeEnum(AssetType).optional(),
});

export const connectWalletSchema = z.object({
  address: z.string().min(1, "Wallet address is required"),
  chain: z.nativeEnum(ChainType),
  signature: z.string().optional(),
});

export type DepositAddressInput = z.infer<typeof depositAddressSchema>;
export type ConnectWalletInput = z.infer<typeof connectWalletSchema>;
