import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import {
  Booking,
  BookingEventType,
  BookingPaymentStatus,
  BookingPublicDepositStatus,
  BookingRemainingBalancePaymentStatus,
  Prisma,
} from "@prisma/client";
import Stripe from "stripe";
import { STRIPE_WEBHOOK_HTTP_PATH } from "../../billing/stripe-webhook.constants";
import { PrismaService } from "../../../prisma";
import { fail } from "../../../utils/http";
import { PaymentReliabilityService } from "../payment-reliability/payment-reliability.service";
import type { CreateBookingCheckoutInput } from "../payment/payment.types";
import { initialRemainingBalanceStatusFromRemainingCents } from "../payment-lifecycle-policy";
import { PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS } from "../public-deposit-policy";

/** Observability context for booking reconciliation from the single Stripe webhook ingress. */
export type StripeBookingWebhookObs = {
  endpointPath: string;
};

function resolveAmountCents(booking: Booking): number | null {
  if (booking.paymentAmountCents != null && booking.paymentAmountCents > 0) {
    return booking.paymentAmountCents;
  }
  if (booking.quotedTotal != null) {
    const n = Number(booking.quotedTotal);
    if (Number.isFinite(n) && n > 0) {
      return Math.round(n * 100);
    }
  }
  if (booking.priceTotal != null) {
    const n = Number(booking.priceTotal);
    if (Number.isFinite(n) && n > 0) {
      return Math.round(n * 100);
    }
  }
  const hr = booking.hourlyRateCents * booking.estimatedHours;
  if (Number.isFinite(hr) && hr > 0) {
    return Math.round(hr);
  }
  return null;
}

function paymentIntentIdFrom(obj: Record<string, unknown>): string | null {
  const pi = obj.payment_intent;
  if (typeof pi === "string") return pi;
  if (pi && typeof pi === "object" && "id" in pi && typeof (pi as { id: unknown }).id === "string") {
    return (pi as { id: string }).id;
  }
  return null;
}

function eventPayloadJson(event: Stripe.Event): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(event)) as Prisma.InputJsonValue;
}

