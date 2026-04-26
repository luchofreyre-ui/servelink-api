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
export function getStripeConstructorOptions(): StripeConstructorOptions | undefined {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_STRIPE_DEBUG_TOOLS !== "true"
  ) {
    return undefined;
  }

  return {
    developerTools: {
      assistant: {
        enabled: true,
      },
    },
  };
}

export function getStripePromise(): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  if (!stripePromise) {
    const stripeOptions = getStripeConstructorOptions();
    stripePromise = stripeOptions
      ? loadStripe(publishableKey, stripeOptions)
      : loadStripe(publishableKey);
  }
  return stripePromise;
}
