import { describe, expect, it } from "vitest";

import { buildFunnelGapReport } from "./funnelGapReport";

describe("buildFunnelGapReport", () => {
  it("has no gaps for monetized authority hubs", () => {
    expect(buildFunnelGapReport()).toEqual([]);
  });
});
