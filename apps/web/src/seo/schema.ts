import { SITE_NAME, SITE_URL } from "./seoConfig";
import { getServiceUrl, getServiceLocationUrl } from "./seoUrls";
import type { ServiceDefinition } from "./seoConfig";
import type { LocationDefinition } from "./seoConfig";

export type BreadcrumbItem = { name: string; url: string };
export type FaqItem = { question: string; answer: string };

/**
 * Organization-safe provider reference. Reusable in Service and other schemas.
 */
export function buildProviderReference(): Record<string, unknown> {
  return {
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function buildLocalBusinessSchema(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    url: SITE_URL,
  };
}

export function buildServiceSchema(
  service: ServiceDefinition,
  location?: LocationDefinition
): Record<string, unknown> {
  const url = location
    ? getServiceLocationUrl(service.slug, location.slug)
    : getServiceUrl(service.slug);
  const areaServed = location
    ? { "@type": "Place", name: location.name }
    : { "@type": "Place", name: "Tulsa and surrounding areas" };
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: service.name,
    provider: buildProviderReference(),
    areaServed,
    url,
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildFaqSchema(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildHomepageWebPageSchema(description: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${SITE_NAME} | Cleaning Services in Tulsa and Surrounding Areas`,
    url: SITE_URL,
    description,
  };
}

/** ItemList schema for service "what's included" lists. Improves rich results and crawl clarity. */
export function buildServiceIncludesSchema(includes: string[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: includes.map((name, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name,
    })),
  };
}
