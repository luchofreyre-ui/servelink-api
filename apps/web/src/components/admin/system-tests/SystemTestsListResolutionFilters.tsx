"use client";

import {
  SYSTEM_TEST_CONFIDENCE_TIER_OPTIONS,
  SYSTEM_TEST_DIAGNOSIS_CATEGORY_FILTER_OPTIONS,
} from "@/lib/system-tests/diagnosisCategoryFilterOptions";

export type SystemTestsListResolutionFiltersProps = {
  sortOptions: { value: string; label: string }[];
  category: string;
  confidenceTier: string;
  sortCombo: string;
  onCategoryChange: (value: string) => void;
  onConfidenceChange: (value: string) => void;
  onSortComboChange: (value: string) => void;
  disabled?: boolean;
  "data-testid"?: string;
};

const selectClass =
  "mt-1 w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-teal-400/50 focus:outline-none";

export function SystemTestsListResolutionFilters(props: SystemTestsListResolutionFiltersProps) {
  const {
    sortOptions,
    category,
    confidenceTier,
    sortCombo,
    onCategoryChange,
    onConfidenceChange,
    onSortComboChange,
    disabled,
    "data-testid": testId,
  } = props;

  return (
    <div
      className="grid gap-4 sm:grid-cols-3"
      data-testid={testId ?? "system-tests-resolution-filters"}
    >
      <label className="block text-xs text-white/45">
        Category
        <select
          className={selectClass}
          value={category}
          disabled={disabled}
          onChange={(e) => onCategoryChange(e.target.value)}
          data-testid="system-tests-filter-category"
        >
          {SYSTEM_TEST_DIAGNOSIS_CATEGORY_FILTER_OPTIONS.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-white/45">
        Confidence
        <select
          className={selectClass}
          value={confidenceTier}
          disabled={disabled}
          onChange={(e) => onConfidenceChange(e.target.value)}
          data-testid="system-tests-filter-confidence"
        >
          {SYSTEM_TEST_CONFIDENCE_TIER_OPTIONS.map((o) => (
            <option key={o.value || "all-conf"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-white/45">
        Sort
        <select
          className={selectClass}
          value={sortCombo}
          disabled={disabled}
          onChange={(e) => onSortComboChange(e.target.value)}
          data-testid="system-tests-filter-sort"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
