import {
  SITE_NAME,
  SITE_URL,
  DEFAULT_TITLE,
  DEFAULT_DESCRIPTION,
  SERVICE_DEFINITIONS,
  LOCATION_DEFINITIONS,
} from "./seoConfig";
import { getServiceUrl, getServiceLocationUrl, getLocationUrl, getAreaPageUrl } from "./seoUrls";
import type { ServiceDefinition } from "./seoConfig";
import type { LocationDefinition } from "./seoConfig";

export type PageMetadata = {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogUrl: string;
};

export function buildDefaultMetadata(): PageMetadata {
  const canonical = SITE_URL;
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonical,
    ogTitle: DEFAULT_TITLE,
    ogDescription: DEFAULT_DESCRIPTION,
    ogUrl: canonical,
  };
}

export function buildServiceMetadata(service: ServiceDefinition): PageMetadata {
  const canonical = getServiceUrl(service.slug);
  const title = `${service.name} | ${SITE_NAME}`;
  const description = `Book professional ${service.name.toLowerCase()} services with Nu Standard Cleaning. Reliable scheduling, quality service, and clear booking for homes and properties in the Tulsa area.`;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildServiceLocationMetadata(
  service: ServiceDefinition,
  location: LocationDefinition
): PageMetadata {
  const canonical = getServiceLocationUrl(service.slug, location.slug);
  const title = `${service.name} in ${location.name} | ${SITE_NAME}`;
  const description = `Book professional ${service.name.toLowerCase()} in ${location.name} with Nu Standard Cleaning. Reliable cleaning services, clear booking, and local coverage for homes and properties.`;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildHomepageMetadata(): PageMetadata {
  const title = "Nu Standard Cleaning | Cleaning Services in Tulsa and Surrounding Areas";
  const description =
    "Book professional house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning with Nu Standard Cleaning in Tulsa and surrounding areas.";
  const canonical = SITE_URL;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildLocationMetadata(location: LocationDefinition): PageMetadata {
  const canonical = getLocationUrl(location.slug);
  const title = `${location.name} Cleaning Services | ${SITE_NAME}`;
  const description = `Explore cleaning services available in ${location.name} with Nu Standard Cleaning, including house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning.`;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

/** Area page (e.g. /tulsa-cleaning-services): same content as location, keyword-rich URL. */
export function buildAreaPageMetadata(location: LocationDefinition): PageMetadata {
  const canonical = getAreaPageUrl(location.slug);
  const title = `${location.name} Cleaning Services | ${SITE_NAME}`;
  const description = `Explore cleaning services available in ${location.name} with Nu Standard Cleaning, including house cleaning, deep cleaning, move-out cleaning, recurring cleaning, and Airbnb cleaning.`;
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildBookingMetadata(params?: {
  serviceSlug?: string;
  locationSlug?: string;
}): PageMetadata {
  const baseTitle = "Book Cleaning Services | Nu Standard Cleaning";
  const serviceDef = params?.serviceSlug
    ? SERVICE_DEFINITIONS.find((s) => s.slug === params!.serviceSlug)
    : null;
  const locationDef = params?.locationSlug
    ? LOCATION_DEFINITIONS.find((l) => l.slug === params!.locationSlug)
    : null;

  let title = baseTitle;
  if (serviceDef && locationDef) {
    title = `Book ${serviceDef.name} in ${locationDef.name} | ${SITE_NAME}`;
  } else if (serviceDef) {
    title = `Book ${serviceDef.name} | ${SITE_NAME}`;
  }

  const description =
    "Book house cleaning, deep cleaning, move-out cleaning, recurring cleaning, or Airbnb cleaning with Nu Standard Cleaning. Select your service and area to see availability and complete your booking.";

  const bookingBase = `${SITE_URL}/book`;
  const qs = new URLSearchParams();
  if (params?.serviceSlug) qs.set("service", params.serviceSlug);
  if (params?.locationSlug) qs.set("location", params.locationSlug);
  const canonical = qs.toString() ? `${bookingBase}?${qs.toString()}` : bookingBase;

  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}
