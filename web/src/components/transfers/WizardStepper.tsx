import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  label: string;
}

interface WizardStepperProps {
  steps: WizardStep[];
  current: number;
}

export function WizardStepper({ steps, current }: WizardStepperProps) {
  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li
              key={step.id}
              className={cn("flex items-center", index < steps.length - 1 && "flex-1")}
            >
              <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                    done && "bg-indigo-600 text-white",
                    active && !done && "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-400",
                    !done && !active && "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                  )}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4">
                      <path d="m5 12 5 5 9-11" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    active ? "text-slate-900 dark:text-white" : "text-slate-400",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 hidden h-0.5 flex-1 sm:block",
                    done ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
