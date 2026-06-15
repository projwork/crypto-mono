"use client";

import { useCallback, useEffect, useState } from "react";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { adminApi, type AdminTransfer } from "@/lib/api/admin";
import type { AssetType, TransferStatus } from "@/lib/api/types";
import { formatAsset, formatEtb } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "INITIATED", label: "Initiated" },
  { value: "AWAITING_CRYPTO", label: "Awaiting crypto" },
  { value: "BLOCKCHAIN_PENDING", label: "Blockchain pending" },
  { value: "BLOCKCHAIN_CONFIRMED", label: "Blockchain confirmed" },
  { value: "SWISS_FUNDS_RECEIVED", label: "Swiss funds received" },
  { value: "FX_CONVERTED", label: "FX converted" },
  { value: "PAYOUT_PROCESSING", label: "Payout processing" },
  { value: "PAYOUT_SENT", label: "Payout sent" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REVERSED", label: "Reversed" },
  { value: "EXPIRED", label: "Expired" },
];

const ASSET_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All assets" },
  { value: "USDC", label: "USDC" },
  { value: "USDT", label: "USDT" },
  { value: "ETH", label: "ETH" },
];

function TransferDetailDrawer({
  transfer,
  open,
  onClose,
  onUpdated,
}: {
  transfer: AdminTransfer | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (t: AdminTransfer) => void;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNote("");
    setError(null);
  }, [transfer?.id, open]);

  if (!transfer) return null;

  const handleOverride = async (action: "reverse" | "complete") => {
    setLoading(true);
    setError(null);
    try {
      const updated = await adminApi.overrideTransfer(transfer.id, action, note.trim() || undefined);
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Override failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title={transfer.reference}>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <TransferStatusBadge status={transfer.status} />
          <span className="text-xs text-slate-400">{formatDateTime(transfer.createdAt)}</span>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Sender</dt>
            <dd className="text-right">
              <p className="font-medium">{transfer.sender.name}</p>
              <p className="text-xs text-slate-400">{transfer.sender.email}</p>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Recipient</dt>
            <dd className="font-medium">{transfer.beneficiary.fullName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Amount</dt>
            <dd>{formatAsset(transfer.sendAmount, transfer.asset)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Payout ETB</dt>
            <dd className="font-semibold text-emerald-600">{formatEtb(transfer.payoutEtb)}</dd>
          </div>
          {transfer.txHash && (
            <div>
              <dt className="text-slate-500">Tx hash</dt>
              <dd className="mt-1 break-all font-mono text-xs">{transfer.txHash}</dd>
            </div>
          )}
          {transfer.failureReason && (
            <div>
              <dt className="text-slate-500">Failure reason</dt>
              <dd className="mt-1 text-rose-600">{transfer.failureReason}</dd>
            </div>
          )}
        </dl>

        {transfer.status === "FAILED" && (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/30 dark:bg-amber-500/5">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Admin override
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
              Reverse marks the transfer as refunded, or force complete to manually reconcile a
              failed payout.
            </p>
            <Input
              label="Note (optional)"
              placeholder="Reason for override…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && <Alert tone="error">{error}</Alert>}
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                loading={loading}
                onClick={() => handleOverride("reverse")}
              >
                Mark reversed
              </Button>
              <Button className="flex-1" loading={loading} onClick={() => handleOverride("complete")}>
                Force complete
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default function AdminTransactionsPage() {
  const [transfers, setTransfers] = useState<AdminTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("");

  const [selected, setSelected] = useState<AdminTransfer | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminApi.listTransfers({
        status: (statusFilter || undefined) as TransferStatus | undefined,
        asset: (assetFilter || undefined) as AssetType | undefined,
        reference: referenceFilter.trim() || undefined,
        limit: 100,
      });
      setTransfers(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load transactions.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, assetFilter, referenceFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDrawer = (t: AdminTransfer) => {
    setSelected(t);
    setDrawerOpen(true);
  };

  const handleUpdated = (updated: AdminTransfer) => {
    setTransfers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setSelected(updated);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Monitor all platform transfers with filters and admin overrides."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Select
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={STATUS_OPTIONS}
        />
        <Select
          label="Asset"
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          options={ASSET_OPTIONS}
        />
        <Input
          label="Reference"
          placeholder="TX0001…"
          value={referenceFilter}
          onChange={(e) => setReferenceFilter(e.target.value)}
        />
      </div>

      {loading && <LoadingBlock label="Loading transactions…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Sender</th>
                  <th className="px-5 py-3 font-medium">Recipient</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Asset</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transfers.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => openDrawer(t)}
                    className="cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-medium">{t.reference}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{t.sender.name}</p>
                      <p className="text-xs text-slate-400">{t.sender.email}</p>
                    </td>
                    <td className="px-5 py-4">{t.beneficiary.fullName}</td>
                    <td className="px-5 py-4 whitespace-nowrap">{formatAsset(t.sendAmount, t.asset)}</td>
                    <td className="px-5 py-4">{t.asset}</td>
                    <td className="px-5 py-4">
                      <TransferStatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400">
                      {formatDateTime(t.createdAt)}
                    </td>
                  </tr>
                ))}
                {transfers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      No transactions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <TransferDetailDrawer
        transfer={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
