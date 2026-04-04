import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearFunnelStageEvents,
  countFunnelStageInteractions,
  listRecentFunnelStageEvents,
  trackFunnelStageAction,
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

  it("trackFunnelStageAction stores client events", () => {
    trackFunnelStageAction("product_buy", { label: "x" });
    const counts = countFunnelStageInteractions();
    expect(counts.product_buy).toBe(1);
    expect(listRecentFunnelStageEvents(5)).toHaveLength(1);
  });
});
