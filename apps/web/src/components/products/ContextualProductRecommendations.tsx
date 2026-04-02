import RecommendedProductsForTopic from "@/components/products/RecommendedProductsForTopic";
import { RECOMMENDATION_EMPTY_STATE_LINE } from "@/components/products/recommendationEmptyStateCopy";
import type { ProductRecommendationContext } from "@/lib/products/productRecommendationContext";

const DEFAULT_SURFACE = "tile";

export function ContextualProductRecommendations({
  context,
}: {
  context: ProductRecommendationContext | null;
}) {
  return (
    <section className="mt-10">
      {context ? (
        <RecommendedProductsForTopic
          sectionTitle={context.heading}
          problem={context.problem}
          surface={context.surface ?? DEFAULT_SURFACE}
          intent={context.intent}
          densityAuthorityProblemSlug={context.densityAuthorityProblemSlug}
          contextTone={context.contextTone}
          showScores
          showReasons
          showComparisons
        />
      ) : (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-zinc-600">
          {RECOMMENDATION_EMPTY_STATE_LINE}
        </div>
      )}
    </section>
  );
}
