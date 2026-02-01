import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma, PrismaService } from '../../prisma';
import { BookingEventType, BookingStatus } from '@prisma/client';
import { BookingEventsService } from './booking-events.service';
import { getTransition, Transition } from './booking-state.machine';

@Injectable()
export class BookingsService {
  private readonly db: PrismaService;

  constructor(private readonly events: BookingEventsService) {
    this.db = prisma;
  }

  async createBooking(input: { customerId: string; note?: string; idempotencyKey?: string | null }) {
    return this.db.$transaction(async (tx: any) => {
      const booking = await tx.booking.create({
        data: {
          status: BookingStatus.pending_payment,
          hourlyRateCents: 0,
          estimatedHours: 0,
          currency: 'usd',
          customer: { connect: { id: input.customerId } },
          notes: input.note ?? null,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.CREATED,
          fromStatus: null,
          toStatus: booking.status,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
        },
      });

      return booking;
    });
  }

  async getBooking(id: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('BOOKING_NOT_FOUND');
    return booking;
  }

  async getEvents(id: string) {
    await this.getBooking(id);
    return this.db.bookingEvent.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: 'asc' },
    });
  }

  async transitionBooking(args: {
    id: string;
    transition: Transition;
    note?: string;
    idempotencyKey?: string | null;
  }) {
    const booking = await this.getBooking(args.id);

    if (args.idempotencyKey) {
      const exists = await this.events.findByIdempotencyKey(args.id, args.idempotencyKey);
      if (exists) return booking;
    }

    let to: BookingStatus;
    try {
      to = getTransition(args.transition, booking.status).to;
    } catch (e: any) {
      if (typeof e?.message === 'string' && e.message.startsWith('INVALID_TRANSITION:')) {
        throw new ConflictException('INVALID_BOOKING_TRANSITION');
      }
      throw e;
    }

    return this.db.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: to },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.STATUS_CHANGED,
          fromStatus: booking.status,
          toStatus: to,
          note: args.note ?? null,
          idempotencyKey: args.idempotencyKey ?? null,
        },
      });

      return updated;
    });
  }
}
