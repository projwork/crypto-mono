import { api } from "./client";

export interface FxRate {
  usdToEtb: number;
  chfToEtb: number;
  timestamp: string;
}

export interface UpdateFxRatePayload {
  usdToEtb: number;
  chfToEtb: number;
  source?: string;
}

export const fxApi = {
  async getCurrentRate(): Promise<FxRate> {
    return api.get<FxRate>("/api/mock/fx-rate", false);
  },
};
