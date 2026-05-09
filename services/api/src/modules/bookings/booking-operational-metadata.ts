/**
 * Booking operational metadata — V1 payload contract and validation.
 * Display helpers must never expose `provenance` to customer-facing DTOs.
 */

export const BOOKING_OPERATIONAL_METADATA_SCHEMA_VERSION_V1 = 1;

/** Primary customer prep blob from intake / planning flows. */
export const MAX_CUSTOMER_TEAM_PREP_FREE_TEXT_LEN = 8_000;

/** Optional structured hints (human-entered labels). */
export const MAX_STRUCTURED_HINT_FIELD_LEN = 2_000;

export type BookingOperationalMetadataProvenance = {
  source: "booking_direction_intake";
  capturedAt: string;
  legacyNotesTransport: "recurringInterest.note";
};

export type CustomerTeamPrepStructuredHints = {
  offLimitsRooms?: string;
  accessInstructions?: string;
  parkingInstructions?: string;
  fragileOrSpecialCare?: string;
  petsAccessHandling?: string;
  priorityRooms?: string;
  residentAtHomeConstraints?: string;
  fragranceOrProductSensitivity?: string;
  gateOrBuildingInstructions?: string;
};

export type CustomerTeamPrepMetadata = {
  freeText: string;
  structuredHints?: CustomerTeamPrepStructuredHints;
};

export type BookingOperationalMetadataPayloadV1 = {
  customerTeamPrep?: CustomerTeamPrepMetadata;
  provenance?: BookingOperationalMetadataProvenance;
};

const STRUCTURED_HINT_KEYS: (keyof CustomerTeamPrepStructuredHints)[] = [
  "offLimitsRooms",
  "accessInstructions",
  "parkingInstructions",
  "fragileOrSpecialCare",
  "petsAccessHandling",
  "priorityRooms",
  "residentAtHomeConstraints",
  "fragranceOrProductSensitivity",
  "gateOrBuildingInstructions",
];

const FORBIDDEN_PAYLOAD_ROOT_KEYS = new Set([
  "email",
  "phone",
  "customerId",
  "userId",
  "stripeCustomerId",
  "paymentIntentId",
  "stripePaymentIntentId",
  "paymentStatus",
  "card",
  "pan",
]);

function clampTrim(s: string, max: number): string {
  const t = s.trim();
  if (!t) return "";
  return t.length > max ? t.slice(0, max) : t;
}

