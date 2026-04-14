import type { EstimateFactorsDto } from "./dto/estimate-factors.dto";

/**
 * Conservative defaults when the client omits `estimateFactors` on the wire
 * (preview/submit payload contract). Prefer real questionnaire data from the client when present.
 */
export function defaultIntakeQuestionnaireFactors(): EstimateFactorsDto {
  return {
    propertyType: "house",
    floors: "1",
    firstTimeWithServelink: "not_sure",
    lastProfessionalClean: "not_sure",
    clutterLevel: "moderate",
    kitchenCondition: "normal",
    stovetopType: "not_sure",
    bathroomCondition: "normal",
    glassShowers: "not_sure",
    petPresence: "none",
    petAccidentsOrLitterAreas: "no",
    occupancyState: "occupied_normal",
    floorVisibility: "mostly_clear",
    carpetPercent: "26_50",
    stairsFlights: "none",
    addonIds: [],
  };
}
