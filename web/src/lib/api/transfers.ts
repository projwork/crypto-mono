import { api } from "./client";
import type {
  PublicTransfer,
  TransferQuote,
  TransferQuotePayload,
} from "./types";

export const transfersApi = {
  async quote(payload: TransferQuotePayload): Promise<TransferQuote> {
    const { quote } = await api.post<{ quote: TransferQuote }>("/api/transfers/quote", payload);
    return quote;
  },

  async create(payload: TransferQuotePayload): Promise<PublicTransfer> {
    const { transfer } = await api.post<{ transfer: PublicTransfer }>("/api/transfers", payload);
    return transfer;
  },

  async get(id: string): Promise<PublicTransfer> {
    const { transfer } = await api.get<{ transfer: PublicTransfer }>(`/api/transfers/${id}`);
    return transfer;
  },

  async list(): Promise<PublicTransfer[]> {
    const { transfers } = await api.get<{ transfers: PublicTransfer[] }>("/api/transfers");
    return transfers;
  },

  async simulateDeposit(id: string): Promise<PublicTransfer> {
    const { transfer } = await api.post<{ transfer: PublicTransfer }>(
      `/api/transfers/${id}/simulate-deposit`,
    );
    return transfer;
  },
};
