"use client";

import { useCallback, useEffect, useState } from "react";
import { transfersApi } from "@/lib/api/transfers";
import type { PublicTransfer, TransferStatus, TransferStatusEvent } from "@/lib/api/types";
import { parseTimelineAction } from "@/lib/transfers/status";

export function useTransferTimeline(transferId: string | null) {
  const [transfer, setTransfer] = useState<PublicTransfer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sseConnected, setSseConnected] = useState(false);
  const [reached, setReached] = useState<Map<TransferStatus, string>>(new Map());

  const applyEvent = useCallback((status: TransferStatus, timestamp: string) => {
    setReached((prev) => {
      const next = new Map(prev);
      if (!next.has(status)) next.set(status, timestamp);
      return next;
    });
    setTransfer((prev) => (prev ? { ...prev, status } : prev));
  }, []);

  const load = useCallback(async () => {
    if (!transferId) return;
    setLoading(true);
    setError(null);
    try {
      const [t, timeline] = await Promise.all([
        transfersApi.get(transferId),
        transfersApi.getTimeline(transferId),
      ]);

      const map = new Map<TransferStatus, string>();
      map.set("INITIATED", t.createdAt);
      if (t.status === "AWAITING_CRYPTO" || timeline.length === 0) {
        map.set("AWAITING_CRYPTO", t.updatedAt);
      }

      for (const entry of timeline) {
        const status = parseTimelineAction(entry.action);
        if (status && !map.has(status)) {
          map.set(status, entry.createdAt);
        }
      }

      if (!map.has(t.status)) {
        map.set(t.status, t.updatedAt);
      }

      setTransfer(t);
      setReached(map);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load transfer.");
    } finally {
      setLoading(false);
    }
  }, [transferId]);

  useEffect(() => {
    void load();
  }, [load]);

  // SSE subscription for live updates
  useEffect(() => {
    if (!transferId || loading || error) return;

    setSseConnected(true);
    const unsubscribe = transfersApi.subscribeEvents(
      transferId,
      (event: TransferStatusEvent) => {
        applyEvent(event.status, event.timestamp);
        setTransfer((prev) =>
          prev
            ? {
                ...prev,
                status: event.status,
                reference: event.reference,
              }
            : prev,
        );
      },
      () => setSseConnected(false),
    );

    return unsubscribe;
  }, [transferId, loading, error, applyEvent]);

  const currentStatus = transfer?.status ?? "INITIATED";

  return {
    transfer,
    loading,
    error,
    reload: load,
    reached,
    currentStatus,
    sseConnected,
  };
}
