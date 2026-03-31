// encyclopediaPipelineMerge.ts — pure merge + hash (no I/O)

import { createHash } from "node:crypto";
import type { GeneratedPage } from "./pageTypes";
import type {
  CanonicalPageSnapshot,
  EncyclopediaContentOrigin,
  IngestGeneratedBatchOptions,
} from "./encyclopediaPipelineTypes";
import type { StoredReviewRecord } from "./reviewPersistenceTypes";

const SECTION_TITLE_MAP: Record<string, string> = {
  whatIs: "What this problem is",
  whyItHappens: "Why this happens",
  whereItAppears: "Where it appears",
  canThisBeFixed: "Can this be fixed",
  chemistry: "Chemistry",
  commonMistakes: "Common mistakes",
  professionalMethod: "Professional method",
  howToFix: "How to fix",
  whatToAvoid: "What to avoid",
  whatToExpect: "What to expect",
  whenToStop: "When to stop",
  toolsRequired: "Tools required",
  recommendedProducts: "Recommended products",
  visualDiagnostics: "Visual diagnostics",
  relatedTopics: "Related topics",
};

export function buildCanonicalPageSnapshotFromGeneratedPage(
  page: GeneratedPage
): CanonicalPageSnapshot {
  const contentSections = page.content?.sections ?? [];
  const sections = contentSections.map((section) => ({
    key: section.key,
    title: SECTION_TITLE_MAP[section.key] ?? section.key,
    content: section.content,
  }));

  return {
    title: page.title,
    slug: page.slug,
    problem: page.meta.problem,
    surface: page.meta.surface,
    intent: page.meta.intent,
    riskLevel: page.meta.riskLevel,
    sections,
    advancedNotes: page.content?.advancedNotes,
    internalLinks: page.internalLinks ?? [],
  };
}

export function computeCanonicalContentHash(
  snapshot: CanonicalPageSnapshot
): string {
  const payload = {
    slug: snapshot.slug,
    title: snapshot.title,
    problem: snapshot.problem,
    surface: snapshot.surface,
    intent: snapshot.intent,
    riskLevel: snapshot.riskLevel,
    sections: [...snapshot.sections].sort((a, b) =>
      a.key.localeCompare(b.key)
    ),
    advancedNotes: snapshot.advancedNotes ?? null,
    internalLinks: [...(snapshot.internalLinks ?? [])].sort(),
  };

  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Machine-owned fields refresh; editor-owned fields preserved from `existing`.
 */
export function mergeIngestionIntoRecord(
  existing: StoredReviewRecord | undefined,
  snapshot: CanonicalPageSnapshot,
  contentHash: string,
  options: IngestGeneratedBatchOptions & {
    ingestedAt: string;
    contentOrigin: EncyclopediaContentOrigin;
  }
): StoredReviewRecord {
  const now = options.ingestedAt;
  const generatedAt = options.generatedAt ?? now;

  if (!existing) {
    return {
      slug: snapshot.slug,
      reviewStatus: "draft",
      updatedAt: now,
      promotionStatus: "not_promoted",
      contentOrigin: options.contentOrigin,
      generatedAt,
      ingestedAt: now,
      sourceBatchId: options.sourceBatchId,
      sourceArtifactPath: options.sourceArtifactPath,
      contentHash,
      canonicalContent: snapshot,
    };
  }

  const hashChanged =
    existing.contentHash !== undefined && existing.contentHash !== contentHash;

  const next: StoredReviewRecord = {
    ...existing,
    slug: snapshot.slug,
    updatedAt: now,
    generatedAt,
    ingestedAt: now,
    sourceBatchId: options.sourceBatchId ?? existing.sourceBatchId,
    sourceArtifactPath: options.sourceArtifactPath ?? existing.sourceArtifactPath,
    contentOrigin: options.contentOrigin,
    contentHash,
    canonicalContent: snapshot,
  };

  if (hashChanged) {
    next.promotionStatus =
      existing.promotionStatus === "promoted" ||
      existing.promotionStatus === "failed"
        ? "not_promoted"
        : existing.promotionStatus;
    next.liveContentHash = undefined;
    next.promotedAt = undefined;
    next.promotionError = undefined;
  }

  return next;
}

export function buildLivePageRecordFromApprovedReviewRecord(
  record: StoredReviewRecord,
  promotedAt: string
): { slug: string; title: string; promotedAt: string; contentHash: string; snapshot: CanonicalPageSnapshot } {
  const snapshot = record.canonicalContent;
  if (!snapshot) {
    throw new Error(`Missing canonicalContent for slug: ${record.slug}`);
  }
  const hash = record.contentHash ?? computeCanonicalContentHash(snapshot);
  return {
    slug: record.slug,
    title: snapshot.title,
    promotedAt,
    contentHash: hash,
    snapshot,
  };
}
