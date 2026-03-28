import { BullModule } from "@nestjs/bullmq";
import { forwardRef, Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsAutomationModule } from "../system-tests-automation/system-tests-automation.module";
import { SystemTestsFamiliesModule } from "../system-tests-families/system-tests-families.module";
import { SystemTestsIncidentsModule } from "../system-tests-incidents/system-tests-incidents.module";
import { SystemTestsIntelligenceModule } from "../system-tests-intelligence/system-tests-intelligence.module";
import { SystemTestsModule } from "../system-tests/system-tests.module";
import { SystemTestsPipelineAnalysisProcessor } from "./system-tests-pipeline-analysis.processor";
import { SystemTestsPipelineAutomationProcessor } from "./system-tests-pipeline-automation.processor";
import { SystemTestsPipelineAdminController } from "./system-tests-pipeline.admin.controller";
import { SystemTestsPipelineJobsService } from "./system-tests-pipeline-jobs.service";
import { SystemTestsPipelineService } from "./system-tests-pipeline.service";

const enableQueue = Boolean(process.env.REDIS_HOST || process.env.REDIS_URL);

@Module({
  imports: [
    PrismaModule,
    SystemTestsFamiliesModule,
    forwardRef(() => SystemTestsIncidentsModule),
    forwardRef(() => SystemTestsIntelligenceModule),
    forwardRef(() => SystemTestsAutomationModule),
    forwardRef(() => SystemTestsModule),
    ...(enableQueue
      ? [
          BullModule.registerQueue({ name: "system-test-analysis" }),
          BullModule.registerQueue({ name: "system-test-automation" }),
        ]
      : []),
  ],
  controllers: [SystemTestsPipelineAdminController],
  providers: [
    SystemTestsPipelineJobsService,
    SystemTestsPipelineService,
    ...(enableQueue
      ? [
          SystemTestsPipelineAnalysisProcessor,
          SystemTestsPipelineAutomationProcessor,
        ]
      : []),
  ],
  exports: [SystemTestsPipelineService, SystemTestsPipelineJobsService],
})
export class SystemTestsPipelineModule {}
