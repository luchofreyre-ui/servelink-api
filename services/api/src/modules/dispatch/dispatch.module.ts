import { Module } from "@nestjs/common";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { FoModule } from "../fo/fo.module";
import { DispatchAdminController } from "./dispatch.admin.controller";
import { DispatchExceptionActionsAdminController } from "./dispatch-exception-actions.admin.controller";
import { DispatchExceptionActionsService } from "./dispatch-exception-actions.service";
import { DispatchExceptionAutomationService } from "./dispatch-exception-automation.service";
import { DispatchExceptionLifecycleService } from "./dispatch-exception-lifecycle.service";
import { DispatchConfigAdminController } from "./dispatch-config.admin.controller";
import { DispatchFoController } from "./dispatch.fo.controller";
import { DispatchFoOfferResponseController } from "./dispatch.fo-offer-response.controller";
import { DispatchService } from "./dispatch.service";
import { DispatchWorker } from "./dispatch.worker";
import { ReputationService } from "./reputation.service";
import { DispatchCandidateService } from "./dispatch-candidate.service";
import { DispatchConfigService } from "./dispatch-config.service";
import { DispatchRankingService } from "./dispatch-ranking.service";
import { ProviderDispatchResolverService } from "./provider-dispatch-resolver.service";
import { DispatchDecisionService } from "../bookings/dispatch-decision.service";
import { BookingTransitionService } from "../bookings/booking-transition.service";
import { DispatchScoringService } from "./dispatch-scoring.service";
import { TrustModule } from "../trust/trust.module";

@Module({
  imports: [FoModule, TrustModule],
  controllers: [
    DispatchAdminController,
    DispatchExceptionActionsAdminController,
    DispatchConfigAdminController,
    DispatchFoController,
    DispatchFoOfferResponseController,
  ],
  providers: [
    AdminPermissionsGuard,
    DispatchExceptionAutomationService,
    DispatchExceptionActionsService,
    DispatchExceptionLifecycleService,
    DispatchService,
    DispatchWorker,
    ReputationService,
    DispatchCandidateService,
    DispatchConfigService,
    DispatchRankingService,
    ProviderDispatchResolverService,
    DispatchDecisionService,
    BookingTransitionService,
    DispatchScoringService,
  ],
  exports: [DispatchService, ReputationService, DispatchConfigService],
})
export class DispatchModule {}
