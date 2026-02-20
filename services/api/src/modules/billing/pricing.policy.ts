export type PricingPolicyV1 = {
  platformFeeBps: number; // e.g. 2000 = 20%
  minPlatformFeeCents: number; // e.g. 0 for now
};

export type SplitChargeResult = {
  platformFeeCents: number;
  foEarningsCents: number;
};

/**
 * Splits total charge into platform fee and FO earnings.
 * totalCents must be >= 0 integer.
 * platformFee = round(total * bps / 10000), then enforced >= minPlatformFeeCents.
 * foEarningsCents = totalCents - platformFeeCents.
 * Invariants: platformFeeCents >= 0, foEarningsCents >= 0, platformFeeCents + foEarningsCents === totalCents.
 */
export function splitCharge(
  totalCents: number,
  policy: PricingPolicyV1,
): SplitChargeResult {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new Error("splitCharge: totalCents must be a non-negative integer");
  }
  if (totalCents === 0) {
    return { platformFeeCents: 0, foEarningsCents: 0 };
  }
  // platformFee = round(total * bps / 10000) — banker-safe (standard round)
  let platformFeeCents = Math.round((totalCents * policy.platformFeeBps) / 10000);
  platformFeeCents = Math.max(platformFeeCents, policy.minPlatformFeeCents);
  const foEarningsCents = totalCents - platformFeeCents;
  if (foEarningsCents < 0) {
    // clamp so sum stays exact (e.g. min fee > total)
    return { platformFeeCents: totalCents, foEarningsCents: 0 };
  }
  return { platformFeeCents, foEarningsCents };
}
