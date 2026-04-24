import { BadRequestException, Injectable } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { resolveBookingCalendarEndMs } from "../bookings/booking-scheduling-calendar-end";
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
    const cacheKey = `${args.foId}:${args.rangeStart}:${args.rangeEnd}:${args.durationMinutes}`;
    const cached = SlotAvailabilityCache.get(cacheKey);
    if (cached) return cached;

    const now = new Date();
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
          estimatedHours: true,
          estimateSnapshot: { select: { outputJson: true } },
        },
      }),
      this.db.bookingSlotHold.findMany({
        where: {
          foId: args.foId,
          expiresAt: { gt: now },
          startAt: { lt: rangeEnd },
          endAt: { gt: rangeStart },
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
      if (!(estimatedHours > 0)) continue;

      // estimatedHours is labor-oriented and must only be a legacy fallback for calendar overlap.
      const endAt = new Date(
        resolveBookingCalendarEndMs({
          scheduledStart: startAt,
          estimatedHours,
          estimateSnapshotOutputJson: booking.estimateSnapshot?.outputJson,
          preferWallClockFromSnapshot: true,
        }),
      );

      if (endAt <= rangeStart || startAt >= rangeEnd) continue;

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
    let cursor = new Date(rangeStart);

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

      if (!overlapsBlocked) {
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
