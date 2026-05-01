import { Injectable, OnModuleInit } from "@nestjs/common";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { PrismaService } from "../../prisma";
import { SlotHoldMetrics } from "./slot-holds.metrics";

@Injectable()
export class SlotHoldCleanupWorker implements OnModuleInit {
  constructor(
    private readonly db: PrismaService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  onModuleInit() {
    setInterval(() => {
      this.cleanup().catch(() => {});
    }, 60_000);
  }

  private async cleanup() {
    const jobName = "slot_hold_cleanup";
    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "setInterval(60000)",
    });
    try {
      const result = await this.db.bookingSlotHold.deleteMany({
        where: {
          expiresAt: { lte: new Date() },
        },
      });
      SlotHoldMetrics.expired += result.count;
      await this.cronRunLedger?.recordSucceeded(ledgerId, {
        expiredCount: result.count,
      });
    } catch (error) {
      await this.cronRunLedger?.recordFailed(ledgerId, error);
      throw error;
    }
  }
}
