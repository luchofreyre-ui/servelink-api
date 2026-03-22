import type { AdminAnomalySlaState } from "@/lib/api/adminAnomalies";

export type ParsedAnomaliesFilters = {
  mine: boolean;
  unassigned: boolean;
  sla: AdminAnomalySlaState | "";
};

function parseSlaParam(value: string | null): AdminAnomalySlaState | "" {
  if (value === "dueSoon" || value === "overdue" || value === "breached") {
    return value;
  }
  return "";
}

export function readAnomalyFiltersFromSearchParams(
  sp: Pick<URLSearchParams, "get"> | null,
): ParsedAnomaliesFilters {
  if (!sp) {
    return { mine: false, unassigned: false, sla: "" };
  }
  return {
    mine: sp.get("mine") === "1",
    unassigned: sp.get("unassigned") === "1",
    sla: parseSlaParam(sp.get("sla")),
  };
}

export function mergeAnomalyFiltersIntoSearchParams(
  current: URLSearchParams,
  patch: Partial<ParsedAnomaliesFilters>,
): URLSearchParams {
  const merged: ParsedAnomaliesFilters = {
    ...readAnomalyFiltersFromSearchParams(current),
    ...patch,
  };

  const next = new URLSearchParams(current.toString());
  if (merged.mine) next.set("mine", "1");
  else next.delete("mine");

  if (merged.unassigned) next.set("unassigned", "1");
  else next.delete("unassigned");

  if (merged.sla) next.set("sla", merged.sla);
  else next.delete("sla");

  return next;
}
