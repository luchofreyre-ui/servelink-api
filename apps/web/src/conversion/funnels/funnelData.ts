import { METHOD_ENTITIES, SOIL_ENTITIES, SURFACE_ENTITIES, TOOL_ENTITIES } from "../../knowledge/entities";
import { KNOWLEDGE_ARTICLES } from "../../knowledge/knowledgeArticles";
import { LOCALIZED_SERVICE_ROUTES } from "../intent/intentCtaData";

import type {
  ServiceFunnelDefinition,
  ServiceFunnelIndexItem,
  ServiceFunnelPageArticle,
  ServiceFunnelPageData,
  ServiceFunnelPageEntity,
  ServiceFunnelPageServiceLink,
} from "./funnelTypes";

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

function getEntityHref(
  kind: "problem" | "surface" | "method" | "tool",
  slug: string,
): string {
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

function buildEntityMap(entities: GenericEntity[]): Map<string, GenericEntity> {
  const map = new Map<string, GenericEntity>();
  for (const entity of entities) {
    const slug = safeString(entity.slug);
    if (slug) map.set(slug, entity);
  }
  return map;
}

const PROBLEM_MAP = buildEntityMap(SOIL_ENTITIES as GenericEntity[]);
const SURFACE_MAP = buildEntityMap(SURFACE_ENTITIES as GenericEntity[]);
const METHOD_MAP = buildEntityMap(METHOD_ENTITIES as GenericEntity[]);
const TOOL_MAP = buildEntityMap(TOOL_ENTITIES as GenericEntity[]);

function getEntityMap(kind: "problem" | "surface" | "method" | "tool") {
  switch (kind) {
    case "problem":
      return PROBLEM_MAP;
    case "surface":
      return SURFACE_MAP;
    case "method":
      return METHOD_MAP;
    case "tool":
      return TOOL_MAP;
    default:
      return new Map<string, GenericEntity>();
  }
}

const ARTICLES_MAP = new Map<string, GenericArticle>();
for (const article of KNOWLEDGE_ARTICLES as unknown as GenericArticle[]) {
  const slug = safeString(article.slug);
  if (slug) ARTICLES_MAP.set(slug, article);
}

export const SERVICE_FUNNELS: ServiceFunnelDefinition[] = [
  {
    slug: "grout-cleaning-help",
    name: "Grout Cleaning Help",
    shortDescription:
      "A conversion-focused funnel for grout, tile residue, and deeper grout cleaning intent.",
    longDescription:
      "This funnel page helps users move from grout-related research into the most relevant cleaning guides, entity pages, and localized service routes without relying on a single knowledge page alone.",
    serviceSlug: "grout-cleaning",
    articleSlugs: ["how-to-clean-grout", "how-to-clean-tile"],
    entityReferences: [
      { kind: "problem", slug: "grout-soiling" },
      { kind: "problem", slug: "soap-scum" },
      { kind: "surface", slug: "grout" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "surface", slug: "porcelain-tile" },
      { kind: "method", slug: "mechanical-agitation" },
      { kind: "tool", slug: "grout-brush" },
    ],
    preferredCitySlugs: ["tulsa-ok", "broken-arrow-ok"],
  },
  {
    slug: "shower-cleaning-help",
    name: "Shower Cleaning Help",
    shortDescription:
      "A funnel page for shower, soap-scum, hard-water, and bathroom mildew cleaning intent.",
    longDescription:
      "This funnel page bridges wet-area educational content and service intent by grouping the strongest article, entity, and city-specific service routes for shower cleaning users.",
    serviceSlug: "shower-cleaning",
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
      { kind: "surface", slug: "chrome" },
      { kind: "method", slug: "oxidizing-cleaners" },
      { kind: "tool", slug: "squeegee" },
    ],
    preferredCitySlugs: ["tulsa-ok", "jenks-ok"],
  },
  {
    slug: "glass-detail-cleaning-help",
    name: "Glass and Detail Cleaning Help",
    shortDescription:
      "A funnel page for glass, windows, hard-water haze, and detail-cleaning service intent.",
    longDescription:
      "This funnel page organizes the strongest glass and detail content paths into a conversion-focused destination with supporting entity pages and localized routes.",
    serviceSlug: "glass-and-detail-cleaning",
    articleSlugs: [
      "how-to-clean-windows",
      "how-to-remove-hard-water-stains",
    ],
    entityReferences: [
      { kind: "problem", slug: "hard-water-stains" },
      { kind: "problem", slug: "smudges" },
      { kind: "surface", slug: "glass" },
      { kind: "surface", slug: "chrome" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "tool", slug: "microfiber-towel" },
      { kind: "tool", slug: "squeegee" },
    ],
    preferredCitySlugs: ["tulsa-ok", "jenks-ok"],
  },
  {
    slug: "hard-surface-floor-cleaning-help",
    name: "Hard Surface Floor Cleaning Help",
    shortDescription:
      "A funnel page for laminate, hard floors, tracked-in soil, and finish-safe floor cleaning intent.",
    longDescription:
      "This funnel page collects the most relevant articles, entities, and service routes for users researching hard-surface floor cleaning before choosing a local path.",
    serviceSlug: "hard-surface-floor-cleaning",
    articleSlugs: [
      "how-to-clean-laminate-floors",
      "how-to-clean-tile",
    ],
    entityReferences: [
      { kind: "problem", slug: "tracked-in-soil" },
      { kind: "problem", slug: "kitchen-grease" },
      { kind: "surface", slug: "laminate" },
      { kind: "surface", slug: "ceramic-tile" },
      { kind: "method", slug: "microfiber-cleaning" },
      { kind: "tool", slug: "mop-pad" },
      { kind: "tool", slug: "microfiber-towel" },
    ],
    preferredCitySlugs: ["tulsa-ok", "bixby-ok"],
  },
];

