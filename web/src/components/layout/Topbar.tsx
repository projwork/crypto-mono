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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 sm:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>

        {/* Breadcrumb/Greeting */}
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Dashboard</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Overview
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* User Info & Profile Unit */}
        <div className="flex items-center gap-3 border-l border-slate-100 pl-6 dark:border-slate-800">
          {/* Detailed Info (Hidden on mobile) */}
          <div className="hidden text-right lg:block">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
              {user ? `${user.firstName} ${user.lastName}` : "User"}
            </p>
            <div className="flex items-center justify-end gap-2 mt-0.5">
               {user && (
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-tighter",
                    user.kycStatus === "APPROVED" ? "text-emerald-600" : "text-amber-600"
                  )}>
                    {humanize(user.kycTier)} · {humanize(user.kycStatus)}
                  </span>
               )}
            </div>
          </div>

          {/* Avatar Unit */}
          <div className="relative">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-xs font-bold text-white shadow-sm">
              {initials}
            </div>
            {/* Status Indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-950" />
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleLogout}
          disabled={signingOut}
          aria-label="Sign out"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-600 transition-all dark:border-slate-800 dark:hover:bg-red-500/10"
          title="Sign out"
        >
          {signingOut ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}

// Utility for class merging if not already globally available
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}