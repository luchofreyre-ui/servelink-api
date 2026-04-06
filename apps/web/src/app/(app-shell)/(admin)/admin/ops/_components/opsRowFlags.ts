/** Server-provided eligibility from `/api/v1/system/ops/*` drilldowns (no client-side rules). */
export function opsAllowed(
  row: Record<string, unknown>,
  flag: string,
): boolean {
  return row[flag] === true;
}

export function opsDisabledReason(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const v = row[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** Show enabled control, or disabled with server reason — hide if neither applies. */
export function opsShowAction(
  row: Record<string, unknown>,
  canKey: string,
  reasonKey: string,
): boolean {
  return opsAllowed(row, canKey) || Boolean(opsDisabledReason(row, reasonKey));
}
