// evidenceEnrichmentTypes.ts

import type { EvidenceItem } from "./evidenceTypes";

export type EvidenceEnrichmentResult = {
  slug: string;
  title: string;
  currentEvidenceCount: number;
  suggestedEvidence: EvidenceItem[];
};
