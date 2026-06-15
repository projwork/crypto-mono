"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { KpiCard } from "@/components/admin/KpiCard";
import { Alert } from "@/components/ui/Alert";
import { ErrorBlock, LoadingBlock, PageHeader } from "@/components/ui/PageStates";
import { ApiError } from "@/lib/api/client";
import { adminApi, type AdminStats } from "@/lib/api/admin";
import { formatEtb, formatUsd } from "@/lib/utils";

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await adminApi.getStats());
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin stats.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const lowLiquidity =
    stats &&
    stats.ethiopiaLiquidity.etbCapacity > 0 &&
    stats.ethiopiaLiquidity.etbAvailable / stats.ethiopiaLiquidity.etbCapacity < 0.2;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Platform overview — transfers, liquidity, and user activity."
      />

      {loading && <LoadingBlock label="Loading dashboard…" />}
      {!loading && error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && stats && (
        <>
          {lowLiquidity && (
            <Alert tone="error">
              <strong>Low liquidity warning:</strong> Ethiopia ETB available is below 20% of capacity.
              Review the{" "}
              <Link href="/admin/liquidity" className="font-medium underline underline-offset-2">
                liquidity pools
              </Link>
              .
            </Alert>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <KpiCard
              label="Total transfers"
              value={formatNumber(stats.totalTransfers)}
              hint="All-time transfer count"
              tone="default"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <KpiCard
              label="Total ETB paid"
              value={formatEtb(stats.totalEtbPaid)}
              hint="Completed payouts to recipients"
              tone="emerald"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <KpiCard
              label="Total crypto received"
              value={formatUsd(stats.totalCryptoReceivedUsd)}
              hint="USD value of confirmed deposits"
              tone="sky"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v10M9 10h4.5a2.5 2.5 0 0 1 0 5H9" strokeLinecap="round" />
                </svg>
              }
            />
            <KpiCard
              label="Swiss liquidity balance"
              value={formatUsd(stats.swissLiquidity.usdBalance)}
              hint={`CHF ${formatNumber(stats.swissLiquidity.chfBalance)} available`}
              tone="default"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M3 21h18M6 21V7l6-4 6 4v14" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <KpiCard
              label="Ethiopia liquidity balance"
              value={formatEtb(stats.ethiopiaLiquidity.etbAvailable)}
              hint={`${formatEtb(stats.ethiopiaLiquidity.etbReserved)} reserved · capacity ${formatEtb(stats.ethiopiaLiquidity.etbCapacity)}`}
              tone={lowLiquidity ? "amber" : "emerald"}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M3 3v18h18M7 14l4-4 4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <KpiCard
              label="Active users"
              value={formatNumber(stats.activeUsers)}
              hint="Registered sender accounts"
              tone="default"
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/admin/transactions"
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-slate-900 dark:text-white">Transactions</p>
              <p className="mt-1 text-slate-500">All transfers with filters and overrides</p>
            </Link>
            <Link
              href="/admin/kyc"
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-slate-900 dark:text-white">KYC review</p>
              <p className="mt-1 text-slate-500">Approve or reject pending verifications</p>
            </Link>
            <Link
              href="/admin/liquidity"
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-slate-900 dark:text-white">Liquidity pools</p>
              <p className="mt-1 text-slate-500">Swiss & Ethiopia balances and ledger</p>
            </Link>
            <Link
              href="/admin/controls"
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-slate-900 dark:text-white">Admin controls</p>
              <p className="mt-1 text-slate-500">FX rate updates & failed transfer overrides</p>
            </Link>
            <Link
              href="/admin/audit"
              className="rounded-xl border border-slate-200 bg-white p-4 text-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="font-medium text-slate-900 dark:text-white">Audit log</p>
              <p className="mt-1 text-slate-500">Platform activity and transfer events</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
