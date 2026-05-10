import { PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS } from "../../public-booking-orchestrator/public-booking-funnel-milestone.constants";

export type AdminBookingFunnelMilestoneSource = "booking_event" | "intake";

/** Normalized row for admin display — read-only projection. */
export type AdminBookingFunnelMilestoneRow = {
  milestone: string;
  occurredAt: string | null;
  source: AdminBookingFunnelMilestoneSource;
  bookingEventId?: string;
  surface?: string | null;
  cadence?: string | null;
  /** Truncated / opaque hint for deposit submit sessions — never full secrets. */
  sessionHint?: string | null;
};

const ALLOWED = new Set<string>(PUBLIC_BOOKING_FUNNEL_MILESTONE_KEYS);

const NOTE_FALLBACK: Record<string, string> = {
  "Public booking review viewed": "REVIEW_VIEWED",
  "Public booking deposit UI reached": "DEPOSIT_UI_REACHED",
  "Public booking deposit submission initiated": "DEPOSIT_SUBMIT_INITIATED",
  "Public booking review abandon signal": "REVIEW_ABANDONED",
  "Public booking funnel reentry": "BOOKING_REENTRY",
  "Public booking recurring cadence selected": "RECURRING_CADENCE_SELECTED",
  "Public booking deposit captured": "DEPOSIT_SUCCEEDED",
};

function asPayloadRecord(payload: unknown): Record<string, unknown> | null {
  return payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload !== null
    ? (payload as Record<string, unknown>)
    : null;
}

