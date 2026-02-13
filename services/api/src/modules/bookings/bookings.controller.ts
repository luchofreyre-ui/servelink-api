import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { BillingService } from "../billing/billing.service";
import { BookingsService } from "./bookings.service";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { TransitionBookingDto } from "./dto/transition-booking.dto";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/bookings")
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly billing: BillingService,
  ) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.createBooking({
      customerId: String(req.user.userId),
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.bookings.getBooking(id);
  }

  @Get(":id/events")
  async events(@Param("id") id: string) {
    return this.bookings.getEvents(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(":id/billing")
  async getBillingSummary(@Param("id") id: string) {
    return this.billing.summarizeBooking({ bookingId: id });
  }

  @Post(":id/billing/finalize")
  async finalizeBilling(
    @Param("id") id: string,
    @Body() body: { idempotencyKey: string },
  ) {
    return this.billing.finalizeBookingBilling({
      bookingId: id,
      idempotencyKey: String(body?.idempotencyKey ?? ""),
    });
  }

  // -----------------------------
  // Admin: set job site location
  // -----------------------------
  @UseGuards(AdminGuard)
  @Post(":id/site")
  async setSite(
    @Param("id") id: string,
    @Body()
    body: {
      siteLat: number;
      siteLng: number;
      geofenceRadiusMeters?: number;
    },
  ) {
    return this.bookings.setSiteLocation({
      id,
      siteLat: body.siteLat,
      siteLng: body.siteLng,
      geofenceRadiusMeters: body.geofenceRadiusMeters,
    });
  }

  @Post(":id/schedule")
  async schedule(
    @Param("id") id: string,
    @Body() dto: TransitionBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: "schedule",
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Post(":id/start")
  async start(
    @Param("id") id: string,
    @Body() dto: TransitionBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: "start",
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Post(":id/complete")
  async complete(
    @Param("id") id: string,
    @Body() dto: TransitionBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: "complete",
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Post(":id/cancel")
  async cancel(
    @Param("id") id: string,
    @Body() dto: TransitionBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: "cancel",
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }
}
