import {
  isContinuityFirstService,
  shouldPreferPriorTeam,
  shouldServiceTypeActAsHardWhitelist,
} from "../src/modules/fo/service-matching-policy";

describe("service-matching-policy", () => {
  it("does not treat public residential deep clean as a hard matchableServiceTypes whitelist", () => {
    expect(
      shouldServiceTypeActAsHardWhitelist(
        "deep_clean",
        "residential",
        "public_one_time",
      ),
    ).toBe(false);
  });

  it("still enforces commercial allow-lists for deep clean", () => {
    expect(
      shouldServiceTypeActAsHardWhitelist(
        "deep_clean",
        "commercial",
        "public_one_time",
      ),
    ).toBe(true);
  });

  it("keeps strict whitelist for residential deep clean when booking mode is omitted", () => {
    expect(
      shouldServiceTypeActAsHardWhitelist("deep_clean", "residential", undefined),
    ).toBe(true);
  });

  it("keeps strict whitelist for move_in in public one-time residential", () => {
    expect(
      shouldServiceTypeActAsHardWhitelist(
        "move_in",
        "residential",
        "public_one_time",
      ),
    ).toBe(true);
  });

  it("marks continuity-first only for authenticated recurring maintenance-like services", () => {
    expect(
      isContinuityFirstService("maintenance", "authenticated_recurring"),
    ).toBe(true);
    expect(
      isContinuityFirstService("deep_clean", "authenticated_recurring"),
    ).toBe(true);
    expect(isContinuityFirstService("maintenance", "public_one_time")).toBe(
      false,
    );
    expect(isContinuityFirstService("move_in", "authenticated_recurring")).toBe(
      false,
    );
  });

  it("shouldPreferPriorTeam requires auth + continuity-first", () => {
    expect(
      shouldPreferPriorTeam("maintenance", "authenticated_recurring", true),
    ).toBe(true);
    expect(
      shouldPreferPriorTeam("maintenance", "authenticated_recurring", false),
    ).toBe(false);
  });
});
