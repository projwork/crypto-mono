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

export interface UpdateFxRatePayload {
  usdToEtb: number;
  chfToEtb: number;
  source?: string;
}

export interface FxRate {
  usdToEtb: number;
  chfToEtb: number;
  timestamp: string;
  source?: string;
}

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

  async updateFxRate(payload: UpdateFxRatePayload): Promise<FxRate> {
    return api.post<FxRate>("/api/admin/fx-rate", payload);
  },

  async listUsers(filters: { role?: string; search?: string; limit?: number } = {}): Promise<{
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    role: string;
    kycTier: string;
    kycStatus: string;
    createdAt: string;
    beneficiariesCount: number;
    transfersCount: number;
    connectedWalletsCount: number;
    kycSubmissionsCount: number;
  }[]> {
    const params = new URLSearchParams();
    if (filters.role) params.set("role", filters.role);
    if (filters.search) params.set("search", filters.search);
    if (filters.limit !== undefined) params.set("limit", String(filters.limit));
    const qs = params.toString();
    const { users } = await api.get<{ users: any[] }>(`/api/admin/users${qs ? `?${qs}` : ""}`);
    return users;
  },

  async getUser(id: string): Promise<any> {
    const { user, wallets, beneficiaries, transfers } = await api.get<{
      user: any;
      wallets: any[];
      beneficiaries: any[];
      transfers: any[];
    }>(`/api/admin/users/${id}`);
    return { user, wallets, beneficiaries, transfers };
  },
};
