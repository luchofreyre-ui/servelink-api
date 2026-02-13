import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { RefundReconcileService } from "./refunds.reconcile.service";

@Processor("refunds")
export class RefundsQueueProcessor extends WorkerHost {
  constructor(private readonly reconcile: RefundReconcileService) {
    super();
  }

  async process(job: Job<{ refundIntentId: string }>) {
    return this.reconcile.executeIntentById({ refundIntentId: job.data.refundIntentId });
  }
}
