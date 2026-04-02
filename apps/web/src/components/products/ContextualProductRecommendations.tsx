import clsx from "clsx";

import RecommendedProductsForTopic from "@/components/products/RecommendedProductsForTopic";
import { RECOMMENDATION_EMPTY_STATE_LINE } from "@/components/products/recommendationEmptyStateCopy";
import type { ProductRecommendationContext } from "@/lib/products/productRecommendationContext";
import type { ProductRecommendationTrackingContext } from "@/lib/products/productRecommendationTrackingTypes";

const DEFAULT_SURFACE = "tile";

export function ContextualProductRecommendations({
  context,
  pinnedProductSlugs,
  trackingContext,
  presentation = "default",
}: {
  context: ProductRecommendationContext | null;
  pinnedProductSlugs?: readonly string[];
  trackingContext?: ProductRecommendationTrackingContext;
  presentation?: "default" | "problemHubSupporting";
}) {
  const hub = presentation === "problemHubSupporting";

  return (
    <div className={clsx(!hub && "mt-10")}>
      {context ? (
        <RecommendedProductsForTopic
          sectionTitle={hub ? "If you need a product" : context.heading}
          problem={context.problem}
          surface={context.surface ?? DEFAULT_SURFACE}
          intent={context.intent}
          densityAuthorityProblemSlug={context.densityAuthorityProblemSlug}
          contextTone={context.contextTone}
          pinnedProductSlugs={pinnedProductSlugs}
          trackingContext={trackingContext}
          showScores
          showReasons
          showComparisons
          presentation={presentation}
        />
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-zinc-600">
          {RECOMMENDATION_EMPTY_STATE_LINE}
        </div>
      )}
    </div>
  );
}
