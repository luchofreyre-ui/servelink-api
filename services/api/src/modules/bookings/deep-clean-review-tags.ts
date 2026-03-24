import { BadRequestException } from "@nestjs/common";

/**
 * Allowed admin reason tags for deep clean calibration review.
 * Tags describe likely explanations, not guaranteed truth.
 */
export const DEEP_CLEAN_REVIEW_TAGS = [
  "underestimation",
  "overestimation",
  "scope_anomaly",
  "operator_inefficiency",
  "customer_interference",
  "task_bundle_mismatch",
  "note_follow_up_required",
  "incomplete_execution_data",
  "other",
] as const;

export type DeepCleanReviewTag = (typeof DEEP_CLEAN_REVIEW_TAGS)[number];

const TAG_SET = new Set<string>(DEEP_CLEAN_REVIEW_TAGS);

export function isDeepCleanReviewTag(value: string): value is DeepCleanReviewTag {
  return TAG_SET.has(value);
}

/**
 * Dedupes, sorts, validates every tag is allowed. Throws on unknown tag.
 */
export function normalizeAndValidateReviewTags(tags: string[]): DeepCleanReviewTag[] {
  if (!Array.isArray(tags)) {
    throw new BadRequestException("reviewReasonTags must be an array");
  }
  const uniq = [...new Set(tags.map((t) => String(t).trim()).filter(Boolean))];
  for (const t of uniq) {
    if (!isDeepCleanReviewTag(t)) {
      throw new BadRequestException(`Invalid review tag: ${t}`);
    }
  }
  return [...uniq].sort() as DeepCleanReviewTag[];
}

export function parseReviewReasonTagsFromJson(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}
