import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";

@Injectable()
export class BookingEventsService {
  constructor(private readonly db: PrismaService) {}

  async findByIdempotencyKey(bookingId: string, idempotencyKey?: string | null) {
    if (!idempotencyKey) return null;

    return this.db.bookingEvent.findFirst({
      where: { bookingId, idempotencyKey },
      select: { id: true },
    });
  }
}
