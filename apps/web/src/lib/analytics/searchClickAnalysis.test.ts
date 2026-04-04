import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetProductClickDataForTests } from "@/lib/products/productClickData";

import {
  trackSearchResultClick,
  trackSearchResultClickWithQuery,
} from "./searchClickAnalysis";

describe("searchClickAnalysis", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetProductClickDataForTests();
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("trackSearchResultClick logs in non-production when problemSlug is set", () => {
    trackSearchResultClick({
      productSlug: "test-product",
      problemSlug: "dust-buildup",
      searchQuery: "dust",
    });
    expect(logSpy).toHaveBeenCalled();
  });

  it("trackSearchResultClickWithQuery resolves hub from query text", () => {
    trackSearchResultClickWithQuery("some-slug", "dust buildup");
    expect(logSpy).toHaveBeenCalled();
  });
});
