import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { AdminActivityController } from "./admin-activity.controller";
import { AdminActivityService } from "./admin-activity.service";
import { AdminAnomaliesService } from "./admin-anomalies.service";
import { AdminAnomaliesController } from "./admin-anomalies.controller";

@Module({
  imports: [PrismaModule],
  controllers: [AdminActivityController, AdminAnomaliesController],
  providers: [
    AdminActivityService,
    AdminPermissionsGuard,
    AdminAnomaliesService,
  ],
})
export class AdminModule {}
