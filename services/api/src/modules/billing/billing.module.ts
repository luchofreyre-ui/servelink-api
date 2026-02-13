import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "../../prisma";
import { BillingService } from "./billing.service";
import { BillingAdjustmentsController } from "./billing.adjustments.controller";
import { BillingRefundsController } from "./billing.refunds.controller";
import { BillingStripeController } from "./billing.stripe.controller";
import { AnomaliesAdminController } from "./anomalies.admin.controller";
import { BillingFinalizationAdminController } from "./billing.finalization.admin.controller";
import { RefundIntentAdminController } from "./refund-intent.admin.controller";
import { RefundReconcileController } from "./refunds.reconcile.controller";
import { RefundReconcileService } from "./refunds.reconcile.service";
import { RefundsCronService } from "./refunds.cron.service";
import { RefundsQueueProcessor } from "./refunds.queue.processor";
import { IntegritySweepCron } from "./integrity.sweep.cron";
import { StripeService } from "./stripe.service";
import { StripeWebhookController } from "./stripe.webhook.controller";

const enableQueue = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

@Module({
  imports: [...(enableQueue ? [BullModule.registerQueue({ name: "refunds" })] : [])],
  controllers: [
    AnomaliesAdminController,
    BillingAdjustmentsController,
    BillingStripeController,
    StripeWebhookController,
    BillingRefundsController,
    BillingFinalizationAdminController,
    RefundIntentAdminController,
    RefundReconcileController,
  ],
  providers: [PrismaService, BillingService, StripeService, RefundReconcileService, RefundsCronService, RefundsQueueProcessor, IntegritySweepCron],
  exports: [BillingService],
})
export class BillingModule {}
