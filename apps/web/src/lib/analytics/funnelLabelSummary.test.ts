import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/funnelStageAnalytics", () => ({
  trackFunnelStageAction: vi.fn(),
}));

import { summarizeFunnelLabel } from "./funnelLabelSummary";

describe("summarizeFunnelLabel", () => {
  it("maps search injected top compare to search_top_result", () => {
    expect(
      summarizeFunnelLabel(
        "search_result_click:product_comparison:injected:title:top_result:position_0",
      ),
    ).toBe("search_top_result");
  });

  it("maps product context compare to compare_entry", () => {
    expect(summarizeFunnelLabel("product_context_compare:some-slug")).toBe("compare_entry");
  });

  it("maps product context buy to product_buy", () => {
    expect(summarizeFunnelLabel("product_context_buy:sku")).toBe("product_buy");
  });

  it("maps authority close buy to authority_close", () => {
    expect(summarizeFunnelLabel("authority_close_buy:bona-hard-surface-floor-cleaner")).toBe("authority_close");
  });

  it("returns unknown for malformed labels", () => {
    expect(summarizeFunnelLabel(null)).toBe("unknown");
    expect(summarizeFunnelLabel("")).toBe("unknown");
    expect(summarizeFunnelLabel("not-a-known-prefix:xyz")).toBe("unknown");
  });
});
