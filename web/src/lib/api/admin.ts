import { api } from "./client";
import type { AssetType, PublicBeneficiary, PublicTransfer, TransferStatus } from "./types";

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

export interface AdminTransferSender {
  id: string;
  name: string;
  email: string;
}

export interface AdminTransfer extends Omit<PublicTransfer, "beneficiary" | "usdToEtb" | "rateTimestamp"> {
  sender: AdminTransferSender;
  beneficiary: PublicBeneficiary;
}

export interface AdminTransferFilters {
  status?: TransferStatus;
  asset?: AssetType;
  reference?: string;
  limit?: number;
}

export type OverrideAction = "reverse" | "complete";

export const adminApi = {
  async getStats(): Promise<AdminStats> {
    const { stats } = await api.get<{ stats: AdminStats }>("/api/admin/stats");
    return stats;
  },

  async listTransfers(filters: AdminTransferFilters = {}): Promise<AdminTransfer[]> {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.asset) params.set("asset", filters.asset);
    if (filters.reference) params.set("reference", filters.reference);
    if (filters.limit) params.set("limit", String(filters.limit));
    const qs = params.toString();
    const { transfers } = await api.get<{ transfers: AdminTransfer[] }>(
      `/api/admin/transfers${qs ? `?${qs}` : ""}`,
    );
    return transfers;
  },

  async getTransfer(id: string): Promise<AdminTransfer> {
    const { transfer } = await api.get<{ transfer: AdminTransfer }>(`/api/admin/transfers/${id}`);
    return transfer;
  },

  async overrideTransfer(
    id: string,
    action: OverrideAction,
    note?: string,
  ): Promise<AdminTransfer> {
    const { transfer } = await api.post<{ transfer: AdminTransfer }>(
      `/api/admin/transfers/${id}/override`,
      { action, note },
    );
    return transfer;
  },
};
