import { describe, expect, it } from "vitest";

import { checkSearchMonetization } from "./searchMonetizationChecks";
import { buildFunnelGapReport } from "@/lib/funnel/funnelGapReport";

describe("checkSearchMonetization", () => {
  it("returns no issues when a query does not match a stackable hub", () => {
    const r = checkSearchMonetization("random query xyz");
    expect(r.resolvedProblemSlug).toBeNull();
    expect(r.issues).toEqual([]);
  });

  it("aligns issues with funnel gap report for a resolved alias query", () => {
    const r = checkSearchMonetization("dust buildup");
    expect(r.resolvedProblemSlug).toBe("dust-buildup");
    const expected = buildFunnelGapReport()
      .filter((g) => g.problemSlug === "dust-buildup")
      .map((g) => `${g.code}: ${g.detail}`);
    expect(r.issues).toEqual(expected);
  });
});
