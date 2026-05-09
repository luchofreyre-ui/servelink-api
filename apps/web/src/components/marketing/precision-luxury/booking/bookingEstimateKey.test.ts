import { describe, expect, it } from "vitest";
import { buildEstimateRequestKey } from "./bookingEstimateKey";

describe("buildEstimateRequestKey", () => {
  it("ignores recurringInterest.note so estimator preview keys stay stable", () => {
    const base = {
      serviceId: "deep-clean",
      recurringInterest: { interested: true, cadence: "weekly" as const },
    };
    const withNote = {
      ...base,
      recurringInterest: {
        ...base.recurringInterest,
        note: "back gate code 1234",
      },
    };
    expect(buildEstimateRequestKey(base)).toEqual(buildEstimateRequestKey(withNote));
  });

  it("drops recurringInterest when interested is not true (team-prep-only transport)", () => {
    const base = { serviceId: "deep-clean" };
    const withPrep = {
      ...base,
      recurringInterest: { interested: false, note: "Lockbox 1" },
    };
    expect(buildEstimateRequestKey(base)).toEqual(buildEstimateRequestKey(withPrep));
  });

  it("still distinguishes recurring cadence changes", () => {
    const a = {
      recurringInterest: { interested: true, cadence: "weekly" as const },
    };
    const b = {
      recurringInterest: { interested: true, cadence: "monthly" as const },
    };
    expect(buildEstimateRequestKey(a)).not.toEqual(buildEstimateRequestKey(b));
  });
});
