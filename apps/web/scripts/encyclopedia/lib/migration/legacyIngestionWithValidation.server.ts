/**
 * Migration-only: validated snapshot ingest into file-backed review store.
 * Not part of operational encyclopedia system.
 */

import type {
  CanonicalPageSnapshot,
  IngestGeneratedBatchOptions,
} from "../../../../src/lib/encyclopedia/encyclopediaPipelineTypes";
import { enforceGenerationQuality } from "../../../../src/lib/encyclopedia/generationEnforcer";
import { ingestCanonicalPageSnapshotsAndRevalidate } from "./legacyEncyclopediaIngestion.server";

export type IngestWithValidationResult = {
  ingested: number;
  rejected: number;
  ingestedSlugs: string[];
  skippedSlugs: string[];
  rejectedPages: ReturnType<typeof enforceGenerationQuality>["rejected"];
};

export function ingestWithValidation(
  snapshots: CanonicalPageSnapshot[],
  options?: IngestGeneratedBatchOptions
): IngestWithValidationResult {
  const { accepted, rejected } = enforceGenerationQuality(snapshots);

  if (accepted.length === 0) {
    throw new Error("All generated pages rejected — nothing to ingest");
  }

  const ingestResult = ingestCanonicalPageSnapshotsAndRevalidate(accepted, options);

  return {
    ingested: ingestResult.ingestedSlugs.length,
    rejected: rejected.length,
    ingestedSlugs: ingestResult.ingestedSlugs,
    skippedSlugs: ingestResult.skippedSlugs,
    rejectedPages: rejected,
  };
}
