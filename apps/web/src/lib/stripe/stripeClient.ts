import { loadStripe, type Stripe } from "@stripe/stripe-js";

const publishableKey =
  typeof process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY === "string"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.trim()
    : "";

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Stripe.js loader for Payment Element. Uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only.
 */
export function getStripePromise(): Promise<Stripe | null> | null {
  if (!publishableKey) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}
