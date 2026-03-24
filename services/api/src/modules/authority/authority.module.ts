import { Module } from "@nestjs/common";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { BookingIntelligenceService } from "./booking-intelligence.service";
import { AuthorityAdminController } from "./authority.admin.controller";
import { BookingAuthorityPersistenceService } from "./booking-authority-persistence.service";
import { BookingAuthorityReportingService } from "./booking-authority-reporting.service";
import { BookingAuthorityMismatchService } from "./booking-authority-mismatch.service";
import { BookingAuthorityQualityService } from "./booking-authority-quality.service";
import { BookingAuthorityDriftService } from "./booking-authority-drift.service";
import { BookingAuthorityAlertService } from "./booking-authority-alert.service";
import { BookingAuthorityRecomputeService } from "./booking-authority-recompute.service";
import { BookingAuthorityLearningExportService } from "./booking-authority-learning-export.service";
import { FoAuthorityKnowledgeController } from "./fo-authority-knowledge.controller";
import { FoAuthorityKnowledgeLinkService } from "./fo-authority-knowledge-link.service";
import { FoAuthorityKnowledgeFeedbackService } from "./fo-authority-knowledge-feedback.service";
import { BookingAuthorityUnmappedTagsService } from "./booking-authority-unmapped-tags.service";

@Module({
  providers: [
    BookingIntelligenceService,
    BookingAuthorityPersistenceService,
    BookingAuthorityReportingService,
    BookingAuthorityMismatchService,
    BookingAuthorityQualityService,
    BookingAuthorityDriftService,
    BookingAuthorityAlertService,
    BookingAuthorityRecomputeService,
    BookingAuthorityLearningExportService,
    FoAuthorityKnowledgeLinkService,
    FoAuthorityKnowledgeFeedbackService,
    BookingAuthorityUnmappedTagsService,
    AdminPermissionsGuard,
  ],
  controllers: [AuthorityAdminController, FoAuthorityKnowledgeController],
  exports: [
    BookingIntelligenceService,
    BookingAuthorityPersistenceService,
    BookingAuthorityMismatchService,
  ],
})
export class AuthorityModule {}
