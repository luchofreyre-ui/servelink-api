import { Injectable } from "@nestjs/common";

import {
  SQFT_MINUTES_PER_100,
  BEDROOM_MINUTES,
  BATHROOM_MINUTES,
  HALF_BATHROOM_MINUTES,
  EXTRA_FLOOR_MINUTES,
  SERVICE_TYPE_MULTIPLIER,
  LAST_CLEANED_MULTIPLIER,
  CONDITION_MULTIPLIER,
  CLUTTER_MULTIPLIER,
  PET_HAIR_MULTIPLIER,
  TEAM_EFFICIENCY,
  ADD_ON_MINUTES,
} from "./estimator.constants";

import {
  EstimateInput,
  EstimateResult,
} from "./estimator.types";

@Injectable()
export class EstimatorService {
  estimate(input: EstimateInput): EstimateResult {
    const sqftMinutes =
      Math.ceil(input.squareFeet / 100) *
      SQFT_MINUTES_PER_100[input.serviceType];

    const bedroomMinutes =
      input.bedrooms *
      BEDROOM_MINUTES[input.serviceType];

    const bathroomMinutes =
      input.bathrooms *
      BATHROOM_MINUTES[input.serviceType];

    const halfBathroomMinutes =
      (input.halfBathrooms ?? 0) *
      HALF_BATHROOM_MINUTES[input.serviceType];

    const floorMinutes =
      Math.max(0, (input.floors ?? 1) - 1) *
      EXTRA_FLOOR_MINUTES;

    const addOnMinutes =
      (input.addOns ?? []).reduce((sum, a) => {
        return sum + ADD_ON_MINUTES[a];
      }, 0);

    const baseLaborMinutes =
      sqftMinutes +
      bedroomMinutes +
      bathroomMinutes +
      halfBathroomMinutes +
      floorMinutes +
      addOnMinutes;

    const adjustedLaborMinutes =
      baseLaborMinutes *
      SERVICE_TYPE_MULTIPLIER[input.serviceType] *
      LAST_CLEANED_MULTIPLIER[input.lastCleaned] *
      CONDITION_MULTIPLIER[input.condition] *
      CLUTTER_MULTIPLIER[input.clutter] *
      PET_HAIR_MULTIPLIER[input.petHair];

    const jobComplexityIndex = Math.min(
      100,
      Math.round(adjustedLaborMinutes / 10),
    );

    const teamSize = 3;

    const effectiveTeamSize =
      TEAM_EFFICIENCY[
        teamSize as keyof typeof TEAM_EFFICIENCY
      ];

    const estimatedDurationMinutes =
      Math.ceil(adjustedLaborMinutes / effectiveTeamSize);

    const hourlyRate = 6500;

    const priceCents =
      Math.ceil(
        (adjustedLaborMinutes / 60) *
          hourlyRate,
      );

    return {
      baseLaborMinutes: Math.round(baseLaborMinutes),
      adjustedLaborMinutes: Math.round(
        adjustedLaborMinutes,
      ),
      jobComplexityIndex,
      teamSize,
      effectiveTeamSize,
      estimatedDurationMinutes,
      priceCents,
    };
  }
}
