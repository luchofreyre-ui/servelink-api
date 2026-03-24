import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { FoModule } from "../fo/fo.module";
import { DispatchModule } from "../dispatch/dispatch.module";
import { BillingModule } from "../billing/billing.module";
import { EstimateModule } from "../estimate/estimate.module";
import { LedgerModule } from "../ledger/ledger.module";
import { SlotHoldsModule } from "../slot-holds/slot-holds.module";
import { PublicBookingConfirmationController } from "./public-booking-confirmation.controller";
import { BookingsController } from "./bookings.controller";
import { AdminDispatchOpsController } from "./admin-dispatch-ops.controller";
import { BookingsService } from "./bookings.service";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { DeepCleanAnalyticsAdminController } from "./deep-clean-analytics.admin.controller";
import { DeepCleanAnalyticsService } from "./deep-clean-analytics.service";
import { DeepCleanCalibrationReviewService } from "./deep-clean-calibration-review.service";
import { DeepCleanInsightsService } from "./deep-clean-insights.service";
import { DeepCleanEstimatorImpactService } from "./deep-clean-estimator-impact.service";
import { DeepCleanCalibrationService } from "./deep-clean-calibration.service";
import { DeepCleanVisitExecutionService } from "./deep-clean-visit-execution.service";
import { BookingScreenService } from "./booking-screen.service";
import { CustomerScreenController } from "./customer-screen.controller";
import { FoScreenController } from "./fo-screen.controller";
import { BookingEventsService } from "./booking-events.service";
import { DispatchDecisionService } from "./dispatch-decision.service";
import { DispatchOpsService } from "./dispatch-ops.service";
import { BookingDispatchControlService } from "./booking-dispatch-control.service";
import { BookingReviewControlService } from "./booking-review-control.service";
import { ExecutionService } from "../execution/execution.service";
import { TrustModule } from "../trust/trust.module";
import { FinancialModule } from "../financial/financial.module";
import { DeepCleanEstimatorConfigModule } from "./deep-clean-estimator-config.module";
import { DeepCleanEstimatorConfigAdminController } from "./deep-clean-estimator-config.admin.controller";
import { AuthorityModule } from "../authority/authority.module";

@Module({
  imports: [
    PrismaModule,
    AuthorityModule,
    FoModule,
    DispatchModule,
    BillingModule,
    DeepCleanEstimatorConfigModule,
    EstimateModule,
    LedgerModule,
    SlotHoldsModule,
    TrustModule,
    FinancialModule,
  ],
  controllers: [
    BookingsController,
    PublicBookingConfirmationController,
    AdminDispatchOpsController,
    DeepCleanAnalyticsAdminController,
    DeepCleanEstimatorConfigAdminController,
    CustomerScreenController,
    FoScreenController,
  ],
  providers: [
    AdminPermissionsGuard,
    DeepCleanAnalyticsService,
    DeepCleanCalibrationReviewService,
    DeepCleanInsightsService,
    DeepCleanEstimatorImpactService,
    DeepCleanCalibrationService,
    DeepCleanVisitExecutionService,
    BookingScreenService,
    BookingsService,
    BookingEventsService,
    DispatchDecisionService,
    DispatchOpsService,
    BookingDispatchControlService,
    BookingReviewControlService,
    ExecutionService,
  ],
  exports: [
    BookingsService,
    BookingEventsService,
    BookingScreenService,
    DispatchDecisionService,
    DispatchOpsService,
    BookingDispatchControlService,
    BookingReviewControlService,
    ExecutionService,
  ],
})
export class BookingsModule {}
