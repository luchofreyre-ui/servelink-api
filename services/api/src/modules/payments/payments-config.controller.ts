import { Controller, Get } from "@nestjs/common";

/**
 * Public-safe Stripe config for the web client (publishable key only).
 * No JWT: publishable keys are designed to be exposed to browsers.
 */
@Controller("/api/v1/payments/config")
export class PaymentsConfigController {
  @Get()
  getConfig() {
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY?.trim() || null;
    return {
      publishableKey,
      currency: (process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
      enabled: Boolean(publishableKey),
    };
  }
}
