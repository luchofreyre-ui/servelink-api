/**
 * Product library types — seeds, ratings, and published snapshots (index + detail).
 */

/** Primary job the product is positioned for in recommendation and ranking logic. */
export type ProductCleaningIntent = "clean" | "disinfect" | "restore" | "remove_residue" | "maintain";

export interface ProductSeed {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  chemicalClass: string;
  surfaces: string[];
  problems: string[];
  /** Declared primary intent for encyclopedia recommendations and related-product semantics. */
  intent: ProductCleaningIntent;
  notes?: string;
  /** Public retailer PDPs (replace with tagged affiliate URLs when enrolled). */
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
  walmartUrl?: string;
  homeDepotUrl?: string;
  /** Amazon / catalog imagery (optional; bulk-filled via `amazonCatalogImport`). */
  primaryImageUrl?: string;
  imageUrls?: string[];
}

export interface ProductScore {
  score: number;
  reason: string;
}

export interface ProductRating {
  cleaningPower: ProductScore;
  safety: ProductScore;
  surfaceCompatibility: ProductScore;
  easeOfUse: ProductScore;
  consistency: ProductScore;
  finalScore: number;
}

export interface ProductTaxonomyLink {
  label: string;
  href: string;
  kind: "problem" | "surface";
}

export interface PublishedProductSnapshot {
  slug: string;
  title: string;
  brand: string;
  category: string;
  chemicalClass: string;
  intent: ProductCleaningIntent;
  heroVerdict: string;
  warningBadges: string[];
  strengths: string[];
  weaknesses: string[];
  bestUseCases: string[];
  worstUseCases: string[];
  compatibleSurfaces: string[];
  compatibleProblems: string[];
  rating: ProductRating;
  relatedEncyclopediaLinks: ProductTaxonomyLink[];
  /** Optional retailer URLs for product detail CTAs */
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
  walmartUrl?: string;
  homeDepotUrl?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
}

/** Row from `analyzeAllProducts` before snapshot decoration. */
export interface AnalyzedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  chemicalClass: string;
  intent: ProductCleaningIntent;
  compatibleProblems: string[];
  compatibleSurfaces: string[];
  strengths: string[];
  weaknesses: string[];
  bestUseCases: string[];
  worstUseCases: string[];
  rating: ProductRating;
  amazonUrl?: string;
  amazonAffiliateUrl?: string;
  isPurchaseAvailable?: boolean;
  buyLabel?: string;
  walmartUrl?: string;
  homeDepotUrl?: string;
  primaryImageUrl?: string;
  imageUrls?: string[];
}
