import { api } from "./client";

export type WalletChain = "ETHEREUM" | "BSC" | "POLYGON" | "ARBITRUM" | "OPTIMISM";

export interface ConnectedWallet {
  id: string;
  address: string;
  chain: WalletChain | string;
  active: boolean;
  createdAt: string;
}

export interface WalletSendDetails {
  transferId: string;
  reference: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  asset: string;
  chain: string;
  network: string;
}

export interface WalletSendResult {
  status: "READY_TO_SEND" | "SENT";
  send: WalletSendDetails;
  confirmation?: {
    txHash: string;
    confirmations: number;
    status: string;
  };
}

export const walletApi = {
  async connect(address: string, chain: WalletChain = "ETHEREUM"): Promise<ConnectedWallet> {
    const { wallet } = await api.post<{ wallet: ConnectedWallet }>("/api/wallet/connect", {
      address,
      chain,
    });
    return wallet;
  },

  async list(): Promise<ConnectedWallet[]> {
    const { wallets } = await api.get<{ wallets: ConnectedWallet[] }>("/api/wallet/me");
    return wallets;
  },

  async disconnect(): Promise<void> {
    await api.post("/api/wallet/disconnect", {});
  },

  async send(
    transferId: string,
    fromAddress: string,
    txHash?: string,
  ): Promise<WalletSendResult> {
    return api.post<WalletSendResult>("/api/wallet/send", {
      transferId,
      fromAddress,
      ...(txHash ? { txHash } : {}),
    });
  },
};
