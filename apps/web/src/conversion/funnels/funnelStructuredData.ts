import { SITE_URL } from "../../seo/seoConfig";
import {
  getServiceFunnelIndexItems,
  getServiceFunnelPageData,
} from "./funnelData";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildServiceFunnelsIndexStructuredData() {
  const items = getServiceFunnelIndexItems();

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Service Help Funnels",
    description:
      "Service funnel pages connecting knowledge content to localized service routes.",
    url: absoluteUrl("/services/funnels"),
    hasPart: items.map((item) => ({
      "@type": "CollectionPage",
      name: item.name,
      description: item.shortDescription,
      url: absoluteUrl(item.href),
    })),
  };
}

export function buildServiceFunnelDetailStructuredData(funnelSlug: string) {
  const data = getServiceFunnelPageData(funnelSlug);

  if (!data) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Funnel Not Found",
      description: "The requested service funnel page could not be found.",
      url: absoluteUrl(`/services/funnels/${funnelSlug}`),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.funnel.name,
    description: data.funnel.longDescription,
    url: absoluteUrl(`/services/funnels/${data.funnel.slug}`),
    hasPart: [
      ...data.articles.map((article) => ({
        "@type": "Article",
        headline: article.title,
        url: absoluteUrl(article.href),
        description: article.summary || "",
      })),
      ...data.entities.map((entity) => ({
        "@type": "DefinedTerm",
        name: entity.name,
        url: absoluteUrl(entity.href),
        description: entity.summary || "",
      })),
    ],
  };
}
