import { ingestWithValidation } from "../ingestion/ingestionWithValidation.server";
import {
  listApprovedUnpromoted,
  listFailedPromotions,
  markPromotionFailed,
  markPromotionSucceeded,
} from "./reviewStore.server";

export type PromotionRunResult = {
  attempted: number;
  promoted: number;
  failed: number;
  promotedSlugs: string[];
  failures: { slug: string; errors: string[] }[];
  rejectionCounts: Record<string, number>;
};

function aggregateRejectionReasons(
  failures: { slug: string; errors: string[] }[]
) {
  const map: Record<string, number> = {};

  for (const f of failures) {
    for (const err of f.errors) {
      map[err] = (map[err] || 0) + 1;
    }
  }

  return map;
}

export async function promoteApprovedReviewRecords(): Promise<PromotionRunResult> {
  const candidates = listApprovedUnpromoted();

  if (!candidates.length) {
    return {
      attempted: 0,
      promoted: 0,
      failed: 0,
      promotedSlugs: [],
      failures: [],
      rejectionCounts: {},
    };
  }

  const snapshots = candidates.map((c) => c.canonicalSnapshot);

  const { accepted, rejected } = await ingestWithValidation(snapshots);

  const failures: { slug: string; errors: string[] }[] = [];

  for (const a of accepted) {
    markPromotionSucceeded(a.slug);
  }

  for (const r of rejected) {
    markPromotionFailed(r.slug, r.errors);
    failures.push({ slug: r.slug, errors: r.errors });
  }

  return {
    attempted: candidates.length,
    promoted: accepted.length,
    failed: rejected.length,
    promotedSlugs: accepted.map((a) => a.slug),
    failures,
    rejectionCounts: aggregateRejectionReasons(failures),
  };
}

export async function retryFailedPromotions(): Promise<PromotionRunResult> {
  const failed = listFailedPromotions();

  if (!failed.length) {
    return {
      attempted: 0,
      promoted: 0,
      failed: 0,
      promotedSlugs: [],
      failures: [],
      rejectionCounts: {},
    };
  }

  const snapshots = failed.map((f) => f.canonicalSnapshot);

  const { accepted, rejected } = await ingestWithValidation(snapshots);

  const failures: { slug: string; errors: string[] }[] = [];

  for (const a of accepted) {
    markPromotionSucceeded(a.slug);
  }

  for (const r of rejected) {
    markPromotionFailed(r.slug, r.errors);
    failures.push({ slug: r.slug, errors: r.errors });
  }

  return {
    attempted: failed.length,
    promoted: accepted.length,
    failed: rejected.length,
    promotedSlugs: accepted.map((a) => a.slug),
    failures,
    rejectionCounts: aggregateRejectionReasons(failures),
  };
}
