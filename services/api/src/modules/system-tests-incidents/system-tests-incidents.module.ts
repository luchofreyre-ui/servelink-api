import { forwardRef, Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsFamiliesModule } from "../system-tests-families/system-tests-families.module";
import { SystemTestsFamilyResolutionModule } from "../system-tests/system-tests-family-resolution.module";
import { SystemTestsModule } from "../system-tests/system-tests.module";
import { SystemTestsIncidentsAdminController } from "./system-tests-incidents.admin.controller";
import { SystemTestsIncidentsReadService } from "./system-tests-incidents-read.service";
import { SystemTestsIncidentsSyncService } from "./system-tests-incidents-sync.service";

@Module({
  imports: [
    PrismaModule,
    SystemTestsFamiliesModule,
    SystemTestsFamilyResolutionModule,
    forwardRef(() => SystemTestsModule),
  ],
  controllers: [SystemTestsIncidentsAdminController],
  providers: [SystemTestsIncidentsSyncService, SystemTestsIncidentsReadService],
  exports: [SystemTestsIncidentsSyncService, SystemTestsIncidentsReadService],
})
export class SystemTestsIncidentsModule {}
