import { api } from "./client";

export interface Wallet {
  address: string;
  chain: "ETHEREUM" | string;
  active: boolean;
}

export interface ConnectWalletResponse {
  wallet: Wallet;
}

export const walletApi = {
  async connect(address: string): Promise<ConnectWalletResponse> {
    const data = await api.post<ConnectWalletResponse>("/api/wallet/connect", {
      address,
    });
    return data;
  },

  async getConnected(): Promise<Wallet | null> {
    try {
      const data = await api.get<{ wallet: Wallet }>("/api/wallet/connected");
      return data.wallet;
    } catch {
      return null;
    }
  },

  async disconnect(): Promise<void> {
    await api.post("/api/wallet/disconnect", {});
  },
};
