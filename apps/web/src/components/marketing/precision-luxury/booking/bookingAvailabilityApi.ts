import { apiFetch } from "@/lib/api/apiFetch";

/** Mirrors `TimeWindow` JSON from `SlotAvailabilityService.listAvailableWindows`. */
export type BookingAvailabilityWindow = {
  startAt: string;
  endAt: string;
};

export type AggregatedAvailabilityMode =
  | "preferred_provider_only"
  | "multi_provider_candidates";

export type ProviderBackedAvailabilityWindow = {
  foId: string;
  cleanerId: string | null;
  cleanerLabel: string | null;
  startAt: string;
  endAt: string;
  windowLabel: string;
  source: "preferred_provider" | "candidate_provider";
};

export type AggregatedAvailabilityResponse = {
  mode: AggregatedAvailabilityMode;
  windows: ProviderBackedAvailabilityWindow[];
};

export type BookingSlotHoldRecord = {
  id: string;
  bookingId: string;
  foId: string;
  startAt: string;
  endAt: string;
  expiresAt: string;
  createdAt?: string;
};

export function parseAvailabilityWindowRow(
  value: unknown,
): BookingAvailabilityWindow | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const startAt = typeof o.startAt === "string" ? o.startAt.trim() : "";
  const endAt = typeof o.endAt === "string" ? o.endAt.trim() : "";
  if (!startAt || !endAt) return null;
  return { startAt, endAt };
}

export function parseProviderBackedWindowRow(
  value: unknown,
): ProviderBackedAvailabilityWindow | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const foId = typeof o.foId === "string" ? o.foId.trim() : "";
  const startAt = typeof o.startAt === "string" ? o.startAt.trim() : "";
  const endAt = typeof o.endAt === "string" ? o.endAt.trim() : "";
  const windowLabel = typeof o.windowLabel === "string" ? o.windowLabel.trim() : "";
  const source = o.source;
  if (
    !foId ||
    !startAt ||
    !endAt ||
    !windowLabel ||
    (source !== "preferred_provider" && source !== "candidate_provider")
  ) {
    return null;
  }
  const cleanerId =
    typeof o.cleanerId === "string" && o.cleanerId.trim() ? o.cleanerId.trim() : null;
  const cleanerLabel =
    typeof o.cleanerLabel === "string" && o.cleanerLabel.trim()
      ? o.cleanerLabel.trim()
      : null;
  return {
    foId,
    cleanerId,
    cleanerLabel,
    startAt,
    endAt,
    windowLabel,
    source,
  };
}

export function parseAggregatedAvailabilityResponse(
  body: unknown,
): AggregatedAvailabilityResponse {
  if (!body || typeof body !== "object") {
    throw new Error("INVALID_AGGREGATED_AVAILABILITY_SHAPE");
  }
  const o = body as Record<string, unknown>;
  const mode = o.mode;
  if (mode !== "preferred_provider_only" && mode !== "multi_provider_candidates") {
    throw new Error("INVALID_AGGREGATED_AVAILABILITY_MODE");
  }
  const raw = o.windows;
  if (!Array.isArray(raw)) {
    throw new Error("INVALID_AGGREGATED_AVAILABILITY_WINDOWS");
  }
  const windows: ProviderBackedAvailabilityWindow[] = [];
  for (const row of raw) {
    const w = parseProviderBackedWindowRow(row);
    if (w) windows.push(w);
  }
  return { mode, windows };
}

export function parseAvailabilityWindowsResponse(body: unknown): BookingAvailabilityWindow[] {
  if (!Array.isArray(body)) {
    throw new Error("INVALID_AVAILABILITY_WINDOWS_SHAPE");
  }
  const out: BookingAvailabilityWindow[] = [];
  for (const row of body) {
    const w = parseAvailabilityWindowRow(row);
    if (w) out.push(w);
  }
  return out;
}

export function parseSlotHoldRecord(value: unknown): BookingSlotHoldRecord | null {
  if (!value || typeof value !== "object") return null;
  const o = value as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id.trim() : "";
  const bookingId = typeof o.bookingId === "string" ? o.bookingId.trim() : "";
  const foId = typeof o.foId === "string" ? o.foId.trim() : "";
  const startAt = typeof o.startAt === "string" ? o.startAt.trim() : "";
  const endAt = typeof o.endAt === "string" ? o.endAt.trim() : "";
  const expiresAt = typeof o.expiresAt === "string" ? o.expiresAt.trim() : "";
  if (!id || !bookingId || !foId || !startAt || !endAt || !expiresAt) return null;
  return {
    id,
    bookingId,
    foId,
    startAt,
    endAt,
    expiresAt,
    createdAt: typeof o.createdAt === "string" ? o.createdAt : undefined,
  };
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function errorMessageFromBody(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    const msg = typeof o.message === "string" ? o.message.trim() : "";
    const code = typeof o.code === "string" ? o.code.trim() : "";
    if (msg) return msg;
    if (code) return code;
  }
  return fallback;
}

