/** UI labels for estimator-aligned selects (must match API `estimate-factor-enums.ts`). */

import type { BookingSelectOption } from "./BookingSelectField";

const empty: BookingSelectOption = "";

export function withEmpty(
  rows: Array<{ value: string; label: string }>,
  placeholder: string,
): BookingSelectOption[] {
  return [empty, ...rows.map((r) => ({ value: r.value, label: r.label }))];
}

export const PROPERTY_TYPE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhome", label: "Townhome" },
  { value: "duplex", label: "Duplex" },
];

export const FLOORS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "1", label: "1 floor" },
  { value: "2", label: "2 floors" },
  { value: "3_plus", label: "3+ floors" },
];

export const FIRST_TIME_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "yes", label: "Yes — first time with Servelink" },
  { value: "no", label: "No — returning" },
  { value: "not_sure", label: "Not sure" },
];

export const LAST_PRO_CLEAN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "under_2_weeks", label: "Under 2 weeks ago" },
  { value: "2_4_weeks", label: "2–4 weeks ago" },
  { value: "1_3_months", label: "1–3 months ago" },
  { value: "3_6_months", label: "3–6 months ago" },
  { value: "6_plus_months", label: "6+ months ago" },
  { value: "not_sure", label: "Not sure" },
];

export const CLUTTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "minimal", label: "Minimal" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
  { value: "not_sure", label: "Not sure" },
];

export const KITCHEN_CONDITION_OPTIONS: Array<{ value: string; label: string }> =
  [
    { value: "light", label: "Light" },
    { value: "normal", label: "Normal" },
    { value: "heavy_grease", label: "Heavy grease" },
    { value: "not_sure", label: "Not sure" },
  ];

export const STOVETOP_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "flat_glass", label: "Flat glass cooktop" },
  { value: "gas_grates", label: "Gas grates" },
  { value: "not_sure", label: "Not sure" },
];

export const BATHROOM_CONDITION_OPTIONS: Array<{ value: string; label: string }> =
  [
    { value: "light", label: "Light" },
    { value: "normal", label: "Normal" },
    { value: "heavy_scale", label: "Heavy scale / buildup" },
    { value: "not_sure", label: "Not sure" },
  ];

export const GLASS_SHOWERS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "none", label: "None" },
  { value: "one", label: "One glass shower" },
  { value: "multiple", label: "Multiple glass showers" },
  { value: "not_sure", label: "Not sure" },
];

export const PET_PRESENCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "none", label: "No pets" },
  { value: "one", label: "One pet" },
  { value: "multiple", label: "Multiple pets" },
  { value: "not_sure", label: "Not sure" },
];

export const PET_SHEDDING_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "low", label: "Low shedding" },
  { value: "medium", label: "Medium shedding" },
  { value: "high", label: "High shedding" },
  { value: "not_sure", label: "Not sure" },
];

export const PET_ACCIDENTS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "not_sure", label: "Not sure" },
];

export const OCCUPANCY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "vacant", label: "Vacant" },
  { value: "occupied_normal", label: "Occupied — normal" },
  { value: "occupied_cluttered", label: "Occupied — cluttered" },
  { value: "not_sure", label: "Not sure" },
];

export const FLOOR_VISIBILITY_OPTIONS: Array<{ value: string; label: string }> =
  [
    { value: "mostly_clear", label: "Mostly clear floors" },
    { value: "some_obstacles", label: "Some obstacles" },
    { value: "lots_of_items", label: "Lots of items / obstacles" },
    { value: "not_sure", label: "Not sure" },
  ];

export const CARPET_PERCENT_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "0_25", label: "0–25% carpet" },
  { value: "26_50", label: "26–50% carpet" },
  { value: "51_75", label: "51–75% carpet" },
  { value: "76_100", label: "76–100% carpet" },
  { value: "not_sure", label: "Not sure" },
];

export const STAIRS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "none", label: "No stairs / not applicable" },
  { value: "one", label: "One flight" },
  { value: "two_plus", label: "Two or more flights" },
  { value: "not_sure", label: "Not sure" },
];
