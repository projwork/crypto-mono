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
