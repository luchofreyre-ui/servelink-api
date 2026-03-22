import { SITE_URL, AREA_PAGE_SUFFIX } from "./seoConfig";

export function getBaseUrl(): string {
  return SITE_URL;
}

export function getServiceUrl(serviceSlug: string): string {
  return `${SITE_URL}/${serviceSlug}`;
}

export function getLocationUrl(locationSlug: string): string {
  return `${SITE_URL}/${locationSlug}`;
}

/** Keyword-rich area landing page URL for cities (e.g. /tulsa-cleaning-services). */
export function getAreaPageUrl(locationSlug: string): string {
  return `${SITE_URL}/${locationSlug}${AREA_PAGE_SUFFIX}`;
}

/** Path only for area page (for in-app links). */
export function getAreaPagePath(locationSlug: string): string {
  return `/${locationSlug}${AREA_PAGE_SUFFIX}`;
}

export function getServiceLocationUrl(serviceSlug: string, locationSlug: string): string {
  return `${SITE_URL}/${serviceSlug}/${locationSlug}`;
}

export function getCanonicalUrl(pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${SITE_URL}${path}`;
}
