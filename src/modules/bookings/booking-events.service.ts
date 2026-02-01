import { Injectable } from '@nestjs/common';
import { prisma, PrismaService } from '../../prisma';

@Injectable()
export class BookingEventsService {
  private readonly db: PrismaService;

  constructor() {
    this.db = prisma;
  }

  async findByIdempotencyKey(bookingId: string, idempotencyKey?: string | null) {
    if (!idempotencyKey) return null;
    return this.db.bookingEvent.findFirst({
      where: { bookingId, idempotencyKey },
      select: { id: true },
    });
  }
}
