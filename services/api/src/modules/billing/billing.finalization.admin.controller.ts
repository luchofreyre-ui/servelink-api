import {
  Body,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { BookingEventType } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { ok, fail } from "../../utils/http";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { BillingService } from "./billing.service";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

@Controller("/api/v1/admin/billing")
@UseGuards(JwtAuthGuard, AdminGuard)
export class BillingFinalizationAdminController {
  constructor(
    private readonly db: PrismaService,
    private readonly billing: BillingService,
  ) {}

  @Post("bookings/:id/refinalize")
  async refinalize(
    @Req() req: AuthedRequest,
    @Param("id") bookingId: string,
    @Body()
    body: {
      idempotencyKey: string;
      reason: string;
      note?: string;
    },
  ) {
    if (req.user?.role !== "admin") throw new ForbiddenException("FORBIDDEN");

    const idem = String(body?.idempotencyKey ?? "");
    const reason = String(body?.reason ?? "").trim();
    if (!idem) return fail("INVALID_REQUEST", "idempotencyKey is required");
    if (!reason) return fail("INVALID_REQUEST", "reason is required");

    const booking = await this.db.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const ptr = await this.db.bookingStripePayment.findUnique({ where: { bookingId } });

    // If PI exists and is succeeded, do not allow re-finalization (money truth already charged).
    if (ptr?.status === "succeeded") {
      return fail(
        "INVALID_REQUEST",
        "Cannot re-finalize after payment has succeeded. Use adjustment/refund workflow.",
        { bookingId, stripePaymentIntentId: ptr.stripePaymentIntentId, status: ptr.status },
      );
    }

    // Compute current totals and create a NEW finalization key boundary
    // BillingService finalize already writes BookingBillingFinalization; we force a new key.
    const finalizationKey = `ADMIN_REFINALIZE:${bookingId}:${idem}`;

    // Ledger: intent
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: `ADMIN_REFINALIZE_INTENT:${bookingId}:${idem}`,
          note: JSON.stringify({
            type: "ADMIN_REFINALIZE_INTENT",
            bookingId,
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

    // Perform finalize with a new idempotency boundary
    const result: any = await this.billing.finalizeBookingBilling({
      bookingId,
      idempotencyKey: finalizationKey,
    } as any);

    // Force-update finalization record ONLY if PI not succeeded:
    // Replace the existing BookingBillingFinalization with the new numbers under a new idempotencyKey.
    // This is an explicit admin override, and we ledger it.
    const existing = await this.db.bookingBillingFinalization.findUnique({ where: { bookingId } });
    if (!existing) throw new NotFoundException("BILLING_FINALIZATION_NOT_FOUND");

    // We allow overwrite here because it's explicitly admin-driven and gated above.
    const updated = await this.db.bookingBillingFinalization.update({
      where: { bookingId },
      data: {
        totalBillableMin: result.totalBillableMin ?? existing.totalBillableMin,
        totalBillableCents: result.totalBillableCents ?? existing.totalBillableCents,
        minimumCents: result.minimumCents ?? existing.minimumCents,
        finalBillableCents: result.finalBillableCents ?? existing.finalBillableCents,
        idempotencyKey: `BILLING_FINALIZED:${bookingId}:${finalizationKey}`,
      },
    });

    // Ledger: executed
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: `ADMIN_REFINALIZE_EXECUTED:${bookingId}:${idem}`,
          note: JSON.stringify({
            type: "ADMIN_REFINALIZE_EXECUTED",
            bookingId,
            reason,
            finalBillableCents: updated.finalBillableCents,
            createdByAdminUserId: req.user?.userId ?? null,
            createdAt: new Date().toISOString(),
          }),
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") throw err;
    }

    return ok({ bookingId, finalization: updated });
  }
}
