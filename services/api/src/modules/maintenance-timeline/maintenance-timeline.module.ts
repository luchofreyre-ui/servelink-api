import { Module } from "@nestjs/common";
import { MaintenanceTimelineAdminController } from "./maintenance-timeline.admin.controller";
import { MaintenanceTimelineService } from "./maintenance-timeline.service";

@Module({
  controllers: [MaintenanceTimelineAdminController],
  providers: [MaintenanceTimelineService],
  exports: [MaintenanceTimelineService],
})
export class MaintenanceTimelineModule {}
