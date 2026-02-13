import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Optional,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { BookingEventType } from "@prisma/client";
import type { Queue } from "bullmq";

import { PrismaService } from "../../prisma";
import { ok } from "../../utils/http";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

@Controller("/api/v1/bookings")
@UseGuards(JwtAuthGuard, AdminGuard)
export class BillingRefundsController {
  constructor(
    private readonly db: PrismaService,
    @Optional() @InjectQueue("refunds") private readonly refundsQueue: Queue | null,
  ) {}

  /**
   * Admin records a refund intent (ledger-only).
   * Does NOT call Stripe yet.
   */
  @Post(":id/refunds/intent")
  async createRefundIntent(
    @Req() req: AuthedRequest,
    @Param("id") bookingId: string,
    @Body()
    body: {
      idempotencyKey: string;
      amountCents?: number; // optional: if omitted => full refund intent
      reason: string;
      note?: string;
    },
  ) {
    const role = req.user?.role;
    const userId = req.user?.userId;
    if (!role || !userId) throw new ForbiddenException("UNAUTHENTICATED");
    if (role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const idem = String(body?.idempotencyKey ?? "");
    if (!idem) throw new ForbiddenException("IDEMPOTENCY_KEY_REQUIRED");

    const reason = String(body?.reason ?? "").trim();
    if (!reason) throw new ForbiddenException("REASON_REQUIRED");

    const booking = await this.db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const amountCentsRaw = body?.amountCents;
    const amountCents =
      typeof amountCentsRaw === "number" && Number.isFinite(amountCentsRaw) && amountCentsRaw > 0
        ? Math.floor(amountCentsRaw)
        : null;

    // Operational record (efficient, queryable). Idempotent by idempotencyKey.
    let createdId: string | null = null;
    try {
      const created = await this.db.refundIntent.create({
        data: {
          bookingId,
          amountCents,
          reason,
          note: body?.note ? String(body.note) : null,
          status: "pending_execution",
          idempotencyKey: `ADMIN_REFUND_INTENT:${bookingId}:${idem}`,
          createdByAdminUserId: userId,
        },
      });
      createdId = created.id;
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
      // If intent already exists, skip enqueue (cron/manual reconcile can pick it up).
    }

    // Fire-and-forget queue job (worker will execute refund by exact RefundIntent id).
    if (this.refundsQueue && createdId) {
      await this.refundsQueue.add(
        "execute_refund_intent",
        { refundIntentId: createdId },
        {
          attempts: 5,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    // Optional: ensure a successful payment exists before refund intent (still allow intent even if not)
    const stripePtr = await this.db.bookingStripePayment.findUnique({ where: { bookingId } });

    // Append immutable instruction
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: `ADMIN_REFUND_INTENT:${bookingId}:${idem}`,
          note: JSON.stringify({
            type: "ADMIN_REFUND_INTENT",
            bookingId,
            paymentIntentId: stripePtr?.stripePaymentIntentId ?? null,
            amountCents, // null => full refund intent
            reason,
            note: body?.note ? String(body.note) : null,
            createdByAdminUserId: userId,
            createdAt: new Date().toISOString(),
            status: "pending_execution",
          }),
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }

    return ok({});
  }
}
