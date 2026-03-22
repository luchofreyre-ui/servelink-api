/**
 * Format date for display (ISO string -> local readable).
 */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * Format relative time (e.g. "5 min ago").
 */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(iso);
}

/**
 * Format number with optional decimals.
 */
export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (value == null || Number.isNaN(value)) return "—";
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

/**
 * Format currency (cents or units). Pass amount in display units (e.g. dollars).
 */
export function formatCurrency(
  value: number | null | undefined,
  options: { currency?: string; inCents?: boolean } = {},
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const { currency = "USD", inCents = false } = options;
  const amount = inCents ? value / 100 : value;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Format percentage (0-100 or 0-1 based on unit).
 */
export function formatPercent(
  value: number | null | undefined,
  options: { decimals?: number; unitScale?: "0-100" | "0-1" } = {},
): string {
  if (value == null || Number.isNaN(value)) return "—";
  const { decimals = 1, unitScale = "0-100" } = options;
  const p = unitScale === "0-1" ? value * 100 : value;
  return `${p.toFixed(decimals)}%`;
}

/**
 * Integer count display (e.g. table counts).
 */
export function formatCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return String(Math.round(value));
}

/**
 * Fallback display for missing values. Use everywhere instead of inline "—".
 */
export function fallbackDisplay(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}
