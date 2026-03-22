import { METHOD_ENTITIES, SOIL_ENTITIES, SURFACE_ENTITIES, TOOL_ENTITIES } from "../entities";
import { KNOWLEDGE_ARTICLES } from "../knowledgeArticles";
import {
  getLocalServiceDefinition,
  getServiceAreaCity,
} from "../../local-seo/serviceAreas/serviceAreaData";
import type {
  EditorialClusterArticleLink,
  EditorialClusterDefinition,
  EditorialClusterEntityKind,
  EditorialClusterEntityLink,
  EditorialClusterIndexItem,
  EditorialClusterPageData,
  EditorialClusterServiceLink,
} from "./clusterTypes";

type GenericEntity = Record<string, unknown>;
type GenericArticle = Record<string, unknown>;

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEntityName(entity: GenericEntity): string {
  return (
    safeString(entity.name) ||
    safeString(entity.title) ||
    safeString(entity.label) ||
    humanizeSlug(safeString(entity.slug))
  );
}

function getEntitySummary(entity: GenericEntity): string {
  return (
    safeString(entity.summary) ||
    safeString(entity.shortDescription) ||
    safeString(entity.description) ||
    safeString(entity.definition)
  );
}

function getArticleTitle(article: GenericArticle): string {
  return (
    safeString(article.title) ||
    safeString(article.name) ||
    humanizeSlug(safeString(article.slug))
  );
}

function getArticleSummary(article: GenericArticle): string {
  return (
    safeString(article.summary) ||
    safeString(article.description) ||
    safeString(article.excerpt) ||
    safeString(article.shortDescription)
  );
}

function getEntitiesForKind(kind: EditorialClusterEntityKind): GenericEntity[] {
  switch (kind) {
    case "problem":
      return SOIL_ENTITIES as GenericEntity[];
    case "surface":
      return SURFACE_ENTITIES as GenericEntity[];
    case "method":
      return METHOD_ENTITIES as GenericEntity[];
    case "tool":
      return TOOL_ENTITIES as GenericEntity[];
    default:
      return [];
  }
}

function getEntityHref(kind: EditorialClusterEntityKind, slug: string): string {
  switch (kind) {
    case "problem":
      return `/cleaning-problems/${slug}`;
    case "surface":
      return `/cleaning-surfaces/${slug}`;
    case "method":
      return `/cleaning-methods/${slug}`;
    case "tool":
      return `/cleaning-tools/${slug}`;
    default:
      return "/";
  }
}

function buildEntityMap(kind: EditorialClusterEntityKind): Map<string, GenericEntity> {
  const map = new Map<string, GenericEntity>();
  for (const entity of getEntitiesForKind(kind)) {
    const slug = safeString(entity.slug);
    if (slug) map.set(slug, entity);
  }
  return map;
}

const PROBLEM_ENTITY_MAP = buildEntityMap("problem");
const SURFACE_ENTITY_MAP = buildEntityMap("surface");
const METHOD_ENTITY_MAP = buildEntityMap("method");
const TOOL_ENTITY_MAP = buildEntityMap("tool");

function getEntityMap(kind: EditorialClusterEntityKind): Map<string, GenericEntity> {
  switch (kind) {
    case "problem":
      return PROBLEM_ENTITY_MAP;
    case "surface":
      return SURFACE_ENTITY_MAP;
    case "method":
      return METHOD_ENTITY_MAP;
    case "tool":
      return TOOL_ENTITY_MAP;
    default:
      return new Map<string, GenericEntity>();
  }
}

function uniqueByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

const ARTICLE_MAP = (() => {
  const map = new Map<string, GenericArticle>();
  for (const article of KNOWLEDGE_ARTICLES as unknown as GenericArticle[]) {
    const slug = safeString(article.slug);
    if (slug) map.set(slug, article);
  }
  return map;
})();

