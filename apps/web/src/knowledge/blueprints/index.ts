import { CHECKLIST_PAGE_BLUEPRINT } from "./checklistBlueprint";
import { COMPARISON_PAGE_BLUEPRINT } from "./comparisonBlueprint";
import { GUIDE_PAGE_BLUEPRINT } from "./guideBlueprint";
import { METHOD_PAGE_BLUEPRINT } from "./methodBlueprint";
import { MYTH_PAGE_BLUEPRINT } from "./mythBlueprint";
import { PROBLEM_PAGE_BLUEPRINT } from "./problemBlueprint";
import { SURFACE_PAGE_BLUEPRINT } from "./surfaceBlueprint";
import { SURFACE_PROBLEM_PAGE_BLUEPRINT } from "./surfaceProblemBlueprint";
import { TOOL_PAGE_BLUEPRINT } from "./toolBlueprint";
import type { KnowledgePageBlueprint, KnowledgePageBlueprintType } from "./types";

export type * from "./types";

export {
  CHECKLIST_PAGE_BLUEPRINT,
  COMPARISON_PAGE_BLUEPRINT,
  GUIDE_PAGE_BLUEPRINT,
  METHOD_PAGE_BLUEPRINT,
  MYTH_PAGE_BLUEPRINT,
  PROBLEM_PAGE_BLUEPRINT,
  SURFACE_PAGE_BLUEPRINT,
  SURFACE_PROBLEM_PAGE_BLUEPRINT,
  TOOL_PAGE_BLUEPRINT,
};

export const KNOWLEDGE_PAGE_BLUEPRINTS: Record<KnowledgePageBlueprintType, KnowledgePageBlueprint> = {
  problem: PROBLEM_PAGE_BLUEPRINT,
  surface: SURFACE_PAGE_BLUEPRINT,
  method: METHOD_PAGE_BLUEPRINT,
  tool: TOOL_PAGE_BLUEPRINT,
  guide: GUIDE_PAGE_BLUEPRINT,
  checklist: CHECKLIST_PAGE_BLUEPRINT,
  comparison: COMPARISON_PAGE_BLUEPRINT,
  myth: MYTH_PAGE_BLUEPRINT,
  "surface-problem": SURFACE_PROBLEM_PAGE_BLUEPRINT,
};

export function getKnowledgePageBlueprint(
  type: KnowledgePageBlueprintType,
): KnowledgePageBlueprint {
  return KNOWLEDGE_PAGE_BLUEPRINTS[type];
}

export function listKnowledgePageBlueprints(): KnowledgePageBlueprint[] {
  return Object.values(KNOWLEDGE_PAGE_BLUEPRINTS);
}
