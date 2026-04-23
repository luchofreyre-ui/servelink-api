import {
  deriveFoSupplyQueueState,
  mergeFoSupplyReasonCodes,
} from "../src/modules/fo/fo-supply-queue";

describe("deriveFoSupplyQueueState", () => {
  it("classifies active FO with readiness + eligibility as ACTIVE_AND_READY", () => {
    expect(
      deriveFoSupplyQueueState({
        opsCategory: "ready",
        supply: { ok: true, reasons: [] },
        eligibility: { reasons: [] },
      }),
    ).toBe("ACTIVE_AND_READY");
  });

  it("classifies active FO with blocked ops category as ACTIVE_BUT_BLOCKED", () => {
    expect(
      deriveFoSupplyQueueState({
        opsCategory: "blocked_configuration",
        supply: { ok: false, reasons: ["FO_MISSING_COORDINATES"] },
        eligibility: {
          reasons: ["FO_MISSING_COORDINATES", "FO_NOT_ACTIVE"],
        },
      }),
    ).toBe("ACTIVE_BUT_BLOCKED");
  });

  it("classifies paused FO with supply ok and only FO_NOT_ACTIVE as READY_TO_ACTIVATE", () => {
    expect(
      deriveFoSupplyQueueState({
        opsCategory: "inactive_or_restricted",
        supply: { ok: true, reasons: [] },
        eligibility: { reasons: ["FO_NOT_ACTIVE"] },
        execution: { ok: true, reasons: [] },
      }),
    ).toBe("READY_TO_ACTIVATE");
  });

  it("does not classify paused as READY_TO_ACTIVATE when execution is blocked", () => {
    expect(
      deriveFoSupplyQueueState({
        opsCategory: "inactive_or_restricted",
        supply: { ok: true, reasons: [] },
        eligibility: { reasons: ["FO_NOT_ACTIVE"] },
        execution: { ok: false, reasons: ["FO_MISSING_PROVIDER_LINK"] },
      }),
    ).toBe("BLOCKED_CONFIGURATION");
  });

  it("inactive FO with failed supply is BLOCKED_CONFIGURATION", () => {
    expect(
      deriveFoSupplyQueueState({
        opsCategory: "inactive_or_restricted",
        supply: { ok: false, reasons: ["FO_NO_SCHEDULING_SOURCE"] },
        eligibility: { reasons: ["FO_NOT_ACTIVE"] },
      }),
    ).toBe("BLOCKED_CONFIGURATION");
  });

  it("inactive with supply ok but safety hold reasons is BLOCKED_CONFIGURATION", () => {
    expect(
      deriveFoSupplyQueueState({
        opsCategory: "inactive_or_restricted",
        supply: { ok: true, reasons: [] },
        eligibility: { reasons: ["FO_NOT_ACTIVE", "FO_SAFETY_HOLD"] },
      }),
    ).toBe("BLOCKED_CONFIGURATION");
  });
});

describe("mergeFoSupplyReasonCodes", () => {
  it("merges and dedupes supply + eligibility reason codes", () => {
    expect(
      mergeFoSupplyReasonCodes({
        opsCategory: "inactive_or_restricted",
        supply: { ok: false, reasons: ["FO_MISSING_COORDINATES"] },
        eligibility: {
          reasons: ["FO_NOT_ACTIVE", "FO_MISSING_COORDINATES"],
        },
      }).sort(),
    ).toEqual(["FO_MISSING_COORDINATES", "FO_NOT_ACTIVE"].sort());
  });

  it("includes execution reason codes in merge", () => {
    expect(
      mergeFoSupplyReasonCodes({
        opsCategory: "blocked_configuration",
        supply: { ok: true, reasons: [] },
        eligibility: { reasons: ["FO_NOT_ACTIVE"] },
        execution: { ok: false, reasons: ["FO_MISSING_PROVIDER_LINK"] },
      }).sort(),
    ).toEqual(["FO_MISSING_PROVIDER_LINK", "FO_NOT_ACTIVE"].sort());
  });
});
