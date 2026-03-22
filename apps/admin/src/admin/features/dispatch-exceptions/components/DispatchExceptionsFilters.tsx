import { AdminFilterBar } from "../../../app/components/filters/AdminFilterBar";
import { AdminTextInput } from "../../../app/components/forms/AdminTextInput";
import { AdminSelect } from "../../../app/components/forms/AdminSelect";
import type { DispatchExceptionsParams } from "../api/types";

type Props = {
  filters: DispatchExceptionsParams;
  onFiltersChange: (f: DispatchExceptionsParams) => void;
};

const PRIORITY_OPTIONS = [
  { value: "", label: "All priorities" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All types" },
  { value: "no_candidates", label: "No candidates" },
  { value: "all_excluded", label: "All excluded" },
  { value: "no_selection", label: "No selection" },
  { value: "multi_pass", label: "Multi pass" },
];

const SORT_OPTIONS = [
  { value: "priority", label: "Priority" },
  { value: "lastDecisionAt", label: "Last decision" },
  { value: "scheduledStart", label: "Scheduled start" },
  { value: "createdAt", label: "Created" },
];

export function DispatchExceptionsFilters({ filters, onFiltersChange }: Props) {
  return (
    <AdminFilterBar>
      <AdminTextInput
        placeholder="Booking ID"
        value={filters.search ?? ""}
        onChange={(v) => onFiltersChange({ ...filters, search: v || undefined })}
      />
      <AdminSelect
        label="Priority"
        value={filters.priorityBucket ?? ""}
        onChange={(v) => onFiltersChange({ ...filters, priorityBucket: v || undefined })}
        options={PRIORITY_OPTIONS}
      />
      <AdminSelect
        label="Type"
        value={filters.type ?? "all"}
        onChange={(v) => onFiltersChange({ ...filters, type: v === "all" ? undefined : v })}
        options={TYPE_OPTIONS}
      />
      <AdminSelect
        label="Sort by"
        value={filters.sortBy ?? "priority"}
        onChange={(v) => onFiltersChange({ ...filters, sortBy: v })}
        options={SORT_OPTIONS}
      />
      <AdminSelect
        label="Order"
        value={filters.sortOrder ?? "desc"}
        onChange={(v) =>
          onFiltersChange({ ...filters, sortOrder: (v as "asc" | "desc") ?? "desc" })
        }
        options={[
          { value: "desc", label: "Desc" },
          { value: "asc", label: "Asc" },
        ]}
      />
    </AdminFilterBar>
  );
}
