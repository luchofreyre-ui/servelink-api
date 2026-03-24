import type { PricingPolicyV1 } from "../billing/pricing.policy";

/**
 * Canonical cleaning pricing policy v1 — single source for:
 * - estimate/estimator (labor → customer quote cents)
 * - billing (hourly rate, increment, in-session grace)
 * - public GET /api/v1/pricing/cleaning
 *
 * Replace with DB/config when product needs dynamic pricing.
 */
export const CLEANING_PRICING_POLICY_V1 = {
  hourlyRateCents: 6500,
  billingIncrementMinutes: 15,
  /** GPS / billing session grace (matches BillingService historical behavior). */
  billingSessionGraceSeconds: 15 * 60,
  /** Customer-facing late grace window (public pricing API). */
  lateGraceMinutes: 120,
  exclusions: [
    "biohazards",
    "mold",
    "construction_debris",
    "hoarding",
    "exterior_windows",
    "heavy_furniture",
  ],
} as const;

export type CleaningPricingPolicyV1 = typeof CLEANING_PRICING_POLICY_V1;

/**
 * Platform fee applied when splitting a customer quote (same semantics as ledger splitCharge).
 */
export const PLATFORM_FEE_POLICY_V1: PricingPolicyV1 = {
  platformFeeBps: 2000,
  minPlatformFeeCents: 0,
};
