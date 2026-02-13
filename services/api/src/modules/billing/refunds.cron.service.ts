import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { RefundReconcileService } from "./refunds.reconcile.service";

@Injectable()
export class RefundsCronService {
  constructor(private readonly reconcile: RefundReconcileService) {}

  // Disabled by default once queue is live.
  // Keep as an optional safety net by setting ENABLE_REFUND_CRON=true.
  @Cron("*/5 * * * *")
  async run() {
    if (process.env.ENABLE_REFUND_CRON !== "true") return;

    try {
      // Safety net only (rare). Queue is primary execution path.
      await this.reconcile.runOnce({ limit: 25 });
    } catch {
      // swallow
    }
  }
}
