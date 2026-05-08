import { BadRequestException, Injectable } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { resolveCanonicalBookingScheduledEndMs } from "../bookings/booking-scheduled-window";
import { SlotAvailabilityCache } from "./slot-availability.cache";

type ListAvailableWindowsArgs = {
  foId: string;
  rangeStart: Date | string;
  rangeEnd: Date | string;
  durationMinutes: number;
  slotIntervalMinutes?: number;
};

type TimeWindow = {
  startAt: Date;
  endAt: Date;
};

@Injectable()
export class SlotAvailabilityService {
  constructor(private readonly db: PrismaService) {}

  private isStrictlyFuture(startAt: Date, now: Date): boolean {
    return startAt.getTime() > now.getTime();
  }

  private toDate(value: Date | string, code: string): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (!Number.isFinite(date.getTime())) {
      throw new BadRequestException(code);
    }

    return date;
  }

  private assertPositiveInt(value: number, code: string) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new BadRequestException(code);
    }
  }

  private windowsOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  async listAvailableWindows(args: ListAvailableWindowsArgs): Promise<TimeWindow[]> {
    const now = new Date();
    const cacheKey = `${args.foId}:${args.rangeStart}:${args.rangeEnd}:${args.durationMinutes}`;
    const cached = SlotAvailabilityCache.get(cacheKey);
    if (cached) {
      return cached.filter((window: TimeWindow) =>
        this.isStrictlyFuture(window.startAt, now),
      );
    }

    const rangeStart = this.toDate(
      args.rangeStart,
      "BOOKING_AVAILABILITY_RANGE_START_INVALID",
    );
    const rangeEnd = this.toDate(
      args.rangeEnd,
      "BOOKING_AVAILABILITY_RANGE_END_INVALID",
    );

    const durationMinutes = Math.floor(args.durationMinutes);
    const slotIntervalMinutes =
      typeof args.slotIntervalMinutes === "number"
        ? Math.floor(args.slotIntervalMinutes)
        : 30;

    this.assertPositiveInt(
      durationMinutes,
      "BOOKING_AVAILABILITY_DURATION_MINUTES_INVALID",
    );
    this.assertPositiveInt(
      slotIntervalMinutes,
      "BOOKING_AVAILABILITY_SLOT_INTERVAL_MINUTES_INVALID",
    );

    if (!(rangeEnd.getTime() > rangeStart.getTime())) {
      throw new BadRequestException("BOOKING_AVAILABILITY_RANGE_INVALID");
    }
    const effectiveRangeStart =
      rangeStart.getTime() <= now.getTime() ? now : rangeStart;
    if (!(rangeEnd.getTime() > effectiveRangeStart.getTime())) {
      SlotAvailabilityCache.set(cacheKey, []);
      return [];
    }

    const [bookings, activeHolds] = await Promise.all([
      this.db.booking.findMany({
        where: {
          foId: args.foId,
          scheduledStart: {
            not: null,
            lt: rangeEnd,
          },
          status: {
            in: [
              BookingStatus.pending_dispatch,
              BookingStatus.offered,
              BookingStatus.assigned,
              BookingStatus.in_progress,
            ],
          },
        },
        select: {
          id: true,
          scheduledStart: true,
          scheduledEnd: true,
          estimatedHours: true,
          estimateSnapshot: { select: { outputJson: true } },
        },
      }),
      this.db.bookingSlotHold.findMany({
        where: {
          foId: args.foId,
          expiresAt: { gt: now },
          startAt: { lt: rangeEnd },
          endAt: { gt: effectiveRangeStart },
        },
        select: {
          id: true,
          startAt: true,
          endAt: true,
        },
      }),
    ]);

    const blocked: TimeWindow[] = [];

    for (const booking of bookings) {
      if (!booking.scheduledStart) continue;

      const startAt = new Date(booking.scheduledStart);
      const estimatedHours = Number(booking.estimatedHours ?? 0);

      if (!Number.isFinite(startAt.getTime())) continue;

      const endMs = resolveCanonicalBookingScheduledEndMs({
        scheduledStart: startAt,
        scheduledEnd: booking.scheduledEnd,
        estimatedHours,
        estimateSnapshotOutputJson: booking.estimateSnapshot?.outputJson,
        preferWallClockFromSnapshot: true,
        hold: null,
      });
      if (endMs == null) continue;

      const endAt = new Date(endMs);

      if (endAt <= effectiveRangeStart || startAt >= rangeEnd) continue;

      blocked.push({ startAt, endAt });
    }

    for (const hold of activeHolds) {
      blocked.push({
        startAt: new Date(hold.startAt),
        endAt: new Date(hold.endAt),
      });
    }

    blocked.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

    const available: TimeWindow[] = [];
    let cursor = new Date(effectiveRangeStart);

    while (true) {
      const candidateStart = new Date(cursor);
      const candidateEnd = this.addMinutes(candidateStart, durationMinutes);

      if (candidateEnd > rangeEnd) {
        break;
      }

      const overlapsBlocked = blocked.some((window) =>
        this.windowsOverlap(
          candidateStart,
          candidateEnd,
          window.startAt,
          window.endAt,
        ),
      );

      if (this.isStrictlyFuture(candidateStart, now) && !overlapsBlocked) {
        available.push({
          startAt: candidateStart,
          endAt: candidateEnd,
        });
      }

      cursor = this.addMinutes(cursor, slotIntervalMinutes);
    }

    const windows = available;
    SlotAvailabilityCache.set(cacheKey, windows);
    return windows;
  }
}
