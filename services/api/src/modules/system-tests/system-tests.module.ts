import { forwardRef, Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsFamiliesModule } from "../system-tests-families/system-tests-families.module";
import { SystemTestsIncidentsModule } from "../system-tests-incidents/system-tests-incidents.module";
import { SystemTestsIntelligenceModule } from "../system-tests-intelligence/system-tests-intelligence.module";
import { SystemTestsPipelineModule } from "../system-tests-pipeline/system-tests-pipeline.module";
import { SystemTestIncidentActionsAdminController } from "./system-test-incident-actions.admin.controller";
import { SystemTestIncidentActionsService } from "./system-test-incident-actions.service";
import { SystemTestIncidentAutomationService } from "./system-test-incident-automation.service";
import { SystemTestIncidentLifecycleService } from "./system-test-incident-lifecycle.service";
import { SystemTestsAdminController } from "./system-tests.admin.controller";
import { SystemTestsFamilyResolutionModule } from "./system-tests-family-resolution.module";
import { SystemTestsService } from "./system-tests.service";

@Module({
  imports: [
    PrismaModule,
    SystemTestsFamilyResolutionModule,
    SystemTestsFamiliesModule,
    forwardRef(() => SystemTestsIncidentsModule),
    forwardRef(() => SystemTestsIntelligenceModule),
    forwardRef(() => SystemTestsPipelineModule),
  ],
  controllers: [
    SystemTestsAdminController,
    SystemTestIncidentActionsAdminController,
  ],
  providers: [
    SystemTestsService,
    SystemTestIncidentAutomationService,
    SystemTestIncidentActionsService,
    SystemTestIncidentLifecycleService,
  ],
  exports: [
    SystemTestsService,
    SystemTestsFamilyResolutionModule,
    SystemTestsIntelligenceModule,
    SystemTestIncidentActionsService,
    SystemTestIncidentLifecycleService,
  ],
})
export class SystemTestsModule {}
