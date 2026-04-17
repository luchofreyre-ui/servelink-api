import { API_BASE_URL } from "@/lib/api";
import type { BookingIntakeEstimateFactors } from "./bookingStep2ToEstimateFactors";

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

function customerFacingMessageFromKnownCode(code: string): string | null {
  const map: Record<string, string> = {
    ESTIMATE_EXECUTION_FAILED:
      "We couldn’t compute a price preview for these selections. You can adjust your details or continue—we’ll follow up with a quote.",
    ESTIMATE_INPUT_INVALID:
      "Some details aren’t valid for an automated preview. Adjust your selections or continue and we’ll help you directly.",
  };
  return map[code] ?? null;
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
  const message = parsed ? normalizeApiMessage(parsed.message) : "";
  const code =
    parsed && typeof parsed.code === "string" ? parsed.code.trim() : "";

  const fromCode = code ? customerFacingMessageFromKnownCode(code) : null;
  if (fromCode) {
    throw new Error(fromCode);
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
 * Step 2 richness is expressed only via `estimateFactors` (no extra top-level keys).
 */
export type SubmitBookingDirectionIntakePayload = {
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  /** Full questionnaire slice; maps into `EstimateInput` after sanitize/resolve. */
  estimateFactors: BookingIntakeEstimateFactors;
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

export type PublicBookingTeamOptionDto = {
  id: string;
  displayName: string;
  shortLabel?: string;
  isRecommended?: boolean;
};

export type PublicBookingTeamOptionsResponse = {
  kind: "public_booking_team_options";
  bookingId: string;
  teams: PublicBookingTeamOptionDto[];
  selectionRequired: boolean;
  unavailableReason?: { code: string; message: string };
};

export type PublicBookingWindowDto = {
  foId: string;
  foDisplayName: string | null;
  startAt: string;
  endAt: string;
};

export type PublicBookingTeamAvailabilityResponse = {
  kind: "public_booking_team_availability";
  bookingId: string;
  selectedTeam: { id: string; displayName: string };
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
  body: { bookingId: string; holdId: string; note?: string },
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
