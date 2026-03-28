import { forwardRef, Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsFamiliesModule } from "../system-tests-families/system-tests-families.module";
import { SystemTestsIncidentsModule } from "../system-tests-incidents/system-tests-incidents.module";
import { SystemTestsPipelineModule } from "../system-tests-pipeline/system-tests-pipeline.module";
import { SystemTestsIntelligenceAdminController } from "./system-tests-intelligence.admin.controller";
import { SystemTestsIntelligenceIngestionService } from "./system-tests-intelligence-ingestion.service";
import { SystemTestsIntelligencePipelineService } from "./system-tests-intelligence.pipeline";
import { SystemTestsIntelligenceReadService } from "./system-tests-intelligence-read.service";
import { SystemTestsIntelligenceService } from "./system-tests-intelligence.service";

@Module({
  imports: [
    PrismaModule,
    SystemTestsFamiliesModule,
    SystemTestsIncidentsModule,
    forwardRef(() => SystemTestsPipelineModule),
  ],
  controllers: [SystemTestsIntelligenceAdminController],
  providers: [
    SystemTestsIntelligenceIngestionService,
    SystemTestsIntelligenceReadService,
    SystemTestsIntelligenceService,
    SystemTestsIntelligencePipelineService,
  ],
  exports: [
    SystemTestsIntelligenceIngestionService,
    SystemTestsIntelligenceReadService,
    SystemTestsIntelligenceService,
    SystemTestsIntelligencePipelineService,
  ],
})
export class SystemTestsIntelligenceModule {}
