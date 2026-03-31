// chemicalMatrix.ts

import type { MaterialType } from "./materialClassifier";

export type ChemicalType =
  | "acid"
  | "alkaline"
  | "neutral"
  | "solvent";

export function getRecommendedChemical(
  problem: string,
  material: MaterialType
): ChemicalType {
  const p = problem.toLowerCase();

  // Hard overrides (safety first)
  if (material === "stone") {
    return "neutral"; // never acid on stone
  }

  if (p.includes("limescale") || p.includes("hard water")) {
    return "acid";
  }

  if (p.includes("grease")) {
    return "alkaline";
  }

  if (p.includes("residue") || p.includes("haze")) {
    return "neutral";
  }

  return "neutral";
}
