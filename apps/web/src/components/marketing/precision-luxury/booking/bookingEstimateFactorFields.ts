/**
 * Public booking funnel values for bedrooms/bathrooms must match
 * `services/api/.../estimate-factor-enums.ts` (ESTIMATE_BEDROOMS / ESTIMATE_BATHROOMS).
 */

export const BOOKING_INTAKE_BEDROOMS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5_plus",
] as const;

export const BOOKING_INTAKE_BATHROOMS = [
  "1",
  "1_5",
  "2",
  "2_5",
  "3",
  "3_5",
  "4_plus",
] as const;

export type BookingIntakeBedroom = (typeof BOOKING_INTAKE_BEDROOMS)[number];
export type BookingIntakeBathroom = (typeof BOOKING_INTAKE_BATHROOMS)[number];

const BEDROOM_SET = new Set<string>(BOOKING_INTAKE_BEDROOMS);
const BATHROOM_SET = new Set<string>(BOOKING_INTAKE_BATHROOMS);

/** Legacy human labels previously stored in URL/state before enum alignment. */
const LEGACY_BEDROOM_TO_ENUM: Record<string, BookingIntakeBedroom> = {
  "1 bedroom": "1",
  "2 bedrooms": "2",
  "3 bedrooms": "3",
  "4 bedrooms": "4",
  "5+ bedrooms": "5_plus",
};

const LEGACY_BATHROOM_TO_ENUM: Record<string, BookingIntakeBathroom> = {
  "1 bathroom": "1",
  "2 bathrooms": "2",
  "3 bathrooms": "3",
  "4+ bathrooms": "4_plus",
};

const BEDROOM_DISPLAY: Record<BookingIntakeBedroom, string> = {
  "0": "Studio / 0 bedrooms",
  "1": "1 bedroom",
  "2": "2 bedrooms",
  "3": "3 bedrooms",
  "4": "4 bedrooms",
  "5_plus": "5+ bedrooms",
};

const BATHROOM_DISPLAY: Record<BookingIntakeBathroom, string> = {
  "1": "1 bathroom",
  "1_5": "1.5 bathrooms",
  "2": "2 bathrooms",
  "2_5": "2.5 bathrooms",
  "3": "3 bathrooms",
  "3_5": "3.5 bathrooms",
  "4_plus": "4+ bathrooms",
};

export const BOOKING_HOME_BEDROOM_OPTIONS: ReadonlyArray<{
  value: BookingIntakeBedroom;
  label: string;
}> = BOOKING_INTAKE_BEDROOMS.map((value) => ({
  value,
  label: BEDROOM_DISPLAY[value],
}));

export const BOOKING_HOME_BATHROOM_OPTIONS: ReadonlyArray<{
  value: BookingIntakeBathroom;
  label: string;
}> = BOOKING_INTAKE_BATHROOMS.map((value) => ({
  value,
  label: BATHROOM_DISPLAY[value],
}));

/** Every bedroom token allowed on the public intake path (matches API `ESTIMATE_BEDROOMS`). */
export const BOOKING_CANONICAL_BEDROOM_FACTORS: ReadonlyArray<BookingIntakeBedroom> = [
  ...BOOKING_INTAKE_BEDROOMS,
];

/** Every bathroom token allowed on the public intake path (matches API `ESTIMATE_BATHROOMS`). */
export const BOOKING_CANONICAL_BATHROOM_FACTORS: ReadonlyArray<BookingIntakeBathroom> = [
  ...BOOKING_INTAKE_BATHROOMS,
];

/** Step 2 grouping: canonical bedroom + bathroom selectors. */
export const BOOKING_STEP2_ROOMS_SECTION_TITLE = "Bedrooms & bathrooms";

export const BOOKING_STEP2_ROOMS_SECTION_BODY =
  "These choices map directly to how we size the visit—studio through five-plus bedrooms, and every half-bath option we support.";

export const BOOKING_BEDROOMS_FIELD_LABEL = "Bedrooms";

export const BOOKING_BATHROOMS_FIELD_LABEL = "Bathrooms";

export const BOOKING_BEDROOMS_FIELD_HELPER =
  "Studio counts as zero bedrooms. Pick the bedroom count we should plan the clean around.";

export const BOOKING_BATHROOMS_FIELD_HELPER =
  "Include half baths the way you’d describe the home—each option here matches our booking form.";

export function isBookingIntakeBedroomToken(value: string): value is BookingIntakeBedroom {
  return BEDROOM_SET.has(value);
}

export function isBookingIntakeBathroomToken(value: string): value is BookingIntakeBathroom {
  return BATHROOM_SET.has(value);
}

/** Coerce URL or legacy state to API token; empty string stays empty. */
export function normalizeBookingBedroomsParam(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (isBookingIntakeBedroomToken(s)) return s;
  const mapped = LEGACY_BEDROOM_TO_ENUM[s];
  return mapped ?? "";
}

export function normalizeBookingBathroomsParam(raw: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (isBookingIntakeBathroomToken(s)) return s;
  const mapped = LEGACY_BATHROOM_TO_ENUM[s];
  return mapped ?? "";
}

export function formatBookingBedroomsForDisplay(token: string): string {
  if (!token.trim()) return "";
  if (isBookingIntakeBedroomToken(token)) return BEDROOM_DISPLAY[token];
  return token;
}

export function formatBookingBathroomsForDisplay(token: string): string {
  if (!token.trim()) return "";
  if (isBookingIntakeBathroomToken(token)) return BATHROOM_DISPLAY[token];
  return token;
}
