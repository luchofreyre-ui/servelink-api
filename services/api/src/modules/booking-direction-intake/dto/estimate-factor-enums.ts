/** Mirrors `EstimatorService` / `EstimateInput` allowed literals for intake validation. */

export const ESTIMATE_BEDROOMS = ["0", "1", "2", "3", "4", "5_plus"] as const;

export const ESTIMATE_BATHROOMS = [
  "1",
  "1_5",
  "2",
  "2_5",
  "3",
  "3_5",
  "4_plus",
] as const;

export const ESTIMATE_PROPERTY_TYPES = [
  "apartment",
  "house",
  "condo",
  "townhome",
  "duplex",
] as const;

export const ESTIMATE_FLOORS = ["1", "2", "3_plus"] as const;

export const ESTIMATE_FIRST_TIME = ["yes", "no", "not_sure"] as const;

export const ESTIMATE_LAST_PRO_CLEAN = [
  "under_2_weeks",
  "2_4_weeks",
  "1_3_months",
  "3_6_months",
  "6_plus_months",
  "not_sure",
] as const;

export const ESTIMATE_CLUTTER_LEVELS = [
  "minimal",
  "light",
  "moderate",
  "heavy",
  "not_sure",
] as const;

export const ESTIMATE_KITCHEN_CONDITION = [
  "light",
  "normal",
  "heavy_grease",
  "not_sure",
] as const;

export const ESTIMATE_STOVETOP_TYPE = ["flat_glass", "gas_grates", "not_sure"] as const;

export const ESTIMATE_BATHROOM_CONDITION = [
  "light",
  "normal",
  "heavy_scale",
  "not_sure",
] as const;

export const ESTIMATE_GLASS_SHOWERS = ["none", "one", "multiple", "not_sure"] as const;

export const ESTIMATE_PET_PRESENCE = ["none", "one", "multiple", "not_sure"] as const;

export const ESTIMATE_PET_SHEDDING = ["low", "medium", "high", "not_sure"] as const;

export const ESTIMATE_PET_ACCIDENTS = ["yes", "no", "not_sure"] as const;

export const ESTIMATE_OCCUPANCY = [
  "vacant",
  "occupied_normal",
  "occupied_cluttered",
  "not_sure",
] as const;

export const ESTIMATE_FLOOR_VISIBILITY = [
  "mostly_clear",
  "some_obstacles",
  "lots_of_items",
  "not_sure",
] as const;

export const ESTIMATE_CARPET_PERCENT = [
  "0_25",
  "26_50",
  "51_75",
  "76_100",
  "not_sure",
] as const;

export const ESTIMATE_STAIRS_FLIGHTS = ["none", "one", "two_plus", "not_sure"] as const;

export const ESTIMATE_ADDON_IDS = [
  "inside_oven",
  "inside_fridge",
  "interior_windows",
  "blinds",
  "baseboards_detail",
  "cabinets_exterior_detail",
  "laundry_fold",
  "dish_wash_load",
  "vacuum_sofa",
] as const;

export type EstimateAddonId = (typeof ESTIMATE_ADDON_IDS)[number];

/** Half baths (explicit; full baths remain `bathrooms` on intake row). */
export const ESTIMATE_HALF_BATHROOMS = ["0", "1", "2_plus"] as const;

export const ESTIMATE_FLOOR_MIX = [
  "mostly_hard",
  "mixed",
  "mostly_carpet",
] as const;

export const ESTIMATE_LAYOUT_TYPE = [
  "open_plan",
  "mixed",
  "segmented",
] as const;

export const ESTIMATE_OCCUPANCY_LEVEL = [
  "ppl_1_2",
  "ppl_3_4",
  "ppl_5_plus",
] as const;

export const ESTIMATE_CHILDREN_IN_HOME = ["yes", "no"] as const;

/** Layer-1 pet impact (distinct from detailed pet presence tokens). */
export const ESTIMATE_PET_IMPACT = ["none", "light", "heavy"] as const;

export const ESTIMATE_OVERALL_LABOR_CONDITION = [
  "recently_maintained",
  "normal_lived_in",
  "behind_weeks",
  "major_reset",
] as const;

export const ESTIMATE_KITCHEN_INTENSITY = [
  "light_use",
  "average_use",
  "heavy_use",
] as const;

export const ESTIMATE_BATHROOM_COMPLEXITY = [
  "standard",
  "moderate_detailing",
  "heavy_detailing",
] as const;

export const ESTIMATE_CLUTTER_ACCESS = [
  "mostly_clear",
  "moderate_clutter",
  "heavy_clutter",
] as const;

export const ESTIMATE_SURFACE_DETAIL_TOKENS = [
  "interior_glass",
  "heavy_mirrors",
  "built_ins",
  "detailed_trim",
  "many_touchpoints",
] as const;

export const ESTIMATE_PRIMARY_INTENT = [
  "maintenance_clean",
  "detailed_standard",
  "reset_level",
] as const;

/** Layer-3 recency question (mapped into `lastProfessionalClean` during sanitize). */
export const ESTIMATE_LAST_PRO_CLEAN_RECENCY = [
  "within_30_days",
  "days_30_90",
  "days_90_plus",
  "unknown_or_not_recently",
] as const;

export const ESTIMATE_FIRST_TIME_VISIT_PROGRAM = [
  "one_visit",
  "two_visit",
  "three_visit",
] as const;

/** Cadence intent (not schedule). */
export const ESTIMATE_RECURRING_CADENCE_INTENT = [
  "weekly",
  "biweekly",
  "monthly",
  "none",
] as const;
