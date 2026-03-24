export type DeepCleanEstimatorImpactFilterState = {
  reviewedOnly: boolean;
  usableOnly: boolean;
  programType: "" | "single_visit" | "three_visit";
  version: string;
  limit: string;
};

export const DEFAULT_DEEP_CLEAN_ESTIMATOR_IMPACT_FILTERS: DeepCleanEstimatorImpactFilterState = {
  reviewedOnly: true,
  usableOnly: true,
  programType: "",
  version: "",
  limit: "",
};

export function DeepCleanEstimatorImpactFilters(props: {
  value: DeepCleanEstimatorImpactFilterState;
  onChange: (next: DeepCleanEstimatorImpactFilterState) => void;
  disabled?: boolean;
}) {
  const { value, onChange, disabled } = props;

  return (
    <div
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      data-testid="deep-clean-estimator-impact-filters"
    >
      <p className="text-sm font-medium text-slate-800">Filters</p>
      <div className="flex flex-wrap gap-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.reviewedOnly}
            disabled={disabled}
            aria-label="Reviewed only"
            onChange={(e) => onChange({ ...value, reviewedOnly: e.target.checked })}
          />
          Reviewed only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value.usableOnly}
            disabled={disabled}
            aria-label="Usable only"
            onChange={(e) => onChange({ ...value, usableOnly: e.target.checked })}
          />
          Usable only
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
                programType: e.target.value as DeepCleanEstimatorImpactFilterState["programType"],
              })
            }
          >
            <option value="">All</option>
            <option value="single_visit">Single visit</option>
            <option value="three_visit">Three visit</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Version</span>
          <input
            type="text"
            placeholder="e.g. 12 or null"
            className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.version}
            aria-label="Estimator version filter"
            onChange={(e) => onChange({ ...value, version: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-slate-700">
          <span className="text-xs font-medium text-slate-500">Limit (max version buckets)</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="optional"
            className="w-36 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            disabled={disabled}
            value={value.limit}
            aria-label="Version bucket limit"
            onChange={(e) => onChange({ ...value, limit: e.target.value })}
          />
        </label>
      </div>
    </div>
  );
}
