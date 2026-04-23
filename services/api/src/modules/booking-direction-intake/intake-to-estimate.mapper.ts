import type { BookingDirectionIntake } from "@prisma/client";
import type {
  Addon,
  Bathrooms,
  Bedrooms,
  EstimateInput,
  Floors,
  PropertyType,
  ServiceType,
  SqftBand,
} from "../estimate/estimator.service";
import type { EstimateFactorsDto } from "./dto/estimate-factors.dto";
import { resolveEstimateFactorsForPublicIntake } from "./estimate-factors-sanitize";

export class IntakeEstimateMappingError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "IntakeEstimateMappingError";
    this.code = code;
  }
}

/**
 * Extracts explicit sqft from marketing home size text.
 * @throws IntakeEstimateMappingError if no valid 3–5 digit sqft in [300, 20000]
 */
export function extractSqftFromHomeSizeStrict(raw: string): number {
  const s = String(raw ?? "").replace(/,/g, "");
  const m = s.match(/(\d{3,5})\b/);
  if (!m) {
    throw new IntakeEstimateMappingError(
      "HOME_SIZE_SQFT_REQUIRED",
      "homeSize must contain a square footage number (3–5 digits, e.g. 2200).",
    );
  }
  const n = Number.parseInt(m[1], 10);
  if (!Number.isFinite(n) || n < 300) {
    throw new IntakeEstimateMappingError(
      "HOME_SIZE_SQFT_INVALID",
      "homeSize square footage must be at least 300.",
    );
  }
  return Math.min(20000, n);
}

export function sqftToBand(sqft: number): SqftBand {
  const x = Math.max(0, Math.floor(sqft));
  if (x <= 799) return "0_799";
  if (x <= 1199) return "800_1199";
  if (x <= 1599) return "1200_1599";
  if (x <= 1999) return "1600_1999";
  if (x <= 2499) return "2000_2499";
  if (x <= 2999) return "2500_2999";
  if (x <= 3499) return "3000_3499";
  return "3500_plus";
}

function mapServiceIdToServiceType(serviceId: string): ServiceType {
  const id = String(serviceId ?? "").toLowerCase().trim();
  if (id.includes("move")) {
    /** Public slug `move-in-move-out` contains both substrings; treat as move-in for matching. */
    if (id === "move-in-move-out" || id.includes("move-in-move-out")) {
      return "move_in";
    }
    if (id.includes("in") && !id.includes("out")) return "move_in";
    return "move_out";
  }
  if (id.includes("deep")) return "deep_clean";
  if (id.includes("recurring") || id.includes("maintenance")) return "maintenance";
  return "maintenance";
}

function mapFrequencyToServiceHint(
  serviceId: string,
  frequency: string,
): ServiceType {
  const base = mapServiceIdToServiceType(serviceId);
  const f = String(frequency ?? "").toLowerCase();
  if (base === "deep_clean" || base === "move_in" || base === "move_out") {
    return base;
  }
  if (f.includes("one") || f.includes("one-time")) return "deep_clean";
  return "maintenance";
}

function assertBedrooms(value: string): Bedrooms {
  const v = value as Bedrooms;
  return v;
}

function assertBathrooms(value: string): Bathrooms {
  const v = value as Bathrooms;
  return v;
}

function assertFloors(value: string): Floors {
  return value as Floors;
}

function assertPropertyType(value: string): PropertyType {
  return value as PropertyType;
}

function assertAddons(ids: string[]): Addon[] {
  return ids as Addon[];
}

/** Same fields the estimator reads from a persisted intake row (DTO-compatible). */
export type IntakeFieldsForEstimate = {
  homeSize: string;
  bedrooms: string;
  bathrooms: string;
  serviceId: string;
  frequency: string;
  deepCleanProgram?: string | null;
  /** Omitted by the public `/book` client; filled with defaults before estimating. */
  estimateFactors?: EstimateFactorsDto | null;
  /** Geocoded service site — drives `matchFOs` in the estimator when both finite. */
  siteLat?: number | null;
  siteLng?: number | null;
};

/**
 * Maps validated intake + questionnaire into `EstimateInput`.
 * Throws `IntakeEstimateMappingError` only for sqft extraction failures (DTO should prevent others).
 */
