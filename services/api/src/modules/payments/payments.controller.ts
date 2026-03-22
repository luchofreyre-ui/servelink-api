import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PrismaService } from "../../prisma";
import { PaymentOrchestrationService } from "./payment-orchestration.service";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

@Controller("/api/v1/payments")
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(
    private readonly paymentOrchestrationService: PaymentOrchestrationService,
    private readonly prisma: PrismaService,
  ) {}

  private async assertCanAccessBooking(
    req: AuthedRequest,
    bookingId: string,
  ): Promise<void> {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!role || !userId) {
      throw new ForbiddenException("UNAUTHENTICATED");
    }
    if (role === "fo") {
      throw new ForbiddenException("FORBIDDEN");
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: { customerId: true },
    });
    if (!booking) {
      throw new ForbiddenException("BOOKING_NOT_FOUND");
    }
    if (role === "customer" && booking.customerId !== userId) {
      throw new ForbiddenException("FORBIDDEN");
    }
  }

  @Post("bookings/:bookingId/intent")
  async createIntent(
    @Req() req: AuthedRequest,
    @Param("bookingId") bookingId: string,
  ) {
    await this.assertCanAccessBooking(req, bookingId);
    return this.paymentOrchestrationService.createPaymentIntentForBooking(
      bookingId,
    );
  }

  @Post("bookings/:bookingId/confirm")
  async confirm(
    @Req() req: AuthedRequest,
    @Param("bookingId") bookingId: string,
    @Body("paymentIntentId") paymentIntentId: string,
  ) {
    await this.assertCanAccessBooking(req, bookingId);
    if (!paymentIntentId || typeof paymentIntentId !== "string") {
      throw new BadRequestException("paymentIntentId required");
    }
    return this.paymentOrchestrationService.confirmPaid({
      bookingId,
      paymentIntentId: paymentIntentId.trim(),
    });
  }

  @Post("bookings/:bookingId/fail")
  async fail(
    @Req() req: AuthedRequest,
    @Param("bookingId") bookingId: string,
    @Body("detail") detail: string,
  ) {
    await this.assertCanAccessBooking(req, bookingId);
    return this.paymentOrchestrationService.markPaymentFailure({
      bookingId,
      detail: detail != null ? String(detail) : "",
    });
  }
}
