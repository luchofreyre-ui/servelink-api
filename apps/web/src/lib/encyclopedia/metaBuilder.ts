// metaBuilder.ts

import type { PageMeta } from "./pageTypes";

export function buildMeta(problem: string, surface: string): PageMeta {
  const p = problem.toLowerCase();

  let riskLevel: PageMeta["riskLevel"] = "low";
  let needsChemicalExplanation = false;
  let needsMaterialSpecifics = false;

  if (
    p.includes("limescale") ||
    p.includes("hard water") ||
    p.includes("soap scum")
  ) {
    needsChemicalExplanation = true;
  }

  if (
    surface.includes("stone") ||
    surface.includes("wood") ||
    surface.includes("glass")
  ) {
    needsMaterialSpecifics = true;
  }

  if (
    p.includes("discoloration") ||
    p.includes("buildup") ||
    p.includes("limescale")
  ) {
    riskLevel = "medium";
  }

  if (p.includes("damage") || p.includes("etching")) {
    riskLevel = "high";
  }

  // enforce deeper content requirement
  if (needsChemicalExplanation && needsMaterialSpecifics) {
    riskLevel = "high";
  }

  return {
    problem,
    surface,
    intent: "",
    riskLevel,
    needsChemicalExplanation,
    needsMaterialSpecifics,
  };
}
