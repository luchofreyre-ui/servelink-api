import { afterEach, describe, expect, it, vi } from "vitest";

import { formatFunnelReportAsText, generateFunnelReport } from "./funnelAnalyticsReporting";

describe("generateFunnelReport", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns structured data with serverOnly when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    const data = generateFunnelReport({ sessionLabel: "test" });
    expect(data.serverOnly).toBe(true);
    expect(data.sessionLabel).toBe("test");
    const parsed = JSON.parse(formatFunnelReportAsText(data)) as { serverOnly: boolean };
    expect(parsed.serverOnly).toBe(true);
  });
});
