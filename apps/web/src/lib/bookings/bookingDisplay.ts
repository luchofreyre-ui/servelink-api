import type { BookingRecord } from "./bookingApiTypes";

export function displayBookingPrice(booking: BookingRecord): string {
  if (typeof booking.priceTotal === "number" && Number.isFinite(booking.priceTotal)) {
    return `$${booking.priceTotal.toFixed(0)}`;
  }
  const q = Number(booking.quotedTotal ?? 0);
  if (Number.isFinite(q) && q > 0) {
    return `$${q.toFixed(0)}`;
  }
  return "—";
}

export function displayBookingNotesLines(booking: BookingRecord): string[] {
  const raw = booking.notes?.trim();
  if (!raw) return [];
  return raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
}
