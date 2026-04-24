/**
 * Billing/payment crons follow this convention unless a file states otherwise:
 * - **Enabled by default** (including when the env var is unset).
 * - **Disabled only** when the variable is explicitly set to `"false"` (trimmed, case-insensitive).
 */
export function isCronDisabledByExplicitFalse(envValue: string | undefined): boolean {
  return String(envValue ?? "").trim().toLowerCase() === "false";
}
