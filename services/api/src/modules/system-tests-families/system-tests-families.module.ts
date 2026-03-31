import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsFamilyResolutionModule } from "../system-tests/system-tests-family-resolution.module";
import { SystemTestsFamiliesAdminController } from "./system-tests-families.admin.controller";
import { SystemTestsFamilyLifecycleService } from "./system-tests-family-lifecycle.service";
import { SystemTestsFamilyOperatorStateService } from "./system-tests-family-operator-state.service";
import { SystemTestsFamiliesReadService } from "./system-tests-families-read.service";
import { SystemTestsFamiliesSyncService } from "./system-tests-families-sync.service";

@Module({
  imports: [PrismaModule, SystemTestsFamilyResolutionModule],
  controllers: [SystemTestsFamiliesAdminController],
  providers: [
    SystemTestsFamiliesSyncService,
    SystemTestsFamiliesReadService,
    SystemTestsFamilyOperatorStateService,
    SystemTestsFamilyLifecycleService,
  ],
  exports: [
    SystemTestsFamiliesSyncService,
    SystemTestsFamiliesReadService,
    SystemTestsFamilyOperatorStateService,
    SystemTestsFamilyLifecycleService,
  ],
})
export class SystemTestsFamiliesModule {}
