import { Module } from "@nestjs/common";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { BookingEventsService } from "./booking-events.service";
import { BillingModule } from "../billing/billing.module";
import { EstimateModule } from "../estimate/estimate.module";
import { FoModule } from "../fo/fo.module";
import { LedgerModule } from "../ledger/ledger.module";

@Module({
  imports: [BillingModule, EstimateModule, FoModule, LedgerModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingEventsService],
  exports: [BookingsService],
})
export class BookingsModule {}
