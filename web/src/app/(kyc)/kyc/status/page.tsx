"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { kycApi } from "@/lib/api/kyc";
import type { KycStatus, KycStatusResponse } from "@/lib/api/types";
import { tokenStore } from "@/lib/api/tokenStore";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatUsd, humanize } from "@/lib/utils";

const POLL_INTERVAL_MS = 7000;

function SophisticatedRadarPulse() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Precision ambient radar tracking rings */}
      <span className="absolute h-full w-full animate-ping rounded-full bg-blue-500/10 [animation-duration:3s]" />
      <span className="absolute h-16 w-16 animate-pulse rounded-full bg-indigo-500/20 [animation-duration:2s]" />
      
      {/* High-end glassmorphic central core */}
      <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-[0_0_30px_rgba(59,130,246,0.4)] border border-white/10">
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white animate-spin [animation-duration:2.5s]">
          <path
            d="M12 4.75v1.5M12 17.75v1.5M4.75 12h1.5M17.75 12h1.5M6.64 6.64l1.06 1.06M16.3l1.06 1.06M6.64 17.36l1.06-1.06M16.3 7.7l1.06-1.06"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}

function PremiumLimitCard({ data }: { data: KycStatusResponse }) {
  const { limit } = data;
  const usedPct =
    limit.limitUsd && limit.limitUsd > 0
      ? Math.min(100, (limit.usedUsd / limit.limitUsd) * 100)
      : 0;

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-[#090f2c]/60 p-6 space-y-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {humanize(data.tier.replace("TIER_", "Tier "))} Limits Ledger
        </span>
        <span className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          Locked During Review
        </span>
      </div>

      {limit.unlimited ? (
        <p className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Unlimited Account Access</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 text-left">
            <div>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Limit</p>
              <p className="mt-1 text-base font-bold text-white font-mono">{formatUsd(limit.limitUsd)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Used</p>
              <p className="mt-1 text-base font-bold text-slate-400 font-mono">{formatUsd(limit.usedUsd)}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium tracking-wide text-slate-500 uppercase">Remaining</p>
              <p className="mt-1 text-base font-bold text-blue-400 font-mono">
                {formatUsd(limit.remainingUsd ?? 0)}
              </p>
            </div>
          </div>
          
          {/* Enhanced readability track bar */}
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function KycStatusPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const [data, setData] = useState<KycStatusResponse | null>(null);
  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPoll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const handleUnauthorized = useCallback(async () => {
    clearPoll();
    tokenStore.clear();
    await logout();
    router.replace("/login");
  }, [clearPoll, logout, router]);

  const fetchStatus = useCallback(
    async (isInitial = false) => {
      if (!isInitial) setReconnecting(true);
      try {
        const response = await kycApi.getStatus();
        setData(response);
        setStatus(response.status);
        setError(null);

        if (response.status === "APPROVED") {
          clearPoll();
          router.replace("/dashboard");
          return;
        }

        if (response.status === "REJECTED") {
          clearPoll();
        }

        if (response.status === "PENDING" && !response.verification) {
          router.replace("/kyc/submit");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await handleUnauthorized();
          return;
        }
        if (isInitial) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load verification status.",
          );
        } else {
          console.warn("KYC status poll failed:", err);
        }
      } finally {
        if (isInitial) setLoading(false);
        setReconnecting(false);
      }
    },
    [clearPoll, handleUnauthorized, router],
  );

  useEffect(() => {
    void fetchStatus(true);
  }, [fetchStatus]);

  useEffect(() => {
    if (status !== "PENDING") return;

    intervalRef.current = setInterval(() => {
      void fetchStatus(false);
    }, POLL_INTERVAL_MS);

    return clearPoll;
  }, [status, fetchStatus, clearPoll]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#030922] gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <p className="text-xs font-semibold tracking-wide text-slate-400">Synchronizing secure networks…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030922] text-white font-sans antialiased selection:bg-blue-500/30 flex flex-col justify-between">
      
      {/* NileRemit Branded App Header Header */}
      <header className="mx-auto w-full max-w-7xl px-6 py-6 flex items-center justify-between border-b border-slate-900/40">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-teal-600 text-white shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M12 2v20M7 6l5-4 5 4M7 18l5 4 5-4"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-white">NileRemit</p>
            <p className="text-[11px] text-slate-400">Crypto → ETB</p>
          </div>
        </Link>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          Connect Wallet
        </Button>
      </header>

      {/* Main Workspace Frame Deck Container */}
      <main className="flex-1 flex items-center justify-center px-3 py-12">
        <div className="w-full max-w-lg mx-auto">
          
          {error && !data && (
            <div className="space-y-4 text-center bg-[#090f2c]/60 border border-red-900/40 rounded-2xl p-6">
              <Alert tone="error">{error}</Alert>
              <Button onClick={() => void fetchStatus(true)} className="bg-blue-600 text-xs w-full">
                Retry Verification Pipeline
              </Button>
            </div>
          )}

          {/* REJECTED PROFILE SUBMISSION STATE */}
          {status === "REJECTED" && data && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-rose-500">
                    <path
                      d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Verification Declined</h2>
                <p className="mt-2 text-xs text-slate-400 max-w-sm mx-auto">
                  Your identity payload profiles could not be validated against network requirements.
                </p>
              </div>

              <div className="bg-[#090f2c]/40 border border-slate-900/80 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="rounded-xl bg-rose-950/30 border border-rose-900/40 p-4 text-xs text-rose-400 font-medium">
                  <span className="font-bold block uppercase text-[10px] tracking-wider text-rose-300 mb-1">Reason for rejection:</span>
                  {data.verification?.rejectionReason ?? "Documents did not meet compliance parameters checklist criteria."}
                </div>

                {data && <PremiumLimitCard data={data} />}

                <Link href="/kyc/submit" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 rounded-xl text-xs tracking-wide shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all">
                    Re-submit Identity Profile
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ACTIVE VERIFICATION PENDING STATE LINK */}
          {status === "PENDING" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8">
              <div className="text-center flex flex-col items-center">
                <SophisticatedRadarPulse />
                <h2 className="text-2xl font-bold tracking-tight text-white mt-4">
                  Verification in progress
                </h2>
                <p className="mt-2 text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
                  Compliance modules are validating document data records against global tracking nodes.
                </p>
                {reconnecting && (
                  <p className="mt-2 text-[10px] font-bold tracking-widest text-blue-500 uppercase animate-pulse">
                    Syncing Ledger Nodes…
                  </p>
                )}
              </div>

              <div className="bg-[#090f2c]/40 border border-slate-900/80 p-6 md:p-8 rounded-3xl space-y-6">
                <div className="rounded-xl bg-blue-950/30 border border-blue-900/40 p-4 text-xs text-blue-400/90 font-medium leading-relaxed">
                  Your transaction tier velocity caps remain locked until compliance updates the authorization database records. You will be redirected instantly upon confirmation.
                </div>

                {data && <PremiumLimitCard data={data} />}

                {/* Highly readable high contrast state status tracker capsule banner item info layout */}
                <div className="flex items-center justify-between rounded-xl bg-[#030922] border border-slate-800/60 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse ring-4 ring-amber-500/20" />
                    <span className="text-xs font-semibold text-slate-400">Current Queue State</span>
                  </div>
                  <span className="text-xs font-bold font-mono tracking-wider text-amber-400 uppercase">
                    {humanize(status ?? "PENDING")}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer Meta Notes */}
      <footer className="pb-8 text-center text-[10px] tracking-wider text-slate-600 uppercase font-medium">
        Checking for ledger security updates automatically
      </footer>

    </div>
  );
}