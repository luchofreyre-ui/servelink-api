/** Preset estimate inputs for admin preview only (deep_clean service_type). */

export type DeepCleanEstimatorPreviewPreset = {
  id: string;
  label: string;
  estimateInput: Record<string, unknown>;
};

const base = {
  property_type: "house",
  bedrooms: "3",
  bathrooms: "2",
  floors: "1",
  service_type: "deep_clean",
  first_time_with_servelink: "no",
  last_professional_clean: "1_3_months",
  clutter_level: "light",
  kitchen_condition: "normal",
  stovetop_type: "flat_glass",
  bathroom_condition: "normal",
  glass_showers: "none",
  pet_presence: "none",
  occupancy_state: "occupied_normal",
  floor_visibility: "mostly_clear",
  flooring_mix: "mostly_hard",
  carpet_percent: "0_25",
  stairs_flights: "one",
  addons: [],
};

export const DEEP_CLEAN_ESTIMATOR_PREVIEW_PRESETS: DeepCleanEstimatorPreviewPreset[] = [
  {
    id: "small_single",
    label: "Small home — single visit",
    estimateInput: {
      ...base,
      sqft_band: "800_1199",
      deep_clean_program: "single_visit",
    },
  },
  {
    id: "mid_three",
    label: "Mid home — three visit",
    estimateInput: {
      ...base,
      sqft_band: "1600_1999",
      deep_clean_program: "phased_3_visit",
    },
  },
  {
    id: "pet_heavy_three",
    label: "Pet-heavy — three visit",
    estimateInput: {
      ...base,
      sqft_band: "2000_2499",
      deep_clean_program: "phased_3_visit",
      pet_presence: "multiple",
      pet_shedding: "high",
    },
  },
];
