import type { BookingPaymentStatus, BookingRecord } from "./bookingApiTypes";

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

function bookingNotesLinesExcludingIntakeBridge(
  notes: string | null | undefined,
): string[] {
  if (!notes?.trim()) return [];
  return notes
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((line) => !isBookingDirectionIntakeBridgeLine(line));
}

/**
 * Customer-safe booking note lines for timelines: hides intake-bridge internals; does not expand `customerPrep`
 * (use `extractCustomerTeamPrepFromBookingNotes` for that under team-prep labeling).
 */
export function displayCustomerSafeBookingNotesLines(
  notes: string | null | undefined,
): string[] {
  return bookingNotesLinesExcludingIntakeBridge(notes);
}

/**
 * Admin / ops / FO human-readable booking note lines: hides intake-bridge blobs from default views while
 * preserving free-form operational notes. Raw lines remain available via {@link displayBookingNotesLines}.
 */
export function displayOpsBookingNotesLines(
  notes: string | null | undefined,
): string[] {
  return bookingNotesLinesExcludingIntakeBridge(notes);
}

/** Parsed `customerPrep=` payload from `Booking.notes` (ops-facing alias). */
export function extractTeamPrepFromBookingNotes(
  raw: string | null | undefined,
): string | null {
  return extractCustomerTeamPrepFromBookingNotes(raw);
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

/** Customer portal headline — scheduled visit wins over raw IDs. */
export function formatVisitScheduleHeading(iso: string | null | undefined): string {
  if (!iso?.trim()) return "Visit scheduling in progress";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Visit scheduling in progress";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

/** Short opaque reference — never the primary headline. */
export function formatBookingReferenceLabel(bookingId: string): string {
  const tail = bookingId.length > 8 ? bookingId.slice(-8) : bookingId;
  return `Ref · ${tail}`;
}

/** Plain-language payment copy for customer-facing surfaces (not ops enums). */
export function describePaymentStatusForCustomer(
  paymentStatus: BookingPaymentStatus | null | undefined,
): string {
  switch (paymentStatus) {
    case "paid":
      return "Paid — thank you";
    case "authorized":
      return "Deposit secured";
    case "checkout_created":
      return "Secure checkout ready — finish payment to confirm";
    case "payment_pending":
      return "Payment processing";
    case "unpaid":
      return "Deposit not completed yet";
    case "failed":
      return "Payment needs attention";
    case "refunded":
      return "Refunded";
    case "waived":
      return "Deposit waived";
    default:
      return "Payment status updating…";
  }
}
