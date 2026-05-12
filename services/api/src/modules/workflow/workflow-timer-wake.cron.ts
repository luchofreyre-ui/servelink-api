import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { WorkflowTimerWakeService } from "./workflow-timer-wake.service";

/**
 * Optional timer wake tick — disabled unless `ENABLE_WORKFLOW_TIMER_WAKE_CRON=true`.
 */
@Injectable()
export class WorkflowTimerWakeCron {
  private readonly log = new Logger(WorkflowTimerWakeCron.name);

  constructor(
    private readonly wake: WorkflowTimerWakeService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  @Cron("*/2 * * * *")
  async tick(): Promise<void> {
    const jobName = "workflow_timer_wake";

    if (process.env.NODE_ENV === "test") {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "NODE_ENV",
        envValue: "test",
      });
      return;
    }

    if (process.env.ENABLE_WORKFLOW_TIMER_WAKE_CRON !== "true") {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_WORKFLOW_TIMER_WAKE_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "*/2 * * * *",
      envFlag: "ENABLE_WORKFLOW_TIMER_WAKE_CRON",
    });

    try {
      const limitRaw = process.env.WORKFLOW_TIMER_WAKE_BATCH_LIMIT;
      const parsed = limitRaw != null ? Number(limitRaw) : 25;
      const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
      const result = await this.wake.processDueTimers({ limit });
      await this.cronRunLedger?.recordSucceeded(
        ledgerId,
        result as unknown as Record<string, unknown>,
      );
    } catch (e: unknown) {
      await this.cronRunLedger?.recordFailed(ledgerId, e);
      this.log.error(e instanceof Error ? e.stack : String(e));
    }
  }
}