export const EDITORIAL_CLUSTERS: EditorialClusterDefinition[] = [
  {
    slug: "grout-and-tile-cleaning",
    name: "Grout and Tile Cleaning",
    shortDescription:
      "Cluster hub for grout and tile cleaning articles, related surfaces, methods, tools, and local service support.",
    longDescription:
      "This editorial cluster organizes the strongest grout and tile cleaning topics into one hub so users can move from broad search intent into live guides, entity pages, and service pages without relying on a single article alone.",
    articleSlugs: ["how-to-clean-grout", "how-to-clean-tile", "how-to-clean-shower"],
    entityReferences: [
      { kind: "problem", slug: "grout-soiling" },
      { kind: "problem", slug: "soap-scum" },
      { kind: "surface", slug: "grout" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "porcelain-tile" },
      { kind: "method", slug: "mechanical-agitation" },
      { kind: "method", slug: "oxidizing-cleaners" },
      { kind: "tool", slug: "grout-brush" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
    serviceReferences: [
      { serviceSlug: "grout-cleaning" },
      { serviceSlug: "shower-cleaning" },
      { serviceSlug: "grout-cleaning", citySlug: "tulsa-ok" },
      { serviceSlug: "grout-cleaning", citySlug: "broken-arrow-ok" },
    ],
    relatedClusterSlugs: ["bathroom-wet-area-cleaning", "floor-cleaning-guides"],
  },
  {
    slug: "bathroom-wet-area-cleaning",
    name: "Bathroom and Wet Area Cleaning",
    shortDescription:
      "Cluster hub for shower, soap scum, mildew, hard water, and wet-area cleaning topics.",
    longDescription:
      "This hub groups the bathroom and wet-area guides that most directly support shower cleaning, residue removal, and surface-safe cleaning decisions across glass, grout, and tile environments.",
    articleSlugs: [
      "how-to-clean-shower",
      "how-to-remove-soap-scum",
      "how-to-remove-hard-water-stains",
      "how-to-remove-bathroom-mildew",
    ],
    entityReferences: [
      { kind: "problem", slug: "soap-scum" },
      { kind: "problem", slug: "hard-water-stains" },
      { kind: "problem", slug: "mildew" },
      { kind: "surface", slug: "glass" },
      { kind: "surface", slug: "grout" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "chrome" },
      { kind: "method", slug: "oxidizing-cleaners" },
      { kind: "method", slug: "moisture-reduction" },
      { kind: "tool", slug: "non-scratch-scrub-pad" },
      { kind: "tool", slug: "squeegee" },
      { kind: "tool", slug: "detail-brush" },
    ],
    serviceReferences: [
      { serviceSlug: "shower-cleaning" },
      { serviceSlug: "glass-and-detail-cleaning" },
      { serviceSlug: "shower-cleaning", citySlug: "tulsa-ok" },
      { serviceSlug: "shower-cleaning", citySlug: "jenks-ok" },
    ],
    relatedClusterSlugs: ["grout-and-tile-cleaning", "glass-and-detail-cleaning-guides"],
  },
  {
    slug: "glass-and-detail-cleaning-guides",
    name: "Glass and Detail Cleaning Guides",
    shortDescription:
      "Cluster hub for glass, windows, hard-water residue, and detail-cleaning editorial support pages.",
    longDescription:
      "This cluster consolidates glass and detail cleaning guidance into a stronger topic family so local pages, service pages, and surface pages can reinforce one another instead of depending on isolated article performance.",
    articleSlugs: ["how-to-clean-windows", "how-to-remove-hard-water-stains"],
    entityReferences: [
      { kind: "problem", slug: "hard-water-stains" },
      { kind: "problem", slug: "soap-scum" },
      { kind: "surface", slug: "glass" },
      { kind: "surface", slug: "chrome" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "method", slug: "moisture-reduction" },
      { kind: "tool", slug: "squeegee" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
    serviceReferences: [
      { serviceSlug: "glass-and-detail-cleaning" },
      { serviceSlug: "glass-and-detail-cleaning", citySlug: "tulsa-ok" },
      { serviceSlug: "glass-and-detail-cleaning", citySlug: "jenks-ok" },
    ],
    relatedClusterSlugs: ["bathroom-wet-area-cleaning", "floor-cleaning-guides"],
  },
  {
    slug: "floor-cleaning-guides",
    name: "Floor Cleaning Guides",
    shortDescription:
      "Cluster hub for tile, laminate, and hard-surface floor cleaning topics tied to method and service support.",
    longDescription:
      "This cluster groups the floor-related cleaning guides that reinforce hard-surface floor cleaning as a broader topic family, making it easier to connect articles to surfaces, methods, tools, and local service intent.",
    articleSlugs: ["how-to-clean-tile", "how-to-clean-laminate-floors"],
    entityReferences: [
      { kind: "problem", slug: "grout-soiling" },
      { kind: "problem", slug: "kitchen-grease" },
      { kind: "surface", slug: "laminate" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "porcelain-tile" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "method", slug: "neutral-cleaners" },
      { kind: "tool", slug: "mop-pad" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
    serviceReferences: [
      { serviceSlug: "hard-surface-floor-cleaning" },
      { serviceSlug: "hard-surface-floor-cleaning", citySlug: "tulsa-ok" },
      { serviceSlug: "hard-surface-floor-cleaning", citySlug: "bixby-ok" },
    ],
    relatedClusterSlugs: ["grout-and-tile-cleaning", "glass-and-detail-cleaning-guides"],
  },
];

const CLUSTER_MAP = new Map<string, EditorialClusterDefinition>(
  EDITORIAL_CLUSTERS.map((c) => [c.slug, c]),
);

function buildClusterArticleLinks(articleSlugs: string[]): EditorialClusterArticleLink[] {
  const output: EditorialClusterArticleLink[] = [];
  for (const slug of articleSlugs) {
    const article = ARTICLE_MAP.get(slug);
    if (!article) continue;
    const isLive = Boolean(article.isLive);
    if (!isLive) continue;
    output.push({
      slug,
      title: getArticleTitle(article),
      href: `/${slug}`,
      summary: getArticleSummary(article) || undefined,
      isLive,
    });
  }
  return uniqueByKey(output, (item) => item.slug).sort((a, b) => a.title.localeCompare(b.title));
}

function buildClusterEntityLinks(
  refs: EditorialClusterDefinition["entityReferences"],
): EditorialClusterEntityLink[] {
  const output: EditorialClusterEntityLink[] = [];
  for (const ref of refs) {
    const entity = getEntityMap(ref.kind).get(ref.slug);
    if (!entity) continue;
    output.push({
      kind: ref.kind,
      slug: ref.slug,
      name: getEntityName(entity),
      href: getEntityHref(ref.kind, ref.slug),
      summary: getEntitySummary(entity) || undefined,
    });
  }
  return uniqueByKey(output, (item) => `${item.kind}:${item.slug}`).sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.name.localeCompare(b.name);
  });
}

function buildClusterServiceLinks(
  refs: EditorialClusterDefinition["serviceReferences"],
): EditorialClusterServiceLink[] {
  const output: EditorialClusterServiceLink[] = [];
  for (const ref of refs) {
    const service = getLocalServiceDefinition(ref.serviceSlug);
    if (!service) continue;
    if (ref.citySlug) {
      const city = getServiceAreaCity(ref.citySlug);
      if (!city) continue;
      output.push({
        key: `${ref.serviceSlug}:${ref.citySlug}`,
        title: `${service.name} in ${city.name}, ${city.stateCode}`,
        href: `/services/${service.slug}/${city.slug}`,
        summary: `${service.shortDescription} Localized for ${city.name}, ${city.stateCode}.`,
      });
      continue;
    }
    output.push({
      key: ref.serviceSlug,
      title: service.name,
      href: "/service-areas",
      summary: service.shortDescription,
    });
  }
  return uniqueByKey(output, (item) => item.key).sort((a, b) => a.title.localeCompare(b.title));
}

export function getAllEditorialClusterSlugs(): string[] {
  return EDITORIAL_CLUSTERS.map((c) => c.slug);
}

export function getEditorialClusterIndexItems(): EditorialClusterIndexItem[] {
  return EDITORIAL_CLUSTERS.map((cluster) => ({
    slug: cluster.slug,
    name: cluster.name,
    shortDescription: cluster.shortDescription,
    href: `/cleaning-guides/clusters/${cluster.slug}`,
    articleCount: cluster.articleSlugs.length,
    entityCount: cluster.entityReferences.length,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function getEditorialClusterPageData(clusterSlug: string): EditorialClusterPageData | null {
  const cluster = CLUSTER_MAP.get(clusterSlug);
  if (!cluster) return null;

  const relatedClusters = cluster.relatedClusterSlugs
    .map((slug) => CLUSTER_MAP.get(slug))
    .filter((item): item is EditorialClusterDefinition => Boolean(item))
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      href: `/cleaning-guides/clusters/${item.slug}`,
      articleCount: item.articleSlugs.length,
      entityCount: item.entityReferences.length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    cluster,
    articles: buildClusterArticleLinks(cluster.articleSlugs),
    entities: buildClusterEntityLinks(cluster.entityReferences),
    services: buildClusterServiceLinks(cluster.serviceReferences),
    relatedClusters,
  };
}
