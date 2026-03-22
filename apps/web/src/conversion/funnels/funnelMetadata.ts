import type { PageMetadata } from "../../seo/metadata";
import { SITE_URL } from "../../seo/seoConfig";
import { getServiceFunnelPageData } from "./funnelData";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildServiceFunnelsIndexMetadata(): PageMetadata {
  const canonical = absoluteUrl("/services/funnels");

  return {
    title: "Service Help Funnels | Nu Standard Cleaning",
    description:
      "Browse service funnel pages that connect cleaning knowledge, intent, and localized service routes.",
    canonical,
    ogTitle: "Service Help Funnels | Nu Standard Cleaning",
    ogDescription:
      "Browse service funnel pages that connect cleaning knowledge, intent, and localized service routes.",
    ogUrl: canonical,
  };
}

export function buildServiceFunnelDetailMetadata(
  funnelSlug: string,
): PageMetadata & { robots?: string } {
  const data = getServiceFunnelPageData(funnelSlug);
  const canonical = absoluteUrl(`/services/funnels/${funnelSlug}`);

  if (!data) {
    return {
      title: "Funnel Not Found | Nu Standard Cleaning",
      description: "The requested service funnel page could not be found.",
      canonical,
      robots: "noindex, nofollow",
      ogTitle: "Funnel Not Found | Nu Standard Cleaning",
      ogDescription: "The requested service funnel page could not be found.",
      ogUrl: canonical,
    };
  }

  return {
    title: `${data.funnel.name} | Nu Standard Cleaning`,
    description: data.funnel.longDescription,
    canonical,
    ogTitle: `${data.funnel.name} | Nu Standard Cleaning`,
    ogDescription: data.funnel.longDescription,
    ogUrl: canonical,
  };
}
