import type { PageMetadata } from "../../seo/metadata";
import { SITE_URL } from "../../seo/seoConfig";
import { getEditorialClusterPageData } from "./clusterData";

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function buildEditorialClusterIndexMetadata(): PageMetadata {
  const canonical = absoluteUrl("/cleaning-guides/clusters");
  const title = "Cleaning Guide Clusters | Nu Standard Cleaning";
  const desc = "Browse editorial cleaning guide clusters that connect live articles to authority pages, surfaces, methods, tools, and local service relevance.";
  return {
    title,
    description: desc,
    canonical,
    ogTitle: title,
    ogDescription: desc,
    ogUrl: canonical,
  };
}

export function buildEditorialClusterDetailMetadata(clusterSlug: string): PageMetadata & { robots?: string } {
  const data = getEditorialClusterPageData(clusterSlug);
  const canonical = absoluteUrl("/cleaning-guides/clusters/" + clusterSlug);

  if (!data) {
    return {
      title: "Cluster Not Found | Nu Standard Cleaning",
      description: "The requested editorial cluster could not be found.",
      canonical,
      robots: "noindex, nofollow",
      ogTitle: "Cluster Not Found | Nu Standard Cleaning",
      ogDescription: "The requested editorial cluster could not be found.",
      ogUrl: canonical,
    };
  }

  const title = data.cluster.name + " | Cleaning Guide Cluster | Nu Standard Cleaning";
  return {
    title,
    description: data.cluster.longDescription,
    canonical,
    ogTitle: title,
    ogDescription: data.cluster.longDescription,
    ogUrl: canonical,
  };
}
