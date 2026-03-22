import { SERVICE_DEFINITIONS, LOCATION_DEFINITIONS, AREA_PAGE_SUFFIX, AREA_PAGE_CITY_SLUGS } from "./seoConfig";
import type { ServiceDefinition } from "./seoConfig";
import type { LocationDefinition } from "./seoConfig";

/**
 * Validate against seeded definitions only. All page-level slug resolution must use these helpers.
 */

const AREA_PAGE_SLUGS = new Set(AREA_PAGE_CITY_SLUGS.map((s) => s + AREA_PAGE_SUFFIX));

export function isAreaPageSlug(segment: string): boolean {
  return AREA_PAGE_SLUGS.has(segment);
}

/** Get location slug from area page slug (e.g. tulsa-cleaning-services -> tulsa). */
export function getLocationSlugFromAreaSlug(areaSlug: string): string | null {
  if (!areaSlug.endsWith(AREA_PAGE_SUFFIX)) return null;
  const locationSlug = areaSlug.slice(0, -AREA_PAGE_SUFFIX.length);
  return LOCATION_DEFINITIONS.some((l) => l.slug === locationSlug) ? locationSlug : null;
}

export function isValidServiceSlug(serviceSlug: string): boolean {
  return SERVICE_DEFINITIONS.some((s) => s.slug === serviceSlug);
}

export function isValidLocationSlug(locationSlug: string): boolean {
  return LOCATION_DEFINITIONS.some((l) => l.slug === locationSlug);
}

export function getServiceBySlug(serviceSlug: string): ServiceDefinition | null {
  return SERVICE_DEFINITIONS.find((s) => s.slug === serviceSlug) ?? null;
}

export function getLocationBySlug(locationSlug: string): LocationDefinition | null {
  return LOCATION_DEFINITIONS.find((l) => l.slug === locationSlug) ?? null;
}
