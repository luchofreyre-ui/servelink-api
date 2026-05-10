import { Injectable, NotFoundException } from "@nestjs/common";
import { BookingEventType } from "@prisma/client";
import { PrismaService } from "../../../prisma";
import {
  parseBookingEventToFunnelRow,
  parseIntakeFunnelMilestoneRows,
  sortFunnelMilestoneRows,
  type AdminBookingFunnelMilestoneRow,
} from "./admin-booking-funnel-milestones.parser";

@Injectable()
export class AdminBookingFunnelMilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Read-only merged timeline: BookingEvent NOTE funnel echoes + linked intake JSON milestones.
   */
  async getTimelineForBooking(
    bookingId: string,
  ): Promise<{ ok: true; bookingId: string; milestones: AdminBookingFunnelMilestoneRow[] }> {
    const id = bookingId.trim();
    if (!id) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        directionIntake: {
          select: { funnelMilestones: true },
        },
      },
    });
    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const events = await this.prisma.bookingEvent.findMany({
      where: { bookingId: id, type: BookingEventType.NOTE },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        createdAt: true,
        note: true,
        payload: true,
        idempotencyKey: true,
      },
    });

    const rows: AdminBookingFunnelMilestoneRow[] = [];
    for (const ev of events) {
      const parsed = parseBookingEventToFunnelRow({
        id: ev.id,
        createdAt: ev.createdAt,
        note: ev.note,
        payload: ev.payload,
        idempotencyKey: ev.idempotencyKey,
        bookingId: id,
      });
      if (parsed) rows.push(parsed);
    }

    const intakeRaw = booking.directionIntake?.funnelMilestones;
    rows.push(...parseIntakeFunnelMilestoneRows(intakeRaw));

    return {
      ok: true,
      bookingId: id,
      milestones: sortFunnelMilestoneRows(rows),
    };
  }
}
