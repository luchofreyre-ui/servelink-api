import { AdminSelect } from "../../../app/components/forms/AdminSelect";
import { AdminTextInput } from "../../../app/components/forms/AdminTextInput";

export type ShipmentPlannerFiltersState = {
  riskLevel: string;
  shipWindow: string;
  search: string;
};

const RISK_OPTIONS = [
  { value: "", label: "All risk levels" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const SHIP_WINDOW_OPTIONS = [
  { value: "", label: "Any window" },
  { value: "this_week", label: "This week" },
  { value: "next_week", label: "Next week" },
  { value: "urgent", label: "Urgent (48h)" },
];

type ShipmentPlannerFiltersProps = {
  filters: ShipmentPlannerFiltersState;
  onChange: (f: ShipmentPlannerFiltersState) => void;
};

export function ShipmentPlannerFilters({ filters, onChange }: ShipmentPlannerFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <AdminTextInput
        label="FO / Territory search"
        value={filters.search}
        onChange={(search) => onChange({ ...filters, search })}
        placeholder="Search FO or territory"
        type="search"
      />
      <AdminSelect
        label="Risk level"
        value={filters.riskLevel}
        onChange={(riskLevel) => onChange({ ...filters, riskLevel })}
        options={RISK_OPTIONS}
      />
      <AdminSelect
        label="Suggested ship window"
        value={filters.shipWindow}
        onChange={(shipWindow) => onChange({ ...filters, shipWindow })}
        options={SHIP_WINDOW_OPTIONS}
      />
    </div>
  );
}