/**
 * GET `/api/v1/bookings/availability/windows`
 * (requires customer JWT via `apiFetch`).
 */
export async function getBookingAvailabilityWindows(args: {
  foId: string;
  rangeStart: string;
  rangeEnd: string;
  durationMinutes: number;
}): Promise<BookingAvailabilityWindow[]> {
  const params = new URLSearchParams({
    foId: args.foId,
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    durationMinutes: String(Math.floor(args.durationMinutes)),
  });
  const res = await apiFetch(
    `/bookings/availability/windows?${params.toString()}`,
    { method: "GET" },
  );
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(
      errorMessageFromBody(body, `availability_windows_failed_${res.status}`),
    );
  }
  return parseAvailabilityWindowsResponse(body);
}

/**
 * GET `/api/v1/bookings/availability/windows/aggregate`
 * Provider-backed windows (each row includes `foId` for hold creation).
 */
export async function getAggregatedBookingAvailabilityWindows(args: {
  rangeStart: string;
  rangeEnd: string;
  durationMinutes: number;
  preferredFoId?: string | null;
  siteLat?: number;
  siteLng?: number;
  squareFootage?: number;
  estimatedLaborMinutes?: number;
  recommendedTeamSize?: number;
  maxProviders?: number;
}): Promise<AggregatedAvailabilityResponse> {
  const params = new URLSearchParams({
    rangeStart: args.rangeStart,
    rangeEnd: args.rangeEnd,
    durationMinutes: String(Math.floor(args.durationMinutes)),
  });
  const pf = args.preferredFoId?.trim();
  if (pf) params.set("preferredFoId", pf);
  if (args.siteLat != null && Number.isFinite(args.siteLat)) {
    params.set("siteLat", String(args.siteLat));
  }
  if (args.siteLng != null && Number.isFinite(args.siteLng)) {
    params.set("siteLng", String(args.siteLng));
  }
  if (args.squareFootage != null && args.squareFootage > 0) {
    params.set("squareFootage", String(Math.floor(args.squareFootage)));
  }
  if (args.estimatedLaborMinutes != null && args.estimatedLaborMinutes > 0) {
    params.set("estimatedLaborMinutes", String(Math.floor(args.estimatedLaborMinutes)));
  }
  if (args.recommendedTeamSize != null && args.recommendedTeamSize > 0) {
    params.set("recommendedTeamSize", String(Math.floor(args.recommendedTeamSize)));
  }
  if (args.maxProviders != null && args.maxProviders > 0) {
    params.set("maxProviders", String(Math.floor(args.maxProviders)));
  }

  const res = await apiFetch(
    `/bookings/availability/windows/aggregate?${params.toString()}`,
    { method: "GET" },
  );
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(
      errorMessageFromBody(body, `availability_aggregate_failed_${res.status}`),
    );
  }
  return parseAggregatedAvailabilityResponse(body);
}

/**
 * POST `/api/v1/bookings/availability/holds`
 * Backend requires an existing `bookingId` (hold is created after booking shell exists).
 */
export async function createBookingAvailabilityHold(args: {
  bookingId: string;
  foId: string;
  startAt: string;
  endAt: string;
}): Promise<BookingSlotHoldRecord> {
  const res = await apiFetch("/bookings/availability/holds", {
    method: "POST",
    json: {
      bookingId: args.bookingId,
      foId: args.foId,
      startAt: args.startAt,
      endAt: args.endAt,
    },
  });
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(
      errorMessageFromBody(body, `availability_hold_failed_${res.status}`),
    );
  }
  const hold = parseSlotHoldRecord(body);
  if (!hold) {
    throw new Error("INVALID_AVAILABILITY_HOLD_SHAPE");
  }
  return hold;
}

/**
 * POST `/api/v1/bookings/:id/confirm-hold`
 */
export async function confirmBookingAvailabilityHold(args: {
  bookingId: string;
  holdId: string;
  note?: string;
  idempotencyKey?: string;
}): Promise<unknown> {
  const headers: Record<string, string> = {};
  if (args.idempotencyKey?.trim()) {
    headers["idempotency-key"] = args.idempotencyKey.trim();
  }
  const res = await apiFetch(
    `/bookings/${encodeURIComponent(args.bookingId)}/confirm-hold`,
    {
      method: "POST",
      headers,
      json: {
        holdId: args.holdId,
        ...(args.note?.trim() ? { note: args.note.trim() } : {}),
      },
    },
  );
  const body = await readJson(res);
  if (!res.ok) {
    throw new Error(
      errorMessageFromBody(body, `confirm_hold_failed_${res.status}`),
    );
  }
  return body;
}

export const BOOKING_SLOT_HOLD_EXPIRED_MESSAGE =
  "Your selected time slot is no longer available. Please choose another option.";

export const BOOKING_SLOT_HOLD_RESERVE_FAILED_MESSAGE =
  "We could not reserve that time slot. Please choose another option.";

export function isHoldExpiredErrorMessage(message: string): boolean {
  const m = message.toUpperCase();
  return m.includes("BOOKING_SLOT_HOLD_EXPIRED");
}
