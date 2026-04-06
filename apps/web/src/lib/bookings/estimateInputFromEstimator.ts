import type { ProblemType, SurfaceType } from "@/lib/estimator/estimateEngine";

/**
 * Maps the marketing estimator demo form into the API `estimateInput` shape
 * expected by POST /api/v1/bookings.
 */
export function buildEstimateInputForApi(params: {
  sqft: number;
  surface: SurfaceType;
  problem: ProblemType;
}): Record<string, unknown> {
  const sqftBand =
    params.sqft < 800
      ? "0_799"
      : params.sqft < 1200
        ? "800_1199"
        : "1200_1599";
  const serviceType =
    params.problem === "heavy_buildup" || params.problem === "deep_clean"
      ? "deep_clean"
      : "maintenance";

  return {
    property_type: "house",
    sqft_band: sqftBand,
    bedrooms: "3",
    bathrooms: "2",
    floors: "1",
    service_type: serviceType,
    first_time_with_servelink: "no",
    last_professional_clean: "1_3_months",
    clutter_level: "light",
    kitchen_condition: "normal",
    bathroom_condition: "normal",
    pet_presence: "none",
    occupancy_state: "occupied_normal",
    floor_visibility: "mostly_clear",
    flooring_mix: "mostly_hard",
    carpet_percent: "0_25",
    stairs_flights: "one",
    addons: [],
  };
}
