import { API_BASE_URL } from "@/lib/api";
import type { BookingIntakeEstimateFactors } from "./bookingStep2ToEstimateFactors";
import type { PublicServiceLocationPayload } from "./bookingUrlState";

function normalizeApiMessage(raw: unknown): string {
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) {
    return raw
      .filter((x): x is string => typeof x === "string")
      .join(" ")
      .trim();
  }
  return "";
}

function parseApiFailEnvelope(parsed: Record<string, unknown> | null): {
  code: string;
  message: string;
  details: Record<string, unknown> | null;
} {
  if (!parsed) {
    return { code: "", message: "", details: null };
  }
  const err = parsed.error;
  if (err && typeof err === "object" && !Array.isArray(err)) {
    const e = err as Record<string, unknown>;
    const details =
      e.details && typeof e.details === "object" && !Array.isArray(e.details)
        ? (e.details as Record<string, unknown>)
        : null;
    return {
      code: typeof e.code === "string" ? e.code.trim() : "",
      message: normalizeApiMessage(e.message),
      details,
    };
  }
  return {
    code: typeof parsed.code === "string" ? parsed.code.trim() : "",
    message: normalizeApiMessage(parsed.message),
    details: null,
  };
}

export type PublicBookingDepositRequiredPayload = {
  kind: "public_booking_deposit_required";
  code: string;
  message: string;
  amountCents: number;
  currency: string;
  clientSecret: string | null;
  paymentIntentId?: string;
  bookingId?: string;
  holdId?: string;
  paymentSessionKey?: string;
};

/** API `error.code === "PAYMENT_REQUIRED"`; deposit fields live in `details` (same shape as this payload). */
export class PublicBookingPaymentRequiredError extends Error {
  readonly code = "PAYMENT_REQUIRED" as const;
  readonly details: PublicBookingDepositRequiredPayload;

  constructor(details: PublicBookingDepositRequiredPayload) {
    super(details.message || "Deposit required");
    this.name = "PublicBookingPaymentRequiredError";
    this.details = details;
  }
}

export class PublicBookingDepositProcessingError extends Error {
  readonly details: {
    kind: "public_booking_deposit_processing";
    message: string;
    paymentIntentId?: string;
  };

  constructor(
    details: PublicBookingDepositProcessingError["details"],
  ) {
    super(details.message);
    this.name = "PublicBookingDepositProcessingError";
    this.details = details;
  }
}

export class PublicBookingApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(args: { code: string; message: string; status: number }) {
    super(args.message);
    this.name = "PublicBookingApiError";
    this.code = args.code;
    this.status = args.status;
  }
}

function customerFacingMessageFromKnownCode(code: string): string | null {
  const map: Record<string, string> = {
    ESTIMATE_EXECUTION_FAILED:
      "We couldn’t compute a price preview for these selections. You can adjust your details or continue—we’ll follow up with a quote.",
    ESTIMATE_INPUT_INVALID:
      "Some details aren’t valid for an automated preview. Adjust your selections or continue and we’ll help you directly.",
    SERVICE_LOCATION_REQUIRED:
      "We need a complete service address before we can show a live preview. Please finish the location step with street, city, state, and ZIP.",
    SERVICE_LOCATION_NOT_RESOLVABLE:
      "We couldn’t verify that address on the map. Please check spelling and ZIP, then try again.",
  };
  return map[code] ?? null;
}

const PUBLIC_BOOKING_DEPOSIT_REQUIRED_CODES = new Set([
  "PAYMENT_REQUIRED",
  "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringFromAny(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberFromAny(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.round(value));
    }
  }
  return null;
}

