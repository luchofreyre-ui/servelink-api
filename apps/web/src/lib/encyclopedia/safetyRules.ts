// safetyRules.ts

import type { MaterialType } from "./materialClassifier";
import type { ChemicalType } from "./chemicalMatrix";

export function getSafetyWarning(
  material: MaterialType,
  chemical: ChemicalType
): string | null {
  if (material === "stone" && chemical === "acid") {
    return "Avoid acid-based cleaners on natural stone, as they can cause etching and permanent surface damage.";
  }

  if (material === "metal" && chemical === "acid") {
    return "Prolonged use of acidic cleaners on metal can cause corrosion or dulling of the finish.";
  }

  return null;
}
