"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { kycApi } from "@/lib/api/kyc";
import { needsKycGate, resolveKycRoute } from "@/lib/auth/routing";
import { useAuth } from "@/lib/auth/AuthContext";

/** Redirects users who must complete KYC before using the main app. */
export function KycGuard({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!needsKycGate(user)) {
      if (user.kycStatus !== "PENDING") {
        setReady(true);
        return;
      }

      let cancelled = false;

      void (async () => {
        try {
          const status = await kycApi.getStatus();
          if (cancelled) return;

          const route = resolveKycRoute(user, status.verification);
          if (route === "/dashboard") {
            setReady(true);
            return;
          }
          router.replace(route);
        } catch {
          if (!cancelled) {
            setReady(true);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    router.replace(resolveKycRoute(user));
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
