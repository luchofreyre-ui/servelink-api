import type { PageMetadata } from "../../seo/metadata";
import { SITE_URL } from "../../seo/seoConfig";
import {
  getLocalServiceDefinition,
  getServiceAreaCity,
  getServiceAreaPageData,
  getServiceAreaServicePageData,
} from "./serviceAreaData";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildServiceAreaIndexMetadata(): PageMetadata {
  const canonical = absoluteUrl("/service-areas");
  const title = "Service Areas | Nu Standard Cleaning";
  const description =
    "Browse Nu Standard Cleaning service areas and connect local pages to the most relevant services, cleaning problems, and surface guidance.";
  return {
    title,
    description,
    canonical,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
  };
}

export function buildServiceAreaCityMetadata(citySlug: string): PageMetadata & { robots?: string } {
  const data = getServiceAreaPageData(citySlug);
  const canonical = absoluteUrl(`/service-areas/${citySlug}`);

  if (!data) {
    return {
      title: "Service Area Not Found | Nu Standard Cleaning",
      description: "The requested service area could not be found.",
      canonical,
      robots: "noindex, nofollow",
      ogTitle: "Service Area Not Found | Nu Standard Cleaning",
      ogDescription: "The requested service area could not be found.",
      ogUrl: canonical,
    };
  }

  const locationLabel = `${data.city.name}, ${data.city.stateCode}`;
  return {
    title: `${locationLabel} Cleaning Services | Nu Standard Cleaning`,
    description: data.city.longDescription,
    canonical,
    ogTitle: `${locationLabel} Cleaning Services | Nu Standard Cleaning`,
    ogDescription: data.city.longDescription,
    ogUrl: canonical,
  };
}

export function buildServiceAreaServiceMetadata(
  serviceSlug: string,
  citySlug: string,
): PageMetadata & { robots?: string } {
  const data = getServiceAreaServicePageData(serviceSlug, citySlug);
  const canonical = absoluteUrl(`/services/${serviceSlug}/${citySlug}`);

  if (!data) {
    const service = getLocalServiceDefinition(serviceSlug);
    const city = getServiceAreaCity(citySlug);
    const desc =
      service && city
        ? `The requested page for ${service.name} in ${city.name}, ${city.stateCode} could not be found.`
        : "The requested localized service page could not be found.";
    return {
      title: "Service Page Not Found | Nu Standard Cleaning",
      description: desc,
      canonical,
      robots: "noindex, nofollow",
      ogTitle: "Service Page Not Found | Nu Standard Cleaning",
      ogDescription: desc,
      ogUrl: canonical,
    };
  }

  const locationLabel = `${data.city.name}, ${data.city.stateCode}`;
  const desc = `${data.service.shortDescription} Explore ${data.service.name.toLowerCase()} in ${locationLabel} with links to related surfaces, problems, methods, and tools.`;
  return {
    title: `${data.service.name} in ${locationLabel} | Nu Standard Cleaning`,
    description: desc,
    canonical,
    ogTitle: `${data.service.name} in ${locationLabel} | Nu Standard Cleaning`,
    ogDescription: desc,
    ogUrl: canonical,
  };
}
