import {
  getAuthorityComparisonEntries,
  getAuthorityMethodDetailEntries,
  getAuthorityMethodComboEntries,
  getAuthorityProblemDetailEntries,
  getAuthoritySitemapSections,
  getAuthorityStaticIndexEntries,
} from "../authoritySitemapSelectors";

describe("authoritySitemapSelectors", () => {
  it("returns static index entries", () => {
    const entries = getAuthorityStaticIndexEntries();
    expect(entries.length).toBeGreaterThan(0);
  });

  it("returns method combo entries", () => {
    const entries = getAuthorityMethodComboEntries();
    expect(entries.length).toBeGreaterThan(0);
  });

  it("returns comparison entries", () => {
    const entries = getAuthorityComparisonEntries();
    expect(entries.length).toBeGreaterThan(0);
  });

  it("returns sitemap sections", () => {
    const sections = getAuthoritySitemapSections();
    expect(sections.length).toBeGreaterThan(0);
    expect(sections.some((section) => section.slug === "authority-core")).toBe(true);
  });

  it("uses encyclopedia locs for migrated method and problem detail URLs", () => {
    const methodUrls = getAuthorityMethodDetailEntries().map((e) => e.url);
    expect(
      methodUrls.some((u) => u === "https://www.nustandardcleaning.com/encyclopedia/methods/degreasing"),
    ).toBe(true);

    const problemUrls = getAuthorityProblemDetailEntries().map((e) => e.url);
    expect(
      problemUrls.some(
        (u) => u === "https://www.nustandardcleaning.com/encyclopedia/problems/grease-buildup",
      ),
    ).toBe(true);
  });
});
