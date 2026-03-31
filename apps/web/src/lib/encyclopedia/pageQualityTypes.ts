// pageQualityTypes.ts

export type PageQualityScore = {
  overall: number;
  titleStrength: number;
  specificity: number;
  evidenceCoverage: number;
  depthCoverage: number;
  internalLinkCoverage: number;
  notes: string[];
};
