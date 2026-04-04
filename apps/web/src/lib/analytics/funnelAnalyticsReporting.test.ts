import { afterEach, describe, expect, it, vi } from "vitest";

import { generateFunnelReport } from "./funnelAnalyticsReporting";

describe("generateFunnelReport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns a server-safe notice when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    const text = generateFunnelReport({ sessionLabel: "test" });
    expect(text).toContain("Funnel performance report (test)");
    expect(text).toContain("browser");
  });
});
