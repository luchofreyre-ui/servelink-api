import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { isCronDisabledByExplicitFalse } from "./payment-lifecycle-cron-env";
import { PaymentLifecycleReconciliationService } from "./payment-lifecycle-reconciliation.service";

const EXPECTED_INTERVAL_MS = 15 * 60 * 1000;

export type CronHealthSnapshot = {
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  stale: boolean;
};

@Injectable()
export class PaymentLifecycleReconciliationCronService {
  private readonly log = new Logger(PaymentLifecycleReconciliationCronService.name);
  private lastRunAt: Date | null = null;
  private lastSuccessAt: Date | null = null;
  private lastFailureAt: Date | null = null;

  constructor(
    private readonly reconciliation: PaymentLifecycleReconciliationService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  getHealthSnapshot(now = new Date()): CronHealthSnapshot {
    return {
      lastRunAt: this.lastRunAt?.toISOString() ?? null,
      lastSuccessAt: this.lastSuccessAt?.toISOString() ?? null,
      lastFailureAt: this.lastFailureAt?.toISOString() ?? null,
      stale:
        this.lastRunAt === null ||
        now.getTime() - this.lastRunAt.getTime() > EXPECTED_INTERVAL_MS * 2,
    };
  }

  @Cron("*/15 * * * *")
  async run(): Promise<void> {
    this.lastRunAt = new Date();
    const jobName = "payment_lifecycle_reconciliation";
    if (isCronDisabledByExplicitFalse(process.env.ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON)) {
      this.log.log({
        kind: "payment_lifecycle_reconcile_cron",
        event: "disabled_by_env",
        env: "ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON=false",
      });
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "*/15 * * * *",
      envFlag: "ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON",
    });
    try {
      const batch =
        Number(process.env.PAYMENT_LIFECYCLE_RECONCILIATION_CRON_BATCH ?? 25) || 25;
      const ids = await this.reconciliation.findBookingsForLifecycleReconciliation({
        limit: batch,
      });

      this.log.log({
        kind: "payment_lifecycle_reconcile_cron",
        event: "batch_start",
        batchSize: batch,
        candidateCount: ids.length,
      });

      let touched = 0;
      let failed = 0;
      for (const id of ids) {
        try {
          const r = await this.reconciliation.reconcileBookingPaymentLifecycle(id);
          if (r.touched) touched += 1;
        } catch (e) {
          failed += 1;
          this.lastFailureAt = new Date();
          this.log.error({
            kind: "payment_lifecycle_reconcile_cron",
            event: "booking_failed",
            bookingId: id,
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }

      this.lastSuccessAt = new Date();
      this.log.log({
        kind: "payment_lifecycle_reconcile_cron",
        event: "batch_end",
        processed: ids.length,
        mutations: touched,
        failures: failed,
      });
      await this.cronRunLedger?.recordSucceeded(ledgerId, {
        processed: ids.length,
        mutations: touched,
        failures: failed,
      });
    } catch (e) {
      this.lastFailureAt = new Date();
      this.log.error({
        kind: "payment_lifecycle_reconcile_cron",
        event: "batch_failed",
        message: e instanceof Error ? e.message : String(e),
      });
      await this.cronRunLedger?.recordFailed(ledgerId, e);
      throw e;
    }
  }
}
