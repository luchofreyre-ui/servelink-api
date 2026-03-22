export type BookingBillingSummary = {
  marginPct: number;
  marginThin: boolean;
  subtotal: number;
};

/**
 * Derives billing view-model fields used by portfolio economics signals.
 * Reads nested shapes defensively from `/bookings/:id/screen`.
 */
export function computeBookingBilling(screen: unknown): BookingBillingSummary {
  const root = screen && typeof screen === "object" ? (screen as Record<string, unknown>) : {};
  const billing =
    root.billing && typeof root.billing === "object"
      ? (root.billing as Record<string, unknown>)
      : {};
  const marginPct = Number(
    billing.marginPct ?? billing.marginPercent ?? billing.grossMarginPct ?? 50,
  );
  const subtotal = Number(billing.subtotal ?? billing.total ?? 0);
  return {
    marginPct: Number.isFinite(marginPct) ? marginPct : 50,
    marginThin: (Number.isFinite(marginPct) ? marginPct : 50) < 18,
    subtotal: Number.isFinite(subtotal) ? subtotal : 0,
  };
}
