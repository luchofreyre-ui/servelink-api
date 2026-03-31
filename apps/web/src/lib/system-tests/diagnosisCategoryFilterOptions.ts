/** Values for `diagnosisCategory` query param (exact API / diagnosis category strings). */
export const SYSTEM_TEST_DIAGNOSIS_CATEGORY_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All categories" },
  { value: "auth_state", label: "Auth" },
  { value: "data_dependency", label: "Data" },
  { value: "timing_issue", label: "Timeout / timing" },
  { value: "selector_drift", label: "Selector" },
  { value: "navigation_issue", label: "Navigation" },
  { value: "environment_unavailable", label: "Environment" },
  { value: "ui_regression", label: "UI / assertion" },
  { value: "api_contract_break", label: "API contract" },
  { value: "unknown", label: "Unknown" },
];

export const SYSTEM_TEST_CONFIDENCE_TIER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All confidence" },
  { value: "high", label: "High confidence" },
  { value: "medium", label: "Medium confidence" },
  { value: "low", label: "Low confidence" },
];

export const SYSTEM_TEST_FAMILIES_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recent:desc", label: "Most recent" },
  { value: "regressionRisk:desc", label: "Highest regression risk" },
  { value: "lifecycle:desc", label: "Lifecycle priority" },
  { value: "confidence:desc", label: "Highest confidence" },
  { value: "priority:desc", label: "Highest priority" },
  { value: "affectedRuns:desc", label: "Most affected runs" },
  { value: "failureCount:desc", label: "Most failures" },
  { value: "operatorState:desc", label: "Operator state (open first)" },
];

export const SYSTEM_TEST_INCIDENTS_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "recent:desc", label: "Most recent" },
  { value: "regressionRisk:desc", label: "Highest regression risk" },
  { value: "lifecycle:desc", label: "Lifecycle priority" },
  { value: "confidence:desc", label: "Highest confidence" },
  { value: "priority:desc", label: "Highest priority" },
  { value: "operatorState:desc", label: "Operator state (open first)" },
];

export const SYSTEM_TEST_LIFECYCLE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All lifecycle states" },
  { value: "new", label: "New" },
  { value: "recurring", label: "Recurring" },
  { value: "resurfaced", label: "Resurfaced" },
  { value: "dormant", label: "Dormant" },
  { value: "resolved", label: "Resolved" },
];

export function parseSortCombo(
  combo: string,
): { sortBy: string; sortDirection: "asc" | "desc" } {
  const parts = combo.split(":");
  const sortBy = parts[0] || "recent";
  const dir = parts[1]?.toLowerCase() === "asc" ? "asc" : "desc";
  return { sortBy, sortDirection: dir };
}
