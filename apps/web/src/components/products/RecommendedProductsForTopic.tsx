import Link from "next/link";

import { RecommendationConfidenceBadge } from "@/components/products/RecommendationConfidenceBadge";
import {
  getRecommendedProducts,
  inferRecommendationIntent,
} from "@/lib/products/getRecommendedProducts";
import {
  buildRecommendationCaveat,
  buildRecommendationReasons,
} from "@/lib/products/recommendationExplanation";
import {
  recommendationConfidence,
  recommendationConfidenceExplanation,
} from "@/lib/products/recommendationConfidence";
import type { ProductCleaningIntent } from "@/lib/products/productTypes";

type Props = {
  problem: string;
  surface: string;
  /** When set, overrides problem-inferred intent for the recommendation engine. */
  intent?: ProductCleaningIntent;
};

function getScore(product: {
  finalScore?: number;
  score?: number;
  rating?: { finalScore?: number };
}) {
  return product.finalScore ?? product.score ?? product.rating?.finalScore ?? null;
}

function explainLines(reasons: string[]): { summary: string[]; cautionsFromReasons: string[] } {
  const cautionsFromReasons = reasons.filter((r) => r.startsWith("Caution:"));
  const neutral = reasons.filter((r) => !r.startsWith("Caution:"));
  return { summary: neutral.slice(0, 2), cautionsFromReasons };
}

export default function RecommendedProductsForTopic({ problem, surface, intent }: Props) {
  const effectiveIntent = intent ?? inferRecommendationIntent(problem);
  const products = getRecommendedProducts({
    problem,
    surface,
    limit: 3,
    intent: effectiveIntent,
  });

  if (!products.length) return null;

  return (
    <section className="rounded-2xl border border-[#C9B27C]/35 bg-[#FCFAF5] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900">Recommended products for this problem</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Ranked for <span className="font-medium">{problem}</span> on{" "}
          <span className="font-medium">{surface}</span>.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Confidence labels mean: <span className="font-medium text-neutral-700">High</span> — strong problem +
          surface + chemistry alignment without a hard caveat; <span className="font-medium text-neutral-700">Medium</span>{" "}
          — useful but verify labels; <span className="font-medium text-neutral-700">Situational</span> — caveats or
          partial listing—read the note on each card.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => {
          const reasons = buildRecommendationReasons({
            slug: product.slug,
            problem,
            surface,
            intent: effectiveIntent,
          });
          const caveat = buildRecommendationCaveat({
            slug: product.slug,
            problem,
            surface,
            intent: effectiveIntent,
          });
          const { summary, cautionsFromReasons } = explainLines(reasons);
          const conf = recommendationConfidence({
            slug: product.slug,
            problem,
            surface,
            intent: effectiveIntent,
          });

          return (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="rounded-2xl border border-white/70 bg-white p-4 transition hover:border-[#C9B27C]/60 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base font-semibold text-neutral-900">
                    {product.title ?? product.slug}
                  </div>
                  {product.brand ? <div className="mt-1 text-sm text-neutral-500">{product.brand}</div> : null}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  <RecommendationConfidenceBadge level={conf} />
                  <p className="max-w-[12rem] text-right text-[10px] leading-snug text-neutral-500">
                    {recommendationConfidenceExplanation(conf)}
                  </p>
                  <div className="rounded-xl bg-[#FCFAF5] px-3 py-1 text-sm font-semibold text-neutral-900">
                    {typeof getScore(product) === "number" ? getScore(product)!.toFixed(1) : "—"}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Why this product is recommended
                </p>
                {summary.length > 0 ? (
                  <ul className="mt-1 space-y-1 text-sm text-gray-700">
                    {summary.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-gray-600">Fits this scenario in the ranked library set.</p>
                )}
              </div>

              {cautionsFromReasons.map((r, i) => (
                <p key={`cr-${i}`} className="mt-2 text-sm text-amber-900/90">
                  {r}
                </p>
              ))}

              {caveat ? <p className="mt-2 text-sm font-medium text-amber-900/90">Caution: {caveat}</p> : null}

              <div className="mt-4 text-sm font-medium text-neutral-900">View product →</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
