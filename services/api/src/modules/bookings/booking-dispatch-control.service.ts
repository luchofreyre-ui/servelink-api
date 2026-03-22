import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";

@Injectable()
export class BookingDispatchControlService {
  constructor(private readonly prisma: PrismaService) {}

  async getControl(bookingId: string) {
    return this.prisma.bookingDispatchControl.findUnique({
      where: { bookingId },
    });
  }

  async isHoldActive(bookingId: string): Promise<boolean> {
    const control = await this.getControl(bookingId);
    return Boolean(control?.holdActive);
  }

  async assertNotHeld(bookingId: string): Promise<void> {
    const held = await this.isHoldActive(bookingId);

    if (held) {
      throw new BadRequestException(
        "Booking is currently on admin hold and cannot be dispatched.",
      );
    }
  }

  async applyHold(input: {
    bookingId: string;
    adminUserId: string;
    reason: string;
    source: string;
  }) {
    return this.prisma.bookingDispatchControl.upsert({
      where: { bookingId: input.bookingId },
      update: {
        holdActive: true,
        holdReason: input.reason,
        holdSource: input.source,
        holdSetByAdminId: input.adminUserId,
        holdSetAt: new Date(),
        holdReleasedAt: null,
      },
      create: {
        bookingId: input.bookingId,
        holdActive: true,
        holdReason: input.reason,
        holdSource: input.source,
        holdSetByAdminId: input.adminUserId,
        holdSetAt: new Date(),
        holdReleasedAt: null,
      },
    });
  }

  async releaseHold(input: { bookingId: string }) {
    return this.prisma.bookingDispatchControl.upsert({
      where: { bookingId: input.bookingId },
      update: {
        holdActive: false,
        holdReleasedAt: new Date(),
      },
      create: {
        bookingId: input.bookingId,
        holdActive: false,
        holdReleasedAt: new Date(),
      },
    });
  }
}
