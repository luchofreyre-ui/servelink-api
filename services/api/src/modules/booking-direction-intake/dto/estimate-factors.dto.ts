import { Transform } from "class-transformer";
import {
  ArrayUnique,
  IsArray,
  IsIn,
  IsString,
  ValidateIf,
} from "class-validator";
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
} from "./estimate-factor-enums";

/**
 * Public intake questionnaire slice that maps 1:1 into `EstimateInput`
 * (except derived `sqft_band`, `bedrooms`/`bathrooms` enums from validated strings,
 * `service_type` from service + frequency, and optional `deep_clean_program`).
 */
export class EstimateFactorsDto {
  @IsString()
  @IsIn([...ESTIMATE_PROPERTY_TYPES])
  propertyType!: (typeof ESTIMATE_PROPERTY_TYPES)[number];

  @IsString()
  @IsIn([...ESTIMATE_FLOORS])
  floors!: (typeof ESTIMATE_FLOORS)[number];

  @IsString()
  @IsIn([...ESTIMATE_FIRST_TIME])
  firstTimeWithServelink!: (typeof ESTIMATE_FIRST_TIME)[number];

  @IsString()
  @IsIn([...ESTIMATE_LAST_PRO_CLEAN])
  lastProfessionalClean!: (typeof ESTIMATE_LAST_PRO_CLEAN)[number];

  @IsString()
  @IsIn([...ESTIMATE_CLUTTER_LEVELS])
  clutterLevel!: (typeof ESTIMATE_CLUTTER_LEVELS)[number];

  @IsString()
  @IsIn([...ESTIMATE_KITCHEN_CONDITION])
  kitchenCondition!: (typeof ESTIMATE_KITCHEN_CONDITION)[number];

  @IsString()
  @IsIn([...ESTIMATE_STOVETOP_TYPE])
  stovetopType!: (typeof ESTIMATE_STOVETOP_TYPE)[number];

  @IsString()
  @IsIn([...ESTIMATE_BATHROOM_CONDITION])
  bathroomCondition!: (typeof ESTIMATE_BATHROOM_CONDITION)[number];

  @IsString()
  @IsIn([...ESTIMATE_GLASS_SHOWERS])
  glassShowers!: (typeof ESTIMATE_GLASS_SHOWERS)[number];

  @IsString()
  @IsIn([...ESTIMATE_PET_PRESENCE])
  petPresence!: (typeof ESTIMATE_PET_PRESENCE)[number];

  /** Required when `petPresence` is not `none`; ignored otherwise. */
  @ValidateIf((o: EstimateFactorsDto) => o.petPresence !== "none")
  @IsString()
  @IsIn([...ESTIMATE_PET_SHEDDING])
  petShedding?: (typeof ESTIMATE_PET_SHEDDING)[number];

  @IsString()
  @IsIn([...ESTIMATE_PET_ACCIDENTS])
  petAccidentsOrLitterAreas!: (typeof ESTIMATE_PET_ACCIDENTS)[number];

  @IsString()
  @IsIn([...ESTIMATE_OCCUPANCY])
  occupancyState!: (typeof ESTIMATE_OCCUPANCY)[number];

  @IsString()
  @IsIn([...ESTIMATE_FLOOR_VISIBILITY])
  floorVisibility!: (typeof ESTIMATE_FLOOR_VISIBILITY)[number];

  @IsString()
  @IsIn([...ESTIMATE_CARPET_PERCENT])
  carpetPercent!: (typeof ESTIMATE_CARPET_PERCENT)[number];

  @IsString()
  @IsIn([...ESTIMATE_STAIRS_FLIGHTS])
  stairsFlights!: (typeof ESTIMATE_STAIRS_FLIGHTS)[number];

  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn([...ESTIMATE_ADDON_IDS], { each: true })
  addonIds!: string[];

  // --- Three-layer public intake (estimate-accuracy + estimator extensions) ---

  @IsString()
  @IsIn([...ESTIMATE_HALF_BATHROOMS])
  halfBathrooms!: (typeof ESTIMATE_HALF_BATHROOMS)[number];

  @IsString()
  @IsIn([...ESTIMATE_FLOOR_MIX])
  floorMix!: (typeof ESTIMATE_FLOOR_MIX)[number];

  @IsString()
  @IsIn([...ESTIMATE_LAYOUT_TYPE])
  layoutType!: (typeof ESTIMATE_LAYOUT_TYPE)[number];

  @IsString()
  @IsIn([...ESTIMATE_OCCUPANCY_LEVEL])
  occupancyLevel!: (typeof ESTIMATE_OCCUPANCY_LEVEL)[number];

  @IsString()
  @IsIn([...ESTIMATE_CHILDREN_IN_HOME])
  childrenInHome!: (typeof ESTIMATE_CHILDREN_IN_HOME)[number];

  @IsString()
  @IsIn([...ESTIMATE_PET_IMPACT])
  petImpact!: (typeof ESTIMATE_PET_IMPACT)[number];

  @IsString()
  @IsIn([...ESTIMATE_OVERALL_LABOR_CONDITION])
  overallLaborCondition!: (typeof ESTIMATE_OVERALL_LABOR_CONDITION)[number];

  @IsString()
  @IsIn([...ESTIMATE_KITCHEN_INTENSITY])
  kitchenIntensity!: (typeof ESTIMATE_KITCHEN_INTENSITY)[number];

  @IsString()
  @IsIn([...ESTIMATE_BATHROOM_COMPLEXITY])
  bathroomComplexity!: (typeof ESTIMATE_BATHROOM_COMPLEXITY)[number];

  @IsString()
  @IsIn([...ESTIMATE_CLUTTER_ACCESS])
  clutterAccess!: (typeof ESTIMATE_CLUTTER_ACCESS)[number];

  @Transform(({ value }) => (Array.isArray(value) ? value : []))
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn([...ESTIMATE_SURFACE_DETAIL_TOKENS], { each: true })
  surfaceDetailTokens!: string[];

  @IsString()
  @IsIn([...ESTIMATE_PRIMARY_INTENT])
  primaryIntent!: (typeof ESTIMATE_PRIMARY_INTENT)[number];

  @IsString()
  @IsIn([...ESTIMATE_LAST_PRO_CLEAN_RECENCY])
  lastProCleanRecency!: (typeof ESTIMATE_LAST_PRO_CLEAN_RECENCY)[number];

  @IsString()
  @IsIn([...ESTIMATE_FIRST_TIME_VISIT_PROGRAM])
  firstTimeVisitProgram!: (typeof ESTIMATE_FIRST_TIME_VISIT_PROGRAM)[number];

  @IsString()
  @IsIn([...ESTIMATE_RECURRING_CADENCE_INTENT])
  recurringCadenceIntent!: (typeof ESTIMATE_RECURRING_CADENCE_INTENT)[number];
}
