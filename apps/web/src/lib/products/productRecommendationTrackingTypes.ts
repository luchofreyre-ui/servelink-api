export type ProductRecommendationTrackingContext = {
  pageType: string;
  sourcePageType?: string | null;
  problemSlug?: string | null;
  surfaceSlug?: string | null;
  intent?: string | null;
  pinnedProductSlugs?: string[];
};
