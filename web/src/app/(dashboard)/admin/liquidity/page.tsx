"use client";

import { useCallback, useEffect, useState } from "react";
import { KpiCard } from "@/components/admin/KpiCard";
import { Alert } from "@/components/ui/Alert";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { liquidityApi, type LiquidityLedgerEntry, type LiquidityPoolsSnapshot } from "@/lib/api/liquidity";
import { formatEtb, formatUsd, humanize } from "@/lib/utils";
import { formatDateTime } from "@/lib/transfers/status";

function formatAmount(amount: number, currency: string): string {
  if (currency === "ETB") return formatEtb(amount);
  if (currency === "USD" || currency === "CHF") {
    return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
  }
  return `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ${currency}`;
}

export default function AdminLiquidityPage() {
  const [pools, setPools] = useState<LiquidityPoolsSnapshot | null>(null);
  const [ledger, setLedger] = useState<LiquidityLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [snapshot, entries] = await Promise.all([
        liquidityApi.getPools(),
        liquidityApi.getLedger(100),
      ]);
      setPools(snapshot);
      setLedger(entries);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load liquidity data.");
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
        title="Liquidity"
        description="Swiss and Ethiopia pool balances, ledger, and low-liquidity alerts."
      />

      {loading && <LoadingBlock label="Loading liquidity…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && pools && (
        <>
          {pools.alerts.lowLiquidityWarning && (
            <Alert tone="error">
              <p className="font-semibold">LOW LIQUIDITY WARNING</p>
              <ul className="mt-2 list-inside list-disc text-sm">
                {pools.alerts.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <KpiCard
              label="Swiss liquidity pool"
              value={formatUsd(pools.pools.swiss.usdBalance)}
              hint={`CHF ${pools.pools.swiss.chfBalance.toLocaleString()} · Incoming ${formatUsd(pools.pools.swiss.incomingDeposits)} · Pending ${formatUsd(pools.pools.swiss.pendingSettlements)}`}
              tone="sky"
            />
            <KpiCard
              label="Ethiopia liquidity pool"
              value={formatEtb(pools.pools.ethiopia.etbAvailable)}
              hint={`Reserved ${formatEtb(pools.pools.ethiopia.etbReserved)} · Disbursed ${formatEtb(pools.pools.ethiopia.etbDisbursed)} · Capacity ${formatEtb(pools.pools.ethiopia.etbCapacity)}`}
              tone={pools.alerts.lowLiquidityWarning ? "amber" : "indigo"}
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Liquidity ledger</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/80">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Pool</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Currency</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledger.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-5 py-3 whitespace-nowrap text-slate-400">
                        {formatDateTime(entry.date)}
                      </td>
                      <td className="px-5 py-3">{entry.poolName}</td>
                      <td className="px-5 py-3">{humanize(entry.type)}</td>
                      <td className="px-5 py-3">{entry.currency}</td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {formatAmount(entry.amount, entry.currency)}
                      </td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {formatAmount(entry.balance, entry.currency)}
                      </td>
                    </tr>
                  ))}
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                        No ledger entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
