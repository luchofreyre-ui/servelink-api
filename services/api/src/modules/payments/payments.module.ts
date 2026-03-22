import { Module } from "@nestjs/common";

import { FinancialModule } from "../financial/financial.module";
import { TrustModule } from "../trust/trust.module";
import { PaymentOrchestrationService } from "./payment-orchestration.service";
import { PaymentsConfigController } from "./payments-config.controller";
import { PaymentsController } from "./payments.controller";
import { StripeService } from "./stripe.service";

@Module({
  imports: [FinancialModule, TrustModule],
  controllers: [PaymentsController, PaymentsConfigController],
  providers: [StripeService, PaymentOrchestrationService],
  exports: [StripeService, PaymentOrchestrationService],
})
export class PaymentsModule {}
