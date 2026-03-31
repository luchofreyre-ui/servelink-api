import { describe, expect, it } from "vitest";

import { parseSortCombo } from "../diagnosisCategoryFilterOptions";

describe("parseSortCombo", () => {
  it("splits sortBy and direction", () => {
    expect(parseSortCombo("confidence:desc")).toEqual({
      sortBy: "confidence",
      sortDirection: "desc",
    });
    expect(parseSortCombo("recent:asc")).toEqual({
      sortBy: "recent",
      sortDirection: "asc",
    });
  });
});
