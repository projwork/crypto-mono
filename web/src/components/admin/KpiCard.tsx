import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "emerald" | "sky" | "amber";
}

const toneStyles = {
  default: "from-slate-50 to-white dark:from-slate-900 dark:to-slate-950",
  emerald: "from-emerald-50/80 to-white dark:from-emerald-500/10 dark:to-slate-950",
  sky: "from-sky-50/80 to-white dark:from-sky-500/10 dark:to-slate-950",
  amber: "from-amber-50/80 to-white dark:from-amber-500/10 dark:to-slate-950",
};

const iconStyles = {
  default: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

export function KpiCard({ label, value, hint, icon, tone = "default" }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 bg-gradient-to-br p-5 shadow-sm",
        "dark:border-slate-800",
        toneStyles[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
        </div>
        {icon && (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
              iconStyles[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
