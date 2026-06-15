"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth/AuthContext";
import { humanize } from "@/lib/utils";

function kycTone(status: string): "success" | "warning" | "danger" {
  if (status === "APPROVED") return "success";
  if (status === "REJECTED") return "danger";
  return "warning";
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const initials = user
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    : "";

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <div className="hidden sm:block">
          <p className="text-sm text-slate-400">Welcome back,</p>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {user ? `${user.firstName} ${user.lastName}` : ""}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <Badge tone={kycTone(user.kycStatus)}>
            {humanize(user.kycTier)} · {humanize(user.kycStatus)}
          </Badge>
        )}
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
            {initials}
          </span>
          <div className="hidden text-right md:block">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {user?.email}
            </p>
            <p className="text-[11px] text-slate-400">{user ? humanize(user.role) : ""}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} loading={signingOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
