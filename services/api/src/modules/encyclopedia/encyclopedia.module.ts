import { Module } from "@nestjs/common";
import { AuthModule } from "../../auth/auth.module";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { EncyclopediaAdminService } from "./admin/encyclopedia-admin.service";
import { EncyclopediaController } from "./encyclopedia.controller";
import { EncyclopediaService } from "./encyclopedia.service";
import { ReviewController } from "./review/review.controller";

@Module({
  imports: [AuthModule],
  controllers: [ReviewController, EncyclopediaController],
  providers: [
    EncyclopediaService,
    EncyclopediaAdminService,
    AdminGuard,
    AdminPermissionsGuard,
  ],
  exports: [EncyclopediaService],
})
export class EncyclopediaModule {}
