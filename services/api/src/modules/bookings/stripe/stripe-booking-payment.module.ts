import { Module } from "@nestjs/common";

import { PrismaModule } from "../../../prisma.module";
import { PaymentReliabilityModule } from "../payment-reliability/payment-reliability.module";
import { StripePaymentService } from "./stripe-payment.service";

@Module({
  imports: [PrismaModule, PaymentReliabilityModule],
  providers: [StripePaymentService],
  exports: [StripePaymentService, PaymentReliabilityModule],
})
export class StripeBookingPaymentModule {}
