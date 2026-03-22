import { getCanonicalUrl, getServiceUrl, getServiceLocationUrl, getLocationUrl, getAreaPageUrl } from "./seoUrls";
import {
  buildLocalBusinessSchema,
  buildHomepageWebPageSchema,
  buildServiceSchema,
  buildBreadcrumbSchema,
  buildFaqSchema,
  buildServiceIncludesSchema,
} from "./schema";
import type { ServiceDefinition } from "./seoConfig";
import type { LocationDefinition } from "./seoConfig";
import type { BreadcrumbItem } from "./schema";
import type { FaqItem } from "./schema";

/** Service page breadcrumb items: Home, service name. */
export function getServicePageBreadcrumbItems(service: ServiceDefinition): BreadcrumbItem[] {
  return [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: service.name, url: getServiceUrl(service.slug) },
  ];
}

/** Location page breadcrumb items: Home, ${location.name} Cleaning Services. */
export function getLocationPageBreadcrumbItems(location: LocationDefinition): BreadcrumbItem[] {
  return [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: `${location.name} Cleaning Services`, url: getLocationUrl(location.slug) },
  ];
}

/** Area page breadcrumb items: Home, ${location.name} Cleaning Services (canonical = area URL). */
export function getAreaPageBreadcrumbItems(location: LocationDefinition): BreadcrumbItem[] {
  return [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: `${location.name} Cleaning Services`, url: getAreaPageUrl(location.slug) },
  ];
}

/** Service/location page breadcrumb items: Home, service name, ${service.name} in ${location.name}. */
export function getServiceLocationPageBreadcrumbItems(
  service: ServiceDefinition,
  location: LocationDefinition
): BreadcrumbItem[] {
  return [
    { name: "Home", url: getCanonicalUrl("/") },
    { name: service.name, url: getServiceUrl(service.slug) },
    { name: `${service.name} in ${location.name}`, url: getServiceLocationUrl(service.slug, location.slug) },
  ];
}

/**
 * Homepage schema set: LocalBusiness, WebPage, FAQ.
 */
export function buildHomepageSchemaSet(
  description: string,
  homepageFaqs: FaqItem[]
): Record<string, unknown>[] {
  return [
    buildLocalBusinessSchema(),
    buildHomepageWebPageSchema(description),
    buildFaqSchema(homepageFaqs),
  ];
}

/**
 * Service page schema set: LocalBusiness, Service, Breadcrumb, ItemList (includes), FAQ.
 */
export function buildServicePageSchemaSet(
  service: ServiceDefinition,
  faqs: FaqItem[],
  includes?: string[]
): Record<string, unknown>[] {
  const breadcrumbItems = getServicePageBreadcrumbItems(service);
  const schemas: Record<string, unknown>[] = [
    buildLocalBusinessSchema(),
    buildServiceSchema(service),
    buildBreadcrumbSchema(breadcrumbItems),
  ];
  if (includes?.length) schemas.push(buildServiceIncludesSchema(includes));
  schemas.push(buildFaqSchema(faqs));
  return schemas;
}

/**
 * Location page schema set: LocalBusiness, Breadcrumb, FAQ.
 * Breadcrumb labels: Home, ${location.name} Cleaning Services.
 */
export function buildLocationPageSchemaSet(
  location: LocationDefinition,
  faqs: FaqItem[]
): Record<string, unknown>[] {
  const breadcrumbItems = getLocationPageBreadcrumbItems(location);
  return [
    buildLocalBusinessSchema(),
    buildBreadcrumbSchema(breadcrumbItems),
    buildFaqSchema(faqs),
  ];
}

/**
 * Area page schema set (e.g. /tulsa-cleaning-services): LocalBusiness, Breadcrumb, FAQ.
 */
export function buildAreaPageSchemaSet(
  location: LocationDefinition,
  faqs: FaqItem[]
): Record<string, unknown>[] {
  const breadcrumbItems = getAreaPageBreadcrumbItems(location);
  return [
    buildLocalBusinessSchema(),
    buildBreadcrumbSchema(breadcrumbItems),
    buildFaqSchema(faqs),
  ];
}

/**
 * Service/location page schema set: LocalBusiness, Service, Breadcrumb, ItemList (includes), FAQ.
 */
export function buildServiceLocationPageSchemaSet(
  service: ServiceDefinition,
  location: LocationDefinition,
  faqs: FaqItem[],
  includes?: string[]
): Record<string, unknown>[] {
  const breadcrumbItems = getServiceLocationPageBreadcrumbItems(service, location);
  const schemas: Record<string, unknown>[] = [
    buildLocalBusinessSchema(),
    buildServiceSchema(service, location),
    buildBreadcrumbSchema(breadcrumbItems),
  ];
  if (includes?.length) schemas.push(buildServiceIncludesSchema(includes));
  schemas.push(buildFaqSchema(faqs));
  return schemas;
}
