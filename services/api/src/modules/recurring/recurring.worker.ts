import { Injectable, Logger } from "@nestjs/common";
import { Interval } from "@nestjs/schedule";
import { RecurringService } from "./recurring.service";

@Injectable()
export class RecurringWorker {
  private readonly logger = new Logger(RecurringWorker.name);

  constructor(private readonly recurring: RecurringService) {}

  @Interval(30_000)
  async handleRecurringProcessing(): Promise<void> {
    if (process.env.NODE_ENV === "test") {
      return;
    }
    try {
      await this.processPendingOccurrences();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err ?? "unknown error");
      this.logger.error(
        `RECURRING_WORKER_TICK_FAILED message=${message}`,
        err instanceof Error ? err.stack : undefined,
      );
    }
  }

  async processPendingOccurrences(): Promise<void> {
    const batch = await this.recurring.getProcessableOccurrences();
    for (const occurrence of batch) {
      await this.recurring.processOccurrence(occurrence.id);
    }
  }
}
