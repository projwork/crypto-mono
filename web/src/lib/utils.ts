/** Tiny className joiner (no extra deps). Filters falsy values. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Format a number as ETB currency. */
export function formatEtb(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return `${num.toLocaleString("en-US", { maximumFractionDigits: 2 })} ETB`;
}

/** Format a crypto amount with its asset symbol. */
export function formatAsset(value: number | string, asset: string): string {
  const num = typeof value === "string" ? Number(value) : value;
  return `${num.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${asset}`;
}

/** Human-readable label for a status enum (UPPER_SNAKE → Title Case). */
export function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Format USD amounts for display. */
export function formatUsd(value: number | string | null): string {
  if (value === null) return "Unlimited";
  const num = typeof value === "string" ? Number(value) : value;
  return `$${num.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

/** Resolve a backend upload path to a full URL. */
export function uploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
