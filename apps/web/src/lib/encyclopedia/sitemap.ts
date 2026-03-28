import {
  getAllEncyclopediaCategories,
  getEncyclopediaClusterSlugs,
  getResolvedEncyclopediaIndex,
} from "./loader";
import { buildEncyclopediaCategoryHref } from "./slug";
import type { EncyclopediaCategory } from "./types";

/** Published + markdown on disk — same gate as public article routes. */
export function listPublishedFileBackedEncyclopediaHrefs(): string[] {
  const entries = getResolvedEncyclopediaIndex().filter(
    (e) => e.status === "published" && e.fileExists === true,
  );
  return [...new Set(entries.map((e) => e.href))].sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Cluster hub routes derived from pipeline rollups (published problems/methods/surfaces only). */
export function listEncyclopediaClusterHubHrefs(): string[] {
  return getEncyclopediaClusterSlugs().map(
    (slug) => `/encyclopedia/clusters/${slug}`,
  );
}

export function listEncyclopediaCategoryListingHrefs(): string[] {
  return getAllEncyclopediaCategories().map((c) =>
    buildEncyclopediaCategoryHref(c),
  );
}

const ENCYCLOPEDIA_ROOT_HREFS = ["/encyclopedia", "/encyclopedia/clusters"] as const;

export interface EncyclopediaSitemapInventory {
  /** Article detail paths */
  articleHrefs: string[];
  /** `/encyclopedia/clusters/{slug}` */
  clusterHubHrefs: string[];
  /** `/encyclopedia`, `/encyclopedia/clusters`, `/encyclopedia/{category}` */
  navigationHrefs: string[];
  /** Deduped union (articles + hubs + nav) */
  allHrefs: string[];
}

/**
 * Full path inventory for pipeline encyclopedia URLs (no origin).
 * Source of truth: resolved index + cluster slug rollup layer.
 */
export function getEncyclopediaSitemapInventory(): EncyclopediaSitemapInventory {
  const articleHrefs = listPublishedFileBackedEncyclopediaHrefs();
  const clusterHubHrefs = listEncyclopediaClusterHubHrefs();
  const categoryHrefs = listEncyclopediaCategoryListingHrefs();
  const navigationHrefs = [
    ...ENCYCLOPEDIA_ROOT_HREFS,
    ...categoryHrefs,
  ].sort((a, b) => a.localeCompare(b));

  const seen = new Set<string>();
  const allHrefs: string[] = [];
  for (const h of [
    ...navigationHrefs,
    ...clusterHubHrefs,
    ...articleHrefs,
  ]) {
    if (seen.has(h)) continue;
    seen.add(h);
    allHrefs.push(h);
  }

  return {
    articleHrefs,
    clusterHubHrefs,
    navigationHrefs,
    allHrefs,
  };
}

/** Absolute URLs for Next.js `MetadataRoute.Sitemap`. */
export function buildEncyclopediaSitemapAbsoluteUrls(siteOrigin: string): {
  encyclopediaRoot: Array<{ url: string; changeFrequency: "weekly"; priority: number }>;
  categoryListings: Array<{ url: string; changeFrequency: "weekly"; priority: number }>;
  clusterHubs: Array<{ url: string; changeFrequency: "weekly"; priority: number }>;
  articles: Array<{ url: string; changeFrequency: "weekly"; priority: number }>;
} {
  const origin = siteOrigin.replace(/\/+$/, "");
  const inv = getEncyclopediaSitemapInventory();

  const encyclopediaRoot = ENCYCLOPEDIA_ROOT_HREFS.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "/encyclopedia" ? 0.85 : 0.82,
  }));

  const categoryListings = getAllEncyclopediaCategories().map(
    (category: EncyclopediaCategory) => ({
      url: `${origin}${buildEncyclopediaCategoryHref(category)}`,
      changeFrequency: "weekly" as const,
      priority: 0.78,
    }),
  );

  const clusterHubs = inv.clusterHubHrefs.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const articles = inv.articleHrefs.map((path) => ({
    url: `${origin}${path}`,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return {
    encyclopediaRoot,
    categoryListings,
    clusterHubs,
    articles,
  };
}
