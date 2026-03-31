import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import { validateGeneratedSnapshot } from "./generationValidator";

export type RejectedGenerationSnapshot = {
  slug: string;
  errors: string[];
};

export function enforceGenerationQuality(snapshots: CanonicalPageSnapshot[]): {
  accepted: CanonicalPageSnapshot[];
  rejected: RejectedGenerationSnapshot[];
} {
  const accepted: CanonicalPageSnapshot[] = [];
  const rejected: RejectedGenerationSnapshot[] = [];

  for (const snapshot of snapshots) {
    const { valid, errors } = validateGeneratedSnapshot(snapshot);
    if (valid) {
      accepted.push(snapshot);
    } else {
      rejected.push({ slug: snapshot.slug ?? "(no slug)", errors });
    }
  }

  return { accepted, rejected };
}
