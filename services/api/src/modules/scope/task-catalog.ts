import type { TaskDefinition } from "./task-types";

const dc = ["deep_clean"] as const;
const maintDc = ["maintenance", "deep_clean"] as const;

function t(def: TaskDefinition): TaskDefinition {
  return def;
}

/**
 * Canonical task catalog. IDs are stable API contracts for snapshots and future FO UI.
 */
export const TASK_CATALOG: readonly TaskDefinition[] = [
  t({
    id: "dcc_t_surface_reset",
    label: "Surface reset & access pass (foundation)",
    category: "foundation",
    description: "Clear surfaces for access; foundation reset before deep work.",
    serviceTypes: dc,
    scopeTags: ["surfaces", "foundation", "access_reset"],
    defaultLaborWeight: 1.1,
    effortClass: "standard",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
  t({
    id: "dcc_t_kitchen_bath_sanitize",
    label: "Kitchen + bathrooms: functional deep sanitation",
    category: "sanitation",
    description: "Functional deep sanitation in kitchen and baths.",
    serviceTypes: dc,
    scopeTags: ["kitchen", "bathroom", "foundation"],
    defaultLaborWeight: 1.2,
    effortClass: "heavy",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
  t({
    id: "dcc_t_floor_baseline",
    label: "Floors: sweep/vacuum/mop baseline",
    category: "floors",
    serviceTypes: maintDc,
    scopeTags: ["floors", "foundation"],
    defaultLaborWeight: 1,
    effortClass: "standard",
    maintenanceEligible: true,
  }),
  t({
    id: "dcc_t_trash_touchpoints",
    label: "Trash removal (light) + high-touch sanitize",
    category: "hygiene",
    serviceTypes: maintDc,
    scopeTags: ["whole_home", "surfaces"],
    defaultLaborWeight: 0.85,
    effortClass: "light",
    maintenanceEligible: true,
  }),
  t({
    id: "dcc_t_maint_core",
    label: "Maintenance core (recurring-equivalent coverage)",
    category: "maintenance",
    serviceTypes: maintDc,
    scopeTags: ["whole_home", "maintenance_pass"],
    defaultLaborWeight: 1,
    effortClass: "standard",
    maintenanceEligible: true,
  }),
  t({
    id: "dcc_t_kitchen_detail",
    label: "Kitchen deep detail (grease, fronts, fixtures)",
    category: "kitchen",
    serviceTypes: dc,
    scopeTags: ["kitchen", "detail"],
    defaultLaborWeight: 1.15,
    effortClass: "heavy",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
  t({
    id: "dcc_t_bath_detail",
    label: "Bathroom deep detail (scale, grout, glass)",
    category: "bathroom",
    serviceTypes: dc,
    scopeTags: ["bathroom", "detail"],
    defaultLaborWeight: 1.15,
    effortClass: "heavy",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
  t({
    id: "dcc_t_baseboards_priority",
    label: "Baseboards & edges in priority zones",
    category: "detail",
    serviceTypes: dc,
    scopeTags: ["detail", "surfaces"],
    defaultLaborWeight: 1,
    effortClass: "standard",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
  t({
    id: "dcc_t_maint_whole_home",
    label: "Maintenance pass whole home",
    category: "maintenance",
    serviceTypes: maintDc,
    scopeTags: ["whole_home", "maintenance_pass"],
    defaultLaborWeight: 1.05,
    effortClass: "standard",
    maintenanceEligible: true,
  }),
  t({
    id: "dcc_t_remaining_detail",
    label: "Remaining rooms: detail + uniform quality",
    category: "detail",
    serviceTypes: dc,
    scopeTags: ["whole_home", "detail"],
    defaultLaborWeight: 1.1,
    effortClass: "standard",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
  t({
    id: "dcc_t_floor_finish",
    label: "Floor finishing + corners",
    category: "floors",
    serviceTypes: maintDc,
    scopeTags: ["floors", "detail"],
    defaultLaborWeight: 1,
    effortClass: "standard",
    maintenanceEligible: true,
  }),
  t({
    id: "dcc_t_polish_qa",
    label: "Polish / QA + maintenance-ready handoff",
    category: "qa",
    serviceTypes: maintDc,
    scopeTags: ["whole_home", "qa"],
    defaultLaborWeight: 0.9,
    effortClass: "light",
    maintenanceEligible: true,
  }),
  t({
    id: "dcc_t_single_visit_polish",
    label: "Final polish & QA (single session)",
    category: "qa",
    serviceTypes: dc,
    scopeTags: ["whole_home", "qa"],
    defaultLaborWeight: 1,
    effortClass: "standard",
    deepCleanOnly: true,
    maintenanceEligible: false,
  }),
];

const TASK_BY_ID: Map<string, TaskDefinition> = new Map(
  TASK_CATALOG.map((task) => [task.id, task]),
);

export function getTaskById(id: string): TaskDefinition | undefined {
  return TASK_BY_ID.get(id);
}

export function getAllTasks(): readonly TaskDefinition[] {
  return TASK_CATALOG;
}

export function assertTaskIdsExist(ids: readonly string[]): void {
  for (const id of ids) {
    if (!TASK_BY_ID.has(id)) {
      throw new Error(`Unknown task id in bundle: ${id}`);
    }
  }
}
