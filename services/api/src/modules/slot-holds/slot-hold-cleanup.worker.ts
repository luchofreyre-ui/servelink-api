import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { SlotHoldMetrics } from "./slot-holds.metrics";

@Injectable()
export class SlotHoldCleanupWorker implements OnModuleInit {
  constructor(private readonly db: PrismaService) {}

  onModuleInit() {
    setInterval(() => {
      this.cleanup().catch(() => {});
    }, 60_000);
  }

  private async cleanup() {
    const result = await this.db.bookingSlotHold.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });
    SlotHoldMetrics.expired += result.count;
  }
}
