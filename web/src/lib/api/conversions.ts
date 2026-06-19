import { api } from "./client";
import type { AssetType, ChfToEtbRate, CryptoToChfRate } from "./types";

export interface CryptoToChfConversionPayload {
  transferId: string;
  asset: AssetType;
  cryptoAmount: number;
}

export interface CryptoToChfConversion {
  transferId: string;
  asset: AssetType;
  cryptoAmount: number;
  marketRate: number;
  chfAmount: number;
  source: string;
  convertedAt: string;
}

export interface ChfToEtbConversionPayload {
  transferId: string;
  chfAmount: number;
}

export interface ChfToEtbConversion {
  transferId: string;
  chfAmount: number;
  rate: number;
  etbAmount: number;
  source: string;
  convertedAt: string;
}

export const conversionsApi = {
  async getCryptoToChfRate(asset: AssetType): Promise<CryptoToChfRate> {
    return api.get<CryptoToChfRate>(
      `/api/conversions/crypto-to-chf/rate?asset=${encodeURIComponent(asset)}`,
      false,
    );
  },

  async getChfToEtbRate(): Promise<ChfToEtbRate> {
    return api.get<ChfToEtbRate>("/api/conversions/chf-to-etb/rate", false);
  },

  async createCryptoToChfConversion(
    payload: CryptoToChfConversionPayload,
  ): Promise<CryptoToChfConversion> {
    const { conversion } = await api.post<{ conversion: CryptoToChfConversion }>(
      "/api/conversions/crypto-to-chf",
      payload,
      true,
    );
    return conversion;
  },

  async createChfToEtbConversion(
    payload: ChfToEtbConversionPayload,
  ): Promise<ChfToEtbConversion> {
    const { conversion } = await api.post<{ conversion: ChfToEtbConversion }>(
      "/api/conversions/chf-to-etb",
      payload,
      true,
    );
    return conversion;
  },
};
