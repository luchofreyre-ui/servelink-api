import type { PublishedProductSnapshot } from "./productTypes";
import { getPublishedProductBySlug } from "./productPublishing";

/** View model for the product detail page (aliases over published snapshot fields). */
export type ProductDetailView = PublishedProductSnapshot & {
  name: string;
  scoreReasons: string[];
  scoreWeaknesses: string[];
  avoidUseCases: string[];
  replaces: string[];
  finalScore: number;
  affiliateLinks: {
    walmart?: string;
    homedepot?: string;
  };
};

export function getProductBySlug(slug: string): ProductDetailView | null {
  const p = getPublishedProductBySlug(slug);
  if (!p) return null;
  return {
    ...p,
    name: p.title,
    scoreReasons: p.strengths,
    scoreWeaknesses: p.weaknesses,
    avoidUseCases: p.worstUseCases,
    replaces: [],
    finalScore: p.rating.finalScore,
    affiliateLinks: {
      walmart: p.walmartUrl ?? undefined,
      homedepot: p.homeDepotUrl ?? undefined,
    },
  };
}
