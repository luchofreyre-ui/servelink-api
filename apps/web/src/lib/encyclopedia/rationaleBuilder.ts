// rationaleBuilder.ts

import { getRecommendedChemical } from "./chemicalMatrix";
import { classifyMaterial } from "./materialClassifier";
import { getSafetyWarning } from "./safetyRules";
import { getRecommendedTool } from "./toolSelector";
import type { CleaningRationale } from "./rationaleTypes";

function describeChemical(chemical: string, problem: string, surface: string): string {
  switch (chemical) {
    case "acid":
      return `An acid-based approach is appropriate because ${problem} on ${surface} is more likely to include mineral-heavy deposits that respond to mild acidic breakdown.`;
    case "alkaline":
      return `An alkaline approach is appropriate because ${problem} on ${surface} is more likely to include oily or organic soil that lifts better under degreasing conditions.`;
    case "neutral":
      return `A neutral cleaner is the safer first choice because ${surface} may be more sensitive to aggressive chemistry or the problem may not require stronger chemical action.`;
    case "solvent":
      return `A solvent-based approach may be useful when the residue is not water-responsive and needs a chemistry that can break down stubborn film more effectively.`;
    default:
      return `The selected chemistry should match both the soil type and the surface sensitivity.`;
  }
}

function describeTool(tool: string, surface: string): string {
  switch (tool) {
    case "microfiber":
      return `Microfiber is recommended for ${surface} because it improves pickup of fine residue while keeping abrasion low.`;
    case "non-abrasive pad":
      return `A non-abrasive pad is recommended for ${surface} because it adds useful agitation without the scratch risk of harsher scrub materials.`;
    case "soft brush":
      return `A soft-bristle brush is recommended for ${surface} because it can reach into texture, grout lines, and uneven areas more effectively than a towel alone.`;
    case "scrub pad":
      return `A light scrub pad is recommended for ${surface} when extra mechanical action is needed but heavy abrasion should still be avoided.`;
    default:
      return `The selected tool should improve contact and agitation without damaging the surface.`;
  }
}

export function buildCleaningRationale(
  problem: string,
  surface: string
): CleaningRationale {
  const material = classifyMaterial(surface);
  const chemical = getRecommendedChemical(problem, material);
  const tool = getRecommendedTool(material);
  const safetyReason = getSafetyWarning(material, chemical) ?? undefined;

  return {
    chemicalReason: describeChemical(chemical, problem, surface),
    toolReason: describeTool(tool, surface),
    safetyReason,
  };
}
