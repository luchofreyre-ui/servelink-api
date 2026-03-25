import { Module } from "@nestjs/common";

import { PrismaModule } from "../../prisma.module";
import { SystemTestsAdminController } from "./system-tests.admin.controller";
import { SystemTestsService } from "./system-tests.service";

@Module({
  imports: [PrismaModule],
  controllers: [SystemTestsAdminController],
  providers: [SystemTestsService],
  exports: [SystemTestsService],
})
export class SystemTestsModule {}
