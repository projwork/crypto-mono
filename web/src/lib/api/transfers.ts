import { api, API_URL } from "./client";
import { tokenStore } from "./tokenStore";
import type {
  PublicTransfer,
  TimelineEntry,
  TransferQuote,
  TransferQuotePayload,
  TransferStatusEvent,
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

  async getTimeline(id: string): Promise<TimelineEntry[]> {
    const { timeline } = await api.get<{ timeline: TimelineEntry[] }>(
      `/api/transfers/${id}/timeline`,
    );
    return timeline;
  },

  async simulateDeposit(id: string): Promise<PublicTransfer> {
    const { transfer } = await api.post<{ transfer: PublicTransfer }>(
      `/api/transfers/${id}/simulate-deposit`,
    );
    return transfer;
  },

  /**
   * Subscribe to real-time transfer status events (SSE).
   * Uses `?accessToken=` because EventSource cannot send Authorization headers.
   */
  subscribeEvents(
    transferId: string,
    onEvent: (event: TransferStatusEvent) => void,
    onError?: () => void,
  ): () => void {
    const token = tokenStore.getAccess();
    if (!token) {
      onError?.();
      return () => undefined;
    }

    const url = `${API_URL}/api/transfers/${transferId}/events?accessToken=${encodeURIComponent(token)}`;
    const source = new EventSource(url);

    source.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data) as TransferStatusEvent);
      } catch {
        /* ignore malformed payloads */
      }
    };

    source.onerror = () => {
      onError?.();
      source.close();
    };

    return () => source.close();
  },
};
