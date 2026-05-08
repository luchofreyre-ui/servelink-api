/**
 * Centralized booking calendar window writes. Production code should set
 * `scheduledStart` / `scheduledEnd` on {@link Booking} only through these helpers
 * (or {@link computeScheduleWritePatch}) so start/end invariants stay consistent.
 *
 * **DB constraint:** A CHECK `(scheduledEnd > scheduledStart)` when both non-null is
 * deferred here — validated in this module before persist. A future online migration
 * could add it once legacy rows are reconciled.
 */
import { BadRequestException } from "@nestjs/common";
import type { Logger } from "@nestjs/common";
import { resolveCanonicalBookingScheduledEnd } from "./booking-scheduled-window";

export const BOOKING_WINDOW_INVARIANT = "BOOKING_WINDOW_INVARIANT" as const;

export type BookingWindowFields = {
  scheduledStart: Date | null;
  scheduledEnd: Date | null;
};

/** Finite start+end pair (mutations that always produce a window). */
export type FiniteBookingWindow = {
  scheduledStart: Date;
  scheduledEnd: Date;
};

function toFiniteDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function logBookingWindowAnomaly(
  log: Logger | undefined,
  event: string,
  fields: Record<string, unknown>,
): void {
  if (!log) return;
  log.warn({
    category: BOOKING_WINDOW_INVARIANT,
    event,
    ...fields,
  });
}

/** Throws if both set and end <= start, or end without start. */
export function assertValidPersistedBookingWindow(
  scheduledStart: Date | string | null | undefined,
  scheduledEnd: Date | string | null | undefined,
): void {
  const start = toFiniteDate(scheduledStart);
  const end = toFiniteDate(scheduledEnd);
  if (end && !start) {
    throw new BadRequestException({
      code: "BOOKING_WINDOW_INVARIANT_VIOLATION",
      message: "scheduledEnd cannot be set without a valid scheduledStart",
    });
  }
  if (start && end && !(end.getTime() > start.getTime())) {
    throw new BadRequestException({
      code: "BOOKING_WINDOW_INVARIANT_VIOLATION",
      message: "scheduledEnd must be strictly after scheduledStart when both are set",
    });
  }
}

/** Explicit canonical pair; both instants required and end > start. */
export function setCanonicalBookingWindow(args: {
  scheduledStart: Date | string;
  scheduledEnd: Date | string;
}): FiniteBookingWindow {
  const scheduledStart = toFiniteDate(args.scheduledStart);
  const scheduledEnd = toFiniteDate(args.scheduledEnd);
  if (!scheduledStart || !scheduledEnd) {
    throw new BadRequestException("BOOKING_WINDOW_DATES_INVALID");
  }
  assertValidPersistedBookingWindow(scheduledStart, scheduledEnd);
  return { scheduledStart, scheduledEnd };
}

/** Hold-validated FO reservation window. */
export function setBookingWindowFromHold(args: {
  startAt: Date | string;
  endAt: Date | string;
}): FiniteBookingWindow {
  return setCanonicalBookingWindow({
    scheduledStart: args.startAt,
    scheduledEnd: args.endAt,
  });
}

/**
 * Derive wall-clock end from snapshot minutes / estimatedHours (same hierarchy as
 * {@link resolveCanonicalBookingScheduledEnd} steps 3–4).
 */
export function setBookingWindowFromDuration(args: {
  scheduledStart: Date | string;
  estimatedHours: number | null | undefined;
  estimateSnapshotOutputJson: string | null | undefined;
  preferWallClockFromSnapshot?: boolean;
}): FiniteBookingWindow {
  const scheduledStart = toFiniteDate(args.scheduledStart);
  if (!scheduledStart) {
    throw new BadRequestException("BOOKING_SCHEDULED_START_INVALID");
  }
  const scheduledEnd = resolveCanonicalBookingScheduledEnd({
    scheduledStart,
    scheduledEnd: null,
    estimatedHours: args.estimatedHours,
    estimateSnapshotOutputJson: args.estimateSnapshotOutputJson,
    preferWallClockFromSnapshot: args.preferWallClockFromSnapshot ?? true,
    hold: null,
  });
  if (!scheduledEnd) {
    throw new BadRequestException({
      code: "BOOKING_WINDOW_DURATION_UNRESOLVABLE",
      message: "Cannot derive scheduledEnd from duration context",
    });
  }
  return { scheduledStart, scheduledEnd };
}

export function clearBookingWindow(): BookingWindowFields {
  return { scheduledStart: null, scheduledEnd: null };
}

export type ScheduleEndResolutionReason =
  | "kept_valid_prior"
  | "recomputed"
  | "cleared_unresolvable";

export function resolveScheduledEndAfterStartChange(args: {
  newStart: Date;
  priorEnd: Date | null;
  estimatedHours: number | null | undefined;
  estimateSnapshotOutputJson: string | null | undefined;
  preferWallClockFromSnapshot?: boolean;
}): {
  scheduledEnd: Date | null;
  resolution: ScheduleEndResolutionReason;
} {
  const prior = toFiniteDate(args.priorEnd);
  if (prior && prior.getTime() > args.newStart.getTime()) {
    return { scheduledEnd: prior, resolution: "kept_valid_prior" };
  }
  const recomputed = resolveCanonicalBookingScheduledEnd({
    scheduledStart: args.newStart,
    scheduledEnd: null,
    estimatedHours: args.estimatedHours,
    estimateSnapshotOutputJson: args.estimateSnapshotOutputJson,
    preferWallClockFromSnapshot: args.preferWallClockFromSnapshot ?? true,
    hold: null,
  });
  if (recomputed) {
    return { scheduledEnd: recomputed, resolution: "recomputed" };
  }
  return { scheduledEnd: null, resolution: "cleared_unresolvable" };
}

/**
 * Build Prisma `data` fragment for schedule fields when changing start (manual schedule / patch).
 * Logs only when end must be cleared and duration cannot be resolved.
 */
export function computeScheduleWritePatch(args: {
  /** Set to a Date to assign, `null` to clear window entirely, `undefined` to leave unchanged. */
  nextScheduledStart: Date | null | undefined;
  currentScheduledStart: Date | null;
  currentScheduledEnd: Date | null;
  estimatedHours: number | null | undefined;
  estimateSnapshotOutputJson: string | null | undefined;
  bookingId?: string;
  log?: Logger;
}): Partial<{ scheduledStart: Date | null; scheduledEnd: Date | null }> {
  if (args.nextScheduledStart === undefined) {
    return {};
  }
  if (args.nextScheduledStart === null) {
    return clearBookingWindow();
  }

  const newStart = toFiniteDate(args.nextScheduledStart);
  if (!newStart) {
    throw new BadRequestException("BOOKING_SCHEDULED_START_INVALID");
  }

  const { scheduledEnd, resolution } = resolveScheduledEndAfterStartChange({
    newStart,
    priorEnd: args.currentScheduledEnd,
    estimatedHours: args.estimatedHours,
    estimateSnapshotOutputJson: args.estimateSnapshotOutputJson,
  });

  if (resolution === "cleared_unresolvable") {
    logBookingWindowAnomaly(args.log, "SCHEDULE_END_CLEARED_UNRESOLVABLE", {
      bookingId: args.bookingId ?? null,
      reason: "Could not recompute scheduledEnd after scheduledStart change",
    });
  }

  assertValidPersistedBookingWindow(newStart, scheduledEnd);
  return { scheduledStart: newStart, scheduledEnd };
}
