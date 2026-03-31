const CONTENT_BATCHES_ENCYCLOPEDIA = "content-batches/encyclopedia";

export type ReviewedCandidatesSourceKey = "standard" | "expanded";

export interface ReviewedCandidatesSourceConfig {
  sourceKey: ReviewedCandidatesSourceKey;
  label: string;
  /** Path relative to repository root (apps/web when running Next). */
  sourcePath: string;
  /** Path relative to repository root for manual-override saves. */
  editedPath: string;
}

export const REVIEW_QUEUE_SOURCE_OPTIONS: readonly ReviewedCandidatesSourceConfig[] = [
  {
    sourceKey: "standard",
    label: "Standard reviewed",
    sourcePath: `${CONTENT_BATCHES_ENCYCLOPEDIA}/generated-reviewed-index-candidates.json`,
    editedPath: `${CONTENT_BATCHES_ENCYCLOPEDIA}/generated-reviewed-index-candidates.edited.json`,
  },
  {
    sourceKey: "expanded",
    label: "Expanded reviewed",
    sourcePath: `${CONTENT_BATCHES_ENCYCLOPEDIA}/generated-expanded-reviewed-index-candidates.json`,
    editedPath: `${CONTENT_BATCHES_ENCYCLOPEDIA}/generated-expanded-reviewed-index-candidates.edited.json`,
  },
] as const;

export function getReviewedCandidatesSourceConfig(
  sourceKey: ReviewedCandidatesSourceKey,
): ReviewedCandidatesSourceConfig {
  const found = REVIEW_QUEUE_SOURCE_OPTIONS.find((o) => o.sourceKey === sourceKey);
  if (!found) {
    throw new Error(`Unknown reviewed candidates sourceKey: ${sourceKey}`);
  }
  return { ...found };
}

/**
 * Parse API query/body discriminator. Invalid values fall back to standard.
 */
export function parseReviewedCandidatesSourceKey(raw: string | null | undefined): ReviewedCandidatesSourceKey {
  if (raw === "expanded") {
    return "expanded";
  }
  return "standard";
}
