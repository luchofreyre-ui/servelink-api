import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { BookingsModule } from "../bookings/bookings.module";
import { StripeBookingPaymentModule } from "../bookings/stripe/stripe-booking-payment.module";
import { FoModule } from "../fo/fo.module";
import { SlotHoldsModule } from "../slot-holds/slot-holds.module";
import { PublicBookingDepositService } from "./public-booking-deposit.service";
import { PublicBookingOrchestratorController } from "./public-booking-orchestrator.controller";
import { PublicBookingOrchestratorService } from "./public-booking-orchestrator.service";

@Module({
  imports: [PrismaModule, SlotHoldsModule, BookingsModule, FoModule, StripeBookingPaymentModule],
  controllers: [PublicBookingOrchestratorController],
  providers: [PublicBookingOrchestratorService, PublicBookingDepositService],
  exports: [PublicBookingOrchestratorService],
})
export class PublicBookingOrchestratorModule {}
