export type ServiceType =
  | "maintenance"
  | "first_time"
  | "deep_clean";

export type LastCleaned =
  | "WITHIN_1_WEEK"
  | "WITHIN_2_WEEKS"
  | "WITHIN_1_MONTH"
  | "ONE_TO_THREE_MONTHS"
  | "THREE_TO_SIX_MONTHS"
  | "SIX_PLUS_MONTHS";

export type ConditionLevel =
  | "LIGHT"
  | "AVERAGE"
  | "HEAVY";

export type ClutterLevel =
  | "MINIMAL"
  | "MODERATE"
  | "SIGNIFICANT";

export type PetHairLevel =
  | "NONE"
  | "MODERATE"
  | "HEAVY";

export type AddOn =
  | "INSIDE_OVEN"
  | "INSIDE_FRIDGE"
  | "INTERIOR_WINDOWS"
  | "BASEBOARDS"
  | "BLINDS"
  | "INSIDE_CABINETS"
  | "WALL_SPOT_CLEANING"
  | "LAUNDRY_ROOM"
  | "DISHES"
  | "BED_LINEN_CHANGE"
  | "LIGHT_ORGANIZATION"
  | "HEAVY_PET_HAIR_TREATMENT";

export interface EstimateInput {
  serviceType: ServiceType;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  halfBathrooms?: number;
  floors?: number;

  lastCleaned: LastCleaned;
  condition: ConditionLevel;
  clutter: ClutterLevel;
  petHair: PetHairLevel;

  addOns?: AddOn[];
}

export interface EstimateResult {
  baseLaborMinutes: number;
  adjustedLaborMinutes: number;

  jobComplexityIndex: number;

  teamSize: number;
  effectiveTeamSize: number;

  estimatedDurationMinutes: number;

  priceCents: number;
}
