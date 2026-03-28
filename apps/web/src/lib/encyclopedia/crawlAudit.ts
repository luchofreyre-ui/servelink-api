import { getEncyclopediaClusterIndexRollups, getResolvedEncyclopediaIndex } from "./loader";
import type { EncyclopediaClusterRollup } from "./types";
import { getEncyclopediaSitemapInventory } from "./sitemap";

export interface EncyclopediaPipelineCrawlAuditRow {
  id: string;
  slug: string;
  /** Path e.g. `/encyclopedia/problems/soap-scum` */
  href: string;
  category: string;
  /** Included in encyclopedia sitemap inventory (expected true for all rows here). */
  inSitemap: boolean;
  /** Inbound edges from other entries’ auto-generated linked groups (see loader graph). */
  incomingLinks: number;
  /** Linked from this entry’s topic cluster hub (featured or section lists). */
  linkedFromClusterHub: boolean;
  /** At least one peer page cites this id via linkedGroups. */
  linkedFromRelatedGroups: boolean;
  /** Always true: `/encyclopedia/{category}` lists every published file-backed article. */
  listedOnCategoryIndex: boolean;
  /**
   * True when the page is absent from both cluster-hub lists and peer linkedGroups
   * (no inbound graph signal). It may still be listed on `/encyclopedia/{category}` and in the sitemap.
   */
  isOrphaned: boolean;
}

function buildClusterSlugToLinkedIds(
  rollups: EncyclopediaClusterRollup[],
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>();
  for (const rollup of rollups) {
    const ids = new Set<string>();
    for (const e of rollup.featuredEntries) {
      ids.add(e.id);
    }
    for (const section of rollup.sections) {
      for (const e of section.entries) {
        ids.add(e.id);
      }
    }
    map.set(rollup.cluster, ids);
  }
  return map;
}

/**
 * One row per published, file-backed encyclopedia article (pipeline index + disk).
 * Uses resolved graph signals and cluster rollups only — no legacy authority imports.
 */
export function getEncyclopediaPipelineCrawlAuditRows(): EncyclopediaPipelineCrawlAuditRow[] {
  const entries = getResolvedEncyclopediaIndex().filter(
    (e) => e.status === "published" && e.fileExists === true,
  );
  const sitemapPaths = new Set(getEncyclopediaSitemapInventory().allHrefs);
  const rollups = getEncyclopediaClusterIndexRollups();
  const clusterTargets = buildClusterSlugToLinkedIds(rollups);

  return entries.map((entry) => {
    const hubIds = clusterTargets.get(entry.cluster);
    const linkedFromClusterHub = hubIds?.has(entry.id) ?? false;
    const linkedFromRelatedGroups = entry.incomingLinks > 0;

    const inSitemap = sitemapPaths.has(entry.href);

    const listedOnCategoryIndex = true;

    const isOrphaned = !linkedFromClusterHub && !linkedFromRelatedGroups;

    return {
      id: entry.id,
      slug: entry.slug,
      href: entry.href,
      category: entry.category,
      inSitemap,
      incomingLinks: entry.incomingLinks,
      linkedFromClusterHub,
      linkedFromRelatedGroups,
      listedOnCategoryIndex,
      isOrphaned,
    };
  });
}

export function summarizeEncyclopediaCrawlAudit(rows: EncyclopediaPipelineCrawlAuditRow[]): {
  total: number;
  missingFromSitemap: number;
  /** Rows with `isOrphaned` (no hub + no inbound linked-group edges). */
  meshOrphanCount: number;
} {
  let missingFromSitemap = 0;
  let meshOrphanCount = 0;
  for (const r of rows) {
    if (!r.inSitemap) missingFromSitemap += 1;
    if (r.isOrphaned) meshOrphanCount += 1;
  }
  return {
    total: rows.length,
    missingFromSitemap,
    meshOrphanCount,
  };
}
