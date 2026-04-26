import {
  loadStripe,
  type Stripe,
  type StripeConstructorOptions,
} from "@stripe/stripe-js";

import { WEB_ENV } from "@/lib/env";

const publishableKey = WEB_ENV.stripePublishableKey;

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Stripe.js loader for Payment Element. Uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only.
 */
export function getStripeConstructorOptions(): StripeConstructorOptions {
  return {
    developerTools: {
      assistant: {
        enabled: WEB_ENV.stripeDebugToolsEnabled,
      },
    },
  };
}

export function getStripePromise(): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey, getStripeConstructorOptions());
  }
  return stripePromise;
}
