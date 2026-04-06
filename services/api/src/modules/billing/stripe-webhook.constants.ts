/**
 * Single public Stripe webhook URL for the API (signature verification + idempotent ingress).
 * Configure this path in the Stripe Dashboard webhook endpoint settings.
 *
 * Legacy: POST /api/v1/bookings/stripe/webhook was removed; all traffic must use this path.
 */
export const STRIPE_WEBHOOK_HTTP_PATH = "/api/v1/stripe/webhook" as const;
