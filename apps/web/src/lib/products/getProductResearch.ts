import { PRODUCT_RESEARCH } from "./productResearch";

export function getProductResearch(slug: string) {
  return PRODUCT_RESEARCH[slug] ?? null;
}
