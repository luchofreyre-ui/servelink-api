import { describe, expect, it } from "vitest";

import { parseSearchResultLabel } from "./searchResultLabelParser";

describe("parseSearchResultLabel", () => {
  it("parses a valid injected compare title top result label", () => {
    expect(
      parseSearchResultLabel(
        "search_result_click:product_comparison:injected:title:top_result:position_0",
      ),
    ).toEqual({
      event: "search_result_click",
      rowType: "product_comparison",
      sourceBucket: "injected",
      clickSurface: "title",
      topBucket: "top_result",
      position: 0,
    });
  });

  it("parses a valid organic product open_page non-top label", () => {
    expect(
      parseSearchResultLabel(
        "search_result_click:product:organic:open_page:non_top_result:position_2",
      ),
    ).toEqual({
      event: "search_result_click",
      rowType: "product",
      sourceBucket: "organic",
      clickSurface: "open_page",
      topBucket: "non_top_result",
      position: 2,
    });
  });

  it("returns null for malformed labels", () => {
    expect(parseSearchResultLabel(null)).toBeNull();
    expect(parseSearchResultLabel("")).toBeNull();
    expect(parseSearchResultLabel("search_result_click:only_three")).toBeNull();
    expect(parseSearchResultLabel("wrong_event:product:organic:title:top_result:position_0")).toBeNull();
    expect(
      parseSearchResultLabel("search_result_click:product:badsource:title:top_result:position_0"),
    ).toBeNull();
  });
});
