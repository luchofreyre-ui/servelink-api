import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { checkForMonetizationGaps, warnMonetizationExpansionGaps } from "./funnelGapExpansion";
import { buildFunnelGapReport } from "./funnelGapReport";

describe("checkForMonetizationGaps", () => {
  it("matches buildFunnelGapReport output", () => {
    expect(checkForMonetizationGaps()).toEqual(buildFunnelGapReport());
  });
});

describe("warnMonetizationExpansionGaps", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("logs when empty or warns per gap", () => {
    const gaps = buildFunnelGapReport();
    warnMonetizationExpansionGaps();
    if (gaps.length === 0) {
      expect(logSpy).toHaveBeenCalled();
    } else {
      expect(warnSpy).toHaveBeenCalled();
    }
  });
});
