import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildFunnelGapReport } from "./funnelGapReport";
import {
  clearGapResolutionAudit,
  listGapResolutionAuditEntries,
  resolveAllGaps,
  resolveGap,
} from "./funnelGapResolution";

describe("funnelGapResolution", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  const store: Record<string, string> = {};

  beforeEach(() => {
    Object.keys(store).forEach((k) => {
      delete store[k];
    });
    vi.stubGlobal(
      "localStorage",
      {
        getItem: (k: string) => (k in store ? store[k]! : null),
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          Object.keys(store).forEach((k) => {
            delete store[k];
          });
        },
        length: 0,
        key: () => null,
      } as Storage,
    );
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    clearGapResolutionAudit();
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it("resolveGap logs the action", () => {
    resolveGap("dust-buildup", "acknowledge");
    expect(logSpy).toHaveBeenCalledWith("Monetization gap for dust-buildup has been acknowledge");
    expect(listGapResolutionAuditEntries()).toHaveLength(1);
  });

  it("resolveAllGaps logs once per unique problem slug with gaps", () => {
    const expectedCalls = new Set(buildFunnelGapReport().map((g) => g.problemSlug)).size;
    resolveAllGaps("suppress");
    expect(logSpy).toHaveBeenCalledTimes(expectedCalls);
  });
});
