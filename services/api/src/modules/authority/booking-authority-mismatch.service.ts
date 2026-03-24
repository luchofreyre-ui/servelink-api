import { Injectable } from "@nestjs/common";
import { BookingAuthorityMismatchType } from "@prisma/client";
import { PrismaService } from "../../prisma";

@Injectable()
export class BookingAuthorityMismatchService {
  constructor(private readonly db: PrismaService) {}

  async createMismatchRecord(params: {
    bookingId: string;
    authorityResultId: string;
    mismatchType: BookingAuthorityMismatchType;
    notes?: string | null;
    actorUserId?: string | null;
  }) {
    return this.db.bookingAuthorityMismatch.create({
      data: {
        bookingId: params.bookingId,
        authorityResultId: params.authorityResultId,
        mismatchType: params.mismatchType,
        notes: params.notes ?? null,
        actorUserId: params.actorUserId?.trim() || null,
      },
    });
  }

  listMismatchesForBooking(bookingId: string) {
    return this.db.bookingAuthorityMismatch.findMany({
      where: { bookingId },
      orderBy: { createdAt: "desc" },
    });
  }

  async listRecentMismatches(params: { skip: number; take: number }) {
    const [items, total] = await Promise.all([
      this.db.bookingAuthorityMismatch.findMany({
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      this.db.bookingAuthorityMismatch.count(),
    ]);
    return { items, total };
  }
}
