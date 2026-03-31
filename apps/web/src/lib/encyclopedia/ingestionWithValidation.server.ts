/**
 * Migration-only legacy pipeline support.
 * Not part of operational encyclopedia system.
 * Use API-backed review + ingestion instead.
 */

import type {
  CanonicalPageSnapshot,
  IngestGeneratedBatchOptions,
} from "./encyclopediaPipelineTypes";

const LEGACY_REMOVED =
  "Legacy encyclopedia write path has been removed. Use the API-backed encyclopedia review system instead.";

export function ingestWithValidation(
  _snapshots: CanonicalPageSnapshot[],
  _options?: IngestGeneratedBatchOptions
): never {
  throw new Error(LEGACY_REMOVED);
}
