import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildFunnelGapReport } from "./funnelGapReport";
import { resolveAllGaps, resolveGap } from "./funnelGapResolution";

describe("funnelGapResolution", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("resolveGap logs the action", () => {
    resolveGap("dust-buildup", "acknowledge");
    expect(logSpy).toHaveBeenCalledWith("Monetization gap for dust-buildup has been acknowledge");
  });

  it("resolveAllGaps logs once per unique problem slug with gaps", () => {
    const expectedCalls = new Set(buildFunnelGapReport().map((g) => g.problemSlug)).size;
    resolveAllGaps("suppress");
    expect(logSpy).toHaveBeenCalledTimes(expectedCalls);
  });
});
