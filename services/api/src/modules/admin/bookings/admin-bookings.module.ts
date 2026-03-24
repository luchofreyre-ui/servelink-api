import { Module } from "@nestjs/common";
import { PrismaModule } from "../../../prisma.module";
import { AdminPermissionsGuard } from "../../../common/admin/admin-permissions.guard";
import { AuthorityModule } from "../../authority/authority.module";
import { AdminBookingsController } from "./admin-bookings.controller";
import { AdminBookingsService } from "./admin-bookings.service";

@Module({
  imports: [PrismaModule, AuthorityModule],
  controllers: [AdminBookingsController],
  providers: [AdminBookingsService, AdminPermissionsGuard],
  exports: [AdminBookingsService],
})
export class AdminBookingsModule {}
