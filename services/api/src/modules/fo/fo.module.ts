import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { FoService } from "./fo.service";
import { ProviderResolverService } from "./provider-resolver.service";
import { FoAdminController } from "./fo.admin.controller";
import { SupplyFranchiseOwnerAdminController } from "./supply-franchise-owner.admin.controller";
import { FoScheduleService } from "../franchise-owner/fo-schedule.service";

@Module({
  imports: [AuthModule],
  providers: [FoService, ProviderResolverService, FoScheduleService],
  controllers: [FoAdminController, SupplyFranchiseOwnerAdminController],
  exports: [FoService, ProviderResolverService, FoScheduleService],
})
export class FoModule {}
