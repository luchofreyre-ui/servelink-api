import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "../../../auth/jwt-auth.guard";
import { AdminGuard } from "../../../guards/admin.guard";
import { AdminPermissions } from "../../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../../common/admin/admin-permissions.guard";
import { AdminBookingsService } from "./admin-bookings.service";
import { UpdateOperatorNoteDto } from "./dto/update-operator-note.dto";
import { ReassignBookingDto } from "./dto/reassign-booking.dto";

type AuthenticatedRequest = Request & {
  user?: {
    userId?: string;
  };
};

@Controller("api/v1/admin/bookings")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class AdminBookingsController {
  constructor(private readonly adminBookings: AdminBookingsService) {}

  @Get(":bookingId/command-center")
  @AdminPermissions("exceptions.read")
  async getCommandCenter(@Param("bookingId") bookingId: string) {
    return this.adminBookings.getCommandCenter(bookingId);
  }

  @Get(":bookingId/operational-detail")
  @AdminPermissions("exceptions.read")
  async getBookingOperationalDetail(@Param("bookingId") bookingId: string) {
    return this.adminBookings.getBookingOperationalDetail(bookingId);
  }

  @Patch(":bookingId/operator-note")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.write")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async updateOperatorNote(
    @Param("bookingId") bookingId: string,
    @Body() dto: UpdateOperatorNoteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException("Missing admin user");
    }
    return this.adminBookings.updateOperatorNote(adminUserId, bookingId, dto.note);
  }

  @Post(":bookingId/hold")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.write")
  async hold(@Param("bookingId") bookingId: string, @Req() req: AuthenticatedRequest) {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException("Missing admin user");
    }
    return this.adminBookings.holdBooking(adminUserId, bookingId);
  }

  @Post(":bookingId/review")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.write")
  async review(@Param("bookingId") bookingId: string, @Req() req: AuthenticatedRequest) {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException("Missing admin user");
    }
    return this.adminBookings.markBookingInReview(adminUserId, bookingId);
  }

  @Post(":bookingId/approve")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.write")
  async approve(@Param("bookingId") bookingId: string, @Req() req: AuthenticatedRequest) {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException("Missing admin user");
    }
    return this.adminBookings.approveBooking(adminUserId, bookingId);
  }

  @Post(":bookingId/reassign")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.write")
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async reassign(
    @Param("bookingId") bookingId: string,
    @Body() dto: ReassignBookingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminUserId = req.user?.userId;
    if (!adminUserId) {
      throw new UnauthorizedException("Missing admin user");
    }
    return this.adminBookings.reassignBooking(adminUserId, bookingId, dto);
  }
}
