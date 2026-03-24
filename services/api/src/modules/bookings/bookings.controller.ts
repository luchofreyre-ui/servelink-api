import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { BillingService } from "../billing/billing.service";
import { DispatchService } from "../dispatch/dispatch.service";
import { SlotAvailabilityService } from "../slot-holds/slot-availability.service";
import { SlotHoldsService } from "../slot-holds/slot-holds.service";
import { DispatchDecisionService } from "./dispatch-decision.service";
import { PrismaService } from "../../prisma";
import { BookingsService } from "./bookings.service";
import { DeepCleanVisitExecutionService } from "./deep-clean-visit-execution.service";
import { CompleteDeepCleanVisitDto } from "./dto/deep-clean-visit-execution.dto";
import { BookingScreenService } from "./booking-screen.service";
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
    private readonly dispatchDecisionService: DispatchDecisionService,
    private readonly slotAvailability: SlotAvailabilityService,
    private readonly slotHolds: SlotHoldsService,
    private readonly prisma: PrismaService,
    private readonly bookingScreens: BookingScreenService,
    private readonly deepCleanVisitExecution: DeepCleanVisitExecutionService,
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

  @Get(":id/status")
  async getStatus(@Param("id") id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        scheduledStart: true,
        startedAt: true,
        completedAt: true,
        paymentStatus: true,
        paymentIntentId: true,
        quotedSubtotal: true,
        quotedMargin: true,
        quotedTotal: true,
      },
    });
  }

  @Get(":id/screen")
  async getScreen(@Param("id") id: string, @Req() req: any) {
    await this.bookingScreens.assertCanViewBooking(
      {
        userId: String(req.user?.userId ?? ""),
        role: String(req.user?.role ?? ""),
      },
      id,
    );
    const role = String(req.user?.role ?? "");
    const screen = await this.bookingScreens.buildBookingScreen(id, {
      includeFoKnowledgeLinks: role === "fo",
      includeCustomerAuthorityEducation: role === "customer",
    });
    return { kind: "booking_screen" as const, screen };
  }

  @Post(":id/deep-clean/visits/:visitNumber/start")
  async startDeepCleanVisit(
    @Param("id") id: string,
    @Param("visitNumber", ParseIntPipe) visitNumber: number,
    @Req() req: { user?: { userId?: string; role?: string } },
  ) {
    await this.bookingScreens.assertCanViewBooking(
      {
        userId: String(req.user?.userId ?? ""),
        role: String(req.user?.role ?? ""),
      },
      id,
    );
    const execution = await this.deepCleanVisitExecution.startVisit({
      bookingId: id,
      visitNumber,
      actorUserId: String(req.user?.userId ?? "").trim() || null,
    });
    return {
      kind: "deep_clean_visit_started" as const,
      execution,
    };
  }

  @Post(":id/deep-clean/visits/:visitNumber/complete")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async completeDeepCleanVisit(
    @Param("id") id: string,
    @Param("visitNumber", ParseIntPipe) visitNumber: number,
    @Body() body: CompleteDeepCleanVisitDto,
    @Req() req: { user?: { userId?: string; role?: string } },
  ) {
    await this.bookingScreens.assertCanViewBooking(
      {
        userId: String(req.user?.userId ?? ""),
        role: String(req.user?.role ?? ""),
      },
      id,
    );
    const execution = await this.deepCleanVisitExecution.completeVisit({
      bookingId: id,
      visitNumber,
      actualDurationMinutes:
        body.actualDurationMinutes === undefined
          ? null
          : body.actualDurationMinutes,
      operatorNote:
        body.operatorNote === undefined ? null : body.operatorNote,
      actorUserId: String(req.user?.userId ?? "").trim() || null,
    });
    return {
      kind: "deep_clean_visit_completed" as const,
      execution,
    };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return this.bookings.getBooking(id);
  }

  @Get(":id/events")
  async events(@Param("id") id: string) {
    return this.bookings.getEvents(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
  @AdminPermissions("exceptions.read")
  @Get(":id/dispatch-timeline")
  async getDispatchTimeline(@Param("id") id: string) {
    return this.dispatchDecisionService.getBookingDispatchTimeline(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
  @AdminPermissions("exceptions.read")
  @Get(":id/dispatch-exception-detail")
  async getDispatchExceptionDetail(@Param("id") id: string) {
    return this.dispatchDecisionService.getDispatchExceptionDetail(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
  @AdminPermissions("dispatch.read")
  @Get(":id/dispatch-explainer")
  async getDispatchExplainer(@Param("id") id: string) {
    return this.dispatchDecisionService.getDispatchExplainer(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
  @AdminPermissions("exceptions.write")
  @Post(":id/dispatch-operator-notes")
  async addDispatchOperatorNote(
    @Param("id") id: string,
    @Body() body: { adminUserId?: string | null; note?: string | null },
  ) {
    return this.dispatchDecisionService.addOperatorNote({
      bookingId: id,
      adminUserId: body.adminUserId ?? null,
      note: body.note ?? "",
    });
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
