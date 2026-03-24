import { describe, expect, it } from "vitest";
import { governanceStatusBadgeClass, governanceStatusLabel } from "./deepCleanEstimatorGovernanceMappers";

describe("deepCleanEstimatorGovernanceMappers", () => {
  it("maps status labels and badge classes", () => {
    expect(governanceStatusLabel("active")).toBe("Active");
    expect(governanceStatusBadgeClass("active")).toMatch(/emerald/);
    expect(governanceStatusBadgeClass("draft")).toMatch(/amber/);
    expect(governanceStatusBadgeClass("archived")).toMatch(/slate/);
  });
});
