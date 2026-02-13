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
import { ok, fail } from "../../utils/http";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

@Controller("/api/v1/admin/refunds")
@UseGuards(JwtAuthGuard, AdminGuard)
export class RefundIntentAdminController {
  constructor(
    private readonly db: PrismaService,
    @Optional() @InjectQueue("refunds") private readonly refundsQueue: Queue | null,
  ) {}

  @Post("intents/:id/retry")
  async retry(
    @Req() req: AuthedRequest,
    @Param("id") refundIntentId: string,
    @Body()
    body: { idempotencyKey: string; reason: string; note?: string },
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const idem = String(body?.idempotencyKey ?? "");
    const reason = String(body?.reason ?? "").trim();
    if (!idem) return fail("INVALID_REQUEST", "idempotencyKey is required");
    if (!reason) return fail("INVALID_REQUEST", "reason is required");

    const intent = await this.db.refundIntent.findUnique({ where: { id: refundIntentId } });
    if (!intent) throw new NotFoundException("REFUND_INTENT_NOT_FOUND");

    if (intent.status !== "failed") {
      return fail("INVALID_REQUEST", "Only failed intents can be retried", {
        refundIntentId,
        status: intent.status,
      });
    }

    // Ledger note (idempotent)
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId: intent.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: `ADMIN_REFUND_INTENT_RETRY:${intent.id}:${idem}`,
          note: JSON.stringify({
            type: "ADMIN_REFUND_INTENT_RETRY",
            bookingId: intent.bookingId,
            refundIntentId: intent.id,
            reason,
            note: body?.note ? String(body.note) : null,
            createdByAdminUserId: req.user?.userId ?? null,
            createdAt: new Date().toISOString(),
          }),
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }

    const updated = await this.db.refundIntent.update({
      where: { id: intent.id },
      data: {
        status: "pending_execution",
        stripeRefundId: null, // clear any stale value
      },
    });

    // Re-enqueue if queue enabled
    if (this.refundsQueue) {
      await this.refundsQueue.add(
        "execute_refund_intent",
        { refundIntentId: intent.id },
        {
          attempts: 5,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    return ok({ refundIntent: updated, queued: Boolean(this.refundsQueue) });
  }
}
