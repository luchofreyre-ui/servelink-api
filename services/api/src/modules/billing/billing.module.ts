import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { PrismaService } from "../../prisma";
import { LedgerModule } from "../ledger/ledger.module";
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
import { StripeReconcileAdminController } from "./stripe.reconcile.admin.controller";
import { StripeReconcileService } from "./stripe.reconcile.service";
import { StripeService } from "./stripe.service";
import { StripeWebhookController } from "./stripe.webhook.controller";
import { StripeWebhookHandlerService } from "./stripe.webhook.handler.service";

const enableQueue = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

@Module({
  imports: [
    LedgerModule,
    ...(enableQueue ? [BullModule.registerQueue({ name: "refunds" })] : []),
  ],
  controllers: [
    AnomaliesAdminController,
    BillingAdjustmentsController,
    BillingStripeController,
    StripeWebhookController,
    BillingRefundsController,
    BillingFinalizationAdminController,
    RefundIntentAdminController,
    RefundReconcileController,
    StripeReconcileAdminController,
  ],
  providers: [PrismaService, BillingService, StripeService, StripeWebhookHandlerService, RefundReconcileService, StripeReconcileService, RefundsCronService, RefundsQueueProcessor, IntegritySweepCron],
  exports: [BillingService],
})
export class BillingModule {}
