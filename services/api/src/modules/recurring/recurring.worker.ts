import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { RecurringService } from "./recurring.service";

@Injectable()
export class RecurringWorker {
  private readonly logger = new Logger(RecurringWorker.name);

  constructor(
    private readonly recurring: RecurringService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  @Interval(30_000)
  async handleRecurringProcessing(): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      await this.cronRunLedger?.recordSkipped("recurring_processing", "disabled_by_env", {
        envFlag: "NODE_ENV",
        envValue: "test",
      });
      return;
    }
    const ledgerId = await this.cronRunLedger?.recordStarted("recurring_processing", {
      schedule: "@Interval(30000)",
    });
    try {
      const result = await this.processPendingOccurrences();
      await this.cronRunLedger?.recordSucceeded(ledgerId, result);
    } catch (err: unknown) {
      await this.cronRunLedger?.recordFailed(ledgerId, err);
      const message =
        err instanceof Error ? err.message : String(err ?? "unknown error");
      this.logger.error(
        `RECURRING_WORKER_TICK_FAILED message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  async processPendingOccurrences(): Promise<{ processed: number }> {
    const batch = await this.recurring.getProcessableOccurrences();
    for (const occurrence of batch) {
      await this.recurring.processOccurrence(occurrence.id);
    }
    return { processed: batch.length };
  }
}
