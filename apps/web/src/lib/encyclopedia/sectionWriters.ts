// sectionWriters.ts

import { classifyMaterial } from "./materialClassifier";
import { getRecommendedChemical } from "./chemicalMatrix";
import {
  isWaterBased,
  isGreaseBased,
  isResidueBased,
} from "./contentRules";
import { getSafetyWarning } from "./safetyRules";
import { getRecommendedTool } from "./toolSelector";

export function writeWhatIs(problem: string, surface: string): string {
  return `${problem} on ${surface} is a common cleaning issue that affects both appearance and surface performance. It typically forms as a visible layer, film, or buildup that can dull the finish, reduce clarity, or create uneven texture depending on the material.`;
}

export function writeWhyItHappens(problem: string, surface: string): string {
  if (isWaterBased(problem)) {
    return `This issue is primarily caused by mineral deposits left behind when water evaporates. On ${surface}, repeated exposure to hard water leads to a gradual accumulation of calcium and magnesium, which bond tightly to the surface over time.`;
  }

  if (isGreaseBased(problem)) {
    return `This problem develops when airborne oils and cooking residues settle onto ${surface}. Over time, these particles combine with dust and heat, forming a sticky layer that becomes increasingly difficult to remove.`;
  }

  if (isResidueBased(problem)) {
    return `This issue is usually caused by leftover cleaning agents or improper rinsing. On ${surface}, residues can dry unevenly, leaving behind streaks, haze, or a dull film.`;
  }

  return `This issue is driven by chemical and environmental interactions on ${surface}. Over time, repeated exposure alters the surface condition, allowing deposits to bond more aggressively and become harder to remove with standard cleaning methods.`;
}

export function writeWhereItAppears(problem: string, surface: string): string {
  return `${problem} most commonly appears on high-use or frequently exposed areas of ${surface}, especially where moisture, heat, or repeated contact is present. Edges, corners, and uneven surfaces tend to accumulate buildup faster.`;
}

export function writeHowToFix(problem: string, surface: string): string {
  const material = classifyMaterial(surface);
  const chemical = getRecommendedChemical(problem, material);
  const tool = getRecommendedTool(material);
  const safety = getSafetyWarning(material, chemical);

  let chemicalText = "";
  let toolText = "";

  switch (chemical) {
    case "acid":
      chemicalText = "an acid-based cleaner such as vinegar or a descaler";
      break;
    case "alkaline":
      chemicalText = "an alkaline degreaser";
      break;
    case "neutral":
      chemicalText = "a neutral pH cleaner";
      break;
    case "solvent":
      chemicalText = "a solvent-based cleaner";
      break;
  }

  switch (tool) {
    case "microfiber":
      toolText = "a microfiber towel";
      break;
    case "non-abrasive pad":
      toolText = "a non-abrasive pad";
      break;
    case "soft brush":
      toolText = "a soft-bristle brush";
      break;
    case "scrub pad":
      toolText = "a light scrub pad";
      break;
  }

  let base = `Use ${chemicalText} on ${surface} to break down the buildup. Apply evenly, allow proper dwell time, then agitate using ${toolText}. Rinse thoroughly and dry the surface to prevent residue or reformation.`;

  if (safety) {
    base += ` ${safety}`;
  }

  return base;
}

export function writeWhatToAvoid(problem: string, surface: string): string {
  return `Avoid using overly harsh chemicals or abrasive tools on ${surface}, as they can damage the material or worsen the issue. Skipping proper rinsing or using incorrect products can also lead to recurring problems.`;
}

export function writeWhatToExpect(problem: string, surface: string): string {
  return `Once properly cleaned, ${surface} should return to a more uniform and consistent appearance. However, severe buildup may require multiple treatments, and ongoing maintenance is necessary to prevent the issue from returning.`;
}
