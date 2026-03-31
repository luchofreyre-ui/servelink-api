import fs from "fs";
import path from "path";
import type { CanonicalPageSnapshot } from "../canonical/canonicalTypes";
import type { ReviewRecord } from "./reviewPromotionTypes";
import { getAllReviewRecords } from "./reviewStore.server";

function getStorePath() {
  return (
    process.env.ENCYCLOPEDIA_REVIEW_STORE_PATH ||
    path.join(process.cwd(), "data/encyclopedia/review-store.json")
  );
}

function writeStore(records: ReviewRecord[]) {
  const storePath = getStorePath();
  fs.mkdirSync(path.dirname(storePath), { recursive: true });
  fs.writeFileSync(storePath, JSON.stringify(records, null, 2));
}

export type ReviewedCandidateInput = {
  slug: string;
  title: string;
  canonicalSnapshot: CanonicalPageSnapshot;
  sourceName?: string;
};

export function saveReviewedCandidatesToApiStore(
  inputs: ReviewedCandidateInput[],
) {
  const store = getAllReviewRecords();
  const now = new Date().toISOString();

  const bySlug = new Map(store.map((item) => [item.slug, item]));
  let created = 0;
  let updated = 0;

  for (const input of inputs) {
    const existing = bySlug.get(input.slug);

    if (!existing) {
      const next: ReviewRecord = {
        slug: input.slug,
        title: input.title,
        canonicalSnapshot: input.canonicalSnapshot,
        reviewStatus: "pending",
        publishStatus: "draft",
        source: "reviewed_candidates",
        sourceDetail: input.sourceName ?? "reviewed_candidates_route",
        importedAt: now,
        promotionErrors: [],
      };

      store.push(next);
      bySlug.set(input.slug, next);
      created++;
      continue;
    }

    const shouldPreserveLive = existing.publishStatus === "live";

    const merged: ReviewRecord = {
      ...existing,
      title: input.title,
      canonicalSnapshot: input.canonicalSnapshot,
      source: existing.source ?? "reviewed_candidates",
      sourceDetail:
        existing.sourceDetail ??
        input.sourceName ??
        "reviewed_candidates_route",
      importedAt: existing.importedAt ?? now,
      promotionErrors: [],
      reviewStatus: shouldPreserveLive ? existing.reviewStatus : "pending",
      publishStatus: shouldPreserveLive ? existing.publishStatus : "draft",
    };

    const index = store.findIndex((row) => row.slug === input.slug);
    store[index] = merged;
    bySlug.set(input.slug, merged);
    updated++;
  }

  writeStore(store);

  return {
    attempted: inputs.length,
    created,
    updated,
    total: store.length,
    slugs: inputs.map((item) => item.slug),
  };
}
