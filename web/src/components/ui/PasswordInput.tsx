"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  hint?: string;
  labelAction?: React.ReactNode;
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
        <path
          d="M2.036 12.322a1 1 0 0 1 0-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
          stroke="currentColor"
          strokeWidth={1.5}
        />
        <path
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
          stroke="currentColor"
          strokeWidth={1.5}
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden>
      <path
        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, hint, labelAction, id, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {(label || labelAction) && (
          <div className="flex items-center justify-between">
            {label && (
              <label htmlFor={id} className="text-sm font-semibold text-slate-700">
                {label}
              </label>
            )}
            {labelAction}
          </div>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={visible ? "text" : "password"}
            className={cn(
              "h-11 w-full rounded-xl border bg-white px-3.5 pr-11 text-sm text-slate-900 transition-colors",
              "placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
              error
                ? "border-rose-400 focus:border-rose-500"
                : "border-slate-200 focus:border-indigo-500",
              className,
            )}
            aria-invalid={error ? true : undefined}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={visible ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            <EyeIcon open={visible} />
          </button>
        </div>
        {error ? (
          <p className="text-xs text-rose-500">{error}</p>
        ) : hint ? (
          <p className="text-xs text-slate-400">{hint}</p>
        ) : null}
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
