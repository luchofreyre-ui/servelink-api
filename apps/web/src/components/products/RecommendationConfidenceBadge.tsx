import type { RecommendationConfidenceLevel } from "@/lib/products/recommendationConfidence";
import {
  recommendationConfidenceExplanation,
  recommendationConfidenceLabel,
} from "@/lib/products/recommendationConfidence";

const STYLES: Record<RecommendationConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-900 border-emerald-200",
  medium: "bg-amber-50 text-amber-900 border-amber-200",
  situational: "bg-slate-50 text-slate-800 border-slate-200",
};

export function RecommendationConfidenceBadge({ level }: { level: RecommendationConfidenceLevel }) {
  return (
    <span
      className={`inline-flex shrink-0 rounded-lg border px-2 py-0.5 text-xs font-semibold ${STYLES[level]}`}
      title={recommendationConfidenceExplanation(level)}
    >
      Fit: {recommendationConfidenceLabel(level)}
    </span>
  );
}
