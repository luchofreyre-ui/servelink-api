// evidenceAttachmentMerge.ts

import { EVIDENCE_LIBRARY } from "./evidenceLibrary";
import type { EvidenceItem } from "./evidenceTypes";

export function mergeAttachedEvidence(
  currentEvidence: EvidenceItem[] | undefined,
  attachedIds: string[] | undefined
): EvidenceItem[] {
  const existing = currentEvidence ?? [];
  const attached = (attachedIds ?? [])
    .map((id) => EVIDENCE_LIBRARY.find((item) => item.id === id))
    .filter(Boolean) as EvidenceItem[];

  const seen = new Set<string>();
  const result: EvidenceItem[] = [];

  for (const item of [...existing, ...attached]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }

  return result;
}
