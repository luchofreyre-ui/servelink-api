import {
  type BookingOperationalMetadataProvenance,
  analyzeCustomerPrepFieldsInBookingNotes,
  buildBookingOperationalMetadataPayloadV1,
  extractCustomerPrepFromBookingNotes,
  hasCustomerTeamPrep,
} from "../src/modules/bookings/booking-operational-metadata";

/** Matches intake-bridge rows like `Booking direction intake … | serviceId=…` (see API bridge / web `bookingDisplay`). */
export function isBookingDirectionIntakeBridgeLine(line: string): boolean {
  const t = line.trim();
  return (
    /Booking direction intake\s+/i.test(t) &&
    t.includes("serviceId=") &&
    t.includes("|")
  );
}

export function hasMalformedBookingDirectionBridgeHint(notes: string): boolean {
  for (const line of notes.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    if (/booking direction intake/i.test(t) && !isBookingDirectionIntakeBridgeLine(t)) {
      return true;
    }
  }
  return false;
}

export function hasAnyBookingDirectionIntakeBridgeLine(notes: string): boolean {
  for (const line of notes.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    if (isBookingDirectionIntakeBridgeLine(t)) return true;
  }
  return false;
}

/** Non-bridge lines with substantive text (ops / free-form customer notes). */
export function hasNonBridgeSubstantiveLines(notes: string): boolean {
  for (const line of notes.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    if (!isBookingDirectionIntakeBridgeLine(t)) return true;
  }
  return false;
}

/** Fixed ISO provenance used only to exercise `buildBookingOperationalMetadataPayloadV1` in dry-run validation. */
const DRY_RUN_PAYLOAD_VALIDATION_PROVENANCE: BookingOperationalMetadataProvenance = {
  source: "booking_direction_intake",
  capturedAt: "1970-01-01T00:00:00.000Z",
  legacyNotesTransport: "recurringInterest.note",
};

export const OPERATIONAL_METADATA_BACKFILL_BUCKETS = [
  "A_structured_present",
  "B_would_create_from_notes",
  "C_no_prep",
  "D_ambiguous_notes",
  "E_bridge_only_no_prep",
  "F_free_form_notes_no_prep",
  "G_invalid_or_empty_prep",
] as const;

export type OperationalMetadataBackfillBucket =
  (typeof OPERATIONAL_METADATA_BACKFILL_BUCKETS)[number];

export type OperationalMetadataBackfillClassificationInput = {
  id: string;
  notes: string | null | undefined;
  createdAt: Date | string;
  hasOperationalMetadataRow: boolean;
};

export type OperationalMetadataBackfillClassificationResult = {
  bookingId: string;
  bucket: OperationalMetadataBackfillBucket;
  createdAt: Date | string;
};

function notesAppearsEmpty(raw: string | null | undefined): boolean {
  return raw === null || raw === undefined || !String(raw).trim();
}

export function classifyBookingForOperationalMetadataBackfill(
  row: OperationalMetadataBackfillClassificationInput,
): OperationalMetadataBackfillClassificationResult {
  const bucket = classifyBookingForOperationalMetadataBackfillBucket(row);
  return { bookingId: row.id, bucket, createdAt: row.createdAt };
}

export function classifyBookingForOperationalMetadataBackfillBucket(
  row: OperationalMetadataBackfillClassificationInput,
): OperationalMetadataBackfillBucket {
  if (row.hasOperationalMetadataRow) {
    return "A_structured_present";
  }

  if (notesAppearsEmpty(row.notes)) {
    return "C_no_prep";
  }

  const notes = String(row.notes);

  if (hasMalformedBookingDirectionBridgeHint(notes)) {
    return "D_ambiguous_notes";
  }

  const { nonEmptySegments, customerPrepFieldCount } =
    analyzeCustomerPrepFieldsInBookingNotes(notes);

  if (customerPrepFieldCount > 1) {
    return "D_ambiguous_notes";
  }

  if (customerPrepFieldCount === 1 && nonEmptySegments.length === 0) {
    return "G_invalid_or_empty_prep";
  }

  if (customerPrepFieldCount === 1 && nonEmptySegments.length === 1) {
    const prepJoined = extractCustomerPrepFromBookingNotes(notes);
    if (!prepJoined?.trim()) {
      return "G_invalid_or_empty_prep";
    }
    try {
      const payload = buildBookingOperationalMetadataPayloadV1({
        customerTeamPrepFreeText: prepJoined,
        provenance: DRY_RUN_PAYLOAD_VALIDATION_PROVENANCE,
      });
      if (!hasCustomerTeamPrep(payload)) {
        return "G_invalid_or_empty_prep";
      }
      return "B_would_create_from_notes";
    } catch {
      return "G_invalid_or_empty_prep";
    }
  }

  /* customerPrepFieldCount === 0 */
  if (hasAnyBookingDirectionIntakeBridgeLine(notes) && !hasNonBridgeSubstantiveLines(notes)) {
    return "E_bridge_only_no_prep";
  }

  if (hasNonBridgeSubstantiveLines(notes)) {
    return "F_free_form_notes_no_prep";
  }

  return "C_no_prep";
}

