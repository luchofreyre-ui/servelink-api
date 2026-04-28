import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import {
  BookingEventType,
  BookingPublicDepositStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { initialRemainingBalanceStatusFromRemainingCents } from "../bookings/payment-lifecycle-policy";
import {
  computeRemainingBalanceAfterDepositCents,
  PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
} from "../bookings/public-deposit-policy";
import type Stripe from "stripe";
import { StripePaymentService } from "../bookings/stripe/stripe-payment.service";

/** Stable Stripe idempotency for public-deposit PI creation (shared by prepare + confirm). */
export function publicBookingDepositPiIdempotencyKey(
  bookingId: string,
  holdId?: string | null,
): string {
  const hold = holdId?.trim();
  return `pb-deposit-pi:booking:${bookingId.trim()}${hold ? `:hold:${hold}` : ""}`.slice(0, 255);
}

export type PublicBookingDepositPrepareResult = {
  kind: "public_booking_deposit_prepare";
  bookingId: string;
  depositStatus: string;
  paymentMode: "none" | "deposit";
  classification: string;
  publicDepositStatus?: string;
  clientSecret?: string | null;
  paymentIntentId?: string;
  alreadyCompleted?: boolean;
  alreadyExists?: boolean;
  nextAction: "confirm_deposit" | "finalize_booking" | "show_error";
  errorCode?: string;
  errorMessage?: string;
  amountCents?: number;
  currency?: string;
  stripeStatus?: string;
};

function readEstimatedPriceCentsFromSnapshot(outputJson: string | null): number {
  if (!outputJson?.trim()) return 0;
  try {
    const out = JSON.parse(outputJson) as Record<string, unknown>;
    const v = out.estimatedPriceCents;
    if (typeof v === "number" && Number.isFinite(v)) {
      return Math.max(0, Math.floor(v));
    }
  } catch {
    /* ignore */
  }
  return 0;
}

function estimateSnapshotHash(outputJson: string | null | undefined): string {
  return createHash("sha256")
    .update(outputJson?.trim() || "")
    .digest("hex")
    .slice(0, 32);
}

function isDuplicateBookingEventIdempotencyError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  if (error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (!target) {
    return false;
  }
  if (Array.isArray(target)) {
    return target.includes("bookingId") && target.includes("idempotencyKey");
  }
  if (typeof target === "string") {
    return target.includes("bookingId") && target.includes("idempotencyKey");
  }
  return false;
}

type PublicDepositContext = {
  booking: {
    id: string;
    tenantId: string;
    status: BookingStatus;
    customerId: string;
    publicDepositStatus: BookingPublicDepositStatus;
    publicDepositAmountCents: number;
    publicDepositPaymentIntentId: string | null;
    stripeCustomerId: string | null;
    customer: { id: string; email: string | null; stripeCustomerId: string | null };
    estimateSnapshot: { outputJson: string | null } | null;
  };
  hold: {
    id: string;
    bookingId: string;
    foId: string;
    startAt: Date;
    endAt: Date;
    expiresAt: Date;
  } | null;
  estimatedTotalCents: number;
  estimateHash: string;
};

/**
 * Public booking deposit: $100 immediate capture before hold confirmation assigns the booking.
 * Skipped only through PUBLIC_BOOKING_DEPOSIT_MODE=bypass or when Stripe is unavailable.
 */
@Injectable()
export class PublicBookingDepositService {
  private readonly log = new Logger(PublicBookingDepositService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripePayments: StripePaymentService,
    private readonly config: ConfigService = new ConfigService(),
  ) {}

  private shouldBypassPublicDeposit(): boolean {
    const mode = this.config.get<"required" | "bypass">(
      "PUBLIC_BOOKING_DEPOSIT_MODE",
    );
    const stripeKey = this.config.get<string>("STRIPE_SECRET_KEY");

    const stripeConfigured = !!stripeKey?.trim();
    return mode === "bypass" || !stripeConfigured;
  }

  private async loadPublicDepositContext(args: {
    bookingId: string;
    holdId?: string | null;
    requireUnexpiredHold: boolean;
  }): Promise<PublicDepositContext> {
    const bookingId = args.bookingId.trim();
    const holdId = args.holdId?.trim() || "";
    if (!bookingId) {
      throw new BadRequestException({
        code: "BOOKING_ID_REQUIRED",
        message: "bookingId is required",
      });
    }

    const [booking, hold] = await Promise.all([
      this.prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          tenantId: true,
          status: true,
          customerId: true,
          publicDepositStatus: true,
          publicDepositAmountCents: true,
          publicDepositPaymentIntentId: true,
          stripeCustomerId: true,
          customer: { select: { id: true, email: true, stripeCustomerId: true } },
          estimateSnapshot: { select: { outputJson: true } },
        },
      }),
      holdId
        ? this.prisma.bookingSlotHold.findUnique({
            where: { id: holdId },
            select: {
              id: true,
              bookingId: true,
              foId: true,
              startAt: true,
              endAt: true,
              expiresAt: true,
            },
          })
        : Promise.resolve(null),
    ]);

    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }
    if (!booking.tenantId?.trim()) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_TENANT_REQUIRED",
        message: "A tenant context is required before preparing payment.",
      });
    }
    if (holdId && (!hold || hold.bookingId !== booking.id)) {
      throw new NotFoundException("PUBLIC_BOOKING_HOLD_NOT_FOUND");
    }
    if (!hold && args.requireUnexpiredHold) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_HOLD_REQUIRED",
        message: "A valid slot hold is required before confirming this booking.",
      });
    }
    if (hold && args.requireUnexpiredHold && hold.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException({
        code: "BOOKING_SLOT_HOLD_EXPIRED",
        message: "The selected slot hold expired before payment could be finalized.",
      });
    }

    const outputJson = booking.estimateSnapshot?.outputJson ?? null;
    return {
      booking,
      hold,
      estimatedTotalCents: readEstimatedPriceCentsFromSnapshot(outputJson),
      estimateHash: estimateSnapshotHash(outputJson),
    };
  }

  private assertPaymentIntentMatchesPublicDepositContext(
    pi: Stripe.PaymentIntent,
    ctx: PublicDepositContext,
  ) {
    const metadata = pi.metadata ?? {};
    const expectedAmount =
      ctx.booking.publicDepositAmountCents ?? PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS;
    if (pi.amount !== expectedAmount) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_DEPOSIT_AMOUNT_MISMATCH",
        message: "Deposit PaymentIntent amount does not match the locked booking deposit.",
      });
    }
    if (
      metadata.bookingId !== ctx.booking.id ||
      metadata.bookingSessionKey !== ctx.booking.id ||
      metadata.tenantId !== ctx.booking.tenantId ||
      metadata.estimateSnapshotHash !== ctx.estimateHash
    ) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_DEPOSIT_SESSION_MISMATCH",
        message: "Deposit PaymentIntent does not match this booking session and hold.",
      });
    }
    const metadataHoldId = metadata.holdId?.trim();
    if (metadataHoldId && ctx.hold && metadataHoldId !== ctx.hold.id) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_DEPOSIT_SESSION_MISMATCH",
        message: "Deposit PaymentIntent does not match this booking session and hold.",
      });
    }
  }

  private async recordMissingDepositPaymentIntentVisibility(args: {
    bookingId: string;
    holdId: string;
    publicDepositStatus: BookingPublicDepositStatus;
    source: "public_booking_confirm";
  }) {
    const idempotencyKey = `public-deposit-missing-pi:${args.bookingId}`;
    const payload = {
      reason: "DEPOSIT_SUCCEEDED_MISSING_PAYMENT_INTENT",
      bookingId: args.bookingId,
      holdId: args.holdId,
      publicDepositStatus: args.publicDepositStatus,
      source: args.source,
    } as const;

    try {
      await this.prisma.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey,
          note: "Public booking deposit marked succeeded without a PaymentIntent; confirmation allowed with reconciliation visibility.",
          payload: payload as Prisma.InputJsonValue,
        },
      });
    } catch (err: any) {
      if (err?.code !== "P2002") {
        throw err;
      }
    }

    const existing = await this.prisma.paymentAnomaly.findFirst({
      where: {
        bookingId: args.bookingId,
        kind: "public_deposit_succeeded_missing_payment_intent",
        status: "open",
      },
      select: { id: true },
    });
    if (existing) return;

    await this.prisma.paymentAnomaly.create({
      data: {
        bookingId: args.bookingId,
        kind: "public_deposit_succeeded_missing_payment_intent",
        severity: "warning",
        status: "open",
        message:
          "Public booking deposit is marked succeeded but has no persisted PaymentIntent id.",
        details: payload as Prisma.InputJsonValue,
      },
    });
  }

  private async ensureDepositStripeCustomer(ctx: PublicDepositContext): Promise<string> {
    const existing = ctx.booking.stripeCustomerId?.trim();
    if (existing) return existing;

    const stripeCustomerId = await this.stripePayments.ensureStripeCustomerForUser({
      userId: ctx.booking.customerId,
      email:
        String(ctx.booking.customer.email ?? "").trim() ||
        `customer+${ctx.booking.customerId}@servelink.invalid`,
      bookingId: ctx.booking.id,
    });
    await this.prisma.booking.update({
      where: { id: ctx.booking.id },
      data: { stripeCustomerId },
    });
    ctx.booking.stripeCustomerId = stripeCustomerId;
    return stripeCustomerId;
  }

  private async retrieveExistingDepositPaymentIntent(args: {
    bookingId: string;
    paymentIntentId: string;
  }): Promise<
    | { ok: true; paymentIntent: Stripe.PaymentIntent }
    | { ok: false; code: string; message: string }
  > {
    try {
      return {
        ok: true,
        paymentIntent: await this.stripePayments.retrievePaymentIntent(args.paymentIntentId),
      };
    } catch (err) {
      this.log.error({
        kind: "public_booking_deposit_prepare",
        event: "existing_payment_intent_retrieve_failed",
        bookingId: args.bookingId,
        paymentIntentId: args.paymentIntentId,
        message: err instanceof Error ? err.message : String(err),
      });
      return {
        code: "PUBLIC_BOOKING_DEPOSIT_PAYMENT_INTENT_RETRIEVE_FAILED",
        message: "Existing deposit PaymentIntent could not be retrieved",
        ok: false,
      };
    }
  }

  /**
   * Ensures deposit succeeded (or skip flag). Otherwise throws structured HTTP errors.
   */
  async ensurePublicDepositResolvedBeforeConfirm(args: {
    bookingId: string;
    holdId: string;
    stripePaymentMethodId?: string | null;
    idempotencyKey: string | null;
  }): Promise<void> {
    if (this.shouldBypassPublicDeposit()) {
      this.log.warn("Public booking deposit skipped by deposit mode/config.");
      return;
    }

    const ctx = await this.loadPublicDepositContext({
      bookingId: args.bookingId,
      holdId: args.holdId,
      requireUnexpiredHold: false,
    });
    const booking = ctx.booking;
    if (!ctx.hold) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_HOLD_REQUIRED",
        message: "A valid slot hold is required before confirming this booking.",
      });
    }
    const holdExpired = ctx.hold.expiresAt.getTime() <= Date.now();

    if (booking.status !== BookingStatus.pending_payment) {
      return;
    }

    if (
      booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded &&
      !booking.publicDepositPaymentIntentId?.trim()
    ) {
      await this.recordMissingDepositPaymentIntentVisibility({
        bookingId: booking.id,
        holdId: ctx.hold.id,
        publicDepositStatus: booking.publicDepositStatus,
        source: "public_booking_confirm",
      });
      return;
    }

    const stripeCustomerId = await this.ensureDepositStripeCustomer(ctx);

    const idemBase =
      (args.idempotencyKey?.trim() || `pb:${args.bookingId}:${args.holdId}`).slice(0, 200);
    const idemPi = publicBookingDepositPiIdempotencyKey(booking.id, args.holdId);
    const idemConfirm = `pb-deposit-confirm:${idemBase}`;

    const estimatedTotal = ctx.estimatedTotalCents;
    const remaining = computeRemainingBalanceAfterDepositCents({
      estimatedTotalCents: estimatedTotal,
      depositAmountCents: booking.publicDepositAmountCents,
    });

    const existingPiId = booking.publicDepositPaymentIntentId?.trim() || null;
    const pm = args.stripePaymentMethodId?.trim() || null;

    if (holdExpired && !existingPiId) {
      throw new ConflictException({
        code: "BOOKING_SLOT_HOLD_EXPIRED",
        message: "The selected slot hold expired before payment could be finalized.",
      });
    }

    if (holdExpired && pm) {
      throw new ConflictException({
        code: "BOOKING_SLOT_HOLD_EXPIRED",
        message: "The selected slot hold expired before payment could be finalized.",
      });
    }

    if (pm) {
      await this.chargeOrConfirmWithPaymentMethod({
        bookingId: booking.id,
        holdId: args.holdId,
        stripeCustomerId,
        paymentMethodId: pm,
        idempotencyKey: idemConfirm,
        estimatedTotalCentsSnapshot: estimatedTotal > 0 ? estimatedTotal : null,
        remainingBalanceAfterDepositCents: estimatedTotal > 0 ? remaining : null,
        existingPaymentIntentId: existingPiId,
        tenantId: booking.tenantId,
        estimateSnapshotHash: ctx.estimateHash,
      });
      return;
    }

    let activeDepositPiId = existingPiId;
    if (activeDepositPiId) {
      const pi = await this.stripePayments.retrievePaymentIntent(activeDepositPiId);
      const st = pi.status;
      if (st === "succeeded") {
        this.assertPaymentIntentMatchesPublicDepositContext(pi, ctx);
        await this.markDepositSucceededFromStripeState({
          bookingId: booking.id,
          paymentIntentId: activeDepositPiId,
          estimatedTotalCentsSnapshot: estimatedTotal > 0 ? estimatedTotal : null,
          remainingBalanceAfterDepositCents: estimatedTotal > 0 ? remaining : null,
        });
        return;
      }
      if (holdExpired) {
        throw new ConflictException({
          code: "BOOKING_SLOT_HOLD_EXPIRED",
          message: "The selected slot hold expired before payment could be finalized.",
        });
      }
      if (st === "processing") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_processing",
            code: "PUBLIC_BOOKING_DEPOSIT_PROCESSING",
            message: "Deposit payment is processing. Retry confirmation shortly.",
            paymentIntentId: pi.id,
          },
          HttpStatus.CONFLICT,
        );
      }
      if (st === "canceled" || String(st) === "failed") {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            publicDepositPaymentIntentId: null,
            publicDepositStatus: BookingPublicDepositStatus.deposit_required,
          },
        });
        activeDepositPiId = null;
      } else if (st === "requires_action") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_requires_action",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRES_ACTION",
            message: "Additional authentication is required to complete the deposit.",
            clientSecret: pi.client_secret ?? null,
            paymentIntentId: pi.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      } else if (st === "requires_payment_method" || st === "requires_confirmation") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_required",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message:
              "A $100 deposit is required to confirm this booking. Add a payment method and retry.",
            amountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
            currency: "usd",
            clientSecret: pi.client_secret ?? null,
            paymentIntentId: pi.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      } else {
        this.log.warn(
          `Public deposit PI in unexpected state booking=${booking.id} status=${st}`,
        );
        throw new HttpException(
          {
            kind: "public_booking_deposit_required",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
            message:
              "A $100 deposit is required to confirm this booking. Complete payment with Stripe, then retry confirmation with the same hold.",
            amountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
            currency: "usd",
            clientSecret: pi.client_secret ?? null,
            paymentIntentId: pi.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    if (holdExpired) {
      throw new ConflictException({
        code: "BOOKING_SLOT_HOLD_EXPIRED",
        message: "The selected slot hold expired before payment could be finalized.",
      });
    }

    const pi = await this.stripePayments.createPublicBookingDepositPaymentIntent({
      bookingId: booking.id,
      stripeCustomerId,
      idempotencyKey: idemPi,
      holdId: args.holdId,
      tenantId: booking.tenantId,
      estimateSnapshotHash: ctx.estimateHash,
      estimatedTotalCents: estimatedTotal,
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        publicDepositPaymentIntentId: pi.id,
        stripeCustomerId,
        publicDepositStatus: BookingPublicDepositStatus.deposit_required,
        publicDepositAmountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
      },
    });

    throw new HttpException(
      {
        kind: "public_booking_deposit_required",
        code: "PUBLIC_BOOKING_DEPOSIT_REQUIRED",
        message:
          "A $100 deposit is required to confirm this booking. Complete payment with Stripe, then retry confirmation with the same hold.",
        amountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
        currency: "usd",
        clientSecret: pi.client_secret ?? null,
        paymentIntentId: pi.id,
      },
      HttpStatus.PAYMENT_REQUIRED,
    );
  }

  private async chargeOrConfirmWithPaymentMethod(args: {
    bookingId: string;
    holdId: string;
    stripeCustomerId: string;
    paymentMethodId: string;
    idempotencyKey: string;
    estimatedTotalCentsSnapshot: number | null;
    remainingBalanceAfterDepositCents: number | null;
    existingPaymentIntentId: string | null;
    tenantId: string;
    estimateSnapshotHash: string;
  }): Promise<void> {
    let pi: Stripe.PaymentIntent | null = null;

    if (args.existingPaymentIntentId) {
      const cur = await this.stripePayments.retrievePaymentIntent(
        args.existingPaymentIntentId,
      );
      if (cur.status === "succeeded") {
        await this.markDepositSucceededFromStripeState({
          bookingId: args.bookingId,
          paymentIntentId: cur.id,
          estimatedTotalCentsSnapshot: args.estimatedTotalCentsSnapshot,
          remainingBalanceAfterDepositCents: args.remainingBalanceAfterDepositCents,
        });
        return;
      }
      if (cur.status === "requires_action") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_requires_action",
            code: "PUBLIC_BOOKING_DEPOSIT_REQUIRES_ACTION",
            message: "Additional authentication is required to complete the deposit.",
            clientSecret: cur.client_secret ?? null,
            paymentIntentId: cur.id,
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      if (
        cur.status === "requires_payment_method" ||
        cur.status === "requires_confirmation"
      ) {
        pi = await this.stripePayments.confirmPaymentIntentWithPaymentMethod({
          paymentIntentId: cur.id,
          paymentMethodId: args.paymentMethodId,
          idempotencyKey: args.idempotencyKey,
        });
      } else if (cur.status === "processing") {
        throw new HttpException(
          {
            kind: "public_booking_deposit_processing",
            code: "PUBLIC_BOOKING_DEPOSIT_PROCESSING",
            message: "Deposit payment is processing. Retry confirmation shortly.",
            paymentIntentId: cur.id,
          },
          HttpStatus.CONFLICT,
        );
      } else {
        pi = await this.stripePayments.createAndConfirmPublicDepositPaymentIntent({
          bookingId: args.bookingId,
          stripeCustomerId: args.stripeCustomerId,
          paymentMethodId: args.paymentMethodId,
          idempotencyKey: args.idempotencyKey,
          holdId: args.holdId,
          tenantId: args.tenantId,
          estimateSnapshotHash: args.estimateSnapshotHash,
          estimatedTotalCents: args.estimatedTotalCentsSnapshot,
        });
      }
    } else {
      pi = await this.stripePayments.createAndConfirmPublicDepositPaymentIntent({
        bookingId: args.bookingId,
        stripeCustomerId: args.stripeCustomerId,
        paymentMethodId: args.paymentMethodId,
        idempotencyKey: args.idempotencyKey,
        holdId: args.holdId,
        tenantId: args.tenantId,
        estimateSnapshotHash: args.estimateSnapshotHash,
        estimatedTotalCents: args.estimatedTotalCentsSnapshot,
      });
    }

    if (!pi) {
      throw new BadRequestException({
        code: "PUBLIC_BOOKING_DEPOSIT_FAILED",
        message: "Deposit payment intent was not created.",
      });
    }

    if (pi.status === "succeeded") {
      await this.markDepositSucceededFromStripeState({
        bookingId: args.bookingId,
        paymentIntentId: pi.id,
        estimatedTotalCentsSnapshot: args.estimatedTotalCentsSnapshot,
        remainingBalanceAfterDepositCents: args.remainingBalanceAfterDepositCents,
      });
      return;
    }

    if (pi.status === "requires_action") {
      throw new HttpException(
        {
          kind: "public_booking_deposit_requires_action",
          code: "PUBLIC_BOOKING_DEPOSIT_REQUIRES_ACTION",
          message: "Additional authentication is required to complete the deposit.",
          clientSecret: pi.client_secret ?? null,
          paymentIntentId: pi.id,
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: {
        publicDepositStatus: BookingPublicDepositStatus.deposit_failed,
        publicDepositPaymentIntentId: pi.id,
      },
    });

    throw new BadRequestException({
      code: "PUBLIC_BOOKING_DEPOSIT_FAILED",
      message: `Deposit did not succeed (status=${pi.status}).`,
    });
  }

  /**
   * Public, unauthenticated: returns a PaymentIntent `client_secret` when the booking
   * still requires deposit capture, or `paymentMode: "none"` when deposit is already
   * satisfied / skipped. Initial review payment can happen before a slot hold
   * exists; final confirmation still binds the paid booking to a concrete hold.
   */
  async preparePublicBookingDeposit(
    bookingId: string,
    holdId?: string | null,
  ): Promise<PublicBookingDepositPrepareResult> {
    const id = bookingId.trim();
    const hold = holdId?.trim() || "";
    if (!id) {
      throw new BadRequestException({
        code: "BOOKING_ID_REQUIRED",
        message: "bookingId is required",
      });
    }

    if (this.shouldBypassPublicDeposit()) {
      return {
        kind: "public_booking_deposit_prepare",
        bookingId: id,
        depositStatus: "deposit_succeeded",
        paymentMode: "none",
        classification: "skip_deposit_env",
        publicDepositStatus: "deposit_succeeded",
        alreadyCompleted: true,
        nextAction: "finalize_booking",
      };
    }

    const ctx = await this.loadPublicDepositContext({
      bookingId: id,
      holdId: hold || null,
      requireUnexpiredHold: false,
    });
    const booking = ctx.booking;
    const holdExpired = ctx.hold ? ctx.hold.expiresAt.getTime() <= Date.now() : false;

    if (booking.status !== BookingStatus.pending_payment) {
      return {
        kind: "public_booking_deposit_prepare",
        bookingId: id,
        depositStatus: String(booking.publicDepositStatus ?? ""),
        paymentMode: "none",
        classification: "booking_not_pending_payment",
        publicDepositStatus: String(booking.publicDepositStatus ?? ""),
        alreadyCompleted: true,
        nextAction: "finalize_booking",
      };
    }

    if (
      booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded &&
      !booking.publicDepositPaymentIntentId?.trim()
    ) {
      return {
        kind: "public_booking_deposit_prepare",
        bookingId: id,
        depositStatus: BookingPublicDepositStatus.deposit_succeeded,
        paymentMode: "none",
        classification: "deposit_inconsistent",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        alreadyCompleted: true,
        nextAction: "finalize_booking",
      };
    }

    if (
      booking.publicDepositStatus === BookingPublicDepositStatus.deposit_succeeded &&
      booking.publicDepositPaymentIntentId?.trim()
    ) {
      return {
        kind: "public_booking_deposit_prepare",
        bookingId: id,
        depositStatus: BookingPublicDepositStatus.deposit_succeeded,
        paymentMode: "none",
        classification: "deposit_succeeded",
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        paymentIntentId: booking.publicDepositPaymentIntentId.trim(),
        alreadyCompleted: true,
        nextAction: "finalize_booking",
      };
    }

    const stripeCustomerId = await this.ensureDepositStripeCustomer(ctx);

    const estimatedTotal = ctx.estimatedTotalCents;
    const remaining = computeRemainingBalanceAfterDepositCents({
      estimatedTotalCents: estimatedTotal,
      depositAmountCents: booking.publicDepositAmountCents,
    });

    const depositReturn = (
      stripeStatus: string,
      clientSecret: string | null,
      paymentIntentId: string,
      classification: string,
      alreadyExists = false,
    ): PublicBookingDepositPrepareResult => ({
      kind: "public_booking_deposit_prepare",
      bookingId: booking.id,
      depositStatus: String(booking.publicDepositStatus ?? ""),
      paymentMode: "deposit",
      classification,
      publicDepositStatus: String(booking.publicDepositStatus ?? ""),
      clientSecret,
      paymentIntentId,
      amountCents: booking.publicDepositAmountCents ?? PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
      currency: "usd",
      stripeStatus,
      nextAction: "confirm_deposit",
      ...(alreadyExists ? { alreadyExists: true } : {}),
    });

    const activeDepositPiId = booking.publicDepositPaymentIntentId?.trim() || null;

    if (activeDepositPiId) {
      const existingPi = await this.retrieveExistingDepositPaymentIntent({
        bookingId: booking.id,
        paymentIntentId: activeDepositPiId,
      });
      if (!existingPi.ok) {
        return {
          kind: "public_booking_deposit_prepare",
          bookingId: booking.id,
          depositStatus: String(booking.publicDepositStatus ?? ""),
          paymentMode: "none",
          classification: "payment_intent_retrieve_failed",
          publicDepositStatus: String(booking.publicDepositStatus ?? ""),
          paymentIntentId: activeDepositPiId,
          nextAction: "show_error",
          errorCode: existingPi.code,
          errorMessage: existingPi.message,
        };
      }
      const pi = existingPi.paymentIntent;
      const st = String(pi.status ?? "");
      if (st === "succeeded") {
        this.assertPaymentIntentMatchesPublicDepositContext(pi, ctx);
        await this.markDepositSucceededFromStripeState({
          bookingId: booking.id,
          paymentIntentId: activeDepositPiId,
          estimatedTotalCentsSnapshot: estimatedTotal > 0 ? estimatedTotal : null,
          remainingBalanceAfterDepositCents: estimatedTotal > 0 ? remaining : null,
        });
        return {
          kind: "public_booking_deposit_prepare",
          bookingId: booking.id,
          depositStatus: BookingPublicDepositStatus.deposit_succeeded,
          paymentMode: "none",
          classification: "deposit_succeeded",
          publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
          paymentIntentId: activeDepositPiId,
          alreadyCompleted: true,
          nextAction: "finalize_booking",
        };
      }
      if (holdExpired) {
        throw new ConflictException({
          code: "BOOKING_SLOT_HOLD_EXPIRED",
          message: "The selected slot hold expired before payment could be finalized.",
        });
      }
      if (st === "processing") {
        return depositReturn(
          st,
          typeof pi.client_secret === "string" ? pi.client_secret : null,
          pi.id,
          "processing",
          true,
        );
      }
      if (st === "canceled" || st === "failed") {
        return {
          kind: "public_booking_deposit_prepare",
          bookingId: booking.id,
          depositStatus: String(booking.publicDepositStatus ?? ""),
          paymentMode: "none",
          classification: "payment_intent_unrecoverable",
          publicDepositStatus: String(booking.publicDepositStatus ?? ""),
          paymentIntentId: pi.id,
          stripeStatus: st,
          alreadyExists: true,
          nextAction: "show_error",
          errorCode: "PUBLIC_BOOKING_DEPOSIT_PAYMENT_INTENT_UNRECOVERABLE",
          errorMessage: "Existing deposit PaymentIntent can no longer be confirmed.",
        };
      } else if (
        st === "requires_action" ||
        st === "requires_payment_method" ||
        st === "requires_confirmation"
      ) {
        return depositReturn(
          st,
          typeof pi.client_secret === "string" ? pi.client_secret : null,
          pi.id,
          "payment_required",
          true,
        );
      } else {
        this.log.warn(
          `preparePublicBookingDeposit: unexpected PI status booking=${booking.id} status=${st}`,
        );
        return depositReturn(
          st,
          typeof pi.client_secret === "string" ? pi.client_secret : null,
          pi.id,
          "payment_required",
          true,
        );
      }
    }

    if (holdExpired) {
      throw new ConflictException({
        code: "BOOKING_SLOT_HOLD_EXPIRED",
        message: "The selected slot hold expired before payment could be finalized.",
      });
    }

    const idemPi = publicBookingDepositPiIdempotencyKey(booking.id, hold || null);
    const pi = await this.stripePayments.createPublicBookingDepositPaymentIntent({
      bookingId: booking.id,
      stripeCustomerId,
      idempotencyKey: idemPi,
      holdId: hold || null,
      tenantId: booking.tenantId,
      estimateSnapshotHash: ctx.estimateHash,
      estimatedTotalCents: estimatedTotal,
    });

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        publicDepositPaymentIntentId: pi.id,
        stripeCustomerId,
        publicDepositStatus: BookingPublicDepositStatus.deposit_required,
        publicDepositAmountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
      },
    });

    return depositReturn(
      String(pi.status ?? ""),
      typeof pi.client_secret === "string" ? pi.client_secret : null,
      pi.id,
      "payment_required",
    );
  }

  private async markDepositSucceededFromStripeState(args: {
    bookingId: string;
    paymentIntentId: string;
    estimatedTotalCentsSnapshot: number | null;
    remainingBalanceAfterDepositCents: number | null;
  }): Promise<void> {
    const patch: Prisma.BookingUpdateInput = {
      publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
      publicDepositPaidAt: new Date(),
      publicDepositPaymentIntentId: args.paymentIntentId,
      publicDepositAmountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
    };
    if (args.estimatedTotalCentsSnapshot != null) {
      patch.estimatedTotalCentsSnapshot = args.estimatedTotalCentsSnapshot;
    }
    if (args.remainingBalanceAfterDepositCents != null) {
      patch.remainingBalanceAfterDepositCents = args.remainingBalanceAfterDepositCents;
      patch.remainingBalanceStatus = initialRemainingBalanceStatusFromRemainingCents(
        args.remainingBalanceAfterDepositCents,
      );
    }

    await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: patch,
    });

    // Idempotency guard:
    // Deposit success may be processed multiple times (prepare + confirm paths).
    // Duplicate BookingEvent for same (bookingId, idempotencyKey) is expected and safe.
    try {
      await this.prisma.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          idempotencyKey: `public-deposit-sync:${args.paymentIntentId}`,
          note: "Public booking deposit captured",
          payload: {
            publicDeposit: true,
            paymentIntentId: args.paymentIntentId,
          } as Prisma.InputJsonValue,
        },
      });
    } catch (err) {
      if (isDuplicateBookingEventIdempotencyError(err)) {
        return;
      }
      throw err;
    }
  }
}
