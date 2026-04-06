import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";

@Injectable()
export class DispatchLockService {
  constructor(private readonly prisma: PrismaService) {}

  async acquireLock(bookingId: string): Promise<boolean> {
    const existing = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { dispatchLockedAt: true },
    });

    if (!existing) return false;

    if (existing.dispatchLockedAt) {
      return false;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { dispatchLockedAt: new Date() },
    });

    return true;
  }

  async releaseLock(bookingId: string): Promise<void> {
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { dispatchLockedAt: null },
    });
  }
}
