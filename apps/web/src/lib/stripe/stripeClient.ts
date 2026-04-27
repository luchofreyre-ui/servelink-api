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
  if (process.env.NODE_ENV === "production") {
    if (process.env.NEXT_PUBLIC_STRIPE_DEBUG_TOOLS === "true") {
      throw new Error(
        "NEXT_PUBLIC_STRIPE_DEBUG_TOOLS must not be enabled in production.",
      );
    }
    return undefined;
  }
  if (process.env.NEXT_PUBLIC_STRIPE_DEBUG_TOOLS !== "true") {
    return undefined;
  }

  const stripeOptions = {
    developerTools: {
      assistant: {
        enabled: true,
      },
    },
  } satisfies StripeConstructorOptions;

  return stripeOptions;
}

export function loadStripeWithProductionLock(
  nextPublishableKey: string,
): Promise<Stripe | null> {
  const stripeOptions = getStripeConstructorOptions();
  return stripeOptions
    ? loadStripe(nextPublishableKey, stripeOptions)
    : loadStripe(nextPublishableKey);
}

export function getStripePromise(): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  if (!stripePromise) {
    stripePromise = loadStripeWithProductionLock(publishableKey);
  }
  return stripePromise;
}
