import { forwardRef, Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsModule } from "../system-tests/system-tests.module";
import { SystemTestsIncidentsAdminController } from "./system-tests-incidents.admin.controller";
import { SystemTestsIncidentsReadService } from "./system-tests-incidents-read.service";
import { SystemTestsIncidentsSyncService } from "./system-tests-incidents-sync.service";

@Module({
  imports: [PrismaModule, forwardRef(() => SystemTestsModule)],
  controllers: [SystemTestsIncidentsAdminController],
  providers: [SystemTestsIncidentsSyncService, SystemTestsIncidentsReadService],
  exports: [SystemTestsIncidentsSyncService, SystemTestsIncidentsReadService],
})
export class SystemTestsIncidentsModule {}
