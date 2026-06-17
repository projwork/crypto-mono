"use client";

import { useId, useRef, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface FileInputProps {
  label: string;
  accept?: string;
  hint?: string;
  error?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  existingUrl?: string | null;
}

export function FileInput({
  label,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  hint,
  error,
  value,
  onChange,
  existingUrl,
}: FileInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.files?.[0] ?? null);
  };

  const fileName = value?.name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div
        className={cn(
          "flex flex-col gap-2 rounded-xl border border-dashed p-4 transition-colors",
          error
            ? "border-rose-300 bg-rose-50/50 dark:border-rose-500/40 dark:bg-rose-500/5"
            : "border-slate-200 bg-slate-50/50 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-900/50",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {fileName ? (
              <p className="truncate text-sm font-medium text-indigo-700 dark:text-indigo-400">
                {fileName}
              </p>
            ) : existingUrl ? (
              <a
                href={existingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View uploaded document
              </a>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                JPEG, PNG, WEBP or PDF — max 5 MB
              </p>
            )}
            {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
          >
            {fileName || existingUrl ? "Replace" : "Choose file"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
