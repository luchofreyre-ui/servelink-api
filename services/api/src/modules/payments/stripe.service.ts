import { Injectable, InternalServerErrorException } from "@nestjs/common";
import Stripe from "stripe";

@Injectable()
export class StripeService {
  private readonly stripe: Stripe | null;
  private readonly currency: string;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    this.currency = process.env.STRIPE_CURRENCY || "usd";

    this.stripe = secretKey
      ? new Stripe(secretKey, {
          apiVersion: "2025-01-27.acacia" as any,
          typescript: true,
        })
      : null;
  }

  private requireClient() {
    if (!this.stripe) {
      throw new InternalServerErrorException(
        "Stripe is not configured. Set STRIPE_SECRET_KEY.",
      );
    }

    return this.stripe;
  }

  async createPaymentIntent(input: {
    bookingId: string;
    amount: number;
    customerEmail?: string | null;
    metadata?: Record<string, string>;
  }) {
    const stripe = this.requireClient();

    const amountInCents = Math.round(input.amount * 100);

    return stripe.paymentIntents.create({
      amount: amountInCents,
      currency: this.currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: input.customerEmail ?? undefined,
      metadata: {
        bookingId: input.bookingId,
        ...(input.metadata ?? {}),
      },
    });
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    const stripe = this.requireClient();
    return stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async constructWebhookEvent(input: {
    signature: string;
    payload: Buffer | string;
  }) {
    const stripe = this.requireClient();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new InternalServerErrorException(
        "Stripe webhook secret is not configured.",
      );
    }

    return stripe.webhooks.constructEvent(
      input.payload,
      input.signature,
      webhookSecret,
    );
  }
}
