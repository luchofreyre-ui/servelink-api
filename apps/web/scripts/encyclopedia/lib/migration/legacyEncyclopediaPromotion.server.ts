/**
 * Migration-only legacy pipeline: promote approved review rows to file-backed live store.
 * Not part of operational encyclopedia system. Use API review promotion instead.
 */

import { revalidatePath } from "next/cache";
import { buildStoredAdminReviewPages } from "../../../../src/lib/encyclopedia/adminPipeline.server";
import { getPublishedEncyclopediaIndex } from "../../../../src/lib/encyclopedia/loader";
import type {
  PromoteApprovedBatchResult,
  PromoteApprovedOptions,
  PromoteApprovedPageResult,
} from "../../../../src/lib/encyclopedia/encyclopediaPipelineTypes";
import { buildLivePageRecordFromApprovedReviewRecord } from "../../../../src/lib/encyclopedia/encyclopediaPipelineMerge";
import { upsertLiveEncyclopediaPage } from "./legacyLiveStoreWrites.server";
import {
  getStoredReviewRecordBySlug,
} from "../../../../src/lib/encyclopedia/reviewPersistence.server";
import { replaceStoredReviewRecord } from "./legacyReviewStoreWrites.server";
import type { ReviewablePage } from "../../../../src/lib/encyclopedia/renderTypes";
import { reviewPageAllowsPipelinePromotion } from "../../../../src/lib/encyclopedia/encyclopediaPromotion.server";

export type PromoteApprovedEncyclopediaPageOptions = {
  runId?: string;
  logBlockedGuard?: boolean;
};

function promoteLogFields(
  runId: string | undefined,
  fields: Record<string, unknown>
): Record<string, unknown> {
  return runId ? { runId, ...fields } : fields;
}

function assertPromotionAllowed(page: ReviewablePage): void {
  if (!reviewPageAllowsPipelinePromotion(page)) {
    throw new Error(`Promotion not allowed for slug: ${page.slug}`);
  }
}

function revalidatePublicEncyclopediaPathForSlug(slug: string): void {
  const entry = getPublishedEncyclopediaIndex().find((e) => e.slug === slug);
  const category = entry?.category ?? "problems";
  revalidatePath(`/encyclopedia/${category}/${slug}`);
}

function revalidatePromotionAdminSurfaces(): void {
  revalidatePath("/admin/encyclopedia/review");
  revalidatePath("/admin/encyclopedia/ops");
}

export function promoteApprovedEncyclopediaPage(
  slug: string,
  options?: PromoteApprovedEncyclopediaPageOptions
): PromoteApprovedPageResult {
  const pages = buildStoredAdminReviewPages();
  const page = pages.find((p) => p.slug === slug);
  if (!page) {
    return { slug, status: "failed", error: "Review page not found" };
  }

  try {
    assertPromotionAllowed(page);
  } catch (e) {
    if (options?.logBlockedGuard) {
      console.warn(
        "[encyclopedia:promote:blocked]",
        promoteLogFields(options?.runId, {
          slug,
          reason: "not_allowed",
          reviewStatus: page.reviewStatus,
          repairReadiness: page.repairReadiness,
        })
      );
    }
    return {
      slug,
      status: "failed",
      error: e instanceof Error ? e.message : "Promotion not allowed",
    };
  }

  const record = getStoredReviewRecordBySlug(slug);
  if (!record) {
    console.error(
      "[encyclopedia:promote:failed]",
      promoteLogFields(options?.runId, {
        slug,
        reason: "missing_record",
      })
    );
    return { slug, status: "failed", error: "Missing review store record" };
  }
  if (!record.canonicalContent) {
    console.error("[encyclopedia:promote:failed]", {
      slug,
      reason: "missing_canonical_content",
    });
    return {
      slug,
      status: "failed",
      error: "Missing canonicalContent; run ingest first",
    };
  }

  if (!record.contentHash) {
    console.error(
      "[encyclopedia:promote:failed]",
      promoteLogFields(options?.runId, {
        slug,
        reason: "missing_content_hash",
      })
    );
    return {
      slug,
      status: "failed",
      error: `Missing contentHash for ${record.slug}; run ingest`,
    };
  }

  const contentHash = record.contentHash;

  if (
    record.promotionStatus === "promoted" &&
    record.liveContentHash &&
    record.liveContentHash === contentHash
  ) {
    return { slug, status: "skipped", reason: "Already promoted at this hash" };
  }

  const promotedAt = new Date().toISOString();

  try {
    const live = buildLivePageRecordFromApprovedReviewRecord(
      record,
      promotedAt
    );
    upsertLiveEncyclopediaPage(live);

    const next: typeof record = {
      ...record,
      promotionStatus: "promoted",
      promotedAt,
      liveContentHash: contentHash,
      promotionError: undefined,
      updatedAt: promotedAt,
    };
    replaceStoredReviewRecord(next);

    return { slug, status: "promoted" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown promotion error";
    console.error(
      "[encyclopedia:promote:error]",
      promoteLogFields(options?.runId, { slug, error: msg })
    );
    const failed: typeof record = {
      ...record,
      promotionStatus: "failed",
      promotionError: msg,
      updatedAt: new Date().toISOString(),
    };
    replaceStoredReviewRecord(failed);
    return { slug, status: "failed", error: msg };
  }
}

export function promoteApprovedEncyclopediaPages(
  options: PromoteApprovedOptions = {}
): PromoteApprovedBatchResult {
  const runId = `promote_${Date.now()}`;
  const pages = buildStoredAdminReviewPages();
  const allow = new Set(options.slugs);
  const targets =
    options.slugs && options.slugs.length > 0
      ? pages.filter((p) => allow.has(p.slug))
      : pages.filter((p) => p.reviewStatus === "approved");

  const results: PromoteApprovedPageResult[] = [];
  for (const p of targets) {
    results.push(promoteApprovedEncyclopediaPage(p.slug, { runId }));
  }

  console.info("[encyclopedia:promote:summary]", {
    runId,
    total: targets.length,
    promoted: results.filter((r) => r.status === "promoted").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
  });

  return { results };
}

export function promoteApprovedEncyclopediaPageAndRevalidate(
  slug: string
): PromoteApprovedPageResult {
  const r = promoteApprovedEncyclopediaPage(slug, { logBlockedGuard: true });
  revalidatePublicEncyclopediaPathForSlug(slug);
  revalidatePromotionAdminSurfaces();
  return r;
}

export function promoteApprovedEncyclopediaPagesAndRevalidate(
  options?: PromoteApprovedOptions
): PromoteApprovedBatchResult {
  const r = promoteApprovedEncyclopediaPages(options);
  for (const row of r.results) {
    if (row.status === "promoted" || row.status === "skipped") {
      revalidatePublicEncyclopediaPathForSlug(row.slug);
    }
  }
  revalidatePromotionAdminSurfaces();
  return r;
}
