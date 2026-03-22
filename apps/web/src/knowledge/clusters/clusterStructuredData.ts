import { SITE_URL } from "../../seo/seoConfig";
import {
  getEditorialClusterIndexItems,
  getEditorialClusterPageData,
} from "./clusterData";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildEditorialClusterIndexStructuredData() {
  const items = getEditorialClusterIndexItems();
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Cleaning Guide Clusters",
    description:
      "Editorial cluster hubs that group live articles with related authority pages and service relevance.",
    url: absoluteUrl("/cleaning-guides/clusters"),
    hasPart: items.map((item) => ({
      "@type": "CollectionPage",
      name: item.name,
      description: item.shortDescription,
      url: absoluteUrl(item.href),
    })),
  };
}

export function buildEditorialClusterDetailStructuredData(clusterSlug: string) {
  const data = getEditorialClusterPageData(clusterSlug);

  if (!data) {
    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Cluster Not Found",
      description: "The requested editorial cluster could not be found.",
      url: absoluteUrl(`/cleaning-guides/clusters/${clusterSlug}`),
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: data.cluster.name,
    description: data.cluster.longDescription,
    url: absoluteUrl(`/cleaning-guides/clusters/${data.cluster.slug}`),
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
