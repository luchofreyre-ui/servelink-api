import { encyclopediaIndexEntrySchema } from "../../../src/lib/encyclopedia/schema";
import type { EncyclopediaIndexEntry } from "../../../src/lib/encyclopedia/types";

export type RawReviewedCandidateForPromotion = {
  id: string;
  title: string;
  slug: string;
  category: "problems" | "methods";
  cluster: string;
  role: "supporting";
  status: "draft";
  generatedType: string;
  normalizedTitle?: string;
  normalizedSlug?: string;
};

export function buildIndexEntryFromReviewedCandidate(
  candidate: RawReviewedCandidateForPromotion,
): {
  entry: EncyclopediaIndexEntry;
  usedRawTitleSlugFallback: boolean;
} {
  const usedRawTitleSlugFallback =
    candidate.normalizedTitle === undefined || candidate.normalizedSlug === undefined;
  const title = candidate.normalizedTitle ?? candidate.title;
  const slug = candidate.normalizedSlug ?? candidate.slug;
  const entry = encyclopediaIndexEntrySchema.parse({
    id: candidate.id,
    title,
    category: candidate.category,
    cluster: candidate.cluster,
    role: candidate.role,
    slug,
    status: candidate.status,
  });
  return { entry, usedRawTitleSlugFallback };
}
