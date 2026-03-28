import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsFamiliesAdminController } from "./system-tests-families.admin.controller";
import { SystemTestsFamiliesReadService } from "./system-tests-families-read.service";
import { SystemTestsFamiliesSyncService } from "./system-tests-families-sync.service";

@Module({
  imports: [PrismaModule],
  controllers: [SystemTestsFamiliesAdminController],
  providers: [SystemTestsFamiliesSyncService, SystemTestsFamiliesReadService],
  exports: [SystemTestsFamiliesSyncService, SystemTestsFamiliesReadService],
})
export class SystemTestsFamiliesModule {}