function normalizePublicBookingDepositRequiredPayload(args: {
  responseStatus: number;
  parsed: Record<string, unknown> | null;
  env: ReturnType<typeof parseApiFailEnvelope>;
}): PublicBookingDepositRequiredPayload | null {
  const root = args.parsed;
  const error = asRecord(root?.error);
  const rootDetails = asRecord(root?.details);
  const errorDetails = asRecord(error?.details);
  const details = args.env.details;
  const candidates = [root, error, rootDetails, errorDetails, details].filter(
    (candidate): candidate is Record<string, unknown> => Boolean(candidate),
  );

  const codes = [
    args.env.code,
    ...candidates.map((candidate) => stringFromAny(candidate.code)),
  ].filter(Boolean);
  const hasDepositCode = codes.some((code) =>
    PUBLIC_BOOKING_DEPOSIT_REQUIRED_CODES.has(code),
  );
  const hasDepositKind = candidates.some(
    (candidate) => candidate.kind === "public_booking_deposit_required",
  );
  const clientSecret = stringFromAny(
    ...candidates.map((candidate) => candidate.clientSecret),
  );
  const paymentIntentId = stringFromAny(
    ...candidates.map((candidate) => candidate.paymentIntentId),
  );
  const isDepositRequired =
    args.responseStatus === 402 ||
    hasDepositCode ||
    hasDepositKind ||
    Boolean(clientSecret) ||
    Boolean(paymentIntentId);

  if (!isDepositRequired) return null;

  const message =
    stringFromAny(
      ...candidates.map((candidate) => candidate.message),
      args.env.message,
    ) || "A $100 deposit is required to confirm this booking.";
  const amountCents =
    numberFromAny(...candidates.map((candidate) => candidate.amountCents)) ??
    10_000;
  const currency =
    stringFromAny(...candidates.map((candidate) => candidate.currency)) || "usd";
  const bookingId = stringFromAny(
    ...candidates.map((candidate) => candidate.bookingId),
  );
  const holdId = stringFromAny(...candidates.map((candidate) => candidate.holdId));
  const paymentSessionKey = stringFromAny(
    ...candidates.map((candidate) => candidate.paymentSessionKey),
  );

  return {
    kind: "public_booking_deposit_required",
    code:
      codes.find((code) => PUBLIC_BOOKING_DEPOSIT_REQUIRED_CODES.has(code)) ??
      "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
    message,
    amountCents,
    currency,
    clientSecret: clientSecret || null,
    ...(paymentIntentId ? { paymentIntentId } : {}),
    ...(bookingId ? { bookingId } : {}),
    ...(holdId ? { holdId } : {}),
    ...(paymentSessionKey ? { paymentSessionKey } : {}),
  };
}

async function throwIfResponseNotOk(
  response: Response,
  kind: "preview" | "submit",
): Promise<void> {
  if (response.ok) return;
  const text = await response.text().catch(() => "");
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : null;
  } catch {
    parsed = null;
  }
  const env = parseApiFailEnvelope(parsed);
  const message = env.message;
  const code = env.code;

  const fromCode = code ? customerFacingMessageFromKnownCode(code) : null;
  if (fromCode) {
    throw new Error(fromCode);
  }

  const depositDetails = env.details;
  const depositKind =
    depositDetails && typeof depositDetails.kind === "string"
      ? depositDetails.kind
      : null;

  if (
    response.status === 409 &&
    depositKind === "public_booking_deposit_processing" &&
    depositDetails
  ) {
    throw new PublicBookingDepositProcessingError({
      kind: "public_booking_deposit_processing",
      message:
        message.trim() ||
        "Deposit payment is processing. Retry confirmation shortly.",
      paymentIntentId:
        typeof depositDetails.paymentIntentId === "string"
          ? depositDetails.paymentIntentId
          : undefined,
    });
  }
  const publicBookingDepositRequired =
    normalizePublicBookingDepositRequiredPayload({
      responseStatus: response.status,
      parsed,
      env,
    });
  if (publicBookingDepositRequired) {
    throw new PublicBookingPaymentRequiredError(publicBookingDepositRequired);
  }
  if (code) {
    throw new PublicBookingApiError({
      code,
      status: response.status,
      message:
        message ||
        (kind === "preview"
          ? "We couldn’t load a price preview right now. You can still continue."
          : "We couldn’t complete that request as entered. Please check your details and try again."),
    });
  }
  if (
    message &&
    message.length <= 600 &&
    !message.startsWith("{") &&
    !message.includes("<!DOCTYPE")
  ) {
    throw new Error(message);
  }
  if (response.status === 400) {
    throw new Error(
      kind === "preview"
        ? "We couldn’t prepare a preview from what you entered. Try adjusting your details, or continue and we’ll follow up."
        : "We couldn’t complete that request as entered. Please check your details and try again.",
    );
  }
  throw new Error(
    kind === "preview"
      ? "We couldn’t load a price preview right now. You can still continue."
      : "We couldn’t save your request right now. Please try again in a moment.",
  );
}

