import type { EstimateFactorsDto } from "./dto/estimate-factors.dto";
import {
  ESTIMATE_ADDON_IDS,
  ESTIMATE_BATHROOM_CONDITION,
  ESTIMATE_CARPET_PERCENT,
  ESTIMATE_CLUTTER_LEVELS,
  ESTIMATE_FIRST_TIME,
  ESTIMATE_FLOOR_VISIBILITY,
  ESTIMATE_FLOORS,
  ESTIMATE_GLASS_SHOWERS,
  ESTIMATE_KITCHEN_CONDITION,
  ESTIMATE_LAST_PRO_CLEAN,
  ESTIMATE_OCCUPANCY,
  ESTIMATE_PET_ACCIDENTS,
  ESTIMATE_PET_PRESENCE,
  ESTIMATE_PET_SHEDDING,
  ESTIMATE_PROPERTY_TYPES,
  ESTIMATE_STAIRS_FLIGHTS,
  ESTIMATE_STOVETOP_TYPE,
} from "./dto/estimate-factor-enums";

/**
 * Neutral defaults for the public `/book` funnel when the client does not send
 * `estimateFactors`. Matches intake bridge tests and satisfies `EstimateFactorsDto`.
 */
export const DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS: EstimateFactorsDto = {
  propertyType: "house",
  floors: "1",
  firstTimeWithServelink: "no",
  lastProfessionalClean: "1_3_months",
  clutterLevel: "light",
  kitchenCondition: "normal",
  stovetopType: "not_sure",
  bathroomCondition: "normal",
  glassShowers: "none",
  petPresence: "none",
  petAccidentsOrLitterAreas: "no",
  occupancyState: "occupied_normal",
  floorVisibility: "mostly_clear",
  carpetPercent: "26_50",
  stairsFlights: "none",
  addonIds: [],
};

function pick<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function sanitizeAddonIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS.addonIds];
  }
  const allowed = new Set<string>(ESTIMATE_ADDON_IDS);
  return value.filter(
    (id): id is string => typeof id === "string" && allowed.has(id),
  );
}

/**
 * Coerces merged / persisted / defaulted questionnaire data into a concrete
 * `EstimateFactorsDto` so `EstimatorService` never receives undefined enum slots
 * from malformed JSON or partial merges.
 */
export function sanitizePublicIntakeEstimateFactors(
  merged: EstimateFactorsDto,
): EstimateFactorsDto {
  const d = DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS;

  const propertyType = pick(
    merged.propertyType,
    ESTIMATE_PROPERTY_TYPES,
    d.propertyType,
  );
  const floors = pick(merged.floors, ESTIMATE_FLOORS, d.floors);
  const firstTimeWithServelink = pick(
    merged.firstTimeWithServelink,
    ESTIMATE_FIRST_TIME,
    d.firstTimeWithServelink,
  );
  const lastProfessionalClean = pick(
    merged.lastProfessionalClean,
    ESTIMATE_LAST_PRO_CLEAN,
    d.lastProfessionalClean,
  );
  const clutterLevel = pick(
    merged.clutterLevel,
    ESTIMATE_CLUTTER_LEVELS,
    d.clutterLevel,
  );
  const kitchenCondition = pick(
    merged.kitchenCondition,
    ESTIMATE_KITCHEN_CONDITION,
    d.kitchenCondition,
  );
  const stovetopType = pick(
    merged.stovetopType,
    ESTIMATE_STOVETOP_TYPE,
    d.stovetopType,
  );
  const bathroomCondition = pick(
    merged.bathroomCondition,
    ESTIMATE_BATHROOM_CONDITION,
    d.bathroomCondition,
  );
  const glassShowers = pick(
    merged.glassShowers,
    ESTIMATE_GLASS_SHOWERS,
    d.glassShowers,
  );
  const petPresence = pick(
    merged.petPresence,
    ESTIMATE_PET_PRESENCE,
    d.petPresence,
  );
  const petAccidentsOrLitterAreas = pick(
    merged.petAccidentsOrLitterAreas,
    ESTIMATE_PET_ACCIDENTS,
    d.petAccidentsOrLitterAreas,
  );
  const occupancyState = pick(
    merged.occupancyState,
    ESTIMATE_OCCUPANCY,
    d.occupancyState,
  );
  const floorVisibility = pick(
    merged.floorVisibility,
    ESTIMATE_FLOOR_VISIBILITY,
    d.floorVisibility,
  );
  const carpetPercent = pick(
    merged.carpetPercent,
    ESTIMATE_CARPET_PERCENT,
    d.carpetPercent,
  );
  const stairsFlights = pick(
    merged.stairsFlights,
    ESTIMATE_STAIRS_FLIGHTS,
    d.stairsFlights,
  );

  const base: EstimateFactorsDto = {
    propertyType,
    floors,
    firstTimeWithServelink,
    lastProfessionalClean,
    clutterLevel,
    kitchenCondition,
    stovetopType,
    bathroomCondition,
    glassShowers,
    petPresence,
    petAccidentsOrLitterAreas,
    occupancyState,
    floorVisibility,
    carpetPercent,
    stairsFlights,
    addonIds: sanitizeAddonIds(merged.addonIds),
  };

  if (petPresence !== "none") {
    return {
      ...base,
      petShedding: pick(merged.petShedding, ESTIMATE_PET_SHEDDING, "medium"),
    };
  }

  return base;
}

/**
 * Merges caller-provided factors onto defaults, then sanitizes so every enum field
 * is a valid estimator token (never undefined / wrong-string from JSON).
 */
export function resolveEstimateFactorsForPublicIntake(
  partial: EstimateFactorsDto | null | undefined,
): EstimateFactorsDto {
  const def = DEFAULT_PUBLIC_FUNNEL_ESTIMATE_FACTORS;

  if (partial == null) {
    return sanitizePublicIntakeEstimateFactors({
      ...def,
      addonIds: [...def.addonIds],
    });
  }

  const merged: EstimateFactorsDto = {
    ...def,
    ...partial,
    addonIds: Array.isArray(partial.addonIds)
      ? [...partial.addonIds]
      : [...def.addonIds],
  };

  if (merged.petPresence !== "none" && merged.petShedding == null) {
    merged.petShedding = "medium";
  }

  return sanitizePublicIntakeEstimateFactors(merged);
}