const FUNNEL_MAP = new Map<string, ServiceFunnelDefinition>(
  SERVICE_FUNNELS.map((funnel) => [funnel.slug, funnel]),
);

function buildArticleLinks(articleSlugs: string[]): ServiceFunnelPageArticle[] {
  const output: ServiceFunnelPageArticle[] = [];
  for (const slug of articleSlugs) {
    const article = ARTICLES_MAP.get(slug);
    const isLive = article && (article as { isLive?: boolean }).isLive;
    if (!article || !isLive) continue;
    output.push({
      slug,
      title: getArticleTitle(article),
      href: `/${slug}`,
      summary: getArticleSummary(article),
    });
  }
  return output.sort((a, b) => a.title.localeCompare(b.title));
}

function buildEntityLinks(
  refs: ServiceFunnelDefinition["entityReferences"],
): ServiceFunnelPageEntity[] {
  const output: ServiceFunnelPageEntity[] = [];
  for (const ref of refs) {
    const entity = getEntityMap(ref.kind).get(ref.slug);
    if (!entity) continue;
    output.push({
      key: `${ref.kind}:${ref.slug}`,
      kind: ref.kind,
      slug: ref.slug,
      name: getEntityName(entity),
      href: getEntityHref(ref.kind, ref.slug),
      summary: getEntitySummary(entity),
    });
  }
  return output.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.name.localeCompare(b.name);
  });
}

function buildServiceLinks(
  funnel: ServiceFunnelDefinition,
): ServiceFunnelPageServiceLink[] {
  const output: ServiceFunnelPageServiceLink[] = [];
  for (const citySlug of funnel.preferredCitySlugs) {
    const route = LOCALIZED_SERVICE_ROUTES.find(
      (item) => item.serviceSlug === funnel.serviceSlug && item.citySlug === citySlug,
    );
    if (!route) continue;
    output.push({
      key: `${funnel.serviceSlug}:${citySlug}`,
      title: route.title,
      href: route.href,
      summary: `Localized service path for ${route.title}.`,
    });
  }
  output.push({
    key: `${funnel.serviceSlug}:all-service-areas`,
    title: "Browse All Service Areas",
    href: "/service-areas",
    summary: "See all available city and service-area paths.",
  });
  return output;
}

export function getAllServiceFunnelSlugs(): string[] {
  return SERVICE_FUNNELS.map((funnel) => funnel.slug);
}

export function getServiceFunnelIndexItems(): ServiceFunnelIndexItem[] {
  return SERVICE_FUNNELS.map((funnel) => ({
    slug: funnel.slug,
    name: funnel.name,
    shortDescription: funnel.shortDescription,
    href: `/services/funnels/${funnel.slug}`,
    serviceSlug: funnel.serviceSlug,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function getServiceFunnelPageData(
  funnelSlug: string,
): ServiceFunnelPageData | null {
  const funnel = FUNNEL_MAP.get(funnelSlug);
  if (!funnel) return null;
  return {
    funnel,
    articles: buildArticleLinks(funnel.articleSlugs),
    entities: buildEntityLinks(funnel.entityReferences),
    serviceLinks: buildServiceLinks(funnel),
  };
}
