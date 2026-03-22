import { Module } from "@nestjs/common";
import { FoService } from "./fo.service";
import { ProviderResolverService } from "./provider-resolver.service";
import { FoAdminController } from "./fo.admin.controller";
import { FoScheduleService } from "../franchise-owner/fo-schedule.service";

@Module({
  providers: [FoService, ProviderResolverService, FoScheduleService],
  controllers: [FoAdminController],
  exports: [FoService, ProviderResolverService, FoScheduleService],
})
export class FoModule {}
