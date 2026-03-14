import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { BillingService } from "../billing/billing.service";
import { DispatchService } from "../dispatch/dispatch.service";
import { SlotAvailabilityService } from "../slot-holds/slot-availability.service";
import { SlotHoldsService } from "../slot-holds/slot-holds.service";
import { BookingsService } from "./bookings.service";
import { AssignBookingDto } from "./dto/assign-booking.dto";
import { AvailabilityWindowsQueryDto } from "./dto/availability-windows-query.dto";
import { ConfirmHoldParamsDto } from "./dto/confirm-hold-params.dto";
import { CreateBookingDto } from "./dto/create-booking.dto";
import { CreateSlotHoldDto } from "./dto/create-slot-hold.dto";
import { TransitionBookingDto } from "./dto/transition-booking.dto";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/bookings")
export class BookingsController {
  constructor(
    private readonly bookings: BookingsService,
    private readonly billing: BillingService,
    private readonly dispatch: DispatchService,
    private readonly slotAvailability: SlotAvailabilityService,
    private readonly slotHolds: SlotHoldsService,
  ) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() dto: CreateBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.createBooking({
      customerId: String(req.user.userId),
      estimateInput: dto.estimateInput as any,
      note: dto.note,
      idempotencyKey: idempotencyKey ?? null,
    });
  }

  @Get("availability/windows")
  async listAvailabilityWindows(@Query() query: AvailabilityWindowsQueryDto) {
    return this.slotAvailability.listAvailableWindows(query);
  }

  @Post("availability/holds")
  async createSlotHold(@Body() dto: CreateSlotHoldDto) {
    return this.slotHolds.createHold({
      bookingId: dto.bookingId,
      foId: dto.foId,
      startAt: dto.startAt,
      endAt: dto.endAt,
    });
  }

  @Post(":id/confirm-hold")
  async confirmHold(
    @Param() params: ConfirmHoldParamsDto,
    @Body()
    body: {
      holdId: string;
      note?: string;
    },
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.confirmBookingFromHold({
      bookingId: params.id,
      holdId: String(body?.holdId ?? "").trim(),
      note: body?.note,
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
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

  private normalizeIdempotencyKey(raw: string | undefined): string | null {
    const s = raw != null ? String(raw).trim() : "";
    return s || null;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(":id/assign")
  async assign(
    @Param("id") id: string,
    @Body() dto: AssignBookingDto,
    @Headers("idempotency-key") idempotencyKey?: string,
  ) {
    return this.bookings.assignBooking({
      bookingId: id,
      foId: dto.foId,
      note: dto.note,
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(":id/offers/:offerId/accept")
  async acceptOffer(
    @Param("id") id: string,
    @Param("offerId") offerId: string,
  ) {
    return this.dispatch.acceptOfferForBooking({
      bookingId: id,
      offerId,
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
      scheduledStart: dto.scheduledStart,
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
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
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
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
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
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
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(":id/reopen")
  async reopen(
    @Param("id") id: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() body: { note?: string } = {},
  ) {
    return this.bookings.transitionBooking({
      id,
      transition: "reopen",
      note: body?.note,
      idempotencyKey: this.normalizeIdempotencyKey(idempotencyKey),
    });
  }
}
