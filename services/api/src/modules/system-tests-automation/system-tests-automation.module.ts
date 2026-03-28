import { forwardRef, Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsModule } from "../system-tests/system-tests.module";
import { SystemTestsPipelineModule } from "../system-tests-pipeline/system-tests-pipeline.module";
import { SystemTestsAutomationController } from "./system-tests-automation.controller";
import { SystemTestsAutomationScheduler } from "./system-tests-automation.scheduler";
import { SystemTestsAutomationService } from "./system-tests-automation.service";
import { SystemTestsDeliveryService } from "./system-tests-delivery.service";
import { SystemTestsReportJobsService } from "./system-tests-report-jobs.service";

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => SystemTestsModule),
    forwardRef(() => SystemTestsPipelineModule),
  ],
  controllers: [SystemTestsAutomationController],
  providers: [
    SystemTestsAutomationService,
    SystemTestsReportJobsService,
    SystemTestsDeliveryService,
    SystemTestsAutomationScheduler,
  ],
  exports: [SystemTestsAutomationService],
})
export class SystemTestsAutomationModule {}
