// contentTypes.ts

import type { EvidenceItem } from "./evidenceTypes";
import type { CleaningRationale } from "./rationaleTypes";
import type { PageQualityScore } from "./pageQualityTypes";

export type SectionContent = {
  key: string;
  content: string;
};

export type GeneratedPageContent = {
  title: string;
  slug: string;
  sections: SectionContent[];
  advancedNotes?: string;
  evidence?: EvidenceItem[];
  rationale?: CleaningRationale;
  qualityScore?: PageQualityScore;
};
