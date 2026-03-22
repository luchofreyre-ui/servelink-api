import {
  METHOD_ENTITIES,
  SOIL_ENTITIES,
  SURFACE_ENTITIES,
  TOOL_ENTITIES,
} from "../../knowledge/entities";
import type {
  LocalEntityLink,
  LocalServiceDefinition,
  ServiceAreaCity,
  ServiceAreaIndexItem,
  ServiceAreaPageData,
  ServiceAreaServicePageData,
} from "./serviceAreaTypes";

type GenericEntity = Record<string, unknown>;

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

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function buildEntityMap(entities: GenericEntity[]): Map<string, GenericEntity> {
  const map = new Map<string, GenericEntity>();

  for (const entity of entities) {
    const slug = safeString(entity.slug);
    if (slug) {
      map.set(slug, entity);
    }
  }

  return map;
}

const PROBLEM_ENTITY_MAP = buildEntityMap(SOIL_ENTITIES as GenericEntity[]);
const SURFACE_ENTITY_MAP = buildEntityMap(SURFACE_ENTITIES as GenericEntity[]);
const METHOD_ENTITY_MAP = buildEntityMap(METHOD_ENTITIES as GenericEntity[]);
const TOOL_ENTITY_MAP = buildEntityMap(TOOL_ENTITIES as GenericEntity[]);

function buildProblemLinks(slugs: string[]): LocalEntityLink[] {
  const result: LocalEntityLink[] = [];
  for (const slug of unique(slugs)) {
    const entity = PROBLEM_ENTITY_MAP.get(slug);
    if (!entity) continue;
    result.push({
      slug,
      name: getEntityName(entity),
      href: `/cleaning-problems/${slug}`,
      summary: getEntitySummary(entity) || undefined,
    });
  }
  return result;
}

function buildSurfaceLinks(slugs: string[]): LocalEntityLink[] {
  const result: LocalEntityLink[] = [];
  for (const slug of unique(slugs)) {
    const entity = SURFACE_ENTITY_MAP.get(slug);
    if (!entity) continue;
    result.push({
      slug,
      name: getEntityName(entity),
      href: `/cleaning-surfaces/${slug}`,
      summary: getEntitySummary(entity) || undefined,
    });
  }
  return result;
}

function buildMethodLinks(slugs: string[]): LocalEntityLink[] {
  const result: LocalEntityLink[] = [];
  for (const slug of unique(slugs)) {
    const entity = METHOD_ENTITY_MAP.get(slug);
    if (!entity) continue;
    result.push({
      slug,
      name: getEntityName(entity),
      href: `/cleaning-methods/${slug}`,
      summary: getEntitySummary(entity) || undefined,
    });
  }
  return result;
}

function buildToolLinks(slugs: string[]): LocalEntityLink[] {
  const result: LocalEntityLink[] = [];
  for (const slug of unique(slugs)) {
    const entity = TOOL_ENTITY_MAP.get(slug);
    if (!entity) continue;
    result.push({
      slug,
      name: getEntityName(entity),
      href: `/cleaning-tools/${slug}`,
      summary: getEntitySummary(entity) || undefined,
    });
  }
  return result;
}

