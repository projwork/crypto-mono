"use client";

import { useEffect, useState } from "react";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { ApiError } from "@/lib/api/client";
import { adminApi, type AdminTransfer } from "@/lib/api/admin";
import { formatAsset, formatEtb } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";

interface TransferDetailDrawerProps {
  transfer: AdminTransfer | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (t: AdminTransfer) => void;
}

export function TransferDetailDrawer({
  transfer,
  open,
  onClose,
  onUpdated,
}: TransferDetailDrawerProps) {
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
            <dd className="font-semibold text-indigo-600">{formatEtb(transfer.payoutEtb)}</dd>
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
