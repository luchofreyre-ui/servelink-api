import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import {
  enforceGenerationQuality,
  type RejectedGenerationSnapshot,
} from "./generationEnforcer";

/** Validates snapshots before promotion (API-side gate); callers persist outcomes via reviewStore. */
export async function ingestWithValidation(
  snapshots: CanonicalPageSnapshot[]
): Promise<{
  accepted: CanonicalPageSnapshot[];
  rejected: RejectedGenerationSnapshot[];
}> {
  const { accepted, rejected } = enforceGenerationQuality(snapshots);
  return { accepted, rejected };
}