function clampHint(raw: string | undefined | null, max = 24): string | null {
  if (!raw || typeof raw !== "string") return null;
  const t = raw.trim();
  if (!t) return null;
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function sanitizeCadence(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s ? s.slice(0, 64) : null;
}

function sanitizeSurface(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim();
  return s ? s.slice(0, 64) : null;
}

function milestoneFromPayload(payload: Record<string, unknown>): string | null {
  const fm = payload.funnelMilestone;
  if (typeof fm !== "string") return null;
  const k = fm.trim();
  return ALLOWED.has(k) ? k : null;
}

function milestoneFromDepositCapturedPayload(
  payload: Record<string, unknown>,
  note: string | null | undefined,
): string | null {
  if (note?.trim() !== "Public booking deposit captured") return null;
  if (payload.publicDeposit === true) return "DEPOSIT_SUCCEEDED";
  return null;
}

function milestoneFromIdempotencyKey(
  key: string | null | undefined,
  bookingId: string,
): { milestone: string; cadence?: string; sessionHint?: string | null } | null {
  if (!key?.trim()) return null;
  const k = key.trim();
  const bid = bookingId.trim();
  if (!bid) return null;
  const reviewPrefix = `pb-funnel:review_viewed:${bid}`;
  if (k === reviewPrefix) return { milestone: "REVIEW_VIEWED" };

  const depositUi = `pb-funnel:deposit_ui:${bid}`;
  if (k === depositUi) return { milestone: "DEPOSIT_UI_REACHED" };

  const submitPrefix = `pb-funnel:deposit_submit:${bid}:`;
  if (k.startsWith(submitPrefix)) {
    const rest = k.slice(submitPrefix.length);
    return {
      milestone: "DEPOSIT_SUBMIT_INITIATED",
      sessionHint: clampHint(rest, 32),
    };
  }

  const recurPrefix = `pb-funnel:recurring_cadence:${bid}:`;
  if (k.startsWith(recurPrefix)) {
    const cadence = k.slice(recurPrefix.length).trim();
    return cadence ? { milestone: "RECURRING_CADENCE_SELECTED", cadence } : null;
  }

  const syncPrefix = "public-deposit-sync:";
  if (k.startsWith(syncPrefix)) {
    return { milestone: "DEPOSIT_SUCCEEDED", sessionHint: clampHint(k.slice(syncPrefix.length), 24) };
  }

  return null;
}

export function parseBookingEventToFunnelRow(args: {
  id: string;
  createdAt: Date;
  note: string | null;
  payload: unknown;
  idempotencyKey: string | null;
  bookingId: string;
}): AdminBookingFunnelMilestoneRow | null {
  const payload = asPayloadRecord(args.payload);
  let milestone: string | null = null;
  let surface: string | null = null;
  let cadence: string | null = null;
  let sessionHint: string | null = null;

  if (payload) {
    milestone =
      milestoneFromPayload(payload) ??
      milestoneFromDepositCapturedPayload(payload, args.note);
    surface = sanitizeSurface(payload.surface);
    cadence = sanitizeCadence(payload.cadence);
    const psk = payload.paymentSessionKey;
    if (typeof psk === "string" && psk.trim()) {
      sessionHint = clampHint(psk.trim(), 32);
    }
    const pi = payload.paymentIntentId;
    if (!sessionHint && typeof pi === "string" && pi.trim()) {
      sessionHint = clampHint(`pi:${pi.trim()}`, 40);
    }
  }

  if (!milestone && args.note) {
    const fb = NOTE_FALLBACK[args.note.trim()];
    if (fb && ALLOWED.has(fb)) milestone = fb;
  }

  if (!milestone) {
    const fromKey = milestoneFromIdempotencyKey(args.idempotencyKey, args.bookingId);
    if (fromKey) {
      milestone = fromKey.milestone;
      if (fromKey.cadence) cadence = fromKey.cadence;
      if (fromKey.sessionHint) sessionHint = fromKey.sessionHint;
    }
  }

  if (!milestone || !ALLOWED.has(milestone)) {
    return null;
  }

  return {
    milestone,
    occurredAt: args.createdAt.toISOString(),
    source: "booking_event",
    bookingEventId: args.id,
    surface,
    cadence,
    sessionHint,
  };
}

export function parseIntakeFunnelMilestoneRows(
  funnelMilestones: unknown,
): AdminBookingFunnelMilestoneRow[] {
  if (!Array.isArray(funnelMilestones)) return [];
  const out: AdminBookingFunnelMilestoneRow[] = [];
  for (const raw of funnelMilestones) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const row = raw as Record<string, unknown>;
    const k = typeof row.k === "string" ? row.k.trim() : "";
    if (!k || !ALLOWED.has(k)) continue;
    const atRaw = row.at;
    const occurredAt =
      typeof atRaw === "string" && Number.isFinite(Date.parse(atRaw))
        ? new Date(atRaw).toISOString()
        : null;
    const p = asPayloadRecord(row.p);
    out.push({
      milestone: k,
      occurredAt,
      source: "intake",
      surface: p ? sanitizeSurface(p.surface) : null,
      cadence: p ? sanitizeCadence(p.cadence) : null,
      sessionHint: p && typeof p.paymentSessionKey === "string"
        ? clampHint(p.paymentSessionKey.trim(), 32)
        : null,
    });
  }
  return out;
}

export function sortFunnelMilestoneRows(
  rows: AdminBookingFunnelMilestoneRow[],
): AdminBookingFunnelMilestoneRow[] {
  return [...rows].sort((a, b) => {
    const ta = a.occurredAt ? Date.parse(a.occurredAt) : 0;
    const tb = b.occurredAt ? Date.parse(b.occurredAt) : 0;
    const sa = Number.isFinite(ta) ? ta : 0;
    const sb = Number.isFinite(tb) ? tb : 0;
    if (sa !== sb) return sa - sb;
    const srcOrder = (s: AdminBookingFunnelMilestoneSource) =>
      s === "intake" ? 0 : 1;
    const d = srcOrder(a.source) - srcOrder(b.source);
    if (d !== 0) return d;
    return `${a.milestone}:${a.bookingEventId ?? ""}`.localeCompare(
      `${b.milestone}:${b.bookingEventId ?? ""}`,
    );
  });
}
