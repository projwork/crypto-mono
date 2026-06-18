import { AssetType } from "@prisma/client";
import type { FeeMode } from "../fx/fx.service.js";

/** PRD §6 Step 4: 2 USDC fee on a 100 USDC send. */
export const getTransferFeeMode = (asset: AssetType, amount: number): FeeMode => {
  if (asset === AssetType.ETH) {
    const fee = Math.max(amount * 0.01, 0.001);
    return { type: "crypto", amount: Math.round(fee * 1e6) / 1e6 };
  }
  return { type: "crypto", amount: 2 };
};

export const getFeeCrypto = (asset: AssetType, amount: number): number => {
  const mode = getTransferFeeMode(asset, amount);
  return mode.type === "crypto" ? mode.amount : 0;
};
