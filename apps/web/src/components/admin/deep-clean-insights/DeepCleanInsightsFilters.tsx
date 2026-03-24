import { DEEP_CLEAN_REVIEW_TAGS, DEEP_CLEAN_REVIEW_TAG_LABELS } from "@/constants/deepCleanReviewTags";
import type { DeepCleanInsightsFeedbackBucketApi } from "@/types/deepCleanInsights";
import { DEEP_CLEAN_INSIGHT_BUCKET_LABELS } from "@/mappers/deepCleanInsightsMappers";

const BUCKETS: DeepCleanInsightsFeedbackBucketApi[] = [
  "estimator_issue",
  "operational_issue",
  "scope_issue",
  "data_quality_issue",
  "mixed",
  "other",
];

export type DeepCleanInsightsFilterState = {
  reviewedOnly: boolean;
  programType: "" | "single_visit" | "three_visit";
  reasonTag: string;
  feedbackBucket: "" | DeepCleanInsightsFeedbackBucketApi;
};

export const DEFAULT_DEEP_CLEAN_INSIGHTS_FILTERS: DeepCleanInsightsFilterState = {
  reviewedOnly: true,
  programType: "",
  reasonTag: "",
  feedbackBucket: "",
};

export function DeepCleanInsightsFilters(props: {
  value: DeepCleanInsightsFilterState;
  onChange: (next: DeepCleanInsightsFilterState) => void;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-800">Filters</p>
      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.reviewedOnly}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, reviewedOnly: e.target.checked })}
          />
          Reviewed only
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Program type</span>
          <select
            aria-label="Program type"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.programType}
            onChange={(e) =>
              onChange({
                ...value,
                programType: e.target.value as DeepCleanInsightsFilterState["programType"],
              })
            }
          >
            <option value="">All</option>
            <option value="single_visit">Single visit</option>
            <option value="three_visit">Three visit</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Reason tag</span>
          <select
            aria-label="Reason tag"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.reasonTag}
            onChange={(e) => onChange({ ...value, reasonTag: e.target.value })}
          >
            <option value="">Any</option>
            {DEEP_CLEAN_REVIEW_TAGS.map((t) => (
              <option key={t} value={t}>
                {DEEP_CLEAN_REVIEW_TAG_LABELS[t]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Feedback bucket</span>
          <select
            aria-label="Feedback bucket"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.feedbackBucket}
            onChange={(e) =>
              onChange({
                ...value,
                feedbackBucket: e.target.value as DeepCleanInsightsFilterState["feedbackBucket"],
              })
            }
          >
            <option value="">Any</option>
            {BUCKETS.map((b) => (
              <option key={b} value={b}>
                {DEEP_CLEAN_INSIGHT_BUCKET_LABELS[b] ?? b}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Summary and breakdowns reflect the same filtered reviewed dataset. Unreviewed bookings stay
        in Deep Clean Analytics for action.
      </p>
    </div>
  );
}
