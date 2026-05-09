import type { BookingRecord } from "./bookingApiTypes";

/** Matches intake-bridge rows like `Booking direction intake … | serviceId=…` (see API bridge). */
function isBookingDirectionIntakeBridgeLine(line: string): boolean {
  const t = line.trim();
  return (
    /Booking direction intake\s+/i.test(t) &&
    t.includes("serviceId=") &&
    t.includes("|")
  );
}

/**
 * Customer-submitted crew prep persisted on `Booking.notes` as `customerPrep=…` on the intake bridge line.
 * Returns trimmed display text only — never the full internal note blob.
 */
export function extractCustomerTeamPrepFromBookingNotes(
  raw: string | null | undefined,
): string | null {
  if (!raw?.trim()) return null;
  const chunks: string[] = [];
  for (const line of raw.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    for (const part of t.split(/\s\|\s/)) {
      const p = part.trim();
      if (p.startsWith("customerPrep=")) {
        const v = p.slice("customerPrep=".length).trim();
        if (v) chunks.push(v);
      }
    }
  }
  if (chunks.length === 0) return null;
  return chunks.join("\n");
}

/**
 * Customer-safe booking note lines for timelines: hides intake-bridge internals; does not expand `customerPrep`
 * (use `extractCustomerTeamPrepFromBookingNotes` for that under team-prep labeling).
 */
export function displayCustomerSafeBookingNotesLines(
  notes: string | null | undefined,
): string[] {
  if (!notes?.trim()) return [];
  return notes
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((line) => !isBookingDirectionIntakeBridgeLine(line));
}

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
