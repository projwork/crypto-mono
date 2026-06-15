import { cn } from "@/lib/utils";
import type { TransferStatus } from "@/lib/api/types";
import {
  formatDateTime,
  getStepState,
  LIFECYCLE_STEPS,
  statusLabel,
  TERMINAL_FAILURE_STATUSES,
  type StepVisualState,
} from "@/lib/transfers/status";

const dotStyles: Record<StepVisualState, string> = {
  completed: "bg-emerald-500 ring-emerald-500/20",
  current: "bg-sky-500 ring-sky-500/30 animate-pulse",
  pending: "bg-slate-200 ring-slate-200/50 dark:bg-slate-700",
  failed: "bg-rose-500 ring-rose-500/30",
};

const lineStyles: Record<StepVisualState, string> = {
  completed: "bg-emerald-500",
  current: "bg-sky-300 dark:bg-sky-700",
  pending: "bg-slate-200 dark:bg-slate-700",
  failed: "bg-rose-400",
};

interface TransferTimelineProps {
  currentStatus: TransferStatus;
  reached: Map<TransferStatus, string>;
}

export function TransferTimeline({ currentStatus, reached }: TransferTimelineProps) {
  const steps = [...LIFECYCLE_STEPS];
  const showFailure =
    TERMINAL_FAILURE_STATUSES.includes(currentStatus) &&
    !LIFECYCLE_STEPS.includes(currentStatus);

  if (showFailure && !steps.includes(currentStatus)) {
    steps.push(currentStatus);
  }

  return (
    <ol className="relative space-y-0">
      {steps.map((step, index) => {
        const state = getStepState(step, currentStatus, reached);
        const timestamp = reached.get(step);
        const isLast = index === steps.length - 1;

        return (
          <li key={step} className="relative flex gap-4 pb-8 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5",
                  lineStyles[state === "pending" ? "pending" : "completed"],
                )}
                aria-hidden
              />
            )}

            <span
              className={cn(
                "relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4",
                dotStyles[state],
              )}
              aria-hidden
            >
              {state === "completed" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-4 w-4">
                  <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {state === "failed" && (
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} className="h-4 w-4">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
                </svg>
              )}
            </span>

            <div className="min-w-0 flex-1 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  state === "pending" && "text-slate-400",
                  state === "current" && "text-sky-700 dark:text-sky-400",
                  state === "completed" && "text-slate-900 dark:text-slate-100",
                  state === "failed" && "text-rose-600 dark:text-rose-400",
                )}
              >
                {statusLabel(step)}
              </p>
              {timestamp && state !== "pending" && (
                <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(timestamp)}</p>
              )}
              {state === "current" && (
                <p className="mt-1 text-xs text-sky-600 dark:text-sky-400">In progress…</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
