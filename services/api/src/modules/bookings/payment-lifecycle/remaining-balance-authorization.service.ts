import { Injectable, Logger } from "@nestjs/common";
import {
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../../prisma";
import { computeRemainingBalanceAuthorizationEligibility } from "../payment-lifecycle-policy";
import { StripePaymentService } from "../stripe/stripe-payment.service";

function customerIdFromPaymentMethodCustomer(customer: unknown): string | null {
  if (typeof customer === "string" && customer.trim()) return customer.trim();
  if (
    customer &&
    typeof customer === "object" &&
    "id" in customer &&
    typeof (customer as { id?: unknown }).id === "string" &&
    (customer as { id: string }).id.trim()
  ) {
    return (customer as { id: string }).id.trim();
  }
  return null;
}

function reusablePaymentMethodFromDepositIntent(
  pi: {
    payment_method?: string | { id?: string; customer?: unknown } | null;
  },
  expectedCustomerId: string,
): { paymentMethodId: string | null; reason?: "no_payment_method" | "non_reusable_payment_method" } {
  const pm = pi.payment_method;
  if (!pm) {
    return { paymentMethodId: null, reason: "no_payment_method" };
  }
  if (pm && typeof pm === "object" && typeof pm.id === "string" && pm.id.trim()) {
    const paymentMethodCustomerId = customerIdFromPaymentMethodCustomer(pm.customer);
    if (paymentMethodCustomerId === expectedCustomerId) {
      return { paymentMethodId: pm.id.trim() };
    }
  }
  return { paymentMethodId: null, reason: "non_reusable_payment_method" };
}

@Injectable()
export class RemainingBalanceAuthorizationService {
  private readonly log = new Logger(RemainingBalanceAuthorizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayments: StripePaymentService,
  ) {}

  /**
   * Finds bookings eligible for T-24h authorization (cron / ops); does not call Stripe.
   */
  async findBookingsNeedingAuthorizationWindow(args: {
    now: Date;
    limit: number;
  }): Promise<string[]> {
    const horizon = new Date(args.now.getTime() + 24 * 60 * 60 * 1000);
    const rows = await this.prisma.booking.findMany({
      where: {
        status: {
          in: [
            BookingStatus.pending_dispatch,
            BookingStatus.offered,
            BookingStatus.assigned,
            BookingStatus.accepted,
            BookingStatus.en_route,
            BookingStatus.active,
            BookingStatus.in_progress,
          ],
        },
        canceledAt: null,
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        remainingBalanceAfterDepositCents: { gt: 0 },
        remainingBalanceStatus: {
          in: [
            BookingRemainingBalancePaymentStatus.balance_pending_authorization,
            BookingRemainingBalancePaymentStatus.balance_authorization_failed,
            BookingRemainingBalancePaymentStatus.balance_authorization_required,
          ],
        },
        scheduledStart: { gt: args.now, lte: horizon },
      },
      select: { id: true },
      take: Math.max(1, Math.min(100, args.limit)),
      orderBy: { scheduledStart: "asc" },
    });
    return rows.map((r) => r.id);
  }

  /**
   * Authorizes remaining balance (manual capture) when policy allows; idempotent against existing PI.
   */
  async authorizeRemainingBalanceForBooking(bookingId: string): Promise<{
    ok: boolean;
    skipped?: string;
    paymentIntentId?: string | null;
  }> {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return { ok: false, skipped: "stripe_not_configured" };
    }

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: { select: { id: true, email: true, stripeCustomerId: true } },
      },
    });
    if (!booking) {
      return { ok: false, skipped: "booking_not_found" };
    }

    const now = new Date();
    const remaining = booking.remainingBalanceAfterDepositCents;
    const elig = computeRemainingBalanceAuthorizationEligibility({
      scheduledStart: booking.scheduledStart,
      now,
      remainingBalanceCents: remaining,
      bookingStatus: booking.status,
      depositStatus: booking.publicDepositStatus,
      balanceStatus: booking.remainingBalanceStatus,
    });
    if (!elig.eligible) {
      return { ok: false, skipped: elig.reason ?? "not_eligible" };
    }

    const existingPiId = booking.remainingBalancePaymentIntentId?.trim() || null;
    if (existingPiId) {
      const synced = await this.syncFromExistingPaymentIntent({
        bookingId,
        paymentIntentId: existingPiId,
      });
      if (synced.handled) {
        return { ok: true, paymentIntentId: existingPiId };
      }
    }

    const stripeCustomerId = booking.stripeCustomerId?.trim();
    if (!stripeCustomerId) {
      this.log.warn({
        kind: "remaining_balance_authorization",
        event: "authorization_skipped",
        bookingId,
        reason: "missing_customer",
      });
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_required,
          remainingBalanceAuthorizationFailureReason: "missing_customer",
        },
      });
      return { ok: false, skipped: "missing_customer" };
    }

    const depositPiId = booking.publicDepositPaymentIntentId?.trim();
    let paymentMethodId: string | null = null;
    let missingPaymentMethodReason: "no_payment_method" | "non_reusable_payment_method" =
      "no_payment_method";
    if (depositPiId) {
      const expanded = await this.stripePayments.retrievePaymentIntentForRemainingBalanceAuth(
        depositPiId,
      );
      const reusable = reusablePaymentMethodFromDepositIntent(
        expanded as never,
        stripeCustomerId,
      );
      paymentMethodId = reusable.paymentMethodId;
      missingPaymentMethodReason = reusable.reason ?? missingPaymentMethodReason;
    }

    if (!paymentMethodId) {
      this.log.warn({
        kind: "remaining_balance_authorization",
        event: "authorization_skipped",
        bookingId,
        reason: missingPaymentMethodReason,
      });
      await this.prisma.booking.update({
        where: { id: bookingId },
        data: {
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_required,
          remainingBalanceAuthorizationFailureReason:
            missingPaymentMethodReason === "non_reusable_payment_method"
              ? "non_reusable_payment_method"
              : "no_payment_method_from_deposit_intent",
        },
      });
      return {
        ok: false,
        skipped: missingPaymentMethodReason,
      };
    }

    if (remaining == null || remaining <= 0) {
      return { ok: false, skipped: "no_remaining_balance" };
    }

    const idemKey = `rb-auth:v2:${bookingId}:${remaining}`.slice(0, 255);
    const pi = await this.stripePayments.createRemainingBalanceAuthorizationPaymentIntent({
      bookingId,
      stripeCustomerId,
      paymentMethodId,
      amountCents: remaining,
      idempotencyKey: idemKey,
    });

    const st = pi.status;
    const patch: Prisma.BookingUpdateInput = {
      remainingBalancePaymentIntentId: pi.id,
      remainingBalanceAuthorizationFailureReason: null,
    };

    if (st === "requires_capture") {
      patch.remainingBalanceStatus = BookingRemainingBalancePaymentStatus.balance_authorized;
      patch.remainingBalanceAuthorizedAt = new Date();
    } else if (st === "succeeded") {
      patch.remainingBalanceStatus = BookingRemainingBalancePaymentStatus.balance_captured;
      patch.remainingBalanceCapturedAt = new Date();
      patch.remainingBalanceAuthorizedAt = booking.remainingBalanceAuthorizedAt ?? new Date();
    } else if (st === "processing") {
      patch.remainingBalanceStatus =
        BookingRemainingBalancePaymentStatus.balance_pending_authorization;
    } else if (st === "requires_action") {
      patch.remainingBalanceStatus =
        BookingRemainingBalancePaymentStatus.balance_authorization_failed;
      patch.remainingBalanceAuthorizationFailureReason = "requires_action";
    } else if (st === "canceled" || String(st) === "failed") {
      patch.remainingBalanceStatus =
        BookingRemainingBalancePaymentStatus.balance_authorization_failed;
      patch.remainingBalanceAuthorizationFailureReason = `stripe_status_${st}`;
    } else {
      patch.remainingBalanceStatus =
        BookingRemainingBalancePaymentStatus.balance_authorization_failed;
      patch.remainingBalanceAuthorizationFailureReason = `unexpected_status_${st}`;
    }

    await this.prisma.booking.update({
      where: { id: bookingId },
      data: patch,
    });

    return { ok: st === "requires_capture" || st === "succeeded", paymentIntentId: pi.id };
  }

  private async syncFromExistingPaymentIntent(args: {
    bookingId: string;
    paymentIntentId: string;
  }): Promise<{ handled: boolean }> {
    const pi = await this.stripePayments.retrievePaymentIntent(args.paymentIntentId);
    const st = pi.status;
    const meta = (pi.metadata ?? {}) as Record<string, string>;
    if (meta.servelinkPurpose !== "remaining_balance_authorization") {
      this.log.warn(
        `remaining balance PI metadata mismatch booking=${args.bookingId} pi=${args.paymentIntentId}`,
      );
    }

    if (st === "requires_capture") {
      await this.prisma.booking.update({
        where: { id: args.bookingId },
        data: {
          remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
          remainingBalanceAuthorizedAt: new Date(),
          remainingBalanceAuthorizationFailureReason: null,
        },
      });
      return { handled: true };
    }
    if (st === "succeeded") {
      await this.prisma.booking.update({
        where: { id: args.bookingId },
        data: {
          remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
          remainingBalanceCapturedAt: new Date(),
          remainingBalanceAuthorizedAt: new Date(),
        },
      });
      return { handled: true };
    }
    if (st === "processing" || st === "requires_confirmation") {
      return { handled: true };
    }
    if (st === "canceled" || String(st) === "failed" || st === "requires_payment_method") {
      await this.prisma.booking.update({
        where: { id: args.bookingId },
        data: {
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_failed,
          remainingBalanceAuthorizationFailureReason: `prior_pi_${st}`,
          remainingBalancePaymentIntentId: null,
        },
      });
      return { handled: false };
    }
    return { handled: true };
  }

}