export function summarizeOperationalMetadataBackfillClassifications(
  rows: Array<{ bucket: OperationalMetadataBackfillBucket }>,
): Record<OperationalMetadataBackfillBucket, number> {
  const counts = Object.fromEntries(
    OPERATIONAL_METADATA_BACKFILL_BUCKETS.map((b) => [b, 0]),
  ) as Record<OperationalMetadataBackfillBucket, number>;
  for (const r of rows) {
    counts[r.bucket]++;
  }
  return counts;
}

export type OperationalMetadataBackfillDryRunCursor = {
  createdAt: string;
  id: string;
};

export type SafeOperationalMetadataBackfillReport = {
  summary: {
    totalScanned: number;
    batchSize: number;
    limit: number | null;
    cursorStart: { createdAt: string | null; id: string | null };
    cursorEnd: { createdAt: string | null; id: string | null };
    percentagesByBucket: Record<OperationalMetadataBackfillBucket, number>;
  };
  buckets: Record<OperationalMetadataBackfillBucket, number>;
  samples?: Partial<Record<OperationalMetadataBackfillBucket, string[]>>;
  nextCursor: OperationalMetadataBackfillDryRunCursor | null;
};

function iso(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  const parsed = Date.parse(String(d));
  if (!Number.isFinite(parsed)) return String(d);
  return new Date(parsed).toISOString();
}

export function computeNextCursorFromLastRow(row: {
  createdAt: Date | string;
  bookingId: string;
}): OperationalMetadataBackfillDryRunCursor {
  return { createdAt: iso(row.createdAt), id: row.bookingId };
}

export function buildSafeOperationalMetadataBackfillReport(args: {
  classifications: OperationalMetadataBackfillClassificationResult[];
  batchSize: number;
  limit: number | null;
  cursorStart: OperationalMetadataBackfillDryRunCursor | null;
  includeSamples: boolean;
  sampleLimit: number;
}): SafeOperationalMetadataBackfillReport {
  const { classifications, batchSize, limit, cursorStart, includeSamples, sampleLimit } =
    args;

  const totalScanned = classifications.length;
  const bucketCounts = summarizeOperationalMetadataBackfillClassifications(classifications);

  const percentagesByBucket = Object.fromEntries(
    OPERATIONAL_METADATA_BACKFILL_BUCKETS.map((b) => {
      const pct = totalScanned === 0 ? 0 : (bucketCounts[b] / totalScanned) * 100;
      return [b, Math.round(pct * 100) / 100];
    }),
  ) as Record<OperationalMetadataBackfillBucket, number>;

  const last = classifications[classifications.length - 1];

  const samples: Partial<Record<OperationalMetadataBackfillBucket, string[]>> | undefined =
    includeSamples
      ? (() => {
          const acc = OPERATIONAL_METADATA_BACKFILL_BUCKETS.reduce(
            (o, b) => {
              o[b] = [];
              return o;
            },
            {} as Record<OperationalMetadataBackfillBucket, string[]>,
          );
          for (const c of classifications) {
            const arr = acc[c.bucket];
            if (arr.length < sampleLimit) {
              arr.push(c.bookingId);
            }
          }
          return acc;
        })()
      : undefined;

  return {
    summary: {
      totalScanned,
      batchSize,
      limit,
      cursorStart: cursorStart
        ? { createdAt: cursorStart.createdAt, id: cursorStart.id }
        : { createdAt: null, id: null },
      cursorEnd: last
        ? { createdAt: iso(last.createdAt), id: last.bookingId }
        : { createdAt: null, id: null },
      percentagesByBucket,
    },
    buckets: bucketCounts,
    ...(samples ? { samples } : {}),
    nextCursor: last ? computeNextCursorFromLastRow(last) : null,
  };
}
