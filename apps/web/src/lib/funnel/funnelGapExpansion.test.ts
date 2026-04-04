import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  autoResolveGaps,
  checkForMonetizationGaps,
  checkForResearchGaps,
  warnMonetizationExpansionGaps,
} from "./funnelGapExpansion";
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

describe("checkForResearchGaps", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns only for missing_research gaps", () => {
    checkForResearchGaps();
    const gaps = buildFunnelGapReport().filter((g) => g.code === "missing_research");
    expect(warnSpy.mock.calls.length).toBe(gaps.length);
  });
});

describe("autoResolveGaps", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("calls resolve for each missing_compare gap", () => {
    const n = buildFunnelGapReport().filter((g) => g.code === "missing_compare").length;
    autoResolveGaps();
    expect(logSpy.mock.calls.length).toBeGreaterThanOrEqual(n);
  });
});
