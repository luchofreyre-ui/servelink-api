import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getFunnelUserPreferences, syncFunnelInteraction } from "./funnelSync";

describe("funnelSync", () => {
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

  it("syncFunnelInteraction persists last engaged problem", () => {
    syncFunnelInteraction("chip", { problemSlug: "dust-buildup", productSlug: "x" });
    expect(getFunnelUserPreferences().lastEngagedProblemSlug).toBe("dust-buildup");
  });

  it("getFunnelUserPreferences returns empty object when unset", () => {
    expect(getFunnelUserPreferences().lastEngagedProblemSlug).toBeUndefined();
  });
});
