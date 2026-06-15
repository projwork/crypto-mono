import { api } from "./client";

export interface AdminStats {
  totalTransfers: number;
  totalEtbPaid: number;
  totalCryptoReceivedUsd: number;
  swissLiquidity: {
    usdBalance: number;
    chfBalance: number;
  };
  ethiopiaLiquidity: {
    etbAvailable: number;
    etbReserved: number;
    etbCapacity: number;
  };
  activeUsers: number;
}

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const { stats } = await api.get<{ stats: AdminStats }>("/api/admin/stats");
    return stats;
  },
};
