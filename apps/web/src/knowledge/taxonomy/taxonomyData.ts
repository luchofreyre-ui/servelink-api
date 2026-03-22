import {
  METHOD_ENTITIES,
  SOIL_ENTITIES,
  SURFACE_ENTITIES,
  TOOL_ENTITIES,
} from "../entities";
import type {
  TaxonomyCategory,
  TaxonomyCategoryIndexItem,
  TaxonomyCategoryPageData,
  TaxonomyEntityKind,
  TaxonomyEntityLink,
  TaxonomyKindConfig,
} from "./taxonomyTypes";

type GenericEntity = Record<string, unknown>;

const TAXONOMY_KIND_CONFIG: Record<TaxonomyEntityKind, TaxonomyKindConfig> = {
  problem: {
    kind: "problem",
    title: "Cleaning Problem Categories",
    intro:
      "Browse cleaning problems by soil behavior, residue type, and removal difficulty so users can move from symptom to solution faster.",
    basePath: "/cleaning-problems",
    categoryBasePath: "/cleaning-problems/categories",
  },
  surface: {
    kind: "surface",
    title: "Cleaning Surface Categories",
    intro:
      "Browse surfaces by material family and finish sensitivity so cleaning recommendations stay aligned with damage risk and material behavior.",
    basePath: "/cleaning-surfaces",
    categoryBasePath: "/cleaning-surfaces/categories",
  },
  method: {
    kind: "method",
    title: "Cleaning Method Categories",
    intro:
      "Browse cleaning methods by operating style and cleaning purpose so users can connect the right process to the right problem and surface.",
    basePath: "/cleaning-methods",
    categoryBasePath: "/cleaning-methods/categories",
  },
  tool: {
    kind: "tool",
    title: "Cleaning Tool Categories",
    intro:
      "Browse cleaning tools by use case and handling role so users can understand where each tool fits inside a safe, evidence-based cleaning workflow.",
    basePath: "/cleaning-tools",
    categoryBasePath: "/cleaning-tools/categories",
  },
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
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

function getEntitiesForKind(kind: TaxonomyEntityKind): GenericEntity[] {
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

function getEntityHref(kind: TaxonomyEntityKind, slug: string): string {
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

function findEntitiesBySlugs(
  kind: TaxonomyEntityKind,
  slugs: string[],
): TaxonomyEntityLink[] {
  const entities = getEntitiesForKind(kind);
  const entityMap = new Map<string, GenericEntity>();

  for (const entity of entities) {
    const slug = safeString(entity.slug);
    if (slug) {
      entityMap.set(slug, entity);
    }
  }

  const result: TaxonomyEntityLink[] = [];

  for (const slug of slugs) {
    const entity = entityMap.get(slug);
    if (!entity) continue;

    result.push({
      slug,
      name: getEntityName(entity),
      href: getEntityHref(kind, slug),
      summary: getEntitySummary(entity) || undefined,
    });
  }

  return result;
}

function problemCategoryForEntity(entity: GenericEntity): string {
  const slug = safeString(entity.slug);
  const category = safeString(entity.category);

  if (category) {
    return category;
  }

  if (
    slug.includes("grease") ||
    slug.includes("oil") ||
    slug.includes("soap-scum") ||
    slug.includes("hard-water")
  ) {
    return "residue-buildup";
  }

  if (
    slug.includes("mold") ||
    slug.includes("mildew") ||
    slug.includes("biofilm") ||
    slug.includes("urine")
  ) {
    return "organic-contamination";
  }

  if (
    slug.includes("rust") ||
    slug.includes("efflorescence") ||
    slug.includes("mineral") ||
    slug.includes("grout-haze")
  ) {
    return "mineral-and-construction-residue";
  }

  return "general-soils-and-stains";
}

function surfaceCategoryForEntity(entity: GenericEntity): string {
  const slug = safeString(entity.slug);
  const category = safeString(entity.category);

  if (category) {
    return category;
  }

  if (
    slug.includes("tile") ||
    slug.includes("grout") ||
    slug.includes("stone") ||
    slug.includes("concrete")
  ) {
    return "mineral-and-masonry-surfaces";
  }

  if (
    slug.includes("wood") ||
    slug.includes("laminate") ||
    slug.includes("vinyl")
  ) {
    return "flooring-and-finished-surfaces";
  }

  if (
    slug.includes("glass") ||
    slug.includes("mirror") ||
    slug.includes("shower")
  ) {
    return "glass-and-wet-area-surfaces";
  }

  return "general-interior-surfaces";
}

function methodCategoryForEntity(entity: GenericEntity): string {
  const slug = safeString(entity.slug);
  const category = safeString(entity.category);

  if (category) {
    return category;
  }

  if (
    slug.includes("agitation") ||
    slug.includes("scrub") ||
    slug.includes("brush")
  ) {
    return "mechanical-cleaning-methods";
  }

  if (
    slug.includes("dwell") ||
    slug.includes("pre-spray") ||
    slug.includes("detergent") ||
    slug.includes("chemical")
  ) {
    return "chemical-application-methods";
  }

  if (
    slug.includes("rinse") ||
    slug.includes("extract") ||
    slug.includes("flush")
  ) {
    return "rinse-and-removal-methods";
  }

  return "general-cleaning-methods";
}

function toolCategoryForEntity(entity: GenericEntity): string {
  const slug = safeString(entity.slug);
  const category = safeString(entity.category);

  if (category) {
    return category;
  }

  if (
    slug.includes("brush") ||
    slug.includes("pad") ||
    slug.includes("scraper")
  ) {
    return "agitation-and-detail-tools";
  }

  if (
    slug.includes("vacuum") ||
    slug.includes("extractor") ||
    slug.includes("squeegee")
  ) {
    return "removal-and-drying-tools";
  }

  if (
    slug.includes("microfiber") ||
    slug.includes("towel") ||
    slug.includes("cloth")
  ) {
    return "wiping-and-finishing-tools";
  }

  return "general-cleaning-tools";
}

function groupEntitySlugsByCategory(
  kind: TaxonomyEntityKind,
): Record<string, string[]> {
  const output: Record<string, string[]> = {};
  const entities = getEntitiesForKind(kind);

  for (const entity of entities) {
    const slug = safeString(entity.slug);
    if (!slug) {
      continue;
    }

    let categorySlug = "";

    switch (kind) {
      case "problem":
        categorySlug = problemCategoryForEntity(entity);
        break;
      case "surface":
        categorySlug = surfaceCategoryForEntity(entity);
        break;
      case "method":
        categorySlug = methodCategoryForEntity(entity);
        break;
      case "tool":
        categorySlug = toolCategoryForEntity(entity);
        break;
    }

    if (!output[categorySlug]) {
      output[categorySlug] = [];
    }

    output[categorySlug].push(slug);
  }

  return output;
}

function buildCategoryDefinitions(kind: TaxonomyEntityKind): TaxonomyCategory[] {
  const grouped = groupEntitySlugsByCategory(kind);

  return Object.entries(grouped)
    .map(([slug, entitySlugs]) => {
      const cleanEntitySlugs = unique(entitySlugs).sort((a, b) => a.localeCompare(b));
      const name = humanizeSlug(slug);

      return {
        slug,
        kind,
        name,
        shortDescription: `${name} topics grouped for stronger browsing, internal linking, and topical authority.`,
        longDescription: `This hub organizes ${name.toLowerCase()} topics so users can move from broader category intent into the most relevant ${kind} pages without guesswork.`,
        entitySlugs: cleanEntitySlugs,
        relatedCategorySlugs: [],
      } satisfies TaxonomyCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((category, _index, all) => ({
      ...category,
      relatedCategorySlugs: all
        .filter((other) => other.slug !== category.slug)
        .slice(0, 3)
        .map((other) => other.slug),
    }));
}

const PROBLEM_CATEGORIES = buildCategoryDefinitions("problem");
const SURFACE_CATEGORIES = buildCategoryDefinitions("surface");
const METHOD_CATEGORIES = buildCategoryDefinitions("method");
const TOOL_CATEGORIES = buildCategoryDefinitions("tool");

function getCategoriesForKind(kind: TaxonomyEntityKind): TaxonomyCategory[] {
  switch (kind) {
    case "problem":
      return PROBLEM_CATEGORIES;
    case "surface":
      return SURFACE_CATEGORIES;
    case "method":
      return METHOD_CATEGORIES;
    case "tool":
      return TOOL_CATEGORIES;
    default:
      return [];
  }
}

export function getTaxonomyKindConfig(kind: TaxonomyEntityKind): TaxonomyKindConfig {
  return TAXONOMY_KIND_CONFIG[kind];
}

export function getTaxonomyCategories(kind: TaxonomyEntityKind): TaxonomyCategory[] {
  return getCategoriesForKind(kind);
}

export function getAllTaxonomyCategorySlugs(kind: TaxonomyEntityKind): string[] {
  return getCategoriesForKind(kind).map((category) => category.slug);
}

export function getTaxonomyCategoryPageData(
  kind: TaxonomyEntityKind,
  categorySlug: string,
): TaxonomyCategoryPageData | null {
  const categories = getCategoriesForKind(kind);
  const category = categories.find((item) => item.slug === categorySlug);

  if (!category) {
    return null;
  }

  const config = getTaxonomyKindConfig(kind);
  const relatedCategoryMap = new Map<string, TaxonomyCategory>(categories.map((item) => [item.slug, item]));

  const relatedCategories = category.relatedCategorySlugs
    .map((slug) => relatedCategoryMap.get(slug))
    .filter((item): item is TaxonomyCategory => Boolean(item))
    .map((item) => ({
      slug: item.slug,
      name: item.name,
      shortDescription: item.shortDescription,
      href: `${config.categoryBasePath}/${item.slug}`,
      entityCount: item.entitySlugs.length,
    }));

  return {
    category,
    entities: findEntitiesBySlugs(kind, category.entitySlugs),
    relatedCategories,
  };
}

export function getTaxonomyCategoryIndexItems(
  kind: TaxonomyEntityKind,
): TaxonomyCategoryIndexItem[] {
  const config = getTaxonomyKindConfig(kind);

  return getCategoriesForKind(kind).map((category) => ({
    slug: category.slug,
    name: category.name,
    shortDescription: category.shortDescription,
    href: `${config.categoryBasePath}/${category.slug}`,
    entityCount: category.entitySlugs.length,
  }));
}

export function getRelatedGuideSlugsForCategory(
  kind: TaxonomyEntityKind,
  categorySlug: string,
): string[] {
  const pageData = getTaxonomyCategoryPageData(kind, categorySlug);

  if (!pageData) {
    return [];
  }

  return pageData.entities.slice(0, 6).map((entity) => entity.slug);
}

export function getEntityCountForKind(kind: TaxonomyEntityKind): number {
  return getEntitiesForKind(kind).length;
}

export function getCategoryCountForKind(kind: TaxonomyEntityKind): number {
  return getCategoriesForKind(kind).length;
}
