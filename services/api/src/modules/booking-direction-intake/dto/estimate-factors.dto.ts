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
}
