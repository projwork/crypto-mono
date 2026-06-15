import { AssetType } from "@prisma/client";
import type { FeeMode } from "../fx/fx.service.js";

/** Mock USD price per crypto unit for the prototype (USDC/USDT pegged to 1). */
export const CRYPTO_TO_USD: Record<AssetType, number> = {
  [AssetType.USDC]: 1,
  [AssetType.USDT]: 1,
  [AssetType.ETH]: 3500,
};

/** PRD §6 Step 4: 2 USDC fee on a 100 USDC send. */
export const getTransferFeeMode = (asset: AssetType, amount: number): FeeMode => {
  if (asset === AssetType.ETH) {
    const fee = Math.max(amount * 0.01, 0.001);
    return { type: "crypto", amount: Math.round(fee * 1e6) / 1e6 };
  }
  return { type: "crypto", amount: 2 };
};

export const getCryptoToUsd = (asset: AssetType): number => CRYPTO_TO_USD[asset];

export const computeUsdValue = (asset: AssetType, amount: number): number =>
  Math.round(amount * getCryptoToUsd(asset) * 100) / 100;

export const getFeeCrypto = (asset: AssetType, amount: number): number => {
  const mode = getTransferFeeMode(asset, amount);
  return mode.type === "crypto" ? mode.amount : 0;
};
