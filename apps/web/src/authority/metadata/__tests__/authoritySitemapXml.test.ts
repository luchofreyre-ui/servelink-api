import { buildSitemapIndexXml, buildUrlSetXml } from "../authoritySitemapXml";

describe("authoritySitemapXml", () => {
  it("builds urlset xml", () => {
    const xml = buildUrlSetXml([
      {
        url: "https://www.nustandardcleaning.com/methods/degreasing",
        lastModified: "2026-03-23",
      },
    ]);

    expect(xml).toContain("<urlset");
    expect(xml).toContain("<loc>https://www.nustandardcleaning.com/methods/degreasing</loc>");
  });

  it("builds sitemap index xml", () => {
    const xml = buildSitemapIndexXml([
      {
        slug: "authority-core",
        urls: [],
      },
    ]);

    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("/sitemaps/authority-core.xml");
  });
});
