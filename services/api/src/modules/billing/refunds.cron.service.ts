import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { RefundReconcileService } from "./refunds.reconcile.service";

@Injectable()
export class RefundsCronService {
  constructor(
    private readonly reconcile: RefundReconcileService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  // Disabled by default once queue is live.
  // Keep as an optional safety net by setting ENABLE_REFUND_CRON=true.
  @Cron("*/5 * * * *")
  async run() {
    const jobName = "refund_reconciliation";
    if (process.env.ENABLE_REFUND_CRON !== "true") {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_REFUND_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "*/5 * * * *",
      envFlag: "ENABLE_REFUND_CRON",
    });
    try {
      // Safety net only (rare). Queue is primary execution path.
      const result = await this.reconcile.runOnce({ limit: 25 });
      await this.cronRunLedger?.recordSucceeded(ledgerId, { result });
    } catch (error) {
      await this.cronRunLedger?.recordFailed(ledgerId, error);
      // swallow
    }
  }
}
