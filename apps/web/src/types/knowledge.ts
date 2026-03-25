export type KnowledgeSeverity = "light" | "medium" | "heavy";

export interface KnowledgeSurface {
  id: string;
  label: string;
  shortDescription: string;
}

export interface KnowledgeProblem {
  id: string;
  label: string;
  shortDescription: string;
}

export interface KnowledgeMethod {
  id: string;
  label: string;
  shortWhyItWorks: string;
}

export interface KnowledgeTool {
  id: string;
  label: string;
  purpose: string;
}

export interface KnowledgeChemical {
  id: string;
  label: string;
  category: string;
  shortWhyItWorks: string;
  safetyNotes: string[];
}

export interface KnowledgeQuickSolveResult {
  input: {
    surfaceId: string;
    problemId: string;
    severity: KnowledgeSeverity;
  };
  surface: KnowledgeSurface;
  problem: KnowledgeProblem;
  scenario: {
    id: string;
    title: string;
    summary: string;
    estimatedMinutesMin: number;
    estimatedMinutesMax: number;
    steps: string[];
    warnings: string[];
    commonMistakes: string[];
    whenToEscalate: string[];
    foNotes: string[];
  };
  method: KnowledgeMethod;
  tools: KnowledgeTool[];
  chemicals: KnowledgeChemical[];
}
