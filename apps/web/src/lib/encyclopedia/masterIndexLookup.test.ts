import { describe, expect, it } from "vitest";

import {
  buildMasterIndexLookupFromEntries,
  candidateExistsInMasterIndex,
} from "./masterIndexLookup";

describe("masterIndexLookup", () => {
  it("candidateExistsInMasterIndex matches id", () => {
    const lookup = buildMasterIndexLookupFromEntries([{ id: "GAP-P-X", slug: "other-slug" }]);
    expect(candidateExistsInMasterIndex(lookup, { id: "GAP-P-X", slug: "new-slug" })).toBe(true);
  });

  it("candidateExistsInMasterIndex matches slug", () => {
    const lookup = buildMasterIndexLookupFromEntries([{ id: "OTHER", slug: "degreasing-on-glass" }]);
    expect(
      candidateExistsInMasterIndex(lookup, { id: "GAP-P-DEGREASING-ON-GLASS", slug: "degreasing-on-glass" }),
    ).toBe(true);
  });

  it("candidateExistsInMasterIndex false when both new", () => {
    const lookup = buildMasterIndexLookupFromEntries([{ id: "A", slug: "a" }]);
    expect(candidateExistsInMasterIndex(lookup, { id: "B", slug: "b" })).toBe(false);
  });

  it("candidateExistsInMasterIndex matches promote slug via normalizedSlug", () => {
    const lookup = buildMasterIndexLookupFromEntries([{ id: "OTHER", slug: "neutral-surface-cleaning-glass" }]);
    expect(
      candidateExistsInMasterIndex(lookup, {
        id: "GAP-M-X",
        slug: "neutral-surface-cleaning-glass-surfaces",
        normalizedSlug: "neutral-surface-cleaning-glass",
      }),
    ).toBe(true);
  });
});
