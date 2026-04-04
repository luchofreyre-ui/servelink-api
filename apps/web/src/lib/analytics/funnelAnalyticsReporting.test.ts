import { afterEach, describe, expect, it, vi } from "vitest";

import { formatFunnelReportAsText, generateFunnelReport } from "./funnelAnalyticsReporting";

describe("generateFunnelReport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns structured server-safe data when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    const data = generateFunnelReport({ sessionLabel: "test" });
    expect(data.serverOnly).toBe(true);
    expect(data.sessionLabel).toBe("test");
    expect(data.preferences).toEqual({});
    expect(data.interactions).toEqual({});
    expect(data.events).toEqual([]);
    expect(formatFunnelReportAsText(data)).toContain("browser");
  });
});
