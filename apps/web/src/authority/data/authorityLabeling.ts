import { getGuidePageBySlug } from "./authorityGuidePageData";
import { getMethodPageBySlug } from "./authorityMethodPageData";
import { getProblemPageBySlug } from "./authorityProblemPageData";
import { getSurfacePageBySlug } from "./authoritySurfacePageData";
import { getProductBySlug } from "@/lib/products/productRegistry";

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export function getAuthorityEntityLabel(slug: string): string {
  return (
    getMethodPageBySlug(slug)?.title ??
    getSurfacePageBySlug(slug)?.title ??
    getProblemPageBySlug(slug)?.title ??
    getGuidePageBySlug(slug)?.title ??
    getProductBySlug(slug)?.name ??
    humanizeSlug(slug)
  );
}

export function formatAuthorityComparisonTitle(comparisonSlug: string): string {
  const [left, right] = comparisonSlug.split("-vs-");
  if (!left || !right) return humanizeSlug(comparisonSlug);
  return `${getAuthorityEntityLabel(left)} vs ${getAuthorityEntityLabel(right)}`;
}

export function formatAuthorityClusterTitle(clusterSlug: string): string {
  return humanizeSlug(clusterSlug);
}
