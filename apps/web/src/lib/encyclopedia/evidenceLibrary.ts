// evidenceLibrary.ts

import type { EvidenceItem } from "./evidenceTypes";

export const EVIDENCE_LIBRARY: EvidenceItem[] = [
  {
    id: "ev-hard-water-acid-dissolves-minerals",
    sourceType: "chemical-rationale",
    title: "Acidic cleaners dissolve mineral deposits",
    summary:
      "Hard water deposits and limescale are mineral-based, so mild acids help break down calcium and magnesium accumulation more effectively than neutral cleaners.",
    appliesToProblems: ["hard water stains", "limescale"],
    tags: ["acid", "minerals", "hard-water", "descaling"],
  },
  {
    id: "ev-grease-alkaline-breakdown",
    sourceType: "chemical-rationale",
    title: "Alkaline cleaners are better for grease",
    summary:
      "Grease and oily residues respond better to alkaline cleaning because alkalinity helps break down and lift organic soils from the surface.",
    appliesToProblems: ["grease buildup"],
    tags: ["alkaline", "grease", "kitchen", "degreasing"],
  },
  {
    id: "ev-neutral-on-sensitive-surfaces",
    sourceType: "material-safety",
    title: "Sensitive surfaces benefit from neutral cleaners",
    summary:
      "Neutral cleaners reduce the risk of etching, finish damage, or surface dulling on more sensitive materials such as natural stone and some finished surfaces.",
    appliesToMaterials: ["stone", "wood", "composite"],
    tags: ["neutral", "surface-safety", "sensitive-materials"],
  },
  {
    id: "ev-microfiber-lifts-fine-residue",
    sourceType: "tool-rationale",
    title: "Microfiber helps remove fine residue",
    summary:
      "Microfiber is effective for lifting fine particles and leftover cleaning film without adding significant abrasion to the surface.",
    appliesToMaterials: ["glass", "stone", "wood", "composite"],
    tags: ["microfiber", "low-abrasion", "residue-removal"],
  },
  {
    id: "ev-soft-brush-for-texture",
    sourceType: "tool-rationale",
    title: "Soft brushes help on textured surfaces",
    summary:
      "Soft-bristle brushes improve access into grout lines, textured tile, and uneven surfaces where towels alone cannot reach effectively.",
    appliesToMaterials: ["tile"],
    tags: ["soft-brush", "tile", "grout", "texture"],
  },
  {
    id: "ev-nonabrasive-pad-controlled-agitation",
    sourceType: "tool-rationale",
    title: "Non-abrasive pads improve controlled agitation",
    summary:
      "Non-abrasive pads can improve cleaning performance on more durable surfaces by increasing agitation without the scratch risk of aggressive scrub media.",
    appliesToMaterials: ["metal", "composite"],
    tags: ["non-abrasive", "agitation", "durable-surfaces"],
  },
  {
    id: "ev-residue-rinsing-matters",
    sourceType: "cleaning-principle",
    title: "Residue problems usually require better rinsing",
    summary:
      "Residue, haze, and film often return when rinsing is incomplete or the surface is not dried evenly after cleaning.",
    appliesToProblems: ["residue buildup", "haze", "residue"],
    tags: ["rinsing", "drying", "film", "haze"],
  },
  {
    id: "ev-soap-scum-reforms-with-moisture",
    sourceType: "maintenance-guidance",
    title: "Soap scum reforms quickly in wet zones",
    summary:
      "Soap scum tends to return in moisture-heavy areas when mineral-rich water and body-product residues continue to accumulate between cleanings.",
    appliesToProblems: ["soap scum"],
    appliesToSurfaces: ["shower glass", "tiles", "bathtubs"],
    tags: ["soap-scum", "bathroom", "maintenance"],
  },
  {
    id: "ev-stone-acid-warning",
    sourceType: "material-safety",
    title: "Acids can etch natural stone",
    summary:
      "Acidic cleaners can react with calcium-based stone surfaces and permanently dull or etch the finish.",
    appliesToMaterials: ["stone"],
    tags: ["stone", "acid-warning", "etching"],
  },
  {
    id: "ev-metal-acid-caution",
    sourceType: "material-safety",
    title: "Acid exposure can dull some metal finishes",
    summary:
      "Repeated acidic exposure can weaken protective finishes or contribute to dulling and corrosion on some metal surfaces.",
    appliesToMaterials: ["metal"],
    tags: ["metal", "acid-warning", "finish-protection"],
  },
];
