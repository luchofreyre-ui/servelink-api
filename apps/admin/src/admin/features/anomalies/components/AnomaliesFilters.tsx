import { AdminSelect } from "../../../app/components/forms/AdminSelect";

export type AnomaliesFiltersState = {
  opsStatus: string;
  severity: string;
  limit: string;
  sinceHours: string;
};

const OPS_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "open", label: "Open" },
  { value: "acked", label: "Acknowledged" },
];

const SEVERITY_OPTIONS = [
  { value: "", label: "All severities" },
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "critical", label: "Critical" },
];

type AnomaliesFiltersProps = {
  filters: AnomaliesFiltersState;
  onChange: (f: AnomaliesFiltersState) => void;
};

export function AnomaliesFilters({ filters, onChange }: AnomaliesFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <AdminSelect
        label="Status"
        value={filters.opsStatus}
        onChange={(opsStatus) => onChange({ ...filters, opsStatus })}
        options={OPS_STATUS_OPTIONS}
      />
      <AdminSelect
        label="Severity"
        value={filters.severity}
        onChange={(severity) => onChange({ ...filters, severity })}
        options={SEVERITY_OPTIONS}
      />
      <AdminSelect
        label="Time window"
        value={filters.sinceHours}
        onChange={(sinceHours) => onChange({ ...filters, sinceHours })}
        options={[
          { value: "24", label: "Last 24h" },
          { value: "168", label: "Last 7 days" },
          { value: "720", label: "Last 30 days" },
        ]}
      />
      <AdminSelect
        label="Limit"
        value={filters.limit}
        onChange={(limit) => onChange({ ...filters, limit })}
        options={[
          { value: "25", label: "25" },
          { value: "50", label: "50" },
          { value: "100", label: "100" },
        ]}
      />
    </div>
  );
}
