import { describe, expect, it } from "vitest";

import { accumulateFunnelMetrics, computeCTR, mergeFunnelStageCounts } from "./funnelMetrics";

describe("accumulateFunnelMetrics", () => {
  it("aggregates multiple labels into stage counts", () => {
    expect(
      accumulateFunnelMetrics([
        "search_result_click:product:organic:title:top_result:position_0",
        "search_result_click:product:organic:title:non_top_result:position_2",
        "authority_close_buy:bona-hard-surface-floor-cleaner",
        "product_context_buy:sku",
      ]),
    ).toEqual({
      search_top_result: 1,
      search_non_top_result: 1,
      authority_close: 1,
      product_buy: 1,
    });
  });

  it("counts unknown for unrecognized labels", () => {
    expect(accumulateFunnelMetrics(["", "totally:unknown:label"])).toEqual({
      unknown: 2,
    });
  });
});

describe("mergeFunnelStageCounts", () => {
  it("adds live counts onto label-derived counts", () => {
    expect(
      mergeFunnelStageCounts(
        { search_top_result: 1 },
        { product_context: 2 },
      ),
    ).toEqual({
      search_top_result: 1,
      product_context: 2,
    });
  });
});

describe("computeCTR", () => {
  it("returns ratio when impressions > 0", () => {
    expect(computeCTR(3, 100)).toBe(0.03);
  });

  it("returns 0 when impressions is 0", () => {
    expect(computeCTR(5, 0)).toBe(0);
  });
});
