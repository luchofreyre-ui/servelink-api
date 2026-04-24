import { Module } from "@nestjs/common";

import { PrismaModule } from "../../../prisma.module";
import { PaymentReliabilityModule } from "../payment-reliability/payment-reliability.module";
import { BookingCancellationPaymentInvariantService } from "../payment-lifecycle/booking-cancellation-payment-invariant.service";
import { BookingCancellationPaymentService } from "../payment-lifecycle/booking-cancellation-payment.service";
import { RemainingBalanceAuthorizationService } from "../payment-lifecycle/remaining-balance-authorization.service";
import { RemainingBalanceCaptureService } from "../payment-lifecycle/remaining-balance-capture.service";
import { StripePaymentService } from "./stripe-payment.service";

@Module({
  imports: [PrismaModule, PaymentReliabilityModule],
  providers: [
    StripePaymentService,
    RemainingBalanceAuthorizationService,
    RemainingBalanceCaptureService,
    BookingCancellationPaymentService,
    BookingCancellationPaymentInvariantService,
  ],
  exports: [
    StripePaymentService,
    PaymentReliabilityModule,
    RemainingBalanceAuthorizationService,
    RemainingBalanceCaptureService,
    BookingCancellationPaymentService,
    BookingCancellationPaymentInvariantService,
  ],
})
export class StripeBookingPaymentModule {}
