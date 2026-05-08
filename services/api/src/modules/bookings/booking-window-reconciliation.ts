/**
 * Controlled repair path for legacy or inconsistent `scheduledStart` / `scheduledEnd` rows.
 * Do not invoke globally from cron without an explicit ops decision.
 */
import type { Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { resolveCanonicalBookingScheduledEnd } from "./booking-scheduled-window";
import { logBookingWindowAnomaly } from "./booking-window-mutation";

export type BookingWindowReconciliationResult =
  | { status: "ok"; bookingId: string }
  | { status: "skipped"; bookingId: string; reason: string }
  | { status: "repaired"; bookingId: string; action: "set_end" | "cleared_invalid_end" };

function windowIsInvalid(
  start: Date | null,
  end: Date | null,
): boolean {
  if (!start || !end) return false;
  return !(end.getTime() > start.getTime());
}

/**
 * Reconcile one booking: if `scheduledStart` exists and `scheduledEnd` is missing or not after start,
 * derive end from the canonical resolver and persist; if impossible, clear invalid `scheduledEnd`.
 */
export async function reconcileBookingScheduledWindowIfNeeded(
  db: PrismaService,
  bookingId: string,
  log?: Logger,
): Promise<BookingWindowReconciliationResult> {
  const row = await db.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
      estimatedHours: true,
    },
  });

  if (!row) {
    return { status: "skipped", bookingId, reason: "BOOKING_NOT_FOUND" };
  }

  if (!row.scheduledStart) {
    return { status: "skipped", bookingId, reason: "NO_SCHEDULED_START" };
  }

  const start = row.scheduledStart;
  const end = row.scheduledEnd;

  if (end && end.getTime() > start.getTime()) {
    return { status: "ok", bookingId: row.id };
  }

  const snap = await db.bookingEstimateSnapshot.findUnique({
    where: { bookingId: row.id },
    select: { outputJson: true },
  });

  const computed = resolveCanonicalBookingScheduledEnd({
    scheduledStart: start,
    scheduledEnd: null,
    estimatedHours: row.estimatedHours,
    estimateSnapshotOutputJson: snap?.outputJson ?? null,
    preferWallClockFromSnapshot: true,
    hold: null,
  });

  if (computed) {
    await db.booking.update({
      where: { id: row.id },
      data: { scheduledEnd: computed },
    });
    logBookingWindowAnomaly(log, "LEGACY_WINDOW_REPAIRED", {
      bookingId: row.id,
      action: "set_end_from_resolver",
    });
    return { status: "repaired", bookingId: row.id, action: "set_end" };
  }

  if (windowIsInvalid(start, end)) {
    await db.booking.update({
      where: { id: row.id },
      data: { scheduledEnd: null },
    });
    logBookingWindowAnomaly(log, "LEGACY_INVALID_END_CLEARED", {
      bookingId: row.id,
      action: "cleared_scheduled_end",
    });
    return { status: "repaired", bookingId: row.id, action: "cleared_invalid_end" };
  }

  return { status: "skipped", bookingId: row.id, reason: "END_STILL_NULL_UNRESOLVABLE" };
}

/**
 * List booking ids that may need reconciliation (bounded scan for ops tools).
 */
export async function findBookingsWithSuspectScheduledWindows(
  db: PrismaService,
  args: { limit: number },
): Promise<string[]> {
  const rows = await db.booking.findMany({
    where: { scheduledStart: { not: null } },
    select: {
      id: true,
      scheduledStart: true,
      scheduledEnd: true,
    },
    take: Math.min(Math.max(1, args.limit), 500),
    orderBy: { updatedAt: "desc" },
  });

  return rows
    .filter((r) => {
      if (!r.scheduledStart) return false;
      if (r.scheduledEnd == null) return true;
      return !(r.scheduledEnd.getTime() > r.scheduledStart.getTime());
    })
    .map((r) => r.id);
}