@Injectable()
export class StripePaymentService {
  private readonly log = new Logger(StripePaymentService.name);
  private readonly stripeClient: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentReliability: PaymentReliabilityService,
  ) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    this.stripeClient = key
      ? new Stripe(key, {
          apiVersion: "2025-01-27.acacia" as any,
          typescript: true,
        })
      : null;
  }

  private requireStripe(): Stripe {
    if (!this.stripeClient) {
      throw new BadRequestException(
        "Stripe is not configured. Set STRIPE_SECRET_KEY.",
      );
    }
    return this.stripeClient;
  }

  /**
   * Creates a real Stripe Checkout Session and persists linkage on the booking.
   * Checkout uses automatic capture (payment mode); reconciliation is webhook-driven.
   */
  async createCheckoutSession(
    booking: Booking,
    input: CreateBookingCheckoutInput,
  ) {
    const stripe = this.requireStripe();
    const amountCents = resolveAmountCents(booking);
    if (!amountCents || amountCents <= 0) {
      throw new BadRequestException(
        "Booking must have a positive payment amount before checkout can be created",
      );
    }

    const successUrl = input.successUrl?.trim();
    const cancelUrl = input.cancelUrl?.trim();
    if (!successUrl || !cancelUrl) {
      throw new BadRequestException(
        "successUrl and cancelUrl are required for Stripe Checkout",
      );
    }

    const currency = (
      booking.paymentCurrency ||
      booking.currency ||
      process.env.STRIPE_CURRENCY ||
      "usd"
    )
      .toLowerCase()
      .slice(0, 3);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: `Booking ${booking.id}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        bookingId: booking.id,
        bookingPublicId: booking.id,
      },
      client_reference_id: booking.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new BadRequestException("Stripe Checkout Session did not return a URL");
    }

    const piId = paymentIntentIdFrom(session as unknown as Record<string, unknown>);
    const cust = session.customer;
    const customerId =
      typeof cust === "string" ? cust : cust && typeof cust === "object" && "id" in cust
        ? String((cust as { id: string }).id)
        : null;

    const meta: Prisma.InputJsonValue = {
      provider: "stripe",
      stripeCheckoutSessionId: session.id,
      successUrl,
      cancelUrl,
    };

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: {
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: piId,
        stripeCustomerId: customerId,
        paymentStatus: BookingPaymentStatus.checkout_created,
        paymentProvider: "stripe",
        paymentReference: session.id,
        paymentCheckoutUrl: session.url,
        paymentAmountCents: amountCents,
        paymentCurrency: currency,
        paymentMeta: meta,
        BookingEvent: {
          create: {
            type: BookingEventType.PAYMENT_CHECKOUT_CREATED,
            note: "Stripe Checkout session created",
            actorUserId: input.actorUserId ?? null,
            actorRole: input.actorRole ?? "customer",
            payload: {
              checkoutSessionId: session.id,
              checkoutUrl: session.url,
              amountCents,
              currency,
            } as Prisma.InputJsonValue,
          },
        },
      },
    });

    return {
      provider: "stripe" as const,
      checkoutUrl: session.url,
      reference: session.id,
      amountCents,
      currency,
      status: BookingPaymentStatus.checkout_created,
    };
  }

  /**
   * Idempotent booking payment updates from verified Stripe webhook events.
   * Caller must create StripeWebhookReceipt first (exactly-once gate), except when invoked from the billing webhook after its receipt insert.
   *
   * **Webhooks are reconciliation signals**, not the sole authority for payment lifecycle: missing
   * Dashboard subscriptions (for example `payment_intent.amount_capturable_updated`) must not
   * permanently strand state — `PaymentLifecycleReconciliationCronService` + T−24h auth cron backstop DB/Stripe drift.
   */
  async applyBookingStripeEvent(
    event: Stripe.Event,
    obs?: StripeBookingWebhookObs,
  ): Promise<void> {
    const type = event.type;
    const object = event.data.object as unknown as Record<string, unknown>;

    switch (type) {
      case "checkout.session.completed":
        await this.onCheckoutSessionCompleted(event.id, object, obs);
        break;
      case "checkout.session.async_payment_succeeded":
        await this.onCheckoutAsyncPaymentSucceeded(event.id, object, obs);
        break;
      case "checkout.session.expired":
        await this.onCheckoutSessionExpired(event.id, object, obs);
        break;
      case "payment_intent.amount_capturable_updated":
        await this.onPaymentIntentAmountCapturableUpdated(event.id, object, obs);
        break;
      case "payment_intent.succeeded":
        await this.onPaymentIntentSucceeded(event.id, object, obs);
        break;
      case "payment_intent.payment_failed":
        await this.onPaymentIntentFailed(event.id, object, obs);
        break;
      default:
        break;
    }
  }

  /**
   * Shared ingress: verify signature, idempotent receipt insert, booking reconciliation.
   * Invoked only from POST /api/v1/stripe/webhook (see STRIPE_WEBHOOK_HTTP_PATH).
   *
   * If Stripe stops delivering certain event types, **scheduled reconciliation** still converges
   * remaining-balance and deposit rows against Stripe PaymentIntents.
   */
  async processBookingStripeWebhookIngress(
    raw: Buffer,
    sig: string | undefined,
  ): Promise<
    | {
        ok: true;
        event: Stripe.Event;
        duplicate: boolean;
        applyFailed: boolean;
      }
    | { ok: false; response: ReturnType<typeof fail> }
  > {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      return { ok: false, response: fail("STRIPE_NOT_CONFIGURED", "Stripe webhook is not configured") };
    }
    if (!sig) {
      return { ok: false, response: fail("INVALID_REQUEST", "Missing Stripe signature") };
    }

    let event: Stripe.Event;
    try {
      const stripe = this.requireStripe();
      event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
    } catch (e) {
      await this.paymentReliability.recordWebhookFailure({
        stripeEventId: null,
        eventType: null,
        endpointPath: STRIPE_WEBHOOK_HTTP_PATH,
        failureKind: "signature_or_construct_failed",
        message: e instanceof Error ? e.message : String(e),
        payload: { stage: "constructEvent" },
      });
      if (e instanceof BadRequestException) {
        return { ok: false, response: fail("STRIPE_NOT_CONFIGURED", e.message) };
      }
      return {
        ok: false,
        response: fail("WEBHOOK_INVALID_SIGNATURE", "Invalid Stripe webhook signature"),
      };
    }

    try {
      await this.prisma.stripeWebhookReceipt.create({
        data: {
          stripeEventId: String(event.id),
          type: event.type,
          livemode: Boolean(event.livemode),
          payload: eventPayloadJson(event),
          endpointPath: STRIPE_WEBHOOK_HTTP_PATH,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        await this.paymentReliability.recordDuplicateStripeEvent(
          String(event.id),
          String(event.type),
        );
        return { ok: true, event, duplicate: true, applyFailed: false };
      }
      await this.paymentReliability.recordWebhookFailure({
        stripeEventId: String(event.id),
        eventType: event.type,
        endpointPath: STRIPE_WEBHOOK_HTTP_PATH,
        failureKind: "receipt_insert_failed",
        message: err instanceof Error ? err.message : String(err),
        payload: { code: err?.code },
      });
      throw err;
    }

    let applyFailed = false;
    try {
      await this.applyBookingStripeEvent(event, {
        endpointPath: STRIPE_WEBHOOK_HTTP_PATH,
      });
    } catch (e) {
      applyFailed = true;
      await this.paymentReliability.recordWebhookFailure({
        stripeEventId: String(event.id),
        eventType: event.type,
        endpointPath: STRIPE_WEBHOOK_HTTP_PATH,
        failureKind: "booking_reconciliation_exception",
        message: e instanceof Error ? e.message : String(e),
        payload: { name: e instanceof Error ? e.name : typeof e },
      });
    }

    return { ok: true, event, duplicate: false, applyFailed };
  }

  eventPayloadJson(event: Stripe.Event): Prisma.InputJsonValue {
    return eventPayloadJson(event);
  }

  private async onCheckoutSessionCompleted(
    stripeEventId: string,
    session: Record<string, unknown>,
    ctx?: StripeBookingWebhookObs,
  ) {
    const sessionId = String(session.id ?? "");
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const booking = await this.findBookingForStripe({
      metadataBookingId: meta.bookingId,
      sessionId: sessionId || null,
      paymentIntentId: paymentIntentIdFrom(session),
    });
    if (!booking) {
      const hasMeta = Boolean(meta.bookingId?.trim());
      const hasSession = Boolean(sessionId.trim());
      if (!hasMeta && !hasSession) {
        await this.paymentReliability.recordAnomaly({
          kind: "metadata_missing_booking_id",
          stripeEventId,
          message:
            "checkout.session.completed: missing bookingId metadata and session id for correlation",
          details: { eventType: "checkout.session.completed", endpointPath: ctx?.endpointPath },
        });
      } else {
        await this.paymentReliability.recordAnomaly({
          kind: "unresolved_booking_correlation",
          stripeEventId,
          message:
            "checkout.session.completed: no booking matched metadata, session, or payment intent",
          details: { eventType: "checkout.session.completed", endpointPath: ctx?.endpointPath },
        });
      }
      this.log.warn(
        `Stripe booking webhook: no booking for checkout.session.completed (event=${stripeEventId})`,
      );
      return;
    }

    const paymentStatusRaw = String(session.payment_status ?? "");
    let next: BookingPaymentStatus;
    if (paymentStatusRaw === "paid") {
      next = BookingPaymentStatus.paid;
    } else if (paymentStatusRaw === "no_payment_required") {
      next = BookingPaymentStatus.paid;
    } else if (paymentStatusRaw === "unpaid") {
      next = BookingPaymentStatus.payment_pending;
    } else {
      next = BookingPaymentStatus.payment_pending;
    }

    const pi = paymentIntentIdFrom(session);
    const amountTotal =
      typeof session.amount_total === "number" ? session.amount_total : null;

    await this.persistBookingStripeUpdate({
      bookingId: booking.id,
      paymentStatus: next,
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: pi,
      stripeCustomerId:
        typeof session.customer === "string"
          ? session.customer
          : session.customer && typeof session.customer === "object" && session.customer !== null && "id" in session.customer
            ? String((session.customer as { id: string }).id)
            : booking.stripeCustomerId,
      paymentReference: sessionId,
      paymentCheckoutUrl: typeof session.url === "string" ? session.url : booking.paymentCheckoutUrl,
      amountCents: amountTotal,
      currency:
        typeof session.currency === "string" ? session.currency : booking.paymentCurrency ?? undefined,
      eventType: "checkout.session.completed",
      stripeEventId,
      note: `Stripe checkout.session.completed (${paymentStatusRaw})`,
    });
  }

  private async onCheckoutAsyncPaymentSucceeded(
    stripeEventId: string,
    session: Record<string, unknown>,
    ctx?: StripeBookingWebhookObs,
  ) {
    const sessionId = String(session.id ?? "");
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const booking = await this.findBookingForStripe({
      metadataBookingId: meta.bookingId,
      sessionId: sessionId || null,
      paymentIntentId: paymentIntentIdFrom(session),
    });
    if (!booking) {
      await this.paymentReliability.recordAnomaly({
        kind: "unresolved_booking_correlation",
        stripeEventId,
        message:
          "checkout.session.async_payment_succeeded: no booking matched metadata, session, or payment intent",
        details: { eventType: "checkout.session.async_payment_succeeded", endpointPath: ctx?.endpointPath },
      });
      this.log.warn(
        `Stripe booking webhook: no booking for checkout.session.async_payment_succeeded (event=${stripeEventId})`,
      );
      return;
    }

    const pi = paymentIntentIdFrom(session);
    await this.persistBookingStripeUpdate({
      bookingId: booking.id,
      paymentStatus: BookingPaymentStatus.paid,
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: pi,
      eventType: "checkout.session.async_payment_succeeded",
      stripeEventId,
      note: "Stripe async payment succeeded",
    });
  }

  private async onPaymentIntentAmountCapturableUpdated(
    stripeEventId: string,
    piObj: Record<string, unknown>,
    ctx?: StripeBookingWebhookObs,
  ) {
    const piId = String(piObj.id ?? "");
    const meta = (piObj.metadata ?? {}) as Record<string, string>;
    if (meta.servelinkPurpose !== "remaining_balance_authorization") return;

    const booking = await this.findBookingForStripe({
      metadataBookingId: meta.bookingId,
      sessionId: null,
      paymentIntentId: piId || null,
    });
    if (!booking) {
      this.log.warn(
        `Stripe booking webhook: no booking for payment_intent.amount_capturable_updated (event=${stripeEventId})`,
      );
      return;
    }

    const capturable =
      typeof piObj.amount_capturable === "number" ? piObj.amount_capturable : 0;
    if (capturable > 0) {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
          remainingBalanceAuthorizedAt: new Date(),
          remainingBalancePaymentIntentId: piId,
          remainingBalanceAuthorizationFailureReason: null,
        },
      });
    }
  }

  private async onCheckoutSessionExpired(
    stripeEventId: string,
    session: Record<string, unknown>,
    ctx?: StripeBookingWebhookObs,
  ) {
    const sessionId = String(session.id ?? "");
    const meta = (session.metadata ?? {}) as Record<string, string>;
    const booking = await this.findBookingForStripe({
      metadataBookingId: meta.bookingId,
      sessionId: sessionId || null,
      paymentIntentId: paymentIntentIdFrom(session),
    });
    if (!booking) {
      await this.paymentReliability.recordAnomaly({
        kind: "unresolved_booking_correlation",
        stripeEventId,
        message:
          "checkout.session.expired: no booking matched metadata, session, or payment intent",
        details: { eventType: "checkout.session.expired", endpointPath: ctx?.endpointPath },
      });
      this.log.warn(
        `Stripe booking webhook: no booking for checkout.session.expired (event=${stripeEventId})`,
      );
      return;
    }

    await this.persistBookingStripeUpdate({
      bookingId: booking.id,
      paymentStatus: BookingPaymentStatus.failed,
      stripeCheckoutSessionId: sessionId,
      stripePaymentIntentId: paymentIntentIdFrom(session),
      eventType: "checkout.session.expired",
      stripeEventId,
      note: "Checkout session expired (not paid)",
      payload: { sessionExpired: true },
    });
  }

  private async onPaymentIntentSucceeded(
    stripeEventId: string,
    piObj: Record<string, unknown>,
    ctx?: StripeBookingWebhookObs,
  ) {
    const piId = String(piObj.id ?? "");
    const meta = (piObj.metadata ?? {}) as Record<string, string>;
    const booking = await this.findBookingForStripe({
      metadataBookingId: meta.bookingId,
      sessionId: null,
      paymentIntentId: piId || null,
    });
    if (!booking) {
      if (!meta.bookingId?.trim() && !piId) {
        await this.paymentReliability.recordAnomaly({
          kind: "metadata_missing_booking_id",
          stripeEventId,
          message:
            "payment_intent.succeeded: missing bookingId metadata and payment intent id for correlation",
          details: { eventType: "payment_intent.succeeded", endpointPath: ctx?.endpointPath },
        });
      } else {
        await this.paymentReliability.recordAnomaly({
          kind: "unresolved_booking_correlation",
          stripeEventId,
          message:
            "payment_intent.succeeded: no booking matched metadata or payment intent",
          details: { eventType: "payment_intent.succeeded", endpointPath: ctx?.endpointPath },
        });
      }
      this.log.warn(
        `Stripe booking webhook: no booking for payment_intent.succeeded (event=${stripeEventId})`,
      );
      return;
    }

    if (meta.servelinkPurpose === "public_deposit") {
      await this.persistPublicDepositWebhookSuccess({
        bookingId: booking.id,
        paymentIntentId: piId,
        stripeEventId,
      });
      return;
    }

    if (meta.servelinkPurpose === "remaining_balance_authorization") {
      const status = String(piObj.status ?? "");
      if (status === "succeeded") {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_captured,
            remainingBalanceCapturedAt: new Date(),
            remainingBalancePaymentIntentId: piId,
          },
        });
      } else if (status === "requires_capture") {
        await this.prisma.booking.update({
          where: { id: booking.id },
          data: {
            remainingBalanceStatus: BookingRemainingBalancePaymentStatus.balance_authorized,
            remainingBalanceAuthorizedAt: new Date(),
            remainingBalancePaymentIntentId: piId,
          },
        });
      }
      return;
    }

    const status = String(piObj.status ?? "");
    let next: BookingPaymentStatus;
    if (status === "requires_capture") {
      next = BookingPaymentStatus.authorized;
    } else if (status === "succeeded") {
      next = BookingPaymentStatus.paid;
    } else {
      return;
    }

    const amount =
      typeof piObj.amount_received === "number"
        ? piObj.amount_received
        : typeof piObj.amount === "number"
          ? piObj.amount
          : null;

    await this.persistBookingStripeUpdate({
      bookingId: booking.id,
      paymentStatus: next,
      stripePaymentIntentId: piId,
      amountCents: amount,
      currency: typeof piObj.currency === "string" ? piObj.currency : undefined,
      eventType: "payment_intent.succeeded",
      stripeEventId,
      note: `Stripe payment_intent.succeeded (${status})`,
    });

    if (next === BookingPaymentStatus.paid) {
      const after = await this.prisma.booking.findUnique({
        where: { id: booking.id },
      });
      if (after && after.paymentStatus !== BookingPaymentStatus.paid) {
        await this.paymentReliability.recordAnomaly({
          bookingId: booking.id,
          stripeEventId,
          kind: "payment_intent_succeeded_booking_still_unpaid",
          severity: "critical",
          message:
            "payment_intent.succeeded expected paid status but booking.paymentStatus did not reconcile to paid",
          details: { observed: after.paymentStatus, endpointPath: ctx?.endpointPath },
        });
      }
    }
  }

  private async onPaymentIntentFailed(
    stripeEventId: string,
    piObj: Record<string, unknown>,
    ctx?: StripeBookingWebhookObs,
  ) {
    const piId = String(piObj.id ?? "");
    const meta = (piObj.metadata ?? {}) as Record<string, string>;
    const booking = await this.findBookingForStripe({
      metadataBookingId: meta.bookingId,
      sessionId: null,
      paymentIntentId: piId || null,
    });
    if (!booking) {
      await this.paymentReliability.recordAnomaly({
        kind: "unresolved_booking_correlation",
        stripeEventId,
        message:
          "payment_intent.payment_failed: no booking matched metadata or payment intent",
        details: { eventType: "payment_intent.payment_failed", endpointPath: ctx?.endpointPath },
      });
      this.log.warn(
        `Stripe booking webhook: no booking for payment_intent.payment_failed (event=${stripeEventId})`,
      );
      return;
    }

    if (meta.servelinkPurpose === "public_deposit") {
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          publicDepositStatus: BookingPublicDepositStatus.deposit_failed,
          publicDepositPaymentIntentId: piId,
        },
      });
      return;
    }

    if (meta.servelinkPurpose === "remaining_balance_authorization") {
      const err =
        (piObj.last_payment_error as { message?: string } | null)?.message ??
        "payment_failed";
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          remainingBalanceStatus:
            BookingRemainingBalancePaymentStatus.balance_authorization_failed,
          remainingBalanceAuthorizationFailureReason: String(err).slice(0, 500),
          remainingBalancePaymentIntentId: piId,
        },
      });
      return;
    }

    await this.persistBookingStripeUpdate({
      bookingId: booking.id,
      paymentStatus: BookingPaymentStatus.failed,
      stripePaymentIntentId: piId,
      eventType: "payment_intent.payment_failed",
      stripeEventId,
      note: "Stripe payment_intent.payment_failed",
      payload: {
        lastPaymentError: piObj.last_payment_error ?? null,
      },
    });
  }

  async ensureStripeCustomerForUser(args: {
    userId: string;
    email: string;
  }): Promise<string> {
    const stripe = this.requireStripe();
    const user = await this.prisma.user.findUnique({
      where: { id: args.userId },
      select: { stripeCustomerId: true, email: true },
    });
    if (!user) {
      throw new BadRequestException("USER_NOT_FOUND");
    }
    const existing = user.stripeCustomerId?.trim();
    if (existing) return existing;
    const customer = await stripe.customers.create({
      email: (args.email || user.email || "").trim() || undefined,
      metadata: { servelinkUserId: args.userId },
    });
    await this.prisma.user.update({
      where: { id: args.userId },
      data: { stripeCustomerId: customer.id },
    });
    return customer.id;
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async retrievePaymentIntentForRemainingBalanceAuth(paymentIntentId: string) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge.payment_method"],
    });
  }

  async createRemainingBalanceAuthorizationPaymentIntent(args: {
    bookingId: string;
    stripeCustomerId: string;
    paymentMethodId: string;
    amountCents: number;
    idempotencyKey: string;
  }) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.create(
      {
        amount: args.amountCents,
        currency: "usd",
        customer: args.stripeCustomerId,
        payment_method: args.paymentMethodId,
        capture_method: "manual",
        confirm: true,
        confirmation_method: "automatic",
        metadata: {
          bookingId: args.bookingId,
          servelinkPurpose: "remaining_balance_authorization",
        },
      },
      { idempotencyKey: args.idempotencyKey.slice(0, 255) },
    );
  }

  async captureRemainingBalancePaymentIntent(
    paymentIntentId: string,
    idempotencyKey: string,
  ) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.capture(
      paymentIntentId,
      {},
      { idempotencyKey: idempotencyKey.slice(0, 255) },
    );
  }

  async refundPaymentIntent(args: { paymentIntentId: string; idempotencyKey: string }) {
    const stripe = this.requireStripe();
    return stripe.refunds.create(
      { payment_intent: args.paymentIntentId },
      { idempotencyKey: args.idempotencyKey.slice(0, 255) },
    );
  }

  async createPublicBookingDepositPaymentIntent(args: {
    bookingId: string;
    stripeCustomerId: string;
    idempotencyKey: string;
    holdId?: string | null;
  }) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.create(
      {
        amount: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
        currency: "usd",
        customer: args.stripeCustomerId,
        automatic_payment_methods: { enabled: true },
        metadata: {
          ...this.buildPublicDepositMetadata({
            bookingId: args.bookingId,
            holdId: args.holdId,
          }),
        },
      },
      { idempotencyKey: args.idempotencyKey.slice(0, 255) },
    );
  }

  async confirmPaymentIntentWithPaymentMethod(args: {
    paymentIntentId: string;
    paymentMethodId: string;
    idempotencyKey: string;
  }) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.confirm(
      args.paymentIntentId,
      { payment_method: args.paymentMethodId },
      { idempotencyKey: args.idempotencyKey.slice(0, 255) },
    );
  }

  async createAndConfirmPublicDepositPaymentIntent(args: {
    bookingId: string;
    stripeCustomerId: string;
    paymentMethodId: string;
    idempotencyKey: string;
    holdId?: string | null;
  }) {
    const stripe = this.requireStripe();
    return stripe.paymentIntents.create(
      {
        amount: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
        currency: "usd",
        customer: args.stripeCustomerId,
        payment_method: args.paymentMethodId,
        confirmation_method: "automatic",
        confirm: true,
        metadata: {
          ...this.buildPublicDepositMetadata({
            bookingId: args.bookingId,
            holdId: args.holdId,
          }),
        },
      },
      { idempotencyKey: args.idempotencyKey.slice(0, 255) },
    );
  }

  /** Metadata-only helper so PM-based create matches Element-based PI shape. */
  buildPublicDepositMetadata(args: { bookingId: string; holdId?: string | null }) {
    const holdId = args.holdId?.trim() || "";
    return {
      bookingId: args.bookingId,
      ...(holdId ? { holdId } : {}),
      servelinkPurpose: "public_deposit",
    } as const;
  }

  private async persistPublicDepositWebhookSuccess(args: {
    bookingId: string;
    paymentIntentId: string;
    stripeEventId: string;
  }) {
    const snap = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
      select: { estimateSnapshot: { select: { outputJson: true } } },
    });
    const out = snap?.estimateSnapshot?.outputJson ?? null;
    let estimatedTotal = 0;
    if (out?.trim()) {
      try {
        const j = JSON.parse(out) as Record<string, unknown>;
        const v = j.estimatedPriceCents;
        if (typeof v === "number" && Number.isFinite(v)) {
          estimatedTotal = Math.max(0, Math.floor(v));
        }
      } catch {
        /* ignore */
      }
    }
    const remaining =
      estimatedTotal > 0
        ? Math.max(0, estimatedTotal - PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS)
        : null;

    await this.prisma.booking.update({
      where: { id: args.bookingId },
      data: {
        publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded,
        publicDepositPaidAt: new Date(),
        publicDepositPaymentIntentId: args.paymentIntentId,
        publicDepositAmountCents: PUBLIC_BOOKING_DEPOSIT_AMOUNT_CENTS,
        ...(estimatedTotal > 0
          ? {
              estimatedTotalCentsSnapshot: estimatedTotal,
              remainingBalanceAfterDepositCents: remaining,
              remainingBalanceStatus:
                initialRemainingBalanceStatusFromRemainingCents(remaining),
            }
          : {}),
      },
    });
  }

  private async findBookingForStripe(params: {
    metadataBookingId?: string | null;
    sessionId?: string | null;
    paymentIntentId?: string | null;
  }): Promise<Booking | null> {
    if (params.metadataBookingId?.trim()) {
      const b = await this.prisma.booking.findUnique({
        where: { id: params.metadataBookingId.trim() },
      });
      if (b) return b;
    }
    if (params.sessionId?.trim()) {
      const b = await this.prisma.booking.findFirst({
        where: { stripeCheckoutSessionId: params.sessionId.trim() },
      });
      if (b) return b;
    }
    if (params.paymentIntentId?.trim()) {
      const id = params.paymentIntentId.trim();
      const b = await this.prisma.booking.findFirst({
        where: {
          OR: [
            { stripePaymentIntentId: id },
            { publicDepositPaymentIntentId: id },
            { remainingBalancePaymentIntentId: id },
          ],
        },
      });
      if (b) return b;
    }
    return null;
  }

  private async persistBookingStripeUpdate(args: {
    bookingId: string;
    paymentStatus: BookingPaymentStatus;
    stripeCheckoutSessionId?: string | null;
    stripePaymentIntentId?: string | null;
    stripeCustomerId?: string | null;
    paymentReference?: string | null;
    paymentCheckoutUrl?: string | null;
    amountCents?: number | null;
    currency?: string | null;
    eventType: string;
    stripeEventId: string;
    note: string;
    payload?: Record<string, unknown>;
  }) {
    const beforeOuter = await this.prisma.booking.findUnique({
      where: { id: args.bookingId },
    });
    if (!beforeOuter) return;
    const prevOuter = beforeOuter.paymentStatus;
    if (
      prevOuter === BookingPaymentStatus.paid &&
      args.paymentStatus !== BookingPaymentStatus.paid &&
      args.paymentStatus !== BookingPaymentStatus.refunded
    ) {
      await this.paymentReliability.recordAnomaly({
        bookingId: args.bookingId,
        stripeEventId: args.stripeEventId,
        kind: "conflicting_payment_state",
        severity: "warning",
        message: `Stripe webhook would transition booking from paid to ${args.paymentStatus} (${args.eventType})`,
        details: { eventType: args.eventType },
      });
    }

    await this.prisma.$transaction(async (tx) => {
      const before = await tx.booking.findUnique({ where: { id: args.bookingId } });
      if (!before) return;

      const prev = before.paymentStatus;
      const mergedMeta: Prisma.InputJsonValue = {
        ...(before.paymentMeta &&
        typeof before.paymentMeta === "object" &&
        !Array.isArray(before.paymentMeta)
          ? (before.paymentMeta as Record<string, unknown>)
          : {}),
        stripe: {
          lastEventType: args.eventType,
          lastEventId: args.stripeEventId,
          ...(args.payload ?? {}),
        },
      };

      const patch: Prisma.BookingUpdateInput = {
        paymentStatus: args.paymentStatus,
        stripeLastEventId: args.stripeEventId,
        paymentMeta: mergedMeta,
      };

      if (args.stripeCheckoutSessionId != null) {
        patch.stripeCheckoutSessionId = args.stripeCheckoutSessionId;
      }
      if (args.stripePaymentIntentId != null) {
        patch.stripePaymentIntentId = args.stripePaymentIntentId;
      }
      if (args.stripeCustomerId != null) {
        patch.stripeCustomerId = args.stripeCustomerId;
      }
      if (args.paymentReference != null) {
        patch.paymentReference = args.paymentReference;
      }
      if (args.paymentCheckoutUrl != null) {
        patch.paymentCheckoutUrl = args.paymentCheckoutUrl;
      }
      if (args.amountCents != null && args.amountCents > 0) {
        patch.paymentAmountCents = Math.round(args.amountCents);
      }
      if (args.currency) {
        patch.paymentCurrency = args.currency.toLowerCase().slice(0, 3);
      }

      const now = new Date();
      if (args.paymentStatus === BookingPaymentStatus.authorized) {
        patch.paymentAuthorizedAt = now;
      }
      if (args.paymentStatus === BookingPaymentStatus.paid) {
        patch.paymentPaidAt = now;
      }
      if (args.paymentStatus === BookingPaymentStatus.failed) {
        patch.paymentFailedAt = now;
      }

      await tx.booking.update({
        where: { id: args.bookingId },
        data: patch,
      });

      if (prev !== args.paymentStatus) {
        await tx.bookingEvent.create({
          data: {
            bookingId: args.bookingId,
            type: BookingEventType.PAYMENT_STATUS_CHANGED,
            actorRole: "system",
            note: args.note,
            payload: {
              previousPaymentStatus: prev,
              nextStatus: args.paymentStatus,
              source: "stripe_webhook",
              stripeEventId: args.stripeEventId,
              stripeEventType: args.eventType,
            } as Prisma.InputJsonValue,
          },
        });
      }

      await tx.stripeWebhookReceipt.updateMany({
        where: { stripeEventId: args.stripeEventId },
        data: {
          bookingId: args.bookingId,
          bookingResolvedId: args.bookingId,
          ...(args.stripePaymentIntentId != null
            ? { stripePaymentIntentId: args.stripePaymentIntentId }
            : {}),
        },
      });
    });
  }
}
