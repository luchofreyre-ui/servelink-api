import type { AnalyzedProduct, ProductTaxonomyLink, PublishedProductSnapshot } from "./productTypes";
import { analyzeAllProducts } from "./productAnalysis";
import { buildProductTaxonomyLinks } from "./productTaxonomyLinks";
import { PRODUCTS } from "./products.seed";

function buildWarningBadges(input: {
  chemicalClass: string;
  compatibleProblems: string[];
}): string[] {
  const badges: string[] = [];
  if (input.chemicalClass === "acid") badges.push("Acid-based");
  if (input.chemicalClass === "bleach" || input.chemicalClass === "oxygen_bleach") badges.push("Oxidizer");
  if (input.chemicalClass === "ammonia_blend") badges.push("Ammonia-based");
  if (input.compatibleProblems.includes("mineral deposits")) badges.push("Mineral-targeting");
  return badges;
}

function buildHeroVerdict(input: {
  name: string;
  bestUseCases: string[];
  finalScore: number;
}): string {
  const lead = input.bestUseCases[0] ?? "targeted cleaning tasks";
  if (input.finalScore >= 8.5) return `${input.name} is a strong choice for ${lead}.`;
  if (input.finalScore >= 7) return `${input.name} is a solid option for ${lead}.`;
  return `${input.name} can work for ${lead}, but requires more selective use.`;
}

export function buildPublishedProductSnapshot(product: AnalyzedProduct): PublishedProductSnapshot {
  const relatedLinks: ProductTaxonomyLink[] = buildProductTaxonomyLinks({
    problems: product.compatibleProblems,
    surfaces: product.compatibleSurfaces,
  });

  return {
    slug: product.slug,
    title: product.name,
    brand: product.brand,
    category: product.category,
    chemicalClass: product.chemicalClass,
    intent: product.intent,
    heroVerdict: buildHeroVerdict({
      name: product.name,
      bestUseCases: product.bestUseCases,
      finalScore: product.rating.finalScore,
    }),
    warningBadges: buildWarningBadges({
      chemicalClass: product.chemicalClass,
      compatibleProblems: product.compatibleProblems,
    }),
    strengths: product.strengths,
    weaknesses: product.weaknesses,
    bestUseCases: product.bestUseCases,
    worstUseCases: product.worstUseCases,
    compatibleSurfaces: product.compatibleSurfaces,
    compatibleProblems: product.compatibleProblems,
    rating: product.rating,
    relatedEncyclopediaLinks: relatedLinks,
    amazonUrl: product.amazonUrl,
    walmartUrl: product.walmartUrl,
    homeDepotUrl: product.homeDepotUrl,
  };
}

export function getAllPublishedProducts(): PublishedProductSnapshot[] {
  return analyzeAllProducts(PRODUCTS).map(buildPublishedProductSnapshot);
}

export function getPublishedProductBySlug(slug: string): PublishedProductSnapshot | null {
  return getAllPublishedProducts().find((product) => product.slug === slug) ?? null;
}

export function getAllProductSlugs(): string[] {
  return getAllPublishedProducts().map((product) => product.slug);
}
