/**
 * FO overlap checks must use the same **calendar** span customers booked when wall-clock
 * duration is on the estimate snapshot (`estimatedDurationMinutes`).
 *
 * `Booking.estimatedHours` remains labor-weighted for pricing; when
 * `preferWallClockFromSnapshot` is true and the snapshot carries `estimatedDurationMinutes`,
 * that value defines the on-calendar end for conflict detection.
 */
export function resolveBookingCalendarEndMs(args: {
  scheduledStart: Date;
  estimatedHours: number;
  estimateSnapshotOutputJson: string | null | undefined;
  preferWallClockFromSnapshot: boolean;
}): number {
  const startMs = args.scheduledStart.getTime();
  if (args.preferWallClockFromSnapshot && args.estimateSnapshotOutputJson?.trim()) {
    try {
      const out = JSON.parse(args.estimateSnapshotOutputJson) as Record<string, unknown>;
      const w = out.estimatedDurationMinutes;
      if (typeof w === "number" && Number.isFinite(w) && w > 0) {
        return startMs + Math.floor(w) * 60 * 1000;
      }
    } catch {
      /* ignore */
    }
  }
  return startMs + args.estimatedHours * 60 * 60 * 1000;
}
