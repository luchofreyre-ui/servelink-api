import {
  getAuthorityComparisonEntries,
  getAuthorityMethodComboEntries,
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
});