export type BookingDirectionUtmPayload = {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
};

export type DeepCleanProgramVisitDisplay = {
  visitIndex: number;
  label: string;
  estimatedPriceCents: number;
  estimatedDurationMinutes: number;
  summary: string;
  bundleLabels: string[];
  taskLabels: string[];
};

export type DeepCleanProgramDisplay = {
  programType: string;
  visitCount: number;
  visits: DeepCleanProgramVisitDisplay[];
};

/**
 * Public intake body aligned with `CreateBookingDirectionIntakeDto`.
 * Step 2 richness is expressed via `estimateFactors`; service location is required for preview/submit geocoding.
 */
export type SubmitBookingDirectionIntakePayload = {
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  /** Full questionnaire slice; maps into `EstimateInput` after sanitize/resolve. */
  estimateFactors: BookingIntakeEstimateFactors;
  /** Geocoded on the server for `siteLat` / `siteLng` and team matching. */
  serviceLocation?: PublicServiceLocationPayload;
  frequency: string;
  preferredTime: string;
  /** Only persisted when service is deep clean. */
  deepCleanProgram?: "single_visit" | "phased_3_visit";
  /**
   * Optional for legacy callers; the public `/book` funnel sends both once
   * Phase 3 contact validation passes.
   */
  customerName?: string;
  customerEmail?: string;
  source?: string;
  utm?: BookingDirectionUtmPayload;
};

export type PublicBookingCrewCapacityMetaDto = {
  requiredLaborMinutes: number;
  recommendedCrewSize: number | null;
  assignedCrewSize: number;
  serviceMaxCrewSize: number;
  serviceSegment: "residential" | "commercial";
};

export type PublicBookingTeamOptionDto = {
  id: string;
  displayName: string;
  shortLabel?: string;
  isRecommended?: boolean;
  assignedCrewSize?: number;
  estimatedDurationMinutes?: number;
  crewCapacityMeta?: PublicBookingCrewCapacityMetaDto;
};

export type PublicBookingTeamOptionsResponse = {
  kind: "public_booking_team_options";
  bookingId: string;
  teams: PublicBookingTeamOptionDto[];
  selectionRequired: boolean;
  unavailableReason?: { code: string; message: string };
};

export type PublicBookingWindowDto = {
  slotId: string;
  foId: string;
  foDisplayName: string | null;
  startAt: string;
  endAt: string;
  durationMinutes?: number;
};

export type PublicBookingTeamAvailabilityResponse = {
  kind: "public_booking_team_availability";
  bookingId: string;
  selectedTeam: {
    id: string;
    displayName: string;
    assignedCrewSize?: number;
    estimatedDurationMinutes?: number;
    crewCapacityMeta?: PublicBookingCrewCapacityMetaDto;
  };
  windows: PublicBookingWindowDto[];
  unavailableReason?: { code: string; message: string };
};

export type PublicBookingHoldResponse = {
  kind: "public_booking_hold";
  bookingId: string;
  holdId: string;
  expiresAt: string;
  window: { foId: string; startAt: string; endAt: string };
};

export type PublicBookingConfirmResponse = {
  kind: "public_booking_confirmation";
  bookingId: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: string;
  alreadyApplied: boolean;
};

export type BookingDirectionIntakeSuccess = {
  kind: "booking_direction_intake";
  intakeId: string;
  createdAt: string;
};

export type BookingDirectionIntakeSubmitResponse = {
  kind: "booking_direction_intake_submit";
  intakeId: string;
  bookingCreated: boolean;
  /** Present from API when `bookingCreated` is true; indicates public scheduling orchestrator eligibility. */
  schedulable?: boolean;
  bookingId: string | null;
  estimate: {
    priceCents: number;
    durationMinutes: number;
    confidence: number;
  } | null;
  deepCleanProgram: DeepCleanProgramDisplay | null;
  bookingError: { code: string; message: string } | null;
};

/** Stateless pre-submit estimate (same shape as submit, without booking fields). */
export type BookingDirectionEstimatePreviewResponse = {
  kind: "booking_direction_estimate_preview";
  estimate: {
    priceCents: number;
    durationMinutes: number;
    confidence: number;
  };
  deepCleanProgram: DeepCleanProgramDisplay | null;
};

