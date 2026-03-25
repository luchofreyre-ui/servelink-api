import { Injectable, NotFoundException } from "@nestjs/common";
import {
  getKnowledgeChemicalById,
  getKnowledgeMethodById,
  getKnowledgeProblemById,
  getKnowledgeScenarioByKey,
  getKnowledgeSurfaceById,
  getKnowledgeToolById,
  KNOWLEDGE_METHODS,
  KNOWLEDGE_PROBLEMS,
  KNOWLEDGE_SURFACES,
} from "./knowledge.catalog";
import {
  KnowledgeProblemId,
  KnowledgeQuickSolveInput,
  KnowledgeQuickSolveResult,
  KnowledgeSeverity,
  KnowledgeSurfaceId,
} from "./knowledge.types";

@Injectable()
export class KnowledgeService {
  listSurfaces() {
    return KNOWLEDGE_SURFACES;
  }

  listProblems() {
    return KNOWLEDGE_PROBLEMS;
  }

  listMethods() {
    return KNOWLEDGE_METHODS;
  }

  resolveQuickSolve(input: KnowledgeQuickSolveInput): KnowledgeQuickSolveResult {
    const normalizedInput: KnowledgeQuickSolveInput = {
      surfaceId: input.surfaceId as KnowledgeSurfaceId,
      problemId: input.problemId as KnowledgeProblemId,
      severity: input.severity as KnowledgeSeverity,
    };

    const scenario = getKnowledgeScenarioByKey(
      normalizedInput.surfaceId,
      normalizedInput.problemId,
      normalizedInput.severity,
    );

    if (!scenario) {
      throw new NotFoundException(
        `No quick solve scenario found for ${normalizedInput.surfaceId}/${normalizedInput.problemId}/${normalizedInput.severity}`,
      );
    }

    const surface = getKnowledgeSurfaceById(scenario.surfaceId);
    const problem = getKnowledgeProblemById(scenario.problemId);
    const method = getKnowledgeMethodById(scenario.recommendedMethodId);
    const tools = scenario.toolIds.map((id) => getKnowledgeToolById(id));
    const chemicals = scenario.chemicalIds.map((id) => getKnowledgeChemicalById(id));

    return {
      input: normalizedInput,
      surface,
      problem,
      scenario: {
        id: scenario.id,
        title: scenario.title,
        summary: scenario.summary,
        estimatedMinutesMin: scenario.estimatedMinutesMin,
        estimatedMinutesMax: scenario.estimatedMinutesMax,
        steps: scenario.steps,
        warnings: scenario.warnings,
        commonMistakes: scenario.commonMistakes,
        whenToEscalate: scenario.whenToEscalate,
        foNotes: scenario.foNotes,
      },
      method,
      tools,
      chemicals,
    };
  }
}
