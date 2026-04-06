export type SurfaceType =
  | "kitchen"
  | "bathroom"
  | "living_room"
  | "bedroom"
  | "whole_home";

export type ProblemType =
  | "light_clean"
  | "standard_clean"
  | "deep_clean"
  | "heavy_buildup";

export interface EstimateInput {
  squareFootage: number;
  bedrooms?: number;
  bathrooms?: number;
  surface: SurfaceType;
  problem: ProblemType;
}

export interface EstimateResult {
  basePrice: number;
  multiplier: number;
  finalPrice: number;
  durationHours: number;
}

const BASE_RATE = 0.12; // per sq ft baseline

const PROBLEM_MULTIPLIERS: Record<ProblemType, number> = {
  light_clean: 0.8,
  standard_clean: 1,
  deep_clean: 1.4,
  heavy_buildup: 1.8,
};

const SURFACE_MULTIPLIERS: Record<SurfaceType, number> = {
  kitchen: 1.3,
  bathroom: 1.4,
  living_room: 1,
  bedroom: 0.9,
  whole_home: 1.2,
};

export function generateEstimate(input: EstimateInput): EstimateResult {
  const basePrice = input.squareFootage * BASE_RATE;

  const problemMultiplier = PROBLEM_MULTIPLIERS[input.problem];
  const surfaceMultiplier = SURFACE_MULTIPLIERS[input.surface];

  const multiplier = problemMultiplier * surfaceMultiplier;

  const finalPrice = Math.round(basePrice * multiplier);

  const durationHours = Math.max(
    1,
    Math.round((input.squareFootage / 400) * multiplier)
  );

  return {
    basePrice,
    multiplier,
    finalPrice,
    durationHours,
  };
}
