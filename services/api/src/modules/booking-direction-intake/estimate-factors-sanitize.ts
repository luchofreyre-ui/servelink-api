import type { EstimateFactorsDto } from "./dto/estimate-factors.dto";
import {
  ESTIMATE_ADDON_IDS,
  ESTIMATE_BATHROOM_COMPLEXITY,
  ESTIMATE_BATHROOM_CONDITION,
  ESTIMATE_CARPET_PERCENT,
  ESTIMATE_CHILDREN_IN_HOME,
  ESTIMATE_CLUTTER_ACCESS,
  ESTIMATE_CLUTTER_LEVELS,
  ESTIMATE_FIRST_TIME,
  ESTIMATE_FIRST_TIME_VISIT_PROGRAM,
  ESTIMATE_FLOOR_MIX,
  ESTIMATE_FLOOR_VISIBILITY,
  ESTIMATE_FLOORS,
  ESTIMATE_GLASS_SHOWERS,
  ESTIMATE_HALF_BATHROOMS,
  ESTIMATE_KITCHEN_CONDITION,
  ESTIMATE_KITCHEN_INTENSITY,
  ESTIMATE_LAST_PRO_CLEAN,
  ESTIMATE_LAST_PRO_CLEAN_RECENCY,
  ESTIMATE_LAYOUT_TYPE,
  ESTIMATE_OCCUPANCY,
  ESTIMATE_OCCUPANCY_LEVEL,
  ESTIMATE_OVERALL_LABOR_CONDITION,
  ESTIMATE_PET_ACCIDENTS,
  ESTIMATE_PET_IMPACT,
  ESTIMATE_PET_PRESENCE,
  ESTIMATE_PET_SHEDDING,
  ESTIMATE_PRIMARY_INTENT,
  ESTIMATE_PROPERTY_TYPES,
  ESTIMATE_RECURRING_CADENCE_INTENT,
  ESTIMATE_SURFACE_DETAIL_TOKENS,
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
  halfBathrooms: "0",
  floorMix: "mixed",
  layoutType: "mixed",
  occupancyLevel: "ppl_1_2",
  childrenInHome: "no",
  petImpact: "none",
  overallLaborCondition: "normal_lived_in",
  kitchenIntensity: "average_use",
  bathroomComplexity: "standard",
  clutterAccess: "mostly_clear",
  surfaceDetailTokens: [],
  primaryIntent: "detailed_standard",
  lastProCleanRecency: "days_30_90",
  firstTimeVisitProgram: "one_visit",
  recurringCadenceIntent: "none",
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

function sanitizeSurfaceDetailTokens(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(ESTIMATE_SURFACE_DETAIL_TOKENS as readonly string[]);
  return value.filter(
    (x): x is string => typeof x === "string" && allowed.has(x),
  );
}

function mapClutterAccessToLevel(
  v: (typeof ESTIMATE_CLUTTER_ACCESS)[number],
): (typeof ESTIMATE_CLUTTER_LEVELS)[number] {
  if (v === "mostly_clear") return "light";
  if (v === "moderate_clutter") return "moderate";
  return "heavy";
}

function mapKitchenIntensityToCondition(
  v: (typeof ESTIMATE_KITCHEN_INTENSITY)[number],
): (typeof ESTIMATE_KITCHEN_CONDITION)[number] {
  if (v === "light_use") return "light";
  if (v === "heavy_use") return "heavy_grease";
  return "normal";
}

function mapBathroomComplexityToCondition(
  v: (typeof ESTIMATE_BATHROOM_COMPLEXITY)[number],
): (typeof ESTIMATE_BATHROOM_CONDITION)[number] {
  if (v === "heavy_detailing") return "heavy_scale";
  return "normal";
}

function mapRecency(
  v: (typeof ESTIMATE_LAST_PRO_CLEAN_RECENCY)[number],
): (typeof ESTIMATE_LAST_PRO_CLEAN)[number] {
  switch (v) {
    case "within_30_days":
      return "under_2_weeks";
    case "days_30_90":
      return "1_3_months";
    case "days_90_plus":
      return "6_plus_months";
    default:
      return "not_sure";
  }
}

function mapPetImpactToPresence(
  v: (typeof ESTIMATE_PET_IMPACT)[number],
): (typeof ESTIMATE_PET_PRESENCE)[number] {
  if (v === "none") return "none";
  if (v === "light") return "one";
  return "multiple";
}

function mapPetImpactToShedding(
  v: (typeof ESTIMATE_PET_IMPACT)[number],
): (typeof ESTIMATE_PET_SHEDDING)[number] | undefined {
  if (v === "none") return undefined;
  if (v === "light") return "low";
  return "high";
}

function mapOccupancyLevelToState(
  v: (typeof ESTIMATE_OCCUPANCY_LEVEL)[number],
): (typeof ESTIMATE_OCCUPANCY)[number] {
  if (v === "ppl_5_plus") return "occupied_cluttered";
  return "occupied_normal";
}

function mapFloorMixToCarpet(
  v: (typeof ESTIMATE_FLOOR_MIX)[number],
): (typeof ESTIMATE_CARPET_PERCENT)[number] {
  if (v === "mostly_hard") return "0_25";
  if (v === "mostly_carpet") return "76_100";
  return "26_50";
}

function applyLayoutToFloorVisibility(
  layout: (typeof ESTIMATE_LAYOUT_TYPE)[number],
  visibility: (typeof ESTIMATE_FLOOR_VISIBILITY)[number],
): (typeof ESTIMATE_FLOOR_VISIBILITY)[number] {
  if (layout === "open_plan") return "mostly_clear";
  if (layout === "segmented") {
    if (visibility === "mostly_clear") return "some_obstacles";
    return visibility;
  }
  return visibility;
}

function bumpGlassForSurfaceTokens(
  tokens: readonly string[],
  glass: (typeof ESTIMATE_GLASS_SHOWERS)[number],
): (typeof ESTIMATE_GLASS_SHOWERS)[number] {
  if (tokens.includes("interior_glass") || tokens.includes("heavy_mirrors")) {
    if (glass === "none" || glass === "not_sure") return "one";
  }
  return glass;
}

function mapPrimaryIntentToFirstTime(
  v: (typeof ESTIMATE_PRIMARY_INTENT)[number],
): (typeof ESTIMATE_FIRST_TIME)[number] {
  if (v === "reset_level") return "yes";
  return "no";
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

  const halfBathrooms = pick(merged.halfBathrooms, ESTIMATE_HALF_BATHROOMS, d.halfBathrooms);
  const floorMix = pick(merged.floorMix, ESTIMATE_FLOOR_MIX, d.floorMix);
  const layoutType = pick(merged.layoutType, ESTIMATE_LAYOUT_TYPE, d.layoutType);
  const occupancyLevel = pick(
    merged.occupancyLevel,
    ESTIMATE_OCCUPANCY_LEVEL,
    d.occupancyLevel,
  );
  const childrenInHome = pick(
    merged.childrenInHome,
    ESTIMATE_CHILDREN_IN_HOME,
    d.childrenInHome,
  );
  const petImpact = pick(merged.petImpact, ESTIMATE_PET_IMPACT, d.petImpact);
  const overallLaborCondition = pick(
    merged.overallLaborCondition,
    ESTIMATE_OVERALL_LABOR_CONDITION,
    d.overallLaborCondition,
  );
  const kitchenIntensity = pick(
    merged.kitchenIntensity,
    ESTIMATE_KITCHEN_INTENSITY,
    d.kitchenIntensity,
  );
  const bathroomComplexity = pick(
    merged.bathroomComplexity,
    ESTIMATE_BATHROOM_COMPLEXITY,
    d.bathroomComplexity,
  );
  const clutterAccess = pick(merged.clutterAccess, ESTIMATE_CLUTTER_ACCESS, d.clutterAccess);
  const surfaceDetailTokens = sanitizeSurfaceDetailTokens(merged.surfaceDetailTokens);
  const primaryIntent = pick(merged.primaryIntent, ESTIMATE_PRIMARY_INTENT, d.primaryIntent);
  const lastProCleanRecency = pick(
    merged.lastProCleanRecency,
    ESTIMATE_LAST_PRO_CLEAN_RECENCY,
    d.lastProCleanRecency,
  );
  const firstTimeVisitProgram = pick(
    merged.firstTimeVisitProgram,
    ESTIMATE_FIRST_TIME_VISIT_PROGRAM,
    d.firstTimeVisitProgram,
  );
  const recurringCadenceIntent = pick(
    merged.recurringCadenceIntent,
    ESTIMATE_RECURRING_CADENCE_INTENT,
    d.recurringCadenceIntent,
  );

  const propertyType = pick(
    merged.propertyType,
    ESTIMATE_PROPERTY_TYPES,
    d.propertyType,
  );
  const floors = pick(merged.floors, ESTIMATE_FLOORS, d.floors);
  const stovetopType = pick(merged.stovetopType, ESTIMATE_STOVETOP_TYPE, d.stovetopType);
  const petAccidentsOrLitterAreas = pick(
    merged.petAccidentsOrLitterAreas,
    ESTIMATE_PET_ACCIDENTS,
    d.petAccidentsOrLitterAreas,
  );
  const stairsFlights = pick(merged.stairsFlights, ESTIMATE_STAIRS_FLIGHTS, d.stairsFlights);

  const clutterLevel = mapClutterAccessToLevel(clutterAccess);
  const kitchenCondition = mapKitchenIntensityToCondition(kitchenIntensity);
  const bathroomCondition = mapBathroomComplexityToCondition(bathroomComplexity);
  const lastProfessionalClean = mapRecency(lastProCleanRecency);
  const petPresence = mapPetImpactToPresence(petImpact);
  const petSheddingFromImpact = mapPetImpactToShedding(petImpact);
  const occupancyState = mapOccupancyLevelToState(occupancyLevel);
  const carpetPercent = mapFloorMixToCarpet(floorMix);
  const floorVisibilityBase = pick(
    merged.floorVisibility,
    ESTIMATE_FLOOR_VISIBILITY,
    d.floorVisibility,
  );
  const floorVisibility = applyLayoutToFloorVisibility(layoutType, floorVisibilityBase);
  const glassShowersBase = pick(
    merged.glassShowers,
    ESTIMATE_GLASS_SHOWERS,
    d.glassShowers,
  );
  const glassShowers = bumpGlassForSurfaceTokens(surfaceDetailTokens, glassShowersBase);
  const firstTimeWithServelink = mapPrimaryIntentToFirstTime(primaryIntent);

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
    halfBathrooms,
    floorMix,
    layoutType,
    occupancyLevel,
    childrenInHome,
    petImpact,
    overallLaborCondition,
    kitchenIntensity,
    bathroomComplexity,
    clutterAccess,
    surfaceDetailTokens,
    primaryIntent,
    lastProCleanRecency,
    firstTimeVisitProgram,
    recurringCadenceIntent,
  };

  if (petPresence !== "none") {
    return {
      ...base,
      petShedding:
        petSheddingFromImpact ??
        pick(merged.petShedding, ESTIMATE_PET_SHEDDING, "medium"),
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
