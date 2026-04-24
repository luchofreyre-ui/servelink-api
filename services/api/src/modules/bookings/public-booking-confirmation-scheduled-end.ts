/**
 * Public booking confirmation and orchestrator responses must expose **wall-clock**
 * job duration on the calendar (crew-adjusted elapsed), not total labor hours.
 *
 * `Booking.estimatedHours` represents labor-style hours (from `estimateMinutes / 60`) and
 * must not be used as the primary public scheduling duration for `scheduledEnd`.
 */

export function computePublicBookingConfirmationScheduledEndIso(
  scheduledStart: Date | null | undefined,
  options: {
    /** Wall-clock minutes from persisted estimate snapshot (`estimatedDurationMinutes`). */
    wallClockDurationMinutes?: number | null;
    /** Legacy fallback only — labor hours, not calendar duration when crew > 1. */
    estimatedHours?: number | null;
  },
): string | null {
  if (!scheduledStart) return null;
  const startMs = scheduledStart.getTime();
  if (!Number.isFinite(startMs)) return null;

  const wall = options.wallClockDurationMinutes;
  if (typeof wall === "number" && Number.isFinite(wall) && wall > 0) {
    return new Date(startMs + Math.floor(wall) * 60 * 1000).toISOString();
  }

  const eh = Number(options.estimatedHours ?? 0);
  if (!Number.isFinite(eh) || eh <= 0) return null;
  return new Date(startMs + eh * 60 * 60 * 1000).toISOString();
}

/**
 * Public hold confirm: `scheduledEnd` follows the **slot hold window** (`hold.endAt`),
 * not `Booking.estimatedHours` (labor hours). Legacy fallback keeps non-hold flows working.
 */
export function computePublicHoldConfirmScheduledEndIso(args: {
  scheduledStart: Date | null | undefined;
  holdEndAt: Date | null | undefined;
  holdStartAt: Date | null | undefined;
  estimatedHours: number | null | undefined;
}): string | null {
  if (!args.scheduledStart) return null;
  const startMs = new Date(args.scheduledStart).getTime();
  if (!Number.isFinite(startMs)) return null;

  if (args.holdEndAt) {
    const endMs = new Date(args.holdEndAt).getTime();
    if (Number.isFinite(endMs) && endMs > startMs) {
      return new Date(endMs).toISOString();
    }
  }

  if (args.holdStartAt && args.holdEndAt) {
    const wallMin = Math.round(
      (new Date(args.holdEndAt).getTime() -
        new Date(args.holdStartAt).getTime()) /
        (60 * 1000),
    );
    if (wallMin > 0) {
      return new Date(startMs + wallMin * 60 * 1000).toISOString();
    }
  }

  const eh = Number(args.estimatedHours ?? 0);
  if (Number.isFinite(eh) && eh > 0) {
    return new Date(startMs + eh * 60 * 60 * 1000).toISOString();
  }
  return null;
}
