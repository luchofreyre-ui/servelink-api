/**
 * Stable operational identity for dispatch exception actions (not row-id based).
 * One work item per booking while it remains in the exception set.
 */
export function buildDispatchExceptionKeyFromBookingId(bookingId: string): string {
  return `dex_v1_${bookingId}`;
}

export function parseBookingIdFromDispatchExceptionKey(
  dispatchExceptionKey: string,
): string | null {
  const prefix = "dex_v1_";
  if (!dispatchExceptionKey.startsWith(prefix)) return null;
  const id = dispatchExceptionKey.slice(prefix.length);
  return id.length > 0 ? id : null;
}
