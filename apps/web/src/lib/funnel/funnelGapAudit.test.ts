import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./funnelGapReport", () => ({
  buildFunnelGapReport: vi.fn(),
}));

import { buildFunnelGapReport } from "./funnelGapReport";
import { buildFunnelGapAuditLines, buildFunnelGapAuditText } from "./funnelGapAudit";

describe("funnel gap audit", () => {
  beforeEach(() => {
    vi.mocked(buildFunnelGapReport).mockReturnValue([]);
  });

  it("renders OK text when no gaps exist", () => {
    expect(buildFunnelGapAuditLines()).toEqual(["OK: no monetization funnel gaps detected."]);
    expect(buildFunnelGapAuditText()).toContain("OK: no monetization funnel gaps detected.");
  });

  it("formats a single gap as slug | code | detail", () => {
    vi.mocked(buildFunnelGapReport).mockReturnValue([
      {
        problemSlug: "test-problem",
        code: "missing_compare",
        detail: "No valid compare pair resolved.",
      },
    ]);
    expect(buildFunnelGapAuditLines()).toEqual([
      "test-problem | missing_compare | No valid compare pair resolved.",
    ]);
    expect(buildFunnelGapAuditText()).toBe(
      "test-problem | missing_compare | No valid compare pair resolved.",
    );
  });
});
