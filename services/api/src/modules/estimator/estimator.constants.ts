export const SQFT_MINUTES_PER_100 = {
  maintenance: 6,
  first_time: 8,
  deep_clean: 10,
};

export const BEDROOM_MINUTES = {
  maintenance: 8,
  first_time: 10,
  deep_clean: 12,
};

export const BATHROOM_MINUTES = {
  maintenance: 18,
  first_time: 24,
  deep_clean: 28,
};

export const HALF_BATHROOM_MINUTES = {
  maintenance: 10,
  first_time: 12,
  deep_clean: 14,
};

export const EXTRA_FLOOR_MINUTES = 12;

export const SERVICE_TYPE_MULTIPLIER = {
  maintenance: 1.0,
  first_time: 1.18,
  deep_clean: 1.35,
};

export const LAST_CLEANED_MULTIPLIER = {
  WITHIN_1_WEEK: 0.92,
  WITHIN_2_WEEKS: 0.97,
  WITHIN_1_MONTH: 1.0,
  ONE_TO_THREE_MONTHS: 1.08,
  THREE_TO_SIX_MONTHS: 1.16,
  SIX_PLUS_MONTHS: 1.28,
};

export const CONDITION_MULTIPLIER = {
  LIGHT: 0.95,
  AVERAGE: 1.0,
  HEAVY: 1.18,
};

export const CLUTTER_MULTIPLIER = {
  MINIMAL: 1.0,
  MODERATE: 1.08,
  SIGNIFICANT: 1.18,
};

export const PET_HAIR_MULTIPLIER = {
  NONE: 1.0,
  MODERATE: 1.06,
  HEAVY: 1.15,
};

export const TEAM_EFFICIENCY = {
  1: 1.0,
  2: 1.8,
  3: 2.5,
  4: 3.1,
  5: 3.6,
  6: 4.0,
};

export const ADD_ON_MINUTES = {
  INSIDE_OVEN: 35,
  INSIDE_FRIDGE: 30,
  INTERIOR_WINDOWS: 45,
  BASEBOARDS: 35,
  BLINDS: 25,
  INSIDE_CABINETS: 40,
  WALL_SPOT_CLEANING: 25,
  LAUNDRY_ROOM: 20,
  DISHES: 20,
  BED_LINEN_CHANGE: 10,
  LIGHT_ORGANIZATION: 30,
  HEAVY_PET_HAIR_TREATMENT: 35,
};
