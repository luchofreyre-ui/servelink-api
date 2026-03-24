import { DEEP_CLEAN_REVIEW_TAGS, DEEP_CLEAN_REVIEW_TAG_LABELS } from "@/constants/deepCleanReviewTags";
import type { DeepCleanAnalyticsSortByApi } from "@/types/deepCleanAnalytics";

export type DeepCleanAnalyticsFilterState = {
  usableOnly: boolean;
  withOperatorNotesOnly: boolean;
  fullyCompletedOnly: boolean;
  programType: "" | "single_visit" | "three_visit";
  sortBy: DeepCleanAnalyticsSortByApi;
  limit: number;
  /** Maps to API reviewStatus when not "all" */
  reviewFilter: "all" | "reviewed" | "unreviewed";
  /** Empty string = any; otherwise must be an allowed API tag */
  reasonTag: string;
};

export const DEFAULT_DEEP_CLEAN_ANALYTICS_FILTERS: DeepCleanAnalyticsFilterState = {
  usableOnly: false,
  withOperatorNotesOnly: false,
  fullyCompletedOnly: false,
  programType: "",
  sortBy: "createdAt_desc",
  limit: 100,
  reviewFilter: "all",
  reasonTag: "",
};

export function DeepCleanAnalyticsFilters(props: {
  value: DeepCleanAnalyticsFilterState;
  onChange: (next: DeepCleanAnalyticsFilterState) => void;
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
            checked={value.usableOnly}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, usableOnly: e.target.checked })}
          />
          Usable only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.withOperatorNotesOnly}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, withOperatorNotesOnly: e.target.checked })}
          />
          Operator notes only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.fullyCompletedOnly}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, fullyCompletedOnly: e.target.checked })}
          />
          Fully completed only
        </label>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Review status</span>
          <select
            aria-label="Review status"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.reviewFilter}
            onChange={(e) =>
              onChange({
                ...value,
                reviewFilter: e.target.value as DeepCleanAnalyticsFilterState["reviewFilter"],
              })
            }
          >
            <option value="all">All</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Reason tag</span>
          <select
            aria-label="Reason tag"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.reasonTag}
            onChange={(e) =>
              onChange({
                ...value,
                reasonTag: e.target.value as DeepCleanAnalyticsFilterState["reasonTag"],
              })
            }
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
          <span className="text-xs font-medium text-slate-500">Program type</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.programType}
            onChange={(e) =>
              onChange({
                ...value,
                programType: e.target.value as DeepCleanAnalyticsFilterState["programType"],
              })
            }
          >
            <option value="">All</option>
            <option value="single_visit">Single visit</option>
            <option value="three_visit">Three visit</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Sort</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.sortBy}
            onChange={(e) =>
              onChange({ ...value, sortBy: e.target.value as DeepCleanAnalyticsSortByApi })
            }
          >
            <option value="createdAt_desc">Created (newest)</option>
            <option value="variance_minutes_desc">Variance minutes (high → low)</option>
            <option value="variance_minutes_asc">Variance minutes (low → high)</option>
            <option value="variance_percent_desc">Variance % (high → low)</option>
            <option value="variance_percent_asc">Variance % (low → high)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Row limit</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={String(value.limit)}
            onChange={(e) => onChange({ ...value, limit: Number(e.target.value) })}
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Summary metrics reflect the same filtered dataset as the table (not a global total). The
        table shows up to the row limit after sort.
      </p>
    </div>
  );
}
