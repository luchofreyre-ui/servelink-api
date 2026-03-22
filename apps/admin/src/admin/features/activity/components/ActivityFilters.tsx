import { AdminTextInput } from "../../../app/components/forms/AdminTextInput";
import { AdminSelect } from "../../../app/components/forms/AdminSelect";

export type ActivityFiltersState = {
  limit: string;
  entityType: string;
  dateFrom: string;
  dateTo: string;
  search: string;
};

const ENTITY_OPTIONS = [
  { value: "", label: "All entities" },
  { value: "booking", label: "Booking" },
  { value: "dispatch_config", label: "Dispatch config" },
];

type ActivityFiltersProps = {
  filters: ActivityFiltersState;
  onChange: (f: ActivityFiltersState) => void;
};

export function ActivityFilters({ filters, onChange }: ActivityFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <AdminTextInput
        label="Search"
        type="search"
        value={filters.search}
        onChange={(search) => onChange({ ...filters, search })}
        placeholder="Search…"
      />
      <AdminSelect
        label="Entity type"
        value={filters.entityType}
        onChange={(entityType) => onChange({ ...filters, entityType })}
        options={ENTITY_OPTIONS}
      />
      <AdminTextInput
        label="Date from"
        type="date"
        value={filters.dateFrom}
        onChange={(dateFrom) => onChange({ ...filters, dateFrom })}
      />
      <AdminTextInput
        label="Date to"
        type="date"
        value={filters.dateTo}
        onChange={(dateTo) => onChange({ ...filters, dateTo })}
      />
      <AdminTextInput
        label="Limit"
        type="text"
        value={filters.limit}
        onChange={(limit) => onChange({ ...filters, limit })}
        placeholder="50"
      />
    </div>
  );
}