const LOCAL_SERVICES: LocalServiceDefinition[] = [
  {
    slug: "grout-cleaning",
    name: "Grout Cleaning",
    shortDescription:
      "Targeted grout cleaning focused on soil release, pore cleaning, and residue control in tiled environments.",
    longDescription:
      "This service focuses on grout line cleaning where embedded soil, mineral residue, organic buildup, or finish-dulling contamination requires a method and tool combination that can clean deeply without creating avoidable surface damage.",
    relatedProblemSlugs: ["soap-scum", "hard-water-stains", "mildew", "grout-soiling"],
    relatedSurfaceSlugs: ["grout", "ceramic-tile", "porcelain-tile"],
    relatedMethodSlugs: ["mechanical-agitation", "oxidizing-cleaners", "microfiber-cleaning"],
    relatedToolSlugs: ["grout-brush", "microfiber-towel", "detail-brush"],
  },
  {
    slug: "shower-cleaning",
    name: "Shower Cleaning",
    shortDescription:
      "Detailed shower cleaning for wet-area residue, mineral buildup, soap scum, and surface-safe restoration.",
    longDescription:
      "This service is built around the cleaning problems most common in wet areas, especially soap residue, hard-water deposits, bio-growth risk, and finish dulling across tile, grout, glass, and metal fixtures.",
    relatedProblemSlugs: ["soap-scum", "hard-water-stains", "mildew", "grout-soiling"],
    relatedSurfaceSlugs: ["glass", "grout", "ceramic-tile", "porcelain-tile", "chrome"],
    relatedMethodSlugs: ["oxidizing-cleaners", "moisture-reduction", "microfiber-cleaning"],
    relatedToolSlugs: ["non-scratch-scrub-pad", "squeegee", "detail-brush", "microfiber-towel"],
  },
  {
    slug: "hard-surface-floor-cleaning",
    name: "Hard Surface Floor Cleaning",
    shortDescription:
      "Cleaning for hard flooring systems where soil type, finish sensitivity, and residue removal must stay aligned.",
    longDescription:
      "This service covers hard floor cleaning where material behavior matters, especially on tile, vinyl, laminate, stone, and other interior surfaces that can be damaged by the wrong chemistry, too much moisture, or the wrong agitation style.",
    relatedProblemSlugs: ["kitchen-grease", "grout-soiling", "soap-scum"],
    relatedSurfaceSlugs: ["laminate", "ceramic-tile", "porcelain-tile"],
    relatedMethodSlugs: ["microfiber-cleaning", "mechanical-agitation", "neutral-cleaners"],
    relatedToolSlugs: ["mop-pad", "microfiber-towel"],
  },
  {
    slug: "glass-and-detail-cleaning",
    name: "Glass and Detail Cleaning",
    shortDescription:
      "Glass-focused and detail-focused cleaning where clarity, streak control, and finish protection are critical.",
    longDescription:
      "This service supports glass, mirror, and high-visibility detail cleaning where residue, smearing, and over-wetting can quickly reduce results and create callback risk.",
    relatedProblemSlugs: ["hard-water-stains", "soap-scum"],
    relatedSurfaceSlugs: ["glass", "chrome"],
    relatedMethodSlugs: ["acid-cleaners", "microfiber-cleaning", "moisture-reduction"],
    relatedToolSlugs: ["squeegee", "microfiber-towel", "detail-brush"],
  },
];

const SERVICE_MAP = new Map<string, LocalServiceDefinition>(
  LOCAL_SERVICES.map((service) => [service.slug, service]),
);

const SERVICE_AREA_CITIES: ServiceAreaCity[] = [
  {
    slug: "tulsa-ok",
    name: "Tulsa",
    stateCode: "OK",
    regionName: "Tulsa Metro",
    shortDescription:
      "Service area page for Tulsa, connecting local cleaning intent to the most relevant services, surfaces, and cleaning problems.",
    longDescription:
      "Nu Standard Cleaning in Tulsa is organized around real cleaning conditions, not generic city-page filler. This service area hub connects Tulsa-area users to the most relevant service pages, problem pages, and surface guidance so the local search experience stays useful and specific.",
    problemSlugs: ["soap-scum", "hard-water-stains", "grout-soiling", "kitchen-grease", "mildew"],
    surfaceSlugs: ["grout", "ceramic-tile", "porcelain-tile", "glass", "laminate"],
    serviceSlugs: ["grout-cleaning", "shower-cleaning", "hard-surface-floor-cleaning", "glass-and-detail-cleaning"],
  },
  {
    slug: "broken-arrow-ok",
    name: "Broken Arrow",
    stateCode: "OK",
    regionName: "Tulsa Metro",
    shortDescription:
      "Service area page for Broken Arrow with service-aware and knowledge-aware local internal links.",
    longDescription:
      "Nu Standard Cleaning in Broken Arrow is structured to connect local service intent with the real surfaces, soil conditions, and cleaning methods that matter most. This page exists to support both users and search engines with stronger local navigation and more useful cleaning context.",
    problemSlugs: ["soap-scum", "hard-water-stains", "grout-soiling"],
    surfaceSlugs: ["grout", "porcelain-tile", "glass", "laminate"],
    serviceSlugs: ["grout-cleaning", "shower-cleaning", "hard-surface-floor-cleaning", "glass-and-detail-cleaning"],
  },
  {
    slug: "jenks-ok",
    name: "Jenks",
    stateCode: "OK",
    regionName: "Tulsa Metro",
    shortDescription:
      "Service area page for Jenks tied directly into the cleaning knowledge graph.",
    longDescription:
      "Nu Standard Cleaning in Jenks uses the same authority structure as the broader site so local pages do more than swap city names. This hub connects users to service pages and the most relevant cleaning topics based on common surface and residue scenarios.",
    problemSlugs: ["soap-scum", "hard-water-stains", "grout-soiling"],
    surfaceSlugs: ["glass", "grout", "ceramic-tile", "chrome"],
    serviceSlugs: ["shower-cleaning", "glass-and-detail-cleaning", "grout-cleaning"],
  },
  {
    slug: "bixby-ok",
    name: "Bixby",
    stateCode: "OK",
    regionName: "Tulsa Metro",
    shortDescription:
      "Service area page for Bixby with local service links and authority-supporting knowledge connections.",
    longDescription:
      "Nu Standard Cleaning in Bixby is represented through a structured local SEO layer that ties city intent to meaningful service, problem, and surface pages. The goal is stronger local relevance without thin or repetitive content patterns.",
    problemSlugs: ["grout-soiling", "kitchen-grease"],
    surfaceSlugs: ["laminate", "ceramic-tile", "grout"],
    serviceSlugs: ["hard-surface-floor-cleaning", "grout-cleaning", "glass-and-detail-cleaning"],
  },
];