/** Reads `source` + standard UTM query params from the booking URL. */
export function buildBookingAttributionFromSearchParams(
  params: URLSearchParams,
): Pick<SubmitBookingDirectionIntakePayload, "source" | "utm"> {
  const source = params.get("source")?.trim() || undefined;

  const utmSource = params.get("utm_source")?.trim();
  const utmMedium = params.get("utm_medium")?.trim();
  const utmCampaign = params.get("utm_campaign")?.trim();
  const utmContent = params.get("utm_content")?.trim();
  const utmTerm = params.get("utm_term")?.trim();

  const utm =
    utmSource || utmMedium || utmCampaign || utmContent || utmTerm
      ? {
          ...(utmSource ? { source: utmSource } : {}),
          ...(utmMedium ? { medium: utmMedium } : {}),
          ...(utmCampaign ? { campaign: utmCampaign } : {}),
          ...(utmContent ? { content: utmContent } : {}),
          ...(utmTerm ? { term: utmTerm } : {}),
        }
      : undefined;

  return {
    ...(source ? { source } : {}),
    ...(utm && Object.keys(utm).length > 0 ? { utm } : {}),
  };
}

export async function submitBookingDirectionIntake(
  payload: SubmitBookingDirectionIntakePayload,
): Promise<BookingDirectionIntakeSubmitResponse> {
  const response = await fetch(
    `${API_BASE_URL}/booking-direction-intake/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await throwIfResponseNotOk(response, "submit");
  }

  return response.json() as Promise<BookingDirectionIntakeSubmitResponse>;
}

export async function previewBookingDirectionEstimate(
  payload: SubmitBookingDirectionIntakePayload,
  init?: RequestInit,
): Promise<BookingDirectionEstimatePreviewResponse> {
  const response = await fetch(
    `${API_BASE_URL}/booking-direction-intake/preview-estimate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      ...init,
    },
  );

  if (!response.ok) {
    await throwIfResponseNotOk(response, "preview");
  }

  return response.json() as Promise<BookingDirectionEstimatePreviewResponse>;
}

/** Alias for estimate hook / contract callers. */
export const previewEstimate = previewBookingDirectionEstimate;

export async function postPublicBookingAvailability(body: {
  bookingId: string;
  foId?: string;
  preferredDate?: string;
  rangeStart?: string;
  rangeEnd?: string;
}): Promise<PublicBookingTeamOptionsResponse | PublicBookingTeamAvailabilityResponse> {
  const response = await fetch(`${API_BASE_URL}/public-booking/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    await throwIfResponseNotOk(response, "submit");
  }
  return response.json() as Promise<
    PublicBookingTeamOptionsResponse | PublicBookingTeamAvailabilityResponse
  >;
}

export async function postPublicBookingHold(body: {
  bookingId: string;
  slotId?: string;
  foId: string;
  startAt: string;
  endAt: string;
}): Promise<PublicBookingHoldResponse> {
  const response = await fetch(`${API_BASE_URL}/public-booking/hold`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    await throwIfResponseNotOk(response, "submit");
  }
  return response.json() as Promise<PublicBookingHoldResponse>;
}

export async function postPublicBookingConfirm(
  body: {
    bookingId: string;
    holdId: string;
    note?: string;
    stripePaymentMethodId?: string;
  },
  idempotencyKey?: string | null,
): Promise<PublicBookingConfirmResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (idempotencyKey?.trim()) {
    headers["idempotency-key"] = idempotencyKey.trim();
  }
  const response = await fetch(`${API_BASE_URL}/public-booking/confirm`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    await throwIfResponseNotOk(response, "submit");
  }
  return response.json() as Promise<PublicBookingConfirmResponse>;
}

export async function createBookingDirectionIntakeOnly(
  payload: SubmitBookingDirectionIntakePayload,
): Promise<BookingDirectionIntakeSuccess> {
  const response = await fetch(
    `${API_BASE_URL}/booking-direction/intakes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    await throwIfResponseNotOk(response, "submit");
  }

  return response.json() as Promise<BookingDirectionIntakeSuccess>;
}