export function mapIntakeFieldsToEstimateInput(
  intake: IntakeFieldsForEstimate,
): EstimateInput {
  const sqft = extractSqftFromHomeSizeStrict(intake.homeSize);
  const sqft_band = sqftToBand(sqft);
  const bedrooms = assertBedrooms(intake.bedrooms);
  const bathrooms = assertBathrooms(intake.bathrooms);
  const service_type = mapFrequencyToServiceHint(
    intake.serviceId,
    intake.frequency,
  );

  const f = resolveEstimateFactorsForPublicIntake(intake.estimateFactors);

  const deepCleanProgramMode: "single_visit" | "phased_3_visit" =
    intake.deepCleanProgram === "phased_3_visit" ||
    f.firstTimeVisitProgram === "three_visit"
      ? "phased_3_visit"
      : "single_visit";

  const estimateInput: EstimateInput = {
    property_type: assertPropertyType(f.propertyType),
    sqft_band,
    bedrooms,
    bathrooms,
    floors: assertFloors(f.floors),
    service_type,
    ...(service_type === "deep_clean"
      ? { deep_clean_program: deepCleanProgramMode }
      : {}),
    first_time_with_servelink: f.firstTimeWithServelink,
    last_professional_clean: f.lastProfessionalClean,
    clutter_level: f.clutterLevel,
    kitchen_condition: f.kitchenCondition,
    stovetop_type: f.stovetopType,
    bathroom_condition: f.bathroomCondition,
    glass_showers: f.glassShowers,
    pet_presence: f.petPresence,
    ...(f.petPresence !== "none" && f.petShedding
      ? { pet_shedding: f.petShedding }
      : {}),
    pet_accidents_or_litter_areas: f.petAccidentsOrLitterAreas,
    occupancy_state: f.occupancyState,
    floor_visibility: f.floorVisibility,
    carpet_percent: f.carpetPercent,
    stairs_flights: f.stairsFlights,
    addons: assertAddons(f.addonIds ?? []),
    half_bathrooms: f.halfBathrooms,
    flooring_mix: f.floorMix,
    layout_type: f.layoutType,
    occupancy_level: f.occupancyLevel,
    children_in_home: f.childrenInHome,
    pet_impact: f.petImpact,
    overall_labor_condition: f.overallLaborCondition,
    kitchen_intensity: f.kitchenIntensity,
    bathroom_complexity: f.bathroomComplexity,
    clutter_access: f.clutterAccess,
    surface_detail_tokens: [...f.surfaceDetailTokens],
    primary_cleaning_intent: f.primaryIntent,
    last_pro_clean_recency: f.lastProCleanRecency,
    first_time_visit_program: f.firstTimeVisitProgram,
    recurring_cadence_intent: f.recurringCadenceIntent,
  };

  const lat = intake.siteLat;
  const lng = intake.siteLng;
  if (
    typeof lat === "number" &&
    Number.isFinite(lat) &&
    typeof lng === "number" &&
    Number.isFinite(lng)
  ) {
    estimateInput.siteLat = lat;
    estimateInput.siteLng = lng;
  }

  return estimateInput;
}

function parseEstimateFactorsFromJson(
  raw: unknown,
): EstimateFactorsDto | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  return raw as EstimateFactorsDto;
}

/**
 * Maps a persisted intake row to EstimatorService input.
 * Missing or non-object `estimateFactors` JSON is filled with public-funnel defaults
 * before mapping (see `resolveEstimateFactorsForPublicIntake`).
 * @throws IntakeEstimateMappingError for sqft / structural mapping failures only.
 */
export function mapIntakeToEstimateInput(
  intake: BookingDirectionIntake,
): EstimateInput {
  const factors = parseEstimateFactorsFromJson(intake.estimateFactors);

  return mapIntakeFieldsToEstimateInput({
    homeSize: intake.homeSize,
    bedrooms: intake.bedrooms,
    bathrooms: intake.bathrooms,
    serviceId: intake.serviceId,
    frequency: intake.frequency,
    deepCleanProgram: intake.deepCleanProgram,
    estimateFactors: resolveEstimateFactorsForPublicIntake(factors),
    siteLat: intake.siteLat ?? null,
    siteLng: intake.siteLng ?? null,
  });
}
