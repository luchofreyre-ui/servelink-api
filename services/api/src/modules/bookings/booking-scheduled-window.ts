import { resolveBookingCalendarEndMs } from "./booking-scheduling-calendar-end";

function toFiniteDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Canonical inputs for resolving a booking's on-calendar window.
 *
 * Priority for the end instant:
 * 1. persisted `Booking.scheduledEnd`
 * 2. active hold `hold.endAt` (pre-confirm / transient)
 * 3. wall-clock minutes on the estimate snapshot (`estimatedDurationMinutes`)
 * 4. `estimatedHours` (labor-weighted legacy fallback)
 */
export type CanonicalBookingWindowInput = {
  scheduledStart: Date | string | null | undefined;
  scheduledEnd?: Date | string | null | undefined;
  estimatedHours: number | null | undefined;
  estimateSnapshotOutputJson?: string | null | undefined;
  /** When false, snapshot wall-clock minutes are ignored (matches {@link resolveBookingCalendarEndMs}). */
  preferWallClockFromSnapshot?: boolean;
  hold?: {
    startAt?: Date | string | null | undefined;
    endAt?: Date | string | null | undefined;
  } | null;
};

function resolveScheduledStart(args: CanonicalBookingWindowInput): Date | null {
  return (
    toFiniteDate(args.scheduledStart) ?? toFiniteDate(args.hold?.startAt ?? null)
  );
}

export function resolveCanonicalBookingScheduledEnd(
  args: CanonicalBookingWindowInput,
): Date | null {
  const ms = resolveCanonicalBookingScheduledEndMs(args);
  return ms == null ? null : new Date(ms);
}

export function resolveCanonicalBookingScheduledEndMs(
  args: CanonicalBookingWindowInput,
): number | null {
  const start = resolveScheduledStart(args);
  if (!start) return null;

  const persisted = toFiniteDate(args.scheduledEnd ?? null);
  if (persisted && persisted.getTime() > start.getTime()) {
    return persisted.getTime();
  }

  const holdEnd = toFiniteDate(args.hold?.endAt ?? null);
  if (holdEnd && holdEnd.getTime() > start.getTime()) {
    return holdEnd.getTime();
  }

  const eh = Number(args.estimatedHours ?? 0);
  const endMs = resolveBookingCalendarEndMs({
    scheduledStart: start,
    estimatedHours: Number.isFinite(eh) ? eh : 0,
    estimateSnapshotOutputJson: args.estimateSnapshotOutputJson,
    preferWallClockFromSnapshot: args.preferWallClockFromSnapshot ?? true,
  });

  if (!(endMs > start.getTime())) return null;
  return endMs;
}

export function resolveCanonicalBookingWindow(
  args: CanonicalBookingWindowInput,
): { start: Date; end: Date } | null {
  const start = resolveScheduledStart(args);
  if (!start) return null;

  const endMs = resolveCanonicalBookingScheduledEndMs({
    ...args,
    scheduledStart: start,
  });
  if (endMs == null) return null;

  const end = new Date(endMs);
  if (!(end.getTime() > start.getTime())) return null;
  return { start, end };
}
