import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/analytics/funnelSync", () => ({
  syncFunnelInteraction: vi.fn(),
}));

import {
  countFunnelStageInteractions,
  listRecentFunnelStageEvents,
  trackFunnelStageAction,
  trackProductInteraction,
} from "./funnelStageAnalytics";

describe("funnelStageAnalytics", () => {
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("trackProductInteraction records a stage event", () => {
    trackProductInteraction("test_stage", "sku-a", { problemSlug: "dust-buildup" });
    const counts = countFunnelStageInteractions();
    expect(counts["product_interaction:test_stage"]).toBe(1);
  });

  it("trackFunnelStageAction stores client events", () => {
    trackFunnelStageAction("product_buy", { label: "x" });
    const counts = countFunnelStageInteractions();
    expect(counts.product_buy).toBe(1);
    expect(listRecentFunnelStageEvents(5)).toHaveLength(1);
  });
});
