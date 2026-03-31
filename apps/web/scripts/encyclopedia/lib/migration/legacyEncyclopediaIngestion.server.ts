/**
 * Migration-only legacy pipeline: ingest generated pages into file-backed review store.
 * Not part of operational encyclopedia system. Use API-backed review + ingestion instead.
 */

import { revalidatePath } from "next/cache";
import type { GeneratedPage } from "../../../../src/lib/encyclopedia/pageTypes";
import type {
  CanonicalPageSnapshot,
  IngestGeneratedBatchOptions,
  IngestGeneratedBatchResult,
} from "../../../../src/lib/encyclopedia/encyclopediaPipelineTypes";
import {
  buildCanonicalPageSnapshotFromGeneratedPage,
  computeCanonicalContentHash,
  mergeIngestionIntoRecord,
} from "../../../../src/lib/encyclopedia/encyclopediaPipelineMerge";
import { getStoredReviewRecordBySlug } from "../../../../src/lib/encyclopedia/reviewPersistence.server";
import { replaceStoredReviewRecord } from "./legacyReviewStoreWrites.server";

export function ingestGeneratedEncyclopediaPages(
  pages: GeneratedPage[],
  options: IngestGeneratedBatchOptions = {}
): IngestGeneratedBatchResult {
  const ingestedSlugs: string[] = [];
  const skippedSlugs: string[] = [];
  const ingestedAt = new Date().toISOString();
  const generatedAt = options.generatedAt ?? ingestedAt;

  for (const page of pages) {
    try {
      const snapshot = buildCanonicalPageSnapshotFromGeneratedPage(page);
      const contentHash = computeCanonicalContentHash(snapshot);
      const existing = getStoredReviewRecordBySlug(page.slug);
      const merged = mergeIngestionIntoRecord(existing, snapshot, contentHash, {
        ...options,
        ingestedAt,
        generatedAt,
        contentOrigin: "generated",
      });
      replaceStoredReviewRecord(merged);
      ingestedSlugs.push(page.slug);
    } catch {
      skippedSlugs.push(page.slug);
    }
  }

  return { ingestedSlugs, skippedSlugs };
}

export function ingestCanonicalPageSnapshots(
  snapshots: CanonicalPageSnapshot[],
  options: IngestGeneratedBatchOptions = {}
): IngestGeneratedBatchResult {
  const ingestedSlugs: string[] = [];
  const skippedSlugs: string[] = [];
  const ingestedAt = new Date().toISOString();
  const generatedAt = options.generatedAt ?? ingestedAt;

  for (const snapshot of snapshots) {
    try {
      const contentHash = computeCanonicalContentHash(snapshot);
      const existing = getStoredReviewRecordBySlug(snapshot.slug);
      const merged = mergeIngestionIntoRecord(existing, snapshot, contentHash, {
        ...options,
        ingestedAt,
        generatedAt,
        contentOrigin: "generated",
      });
      replaceStoredReviewRecord(merged);
      ingestedSlugs.push(snapshot.slug);
    } catch {
      skippedSlugs.push(snapshot.slug);
    }
  }

  return { ingestedSlugs, skippedSlugs };
}

export function ingestCanonicalPageSnapshotsAndRevalidate(
  snapshots: CanonicalPageSnapshot[],
  options?: IngestGeneratedBatchOptions
): IngestGeneratedBatchResult {
  const result = ingestCanonicalPageSnapshots(snapshots, options);
  revalidatePath("/admin/encyclopedia/review");
  revalidatePath("/admin/encyclopedia/ops");
  return result;
}

export function ingestGeneratedEncyclopediaBatch(
  pages: GeneratedPage[],
  options?: IngestGeneratedBatchOptions
): IngestGeneratedBatchResult {
  return ingestGeneratedEncyclopediaPages(pages, options);
}

export function ingestGeneratedEncyclopediaPagesAndRevalidate(
  pages: GeneratedPage[],
  options?: IngestGeneratedBatchOptions
): IngestGeneratedBatchResult {
  const result = ingestGeneratedEncyclopediaPages(pages, options);
  revalidatePath("/admin/encyclopedia/review");
  revalidatePath("/admin/encyclopedia/ops");
  return result;
}
