"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { TransferStatusBadge } from "@/components/transfers/TransferStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyBlock, ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { transfersApi } from "@/lib/api/transfers";
import type { PublicTransfer } from "@/lib/api/types";
import { formatAsset, formatEtb } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<PublicTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setTransfers(await transfersApi.list());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load transfers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transfers"
        description="Track all your crypto-to-Birr remittances."
        action={
          <Link href="/transfers/new">
            <Button>Send money</Button>
          </Link>
        }
      />

      {loading && <LoadingBlock label="Loading transfers…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && transfers.length === 0 && (
        <Card>
          <CardContent>
            <EmptyBlock
              title="No transfers yet"
              description="Your transfer history will appear here once you send money."
              action={
                <Link href="/transfers/new">
                  <Button>Start a transfer</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      )}

      {!loading && !error && transfers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                  <th className="px-5 py-3 font-medium">Reference</th>
                  <th className="px-5 py-3 font-medium">Recipient</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Payout</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transfers.map((t) => (
                  <tr
                    key={t.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-medium text-slate-900 dark:text-white">
                      {t.reference}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {t.beneficiary.fullName}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {formatAsset(t.sendAmount, t.asset)}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-indigo-600 dark:text-indigo-400">
                      {formatEtb(t.payoutEtb)}
                    </td>
                    <td className="px-5 py-4">
                      <TransferStatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/transfers/${t.id}`}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
