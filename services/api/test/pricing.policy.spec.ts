import { splitCharge, type PricingPolicyV1 } from "../src/modules/billing/pricing.policy";

const policy20: PricingPolicyV1 = { platformFeeBps: 2000, minPlatformFeeCents: 0 };

describe("splitCharge", () => {
  it("total=10000, bps=2000 => platformFee=2000, fo=8000", () => {
    const r = splitCharge(10000, policy20);
    expect(r.platformFeeCents).toBe(2000);
    expect(r.foEarningsCents).toBe(8000);
    expect(r.platformFeeCents + r.foEarningsCents).toBe(10000);
  });

  it("odd cents: total=999, bps=2000 => platformFee=200, fo=799", () => {
    const r = splitCharge(999, policy20);
    expect(r.platformFeeCents).toBe(200); // round(199.8) = 200
    expect(r.foEarningsCents).toBe(799);
    expect(r.platformFeeCents + r.foEarningsCents).toBe(999);
  });

  it("total=0 => both 0", () => {
    const r = splitCharge(0, policy20);
    expect(r.platformFeeCents).toBe(0);
    expect(r.foEarningsCents).toBe(0);
  });

  it("enforces minPlatformFeeCents", () => {
    const policy = { platformFeeBps: 0, minPlatformFeeCents: 50 };
    const r = splitCharge(100, policy);
    expect(r.platformFeeCents).toBe(50);
    expect(r.foEarningsCents).toBe(50);
    expect(r.platformFeeCents + r.foEarningsCents).toBe(100);
  });

  it("rejects negative totalCents", () => {
    expect(() => splitCharge(-1, policy20)).toThrow(/non-negative integer/);
  });

  it("rejects non-integer totalCents", () => {
    expect(() => splitCharge(10.5, policy20)).toThrow(/non-negative integer/);
  });
});
