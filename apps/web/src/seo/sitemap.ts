import { SITE_URL, AREA_PAGE_CITY_SLUGS } from "./seoConfig";
import { getServiceUrl, getServiceLocationUrl, getLocationUrl, getAreaPageUrl } from "./seoUrls";
import { SERVICE_DEFINITIONS, LOCATION_DEFINITIONS } from "./seoConfig";
import { getKnowledgeHubUrl, getKnowledgeCategoryUrl } from "../knowledge/knowledgeUrls";
import { KNOWLEDGE_CATEGORIES } from "../knowledge/knowledgeConfig";
import { getAllKnowledgeArticles } from "../knowledge/knowledgeArticles";
import { getAllEditorialClusterSlugs } from "../knowledge/clusters/clusterData";
import { getAllServiceFunnelSlugs } from "../conversion/funnels/funnelData";
import {
  getAllServiceAreaServiceRouteParams,
  getAllServiceAreaSlugs,
} from "../local-seo/serviceAreas/serviceAreaData";
import { getAllTaxonomyCategorySlugs } from "../knowledge/taxonomy/taxonomyData";
import { getAllProblemSlugs } from "../knowledge/problems/problemPageData";
import { getAllSurfaceSlugs } from "../knowledge/surfaces/surfacePageData";
import { getAllMethodSlugs } from "../knowledge/methods/methodPageData";
import { getAllToolSlugs } from "../knowledge/tools/toolPageData";

export type SitemapEntry = { url: string; lastmod?: string; changefreq?: string; priority?: number };

/**
 * Generate sitemap entries: homepage, /book, service pages, location pages, area pages,
 * service/location pages, knowledge hub, knowledge category pages. Live knowledge articles only.
 * Draft knowledge article pages are excluded. No admin URLs. Entries are deduplicated by URL.
 */
export function generateSitemapEntries(): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  const seen = new Set<string>();

  function add(entry: SitemapEntry) {
    if (seen.has(entry.url)) return;
    seen.add(entry.url);
    entries.push(entry);
  }

  add({ url: SITE_URL, changefreq: "weekly", priority: 1 });
  add({ url: `${SITE_URL}/book`, changefreq: "weekly", priority: 0.9 });

  for (const service of SERVICE_DEFINITIONS) {
    add({ url: getServiceUrl(service.slug), changefreq: "weekly", priority: 0.9 });
  }

  for (const location of LOCATION_DEFINITIONS) {
    add({ url: getLocationUrl(location.slug), changefreq: "weekly", priority: 0.85 });
  }

  for (const citySlug of AREA_PAGE_CITY_SLUGS) {
    add({ url: getAreaPageUrl(citySlug), changefreq: "weekly", priority: 0.88 });
  }

  for (const service of SERVICE_DEFINITIONS) {
    for (const location of LOCATION_DEFINITIONS) {
      add({
        url: getServiceLocationUrl(service.slug, location.slug),
        changefreq: "weekly",
        priority: 0.8,
      });
    }
  }

  add({ url: getKnowledgeHubUrl(), changefreq: "weekly", priority: 0.85 });
  for (const cat of KNOWLEDGE_CATEGORIES) {
    add({ url: getKnowledgeCategoryUrl(cat.slug), changefreq: "weekly", priority: 0.8 });
  }
  for (const article of getAllKnowledgeArticles()) {
    if (article.isLive) {
      add({ url: `${SITE_URL}/${article.slug}`, changefreq: "weekly", priority: 0.75 });
    }
  }

  add({ url: `${SITE_URL}/cleaning-problems`, changefreq: "weekly", priority: 0.85 });
  for (const problemSlug of getAllProblemSlugs()) {
    add({ url: `${SITE_URL}/cleaning-problems/${problemSlug}`, changefreq: "weekly", priority: 0.8 });
  }

  add({ url: `${SITE_URL}/cleaning-surfaces`, changefreq: "weekly", priority: 0.85 });
  for (const surfaceSlug of getAllSurfaceSlugs()) {
    add({ url: `${SITE_URL}/cleaning-surfaces/${surfaceSlug}`, changefreq: "weekly", priority: 0.8 });
  }

  add({ url: `${SITE_URL}/cleaning-methods`, changefreq: "weekly", priority: 0.85 });
  for (const methodSlug of getAllMethodSlugs()) {
    add({ url: `${SITE_URL}/cleaning-methods/${methodSlug}`, changefreq: "weekly", priority: 0.8 });
  }

  add({ url: `${SITE_URL}/cleaning-tools`, changefreq: "weekly", priority: 0.85 });
  for (const toolSlug of getAllToolSlugs()) {
    add({ url: `${SITE_URL}/cleaning-tools/${toolSlug}`, changefreq: "weekly", priority: 0.8 });
  }

  add({ url: `${SITE_URL}/cleaning-problems/categories`, changefreq: "weekly", priority: 0.82 });
  for (const slug of getAllTaxonomyCategorySlugs("problem")) {
    add({ url: `${SITE_URL}/cleaning-problems/categories/${slug}`, changefreq: "weekly", priority: 0.78 });
  }
  add({ url: `${SITE_URL}/cleaning-surfaces/categories`, changefreq: "weekly", priority: 0.82 });
  for (const slug of getAllTaxonomyCategorySlugs("surface")) {
    add({ url: `${SITE_URL}/cleaning-surfaces/categories/${slug}`, changefreq: "weekly", priority: 0.78 });
  }
  add({ url: `${SITE_URL}/cleaning-methods/categories`, changefreq: "weekly", priority: 0.82 });
  for (const slug of getAllTaxonomyCategorySlugs("method")) {
    add({ url: `${SITE_URL}/cleaning-methods/categories/${slug}`, changefreq: "weekly", priority: 0.78 });
  }
  add({ url: `${SITE_URL}/cleaning-tools/categories`, changefreq: "weekly", priority: 0.82 });
  for (const slug of getAllTaxonomyCategorySlugs("tool")) {
    add({ url: `${SITE_URL}/cleaning-tools/categories/${slug}`, changefreq: "weekly", priority: 0.78 });
  }

  add({ url: `${SITE_URL}/service-areas`, changefreq: "weekly", priority: 0.82 });
  for (const citySlug of getAllServiceAreaSlugs()) {
    add({ url: `${SITE_URL}/service-areas/${citySlug}`, changefreq: "weekly", priority: 0.78 });
  }
  for (const { serviceSlug, citySlug } of getAllServiceAreaServiceRouteParams()) {
    add({
      url: `${SITE_URL}/services/${serviceSlug}/${citySlug}`,
      changefreq: "weekly",
      priority: 0.78,
    });
  }

  add({ url: `${SITE_URL}/cleaning-guides/clusters`, changefreq: "weekly", priority: 0.8 });
  for (const clusterSlug of getAllEditorialClusterSlugs()) {
    add({ url: `${SITE_URL}/cleaning-guides/clusters/${clusterSlug}`, changefreq: "weekly", priority: 0.76 });
  }

  add({ url: `${SITE_URL}/services/funnels`, changefreq: "weekly", priority: 0.8 });
  for (const funnelSlug of getAllServiceFunnelSlugs()) {
    add({ url: `${SITE_URL}/services/funnels/${funnelSlug}`, changefreq: "weekly", priority: 0.76 });
  }

  return entries;
}
