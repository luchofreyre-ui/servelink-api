import { SITE_URL } from "../../seo/seoConfig";
import {
  getServiceAreaIndexItems,
  getServiceAreaPageData,
  getServiceAreaServicePageData,
} from "./serviceAreaData";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildServiceAreaIndexStructuredData() {
  const items = getServiceAreaIndexItems();

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Service Areas",
    description:
      "Browse Nu Standard Cleaning service areas and local service coverage.",
    url: absoluteUrl("/service-areas"),
    hasPart: items.map((item) => ({
      "@type": "Place",
      name: item.name,
      url: absoluteUrl(item.href),
      description: item.shortDescription,
    })),
  };
}

export function buildServiceAreaCityStructuredData(citySlug: string) {
  const data = getServiceAreaPageData(citySlug);

  if (!data) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Service Area Not Found",
      description: "The requested service area could not be found.",
      url: absoluteUrl(`/service-areas/${citySlug}`),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Cleaning Services in ${data.city.name}, ${data.city.stateCode}`,
    areaServed: {
      "@type": "City",
      name: `${data.city.name}, ${data.city.stateCode}`,
    },
    description: data.city.longDescription,
    url: absoluteUrl(`/service-areas/${data.city.slug}`),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: `${data.city.name} Cleaning Services`,
      itemListElement: data.services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.name,
          description: service.shortDescription,
          url: absoluteUrl(`/services/${service.slug}/${data.city.slug}`),
        },
      })),
    },
  };
}

export function buildServiceAreaServiceStructuredData(
  serviceSlug: string,
  citySlug: string,
) {
  const data = getServiceAreaServicePageData(serviceSlug, citySlug);

  if (!data) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Service Page Not Found",
      description: "The requested localized service page could not be found.",
      url: absoluteUrl(`/services/${serviceSlug}/${citySlug}`),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${data.service.name} in ${data.city.name}, ${data.city.stateCode}`,
    serviceType: data.service.name,
    areaServed: {
      "@type": "City",
      name: `${data.city.name}, ${data.city.stateCode}`,
    },
    description: data.service.longDescription,
    url: absoluteUrl(`/services/${data.service.slug}/${data.city.slug}`),
    isRelatedTo: [
      ...data.relatedProblems.map((item) => ({
        "@type": "DefinedTerm",
        name: item.name,
        url: absoluteUrl(item.href),
      })),
      ...data.relatedSurfaces.map((item) => ({
        "@type": "DefinedTerm",
        name: item.name,
        url: absoluteUrl(item.href),
      })),
    ],
  };
}
