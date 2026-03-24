import { API_BASE_URL } from "@/lib/api";

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

export type SubmitBookingDirectionIntakePayload = {
  serviceId: string;
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  pets: string;
  frequency: string;
  preferredTime: string;
  /** Only persisted when service is deep clean. */
  deepCleanProgram?: "single_visit" | "phased_3_visit";
  source?: string;
  utm?: BookingDirectionUtmPayload;
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
  bookingId: string | null;
  estimate: {
    priceCents: number;
    durationMinutes: number;
    confidence: number;
  } | null;
  deepCleanProgram: DeepCleanProgramDisplay | null;
  bookingError: { code: string; message: string } | null;
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
    `${API_BASE_URL}/api/v1/booking-direction-intake/submit`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `Booking direction intake failed (${response.status})`,
    );
  }

  return response.json() as Promise<BookingDirectionIntakeSubmitResponse>;
}

/** Intake-only save (no booking / estimator). Use when you need the legacy path. */
export async function createBookingDirectionIntakeOnly(
  payload: SubmitBookingDirectionIntakePayload,
): Promise<BookingDirectionIntakeSuccess> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/booking-direction/intakes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      text || `Booking direction intake failed (${response.status})`,
    );
  }

  return response.json() as Promise<BookingDirectionIntakeSuccess>;
}
