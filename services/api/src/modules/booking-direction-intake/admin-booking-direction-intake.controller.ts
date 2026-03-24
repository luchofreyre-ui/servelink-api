import { Controller, Get, Header, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { BookingDirectionIntakeService } from "./booking-direction-intake.service";

@Controller("/api/v1/admin/booking-direction-intakes")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
@AdminPermissions("audit.read")
export class AdminBookingDirectionIntakeController {
  constructor(private readonly intakes: BookingDirectionIntakeService) {}

  @Get()
  @Header("Cache-Control", "private, no-store, max-age=0, must-revalidate")
  list(
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;
    const limitNum =
      parsedLimit != null && Number.isFinite(parsedLimit)
        ? Math.min(Math.max(parsedLimit, 1), 100)
        : 50;
    const offsetNum =
      parsedOffset != null && Number.isFinite(parsedOffset) && parsedOffset >= 0
        ? parsedOffset
        : 0;

    return this.intakes.listForAdmin({ limit: limitNum, offset: offsetNum });
  }
}
