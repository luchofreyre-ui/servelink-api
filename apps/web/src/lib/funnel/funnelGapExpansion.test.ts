import { describe, expect, it } from "vitest";

import { checkForMonetizationGaps } from "./funnelGapExpansion";
import { buildFunnelGapReport } from "./funnelGapReport";

describe("checkForMonetizationGaps", () => {
  it("matches buildFunnelGapReport output", () => {
    expect(checkForMonetizationGaps()).toEqual(buildFunnelGapReport());
  });
});
