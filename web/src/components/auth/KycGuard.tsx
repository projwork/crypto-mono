"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { kycApi } from "@/lib/api/kyc";
import { needsKycGate, resolveKycRoute } from "@/lib/auth/routing";
import { useAuth } from "@/lib/auth/AuthContext";

/** Redirects non-verified users away from the main app to the KYC workflow. */
export function KycGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!needsKycGate(user)) {
      setReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const status = await kycApi.getStatus();
        if (!cancelled) {
          router.replace(resolveKycRoute(user, status.verification));
        }
      } catch {
        if (!cancelled) {
          router.replace(resolveKycRoute(user));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm">Checking verification status…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
