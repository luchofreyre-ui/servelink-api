import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { isCronDisabledByExplicitFalse } from "./payment-lifecycle-cron-env";
import { PaymentLifecycleReconciliationService } from "./payment-lifecycle-reconciliation.service";

@Injectable()
export class PaymentLifecycleReconciliationCronService {
  private readonly log = new Logger(PaymentLifecycleReconciliationCronService.name);

  constructor(private readonly reconciliation: PaymentLifecycleReconciliationService) {}

  @Cron("*/15 * * * *")
  async run(): Promise<void> {
    if (isCronDisabledByExplicitFalse(process.env.ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON)) {
      this.log.log({
        kind: "payment_lifecycle_reconcile_cron",
        event: "disabled_by_env",
        env: "ENABLE_PAYMENT_LIFECYCLE_RECONCILIATION_CRON=false",
      });
      return;
    }

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
        this.log.error({
          kind: "payment_lifecycle_reconcile_cron",
          event: "booking_failed",
          bookingId: id,
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    this.log.log({
      kind: "payment_lifecycle_reconcile_cron",
      event: "batch_end",
      processed: ids.length,
      mutations: touched,
      failures: failed,
    });
  }
}
