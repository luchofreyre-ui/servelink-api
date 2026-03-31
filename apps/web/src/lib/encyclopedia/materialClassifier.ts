// materialClassifier.ts

export type MaterialType =
  | "glass"
  | "stone"
  | "metal"
  | "wood"
  | "tile"
  | "composite"
  | "unknown";

export function classifyMaterial(surface: string): MaterialType {
  const s = surface.toLowerCase();

  if (s.includes("glass") || s.includes("mirror")) return "glass";
  if (s.includes("granite") || s.includes("marble") || s.includes("stone"))
    return "stone";
  if (s.includes("stainless") || s.includes("metal"))
    return "metal";
  if (s.includes("wood")) return "wood";
  if (s.includes("tile") || s.includes("grout")) return "tile";

  return "composite";
}
