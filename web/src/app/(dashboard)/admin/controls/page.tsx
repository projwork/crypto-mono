"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TransferDetailDrawer } from "@/components/admin/TransferDetailDrawer";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { adminApi, type AdminTransfer } from "@/lib/api/admin";
import { fxApi } from "@/lib/api/fx";
import { formatAsset, formatEtb } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";

export default function AdminControlsPage() {
  const [usdToEtb, setUsdToEtb] = useState("");
  const [chfToEtb, setChfToEtb] = useState("");
  const [source, setSource] = useState("admin");
  const [currentRate, setCurrentRate] = useState<{ usdToEtb: number; chfToEtb: number; timestamp: string } | null>(null);
  const [fxLoading, setFxLoading] = useState(true);
  const [fxSaving, setFxSaving] = useState(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxSuccess, setFxSuccess] = useState<string | null>(null);

  const [failedTransfers, setFailedTransfers] = useState<AdminTransfer[]>([]);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [transfersError, setTransfersError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminTransfer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const loadRate = useCallback(async () => {
    setFxLoading(true);
    setFxError(null);
    try {
      const rate = await fxApi.getCurrentRate();
      setCurrentRate(rate);
      setUsdToEtb(String(rate.usdToEtb));
      setChfToEtb(String(rate.chfToEtb));
    } catch (err) {
      setFxError(err instanceof ApiError ? err.message : "Failed to load FX rate.");
    } finally {
      setFxLoading(false);
    }
  }, []);

  const loadFailed = useCallback(async () => {
    setTransfersLoading(true);
    setTransfersError(null);
    try {
      setFailedTransfers(await adminApi.listTransfers({ status: "FAILED", limit: 50 }));
    } catch (err) {
      setTransfersError(err instanceof ApiError ? err.message : "Failed to load failed transfers.");
    } finally {
      setTransfersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRate();
    void loadFailed();
  }, [loadRate, loadFailed]);

  const handleUpdateFx = async () => {
    const usd = Number.parseFloat(usdToEtb);
    const chf = Number.parseFloat(chfToEtb);
    if (!Number.isFinite(usd) || usd <= 0 || !Number.isFinite(chf) || chf <= 0) {
      setFxError("Enter valid positive rates for USD and CHF.");
      return;
    }

    setFxSaving(true);
    setFxError(null);
    setFxSuccess(null);
    try {
      const updated = await adminApi.updateFxRate({
        usdToEtb: usd,
        chfToEtb: chf,
        source: source.trim() || "admin",
      });
      setCurrentRate(updated);
      setFxSuccess(`Rates updated. 1 USD = ${updated.usdToEtb} ETB.`);
    } catch (err) {
      setFxError(err instanceof ApiError ? err.message : "Failed to update FX rate.");
    } finally {
      setFxSaving(false);
    }
  };

  const handleTransferUpdated = (updated: AdminTransfer) => {
    setFailedTransfers((prev) =>
      updated.status === "FAILED" ? prev : prev.filter((t) => t.id !== updated.id),
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin controls"
        description="Update exchange rates and reconcile failed transfers."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Exchange rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fxLoading && <LoadingBlock label="Loading current rate…" />}
            {!fxLoading && currentRate && (
              <p className="text-sm text-slate-500">
                Current: 1 USD = <strong>{currentRate.usdToEtb}</strong> ETB · 1 CHF ={" "}
                <strong>{currentRate.chfToEtb}</strong> ETB
                <span className="block text-xs text-slate-400 mt-1">
                  As of {formatDateTime(currentRate.timestamp)}
                </span>
              </p>
            )}

            <Input
              label="USD to ETB"
              type="number"
              step="0.01"
              min="0"
              value={usdToEtb}
              onChange={(e) => setUsdToEtb(e.target.value)}
            />
            <Input
              label="CHF to ETB"
              type="number"
              step="0.01"
              min="0"
              value={chfToEtb}
              onChange={(e) => setChfToEtb(e.target.value)}
            />
            <Input
              label="Source label"
              placeholder="admin"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />

            {fxError && <Alert tone="error">{fxError}</Alert>}
            {fxSuccess && <Alert tone="success">{fxSuccess}</Alert>}

            <Button onClick={handleUpdateFx} loading={fxSaving} className="w-full">
              Update FX rate
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Failed transfers</CardTitle>
            <Link href="/admin/transactions?status=FAILED">
              <Button variant="ghost" size="sm">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {transfersLoading && <LoadingBlock label="Loading failed transfers…" />}
            {!transfersLoading && transfersError && (
              <ErrorBlock message={transfersError} onRetry={loadFailed} />
            )}
            {!transfersLoading && !transfersError && failedTransfers.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No failed transfers.</p>
            )}
            {!transfersLoading && !transfersError && failedTransfers.length > 0 && (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {failedTransfers.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(t);
                        setDrawerOpen(true);
                      }}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium">{t.reference}</p>
                        <p className="truncate text-sm text-slate-500">{t.sender.name}</p>
                        <p className="text-xs text-slate-400">
                          {formatAsset(t.sendAmount, t.asset)} → {formatEtb(t.payoutEtb)}
                        </p>
                      </div>
                      <TransferStatusBadge status={t.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <TransferDetailDrawer
        transfer={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={handleTransferUpdated}
      />
    </div>
  );
}
