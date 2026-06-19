"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { cn } from "@/lib/utils";

interface DocumentDropzoneProps {
  label: string;
  hint?: string;
  error?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  icon?: "passport" | "id" | "license";
  showCamera?: boolean;
  onCameraClick?: () => void;
  cameraActive?: boolean;
  cameraSlot?: React.ReactNode;
}

function DocIcon({ type }: { type: DocumentDropzoneProps["icon"] }) {
  if (type === "passport") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-indigo-500">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth={1.5} />
        <circle cx="12" cy="10" r="2.5" stroke="currentColor" strokeWidth={1.5} />
        <path d="M8 16h8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "license") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-indigo-500">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth={1.5} />
        <path d="M7 10h4M7 14h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-indigo-500">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth={1.5} />
      <path d="M8 9h8M8 13h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export function DocumentDropzone({
  label,
  hint,
  error,
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  icon = "id",
  showCamera = false,
  onCameraClick,
  cameraActive = false,
  cameraSlot,
}: DocumentDropzoneProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0] ?? null;
    if (file) onChange(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  if (cameraActive && cameraSlot) {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        {cameraSlot}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "rounded-2xl border-2 border-dashed p-5 transition-all",
          dragging
            ? "border-indigo-400 bg-indigo-50/50"
            : error
              ? "border-rose-300 bg-rose-50/30"
              : "border-slate-200 bg-slate-50/50 hover:border-indigo-300",
        )}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleFiles(e.target.files)}
          className="sr-only"
        />
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <DocIcon type={icon} />
          </div>
          <div className="min-w-0 flex-1">
            {value ? (
              <p className="truncate text-sm font-bold text-indigo-700">{value.name}</p>
            ) : (
              <p className="text-sm text-slate-500">
                Drag & drop or <span className="text-indigo-600 font-semibold">browse</span>
              </p>
            )}
            {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
            <p className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider font-bold">
              JPEG, PNG, WEBP or PDF — max 5 MB
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
          >
            {value ? "Replace file" : "Upload file"}
          </button>
          {showCamera && onCameraClick && (
            <button
              type="button"
              onClick={onCameraClick}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                <path
                  d="M6.827 6.175A2.31 2.31 0 0 1 5.186 5.25c-.376.03-.756.128-1.12.293a2.25 2.25 0 0 0-1.591 1.591c-.165.364-.263.744-.293 1.12A2.31 2.31 0 0 1 3 9.5v5.25A2.25 2.25 0 0 0 5.25 17h13.5A2.25 2.25 0 0 0 21 14.75V9.5a2.25 2.25 0 0 0-2.25-2.25h-2.086a2.31 2.31 0 0 1-1.741-.86L14.1 4.86a2.25 2.25 0 0 0-1.591-.86H9.75a2.25 2.25 0 0 0-2.25 2.25v.175Z"
                  stroke="currentColor"
                  strokeWidth={1.5}
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.5} />
              </svg>
              Use camera
            </button>
          )}
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-xl px-4 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
