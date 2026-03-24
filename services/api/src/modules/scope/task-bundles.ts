import type { TaskBundleDefinition } from "./task-types";
import { assertTaskIdsExist } from "./task-catalog";

/** Stable bundle IDs used in estimator output and BookingDeepCleanProgram JSON. */
export const DEEP_CLEAN_BUNDLE_IDS = {
  SINGLE_SESSION_FULL: "dcc_single_visit_full_v1",
  FOUNDATION: "dcc_foundation_v1",
  DETAIL_BUNDLE_A: "dcc_detail_bundle_a_v1",
  DETAIL_BUNDLE_B: "dcc_detail_bundle_b_v1",
  MAINT_SUPPORT: "dcc_maint_support_v1",
} as const;

const BUNDLES: TaskBundleDefinition[] = [
  {
    id: DEEP_CLEAN_BUNDLE_IDS.FOUNDATION,
    label: "Deep clean — foundation",
    summary:
      "Heavy foundation: surface reset, kitchen/bath sanitation, floor baseline, touchpoints.",
    taskIds: [
      "dcc_t_surface_reset",
      "dcc_t_kitchen_bath_sanitize",
      "dcc_t_floor_baseline",
      "dcc_t_trash_touchpoints",
    ],
    programPhase: "foundation",
    usageTags: ["phased_deep_clean_visit_1"],
  },
  {
    id: DEEP_CLEAN_BUNDLE_IDS.DETAIL_BUNDLE_A,
    label: "Deep clean — detail bundle A",
    summary:
      "Maintenance-style core plus high-impact detail: kitchen/bath depth and priority baseboards.",
    taskIds: [
      "dcc_t_maint_core",
      "dcc_t_kitchen_detail",
      "dcc_t_bath_detail",
      "dcc_t_baseboards_priority",
    ],
    programPhase: "detail_a",
    usageTags: ["phased_deep_clean_visit_2"],
  },
  {
    id: DEEP_CLEAN_BUNDLE_IDS.DETAIL_BUNDLE_B,
    label: "Deep clean — detail bundle B",
    summary:
      "Whole-home maintenance pass, remaining detail, floor finish, polish and recurring-ready handoff.",
    taskIds: [
      "dcc_t_maint_whole_home",
      "dcc_t_remaining_detail",
      "dcc_t_floor_finish",
      "dcc_t_polish_qa",
    ],
    programPhase: "detail_b",
    usageTags: ["phased_deep_clean_visit_3"],
  },
  {
    id: DEEP_CLEAN_BUNDLE_IDS.MAINT_SUPPORT,
    label: "Maintenance support (reference)",
    summary:
      "Standalone maintenance tasks often paired with phased visits; detail bundles already embed maintenance passes.",
    taskIds: ["dcc_t_maint_core", "dcc_t_maint_whole_home", "dcc_t_trash_touchpoints"],
    programPhase: "maintenance_support",
    usageTags: ["reference", "composite_building_block"],
  },
  {
    id: DEEP_CLEAN_BUNDLE_IDS.SINGLE_SESSION_FULL,
    label: "Deep clean — single session (full)",
    summary:
      "One visit: foundation + detail scope combined (excluding redundant maintenance-only passes from phased split).",
    taskIds: [
      "dcc_t_surface_reset",
      "dcc_t_kitchen_bath_sanitize",
      "dcc_t_floor_baseline",
      "dcc_t_trash_touchpoints",
      "dcc_t_kitchen_detail",
      "dcc_t_bath_detail",
      "dcc_t_baseboards_priority",
      "dcc_t_remaining_detail",
      "dcc_t_floor_finish",
      "dcc_t_single_visit_polish",
    ],
    programPhase: "single_session",
    usageTags: ["single_visit_deep_clean"],
  },
];

for (const b of BUNDLES) {
  assertTaskIdsExist(b.taskIds);
}

const BUNDLE_BY_ID = new Map<string, TaskBundleDefinition>(
  BUNDLES.map((b) => [b.id, b]),
);

export function getBundleById(id: string): TaskBundleDefinition | undefined {
  return BUNDLE_BY_ID.get(id);
}

export function getAllBundles(): readonly TaskBundleDefinition[] {
  return BUNDLES;
}

export function getDeepCleanProgramBundles(): readonly TaskBundleDefinition[] {
  return BUNDLES;
}
