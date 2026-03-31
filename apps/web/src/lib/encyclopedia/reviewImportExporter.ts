/**
 * Migration-only legacy pipeline support.
 * Not part of operational encyclopedia system.
 * Use API-backed review + promotion instead.
 */

import fs from "fs";
import path from "path";
import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/canonicalTypes";
import type { ReviewImportPayload, ReviewImportRecord } from "./reviewImportTypes";

type LegacyReviewStatus = "pending" | "approved" | "rejected";

/** Pipeline review-store row + reviewed-candidates row shapes (loose). */
type LegacyReviewedCandidate = {
  slug: string;
  title?: string;
  reviewStatus?: LegacyReviewStatus | "draft" | "reviewed";
  recommendation?: "promote" | "review" | "reject";
  snapshot?: CanonicalPageSnapshot;
  canonicalSnapshot?: CanonicalPageSnapshot;
  /** content-batches review-store.json */
  canonicalContent?: CanonicalPageSnapshot;
};

type LegacyReviewedFile =
  | LegacyReviewedCandidate[]
  | {
      items?: LegacyReviewedCandidate[];
      candidates?: LegacyReviewedCandidate[];
      rows?: LegacyReviewedCandidate[];
      records?: LegacyReviewedCandidate[];
    };

function readJsonFile(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function extractCandidates(input: LegacyReviewedFile): LegacyReviewedCandidate[] {
  if (Array.isArray(input)) return input;
  if (Array.isArray(input.items)) return input.items;
  if (Array.isArray(input.candidates)) return input.candidates;
  if (Array.isArray(input.rows)) return input.rows;
  if (Array.isArray(input.records)) return input.records;

  throw new Error("Unsupported reviewed corpus shape");
}

function toReviewStatus(
  item: LegacyReviewedCandidate
): "pending" | "approved" | "rejected" {
  if (item.reviewStatus === "approved") return "approved";
  if (item.reviewStatus === "rejected") return "rejected";
  if (item.reviewStatus === "pending") return "pending";
  if (item.reviewStatus === "draft" || item.reviewStatus === "reviewed") {
    return "pending";
  }

  if (item.recommendation === "promote") return "approved";
  if (item.recommendation === "reject") return "rejected";

  return "pending";
}

function toPublishStatus(
  _reviewStatus: "pending" | "approved" | "rejected"
): "draft" | "promoted" | "live" | "failed" {
  return "draft";
}

function getCanonicalSnapshot(item: LegacyReviewedCandidate): CanonicalPageSnapshot {
  const snapshot =
    item.canonicalSnapshot ?? item.snapshot ?? item.canonicalContent;

  if (!snapshot) {
    throw new Error(`Missing canonical snapshot for slug: ${item.slug}`);
  }

  return snapshot;
}

function dedupeBySlug(items: ReviewImportRecord[]): ReviewImportRecord[] {
  const map = new Map<string, ReviewImportRecord>();

  for (const item of items) {
    map.set(item.slug, item);
  }

  return Array.from(map.values());
}

export function buildReviewImportPayloadFromReviewedCorpus(
  input: LegacyReviewedFile
): ReviewImportPayload {
  const candidates = extractCandidates(input);

  const mapped = candidates.map<ReviewImportRecord>((item) => {
    if (!item.slug) {
      throw new Error("Reviewed candidate missing slug");
    }

    const reviewStatus = toReviewStatus(item);
    const canonicalSnapshot = getCanonicalSnapshot(item);
    const title = item.title?.trim() || canonicalSnapshot.title?.trim() || item.slug;

    return {
      slug: item.slug,
      title,
      canonicalSnapshot,
      reviewStatus,
      publishStatus: toPublishStatus(reviewStatus),
    };
  });

  return dedupeBySlug(mapped);
}

export function exportReviewedCorpusToImportFile(params: {
  sourcePath: string;
  outputPath: string;
}) {
  const input = readJsonFile(params.sourcePath) as LegacyReviewedFile;
  const payload = buildReviewImportPayloadFromReviewedCorpus(input);

  fs.mkdirSync(path.dirname(params.outputPath), { recursive: true });
  fs.writeFileSync(params.outputPath, JSON.stringify(payload, null, 2));

  return {
    sourcePath: params.sourcePath,
    outputPath: params.outputPath,
    exported: payload.length,
  };
}
