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
