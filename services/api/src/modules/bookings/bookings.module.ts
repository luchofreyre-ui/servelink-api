import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { FoModule } from "../fo/fo.module";
import { DispatchModule } from "../dispatch/dispatch.module";
import { BillingModule } from "../billing/billing.module";
import { EstimateModule } from "../estimate/estimate.module";
import { LedgerModule } from "../ledger/ledger.module";
import { SlotHoldsModule } from "../slot-holds/slot-holds.module";
import { BookingsController } from "./bookings.controller";
import { AdminDispatchOpsController } from "./admin-dispatch-ops.controller";
import { BookingsService } from "./bookings.service";
import { BookingEventsService } from "./booking-events.service";
import { DispatchDecisionService } from "./dispatch-decision.service";
import { DispatchOpsService } from "./dispatch-ops.service";
import { BookingDispatchControlService } from "./booking-dispatch-control.service";
import { BookingReviewControlService } from "./booking-review-control.service";
import { ExecutionService } from "../execution/execution.service";
import { PricingService } from "../pricing/pricing.service";
import { TrustModule } from "../trust/trust.module";
import { FinancialModule } from "../financial/financial.module";

@Module({
  imports: [
    PrismaModule,
    FoModule,
    DispatchModule,
    BillingModule,
    EstimateModule,
    LedgerModule,
    SlotHoldsModule,
    TrustModule,
    FinancialModule,
  ],
  controllers: [BookingsController, AdminDispatchOpsController],
  providers: [
    BookingsService,
    BookingEventsService,
    DispatchDecisionService,
    DispatchOpsService,
    BookingDispatchControlService,
    BookingReviewControlService,
    PricingService,
    ExecutionService,
  ],
  exports: [
    BookingsService,
    BookingEventsService,
    DispatchDecisionService,
    DispatchOpsService,
    BookingDispatchControlService,
    BookingReviewControlService,
    ExecutionService,
  ],
})
export class BookingsModule {}
