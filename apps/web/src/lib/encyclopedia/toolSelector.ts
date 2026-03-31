// toolSelector.ts

import type { MaterialType } from "./materialClassifier";

export type ToolType =
  | "microfiber"
  | "non-abrasive pad"
  | "soft brush"
  | "scrub pad";

export function getRecommendedTool(material: MaterialType): ToolType {
  switch (material) {
    case "glass":
      return "microfiber";
    case "stone":
      return "microfiber";
    case "metal":
      return "non-abrasive pad";
    case "tile":
      return "soft brush";
    case "wood":
      return "microfiber";
    default:
      return "microfiber";
  }
}
