import {
  extractCustomerPrepFromBookingNotes,
  parseBookingOperationalMetadataPayloadV1,
} from "./booking-operational-metadata";

export type BookingOperationalMetadataShadowStatus =
  | "match"
  | "structured_only"
  | "notes_only"
  | "mismatch"
  | "no_data"
  | "invalid_structured";

export type CompareBookingOperationalMetadataShadowInput = {
  bookingId: string;
  /** `null` when no operational metadata row was loaded. */
  structuredPayload: unknown | null;
  bookingNotes: string | null | undefined;
};

export type CompareBookingOperationalMetadataShadowResult = {
  bookingId: string;
  status: BookingOperationalMetadataShadowStatus;
  /** Normalized comparable text — for tests / tooling only; do not log by default. */
  normalizedStructuredFreeText?: string;
  normalizedNotesFreeText?: string;
  safeReason: string;
  hasStructuredPrep: boolean;
  hasNotesPrep: boolean;
};

export function normalizeBookingOperationalMetadataComparableText(
  s: string,
): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Default off; malformed values treated as off. */
export function isStructuredBookingMetadataShadowEnabled(): boolean {
  const raw = process.env.ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW;
  if (raw === undefined || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1";
}

/**
 * Pure shadow parity helper — compares structured customer prep vs legacy notes extraction.
 * Never throws (unless programming error).
 */
export function compareBookingOperationalMetadataShadow(
  input: CompareBookingOperationalMetadataShadowInput,
): CompareBookingOperationalMetadataShadowResult {
  const { bookingId, structuredPayload, bookingNotes } = input;

  const notesRaw = extractCustomerPrepFromBookingNotes(bookingNotes);
  const notesNorm = notesRaw
    ? normalizeBookingOperationalMetadataComparableText(notesRaw)
    : "";
  const hasNotesPrep = notesNorm.length > 0;

  const hadBlob =
    structuredPayload !== null && structuredPayload !== undefined;

  if (hadBlob) {
    const parsed = parseBookingOperationalMetadataPayloadV1(structuredPayload);
    if (parsed === null) {
      return {
        bookingId,
        status: "invalid_structured",
        normalizedNotesFreeText: hasNotesPrep ? notesNorm : undefined,
        safeReason: "payload_parse_failed",
        hasStructuredPrep: false,
        hasNotesPrep,
      };
    }

    const structuredNorm =
      parsed.customerTeamPrep?.freeText?.trim()
        ? normalizeBookingOperationalMetadataComparableText(
            parsed.customerTeamPrep.freeText,
          )
        : "";
    const hasStructuredPrep = structuredNorm.length > 0;

    if (!hasStructuredPrep && !hasNotesPrep) {
      return {
        bookingId,
        status: "no_data",
        safeReason: "both_prep_absent",
        hasStructuredPrep: false,
        hasNotesPrep: false,
      };
    }
    if (hasStructuredPrep && hasNotesPrep && structuredNorm === notesNorm) {
      return {
        bookingId,
        status: "match",
        normalizedStructuredFreeText: structuredNorm,
        normalizedNotesFreeText: notesNorm,
        safeReason: "prep_normalized_equal",
        hasStructuredPrep: true,
        hasNotesPrep: true,
      };
    }
    if (hasStructuredPrep && hasNotesPrep && structuredNorm !== notesNorm) {
      return {
        bookingId,
        status: "mismatch",
        normalizedStructuredFreeText: structuredNorm,
        normalizedNotesFreeText: notesNorm,
        safeReason: "prep_normalized_differ",
        hasStructuredPrep: true,
        hasNotesPrep: true,
      };
    }
    if (hasStructuredPrep && !hasNotesPrep) {
      return {
        bookingId,
        status: "structured_only",
        normalizedStructuredFreeText: structuredNorm,
        safeReason: "structured_prep_only",
        hasStructuredPrep: true,
        hasNotesPrep: false,
      };
    }
    return {
      bookingId,
      status: "notes_only",
      normalizedNotesFreeText: notesNorm,
      safeReason: "notes_prep_only",
      hasStructuredPrep: false,
      hasNotesPrep: true,
    };
  }

  if (!hasNotesPrep) {
    return {
      bookingId,
      status: "no_data",
      safeReason: "both_prep_absent",
      hasStructuredPrep: false,
      hasNotesPrep: false,
    };
  }

  return {
    bookingId,
    status: "notes_only",
    normalizedNotesFreeText: notesNorm,
    safeReason: "notes_prep_only",
    hasStructuredPrep: false,
    hasNotesPrep: true,
  };
}
