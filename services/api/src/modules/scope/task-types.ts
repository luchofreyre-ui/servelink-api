/**
 * Code-defined task/scope types (Phase 1). Not DB-backed.
 */

export type ScopeServiceType = "maintenance" | "deep_clean" | "move_in" | "move_out";

export type ScopeTag =
  | "whole_home"
  | "kitchen"
  | "bathroom"
  | "floors"
  | "surfaces"
  | "foundation"
  | "detail"
  | "qa"
  | "maintenance_pass"
  | "access_reset";

/** Relative effort hint for reporting / future weighting (not minutes). */
export type EffortClass = "light" | "standard" | "heavy";

export interface TaskDefinition {
  id: string;
  label: string;
  category: string;
  description?: string;
  serviceTypes: readonly ScopeServiceType[];
  scopeTags: readonly ScopeTag[];
  /** Default labor weight (1 = normal unit; for future allocation). */
  defaultLaborWeight: number;
  effortClass: EffortClass;
  deepCleanOnly?: boolean;
  /** Task can appear on maintenance or hybrid visits */
  maintenanceEligible?: boolean;
}

export interface TaskBundleDefinition {
  id: string;
  label: string;
  summary: string;
  taskIds: readonly string[];
  /** Where this bundle fits in the deep-clean product line */
  programPhase?:
    | "single_session"
    | "foundation"
    | "detail_a"
    | "detail_b"
    | "maintenance_support";
  /** Free-form tags for selectors (e.g. phased_deep_clean_visit_2) */
  usageTags?: readonly string[];
}
