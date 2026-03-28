/**
 * Pipeline encyclopedia crawl / sitemap audit (stdout JSON).
 * Run from apps/web: npm run audit:encyclopedia-crawl
 */
import {
  getEncyclopediaPipelineCrawlAuditRows,
  summarizeEncyclopediaCrawlAudit,
} from "../../src/lib/encyclopedia/crawlAudit";
import { getEncyclopediaSitemapInventory } from "../../src/lib/encyclopedia/sitemap";

const rows = getEncyclopediaPipelineCrawlAuditRows();
const summary = summarizeEncyclopediaCrawlAudit(rows);
const inventory = getEncyclopediaSitemapInventory();

const out = {
  summary,
  inventoryCounts: {
    navigation: inventory.navigationHrefs.length,
    clusterHubs: inventory.clusterHubHrefs.length,
    articles: inventory.articleHrefs.length,
    uniquePaths: inventory.allHrefs.length,
  },
  missingFromSitemap: rows.filter((r) => !r.inSitemap).map((r) => r.href),
  meshOrphans: rows.filter((r) => r.isOrphaned).map((r) => ({
    href: r.href,
    category: r.category,
    linkedFromClusterHub: r.linkedFromClusterHub,
    incomingLinks: r.incomingLinks,
  })),
};

// eslint-disable-next-line no-console -- CLI script
console.log(JSON.stringify(out, null, 2));