const CITY_MAP = new Map<string, ServiceAreaCity>(
  SERVICE_AREA_CITIES.map((city) => [city.slug, city]),
);

export function getAllServiceAreaSlugs(): string[] {
  return SERVICE_AREA_CITIES.map((city) => city.slug);
}

export function getAllLocalServiceSlugs(): string[] {
  return LOCAL_SERVICES.map((service) => service.slug);
}

export function getServiceAreaIndexItems(): ServiceAreaIndexItem[] {
  return SERVICE_AREA_CITIES.map((city) => ({
    slug: city.slug,
    name: `${city.name}, ${city.stateCode}`,
    href: `/service-areas/${city.slug}`,
    shortDescription: city.shortDescription,
    serviceCount: city.serviceSlugs.length,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function getServiceAreaCity(slug: string): ServiceAreaCity | null {
  return CITY_MAP.get(slug) ?? null;
}

export function getLocalServiceDefinition(slug: string): LocalServiceDefinition | null {
  return SERVICE_MAP.get(slug) ?? null;
}

export function getServiceAreaPageData(citySlug: string): ServiceAreaPageData | null {
  const city = getServiceAreaCity(citySlug);

  if (!city) {
    return null;
  }

  const services = city.serviceSlugs
    .map((s) => getLocalServiceDefinition(s))
    .filter((service): service is LocalServiceDefinition => Boolean(service));

  return {
    city,
    services,
    relatedProblems: buildProblemLinks(city.problemSlugs).slice(0, 6),
    relatedSurfaces: buildSurfaceLinks(city.surfaceSlugs).slice(0, 6),
  };
}

export function getServiceAreaServicePageData(
  serviceSlug: string,
  citySlug: string,
): ServiceAreaServicePageData | null {
  const city = getServiceAreaCity(citySlug);
  const service = getLocalServiceDefinition(serviceSlug);

  if (!city || !service) {
    return null;
  }

  const cityProblemSet = new Set(city.problemSlugs);
  const citySurfaceSet = new Set(city.surfaceSlugs);

  const relatedProblems = buildProblemLinks(
    service.relatedProblemSlugs.filter((slug) => cityProblemSet.has(slug)),
  );

  const relatedSurfaces = buildSurfaceLinks(
    service.relatedSurfaceSlugs.filter((slug) => citySurfaceSet.has(slug)),
  );

  const relatedMethods = buildMethodLinks(service.relatedMethodSlugs);
  const relatedTools = buildToolLinks(service.relatedToolSlugs);

  return {
    city,
    service,
    relatedProblems: relatedProblems.slice(0, 6),
    relatedSurfaces: relatedSurfaces.slice(0, 6),
    relatedMethods: relatedMethods.slice(0, 6),
    relatedTools: relatedTools.slice(0, 6),
  };
}

export function getAllServiceAreaServiceRouteParams(): Array<{
  citySlug: string;
  serviceSlug: string;
}> {
  const output: Array<{ citySlug: string; serviceSlug: string }> = [];

  for (const city of SERVICE_AREA_CITIES) {
    for (const serviceSlug of city.serviceSlugs) {
      output.push({
        citySlug: city.slug,
        serviceSlug,
      });
    }
  }

  return output;
}
