import { isCronDisabledByExplicitFalse } from "../src/modules/billing/payment-lifecycle-cron-env";

describe("payment-lifecycle-cron-env", () => {
  it("treats unset as enabled (not disabled)", () => {
    expect(isCronDisabledByExplicitFalse(undefined)).toBe(false);
    expect(isCronDisabledByExplicitFalse("")).toBe(false);
    expect(isCronDisabledByExplicitFalse("true")).toBe(false);
    expect(isCronDisabledByExplicitFalse("0")).toBe(false);
  });

  it("disables only on explicit false", () => {
    expect(isCronDisabledByExplicitFalse("false")).toBe(true);
    expect(isCronDisabledByExplicitFalse("FALSE")).toBe(true);
    expect(isCronDisabledByExplicitFalse("  false  ")).toBe(true);
  });
});