function normalizeStructuredHints(
  hints: CustomerTeamPrepStructuredHints | undefined,
): CustomerTeamPrepStructuredHints | undefined {
  if (!hints || typeof hints !== "object") return undefined;
  const out: CustomerTeamPrepStructuredHints = {};
  for (const key of STRUCTURED_HINT_KEYS) {
    const raw = hints[key];
    if (typeof raw !== "string") continue;
    const v = clampTrim(raw, MAX_STRUCTURED_HINT_FIELD_LEN);
    if (v) out[key] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

function isIso8601Like(s: string): boolean {
  if (!s || s.length < 10) return false;
  return Number.isFinite(Date.parse(s));
}

function parseProvenance(
  v: unknown,
): BookingOperationalMetadataProvenance | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  if (o.source !== "booking_direction_intake") return undefined;
  if (o.legacyNotesTransport !== "recurringInterest.note") return undefined;
  if (typeof o.capturedAt !== "string") return undefined;
  const capturedAt = o.capturedAt.trim();
  if (!isIso8601Like(capturedAt)) return undefined;
  return {
    source: "booking_direction_intake",
    capturedAt,
    legacyNotesTransport: "recurringInterest.note",
  };
}

function parseCustomerTeamPrep(v: unknown): CustomerTeamPrepMetadata | undefined {
  if (v === undefined) return undefined;
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  if (typeof o.freeText !== "string") return undefined;
  const freeText = clampTrim(o.freeText, MAX_CUSTOMER_TEAM_PREP_FREE_TEXT_LEN);
  if (!freeText) return undefined;

  let structuredHints: CustomerTeamPrepStructuredHints | undefined;
  if (
    o.structuredHints !== undefined &&
    o.structuredHints &&
    typeof o.structuredHints === "object" &&
    !Array.isArray(o.structuredHints)
  ) {
    structuredHints = normalizeStructuredHints(
      o.structuredHints as CustomerTeamPrepStructuredHints,
    );
  }

  return structuredHints
    ? { freeText, structuredHints }
    : { freeText };
}

/**
 * Builds a V1 payload ready for JSON persistence. Throws when prep text is empty after trim.
 */
export function buildBookingOperationalMetadataPayloadV1(input: {
  customerTeamPrepFreeText: string;
  structuredHints?: CustomerTeamPrepStructuredHints;
  provenance: BookingOperationalMetadataProvenance;
}): BookingOperationalMetadataPayloadV1 {
  const freeText = clampTrim(
    input.customerTeamPrepFreeText,
    MAX_CUSTOMER_TEAM_PREP_FREE_TEXT_LEN,
  );
  if (!freeText) {
    throw new Error("customerTeamPrepFreeText is required");
  }
  const structuredHints = normalizeStructuredHints(input.structuredHints);
  const customerTeamPrep: CustomerTeamPrepMetadata = structuredHints
    ? { freeText, structuredHints }
    : { freeText };

  const provenance: BookingOperationalMetadataProvenance = {
    source: "booking_direction_intake",
    capturedAt: input.provenance.capturedAt.trim(),
    legacyNotesTransport: "recurringInterest.note",
  };
  if (!isIso8601Like(provenance.capturedAt)) {
    throw new Error("provenance.capturedAt must be ISO-8601 parseable");
  }

  return {
    customerTeamPrep,
    provenance,
  };
}

/**
 * Validates persisted JSON. Fail-closed: invalid shapes return null.
 */
export function parseBookingOperationalMetadataPayloadV1(
  payload: unknown,
): BookingOperationalMetadataPayloadV1 | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const o = payload as Record<string, unknown>;
  const keys = Object.keys(o);
  for (const k of keys) {
    if (FORBIDDEN_PAYLOAD_ROOT_KEYS.has(k)) return null;
    if (k !== "customerTeamPrep" && k !== "provenance") return null;
  }

  const customerTeamPrep = parseCustomerTeamPrep(o.customerTeamPrep);
  if (!customerTeamPrep) return null;

  let provenance: BookingOperationalMetadataProvenance | undefined;
  if ("provenance" in o && o.provenance !== undefined) {
    const p = parseProvenance(o.provenance);
    if (!p) return null;
    provenance = p;
  }

  const result: BookingOperationalMetadataPayloadV1 = {
    customerTeamPrep,
    ...(provenance ? { provenance } : {}),
  };
  return result;
}

export function hasCustomerTeamPrep(payload: unknown): boolean {
  const parsed = parseBookingOperationalMetadataPayloadV1(payload);
  return Boolean(parsed?.customerTeamPrep?.freeText?.trim());
}

/**
 * Legacy `Booking.notes` bridge extraction (aligned with web `bookingDisplay` helpers).
 */
export function extractCustomerPrepFromBookingNotes(
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

export type CustomerTeamPrepDisplayResult = {
  freeText: string;
};

/**
 * Prefer validated structured metadata; fall back to `customerPrep=` parsing on notes.
 * Never returns provenance (internal-only).
 */
export function getCustomerTeamPrepFromBookingOperationalMetadataOrNotes(args: {
  operationalMetadataPayload: unknown | null | undefined;
  bookingNotes: string | null | undefined;
}): CustomerTeamPrepDisplayResult | null {
  const parsed = parseBookingOperationalMetadataPayloadV1(
    args.operationalMetadataPayload,
  );
  const fromMeta = parsed?.customerTeamPrep?.freeText?.trim();
  if (fromMeta) {
    return { freeText: fromMeta };
  }
  const fromNotes = extractCustomerPrepFromBookingNotes(args.bookingNotes)?.trim();
  if (fromNotes) {
    return { freeText: fromNotes };
  }
  return null;
}
