import fs from "fs";
import path from "path";
import { buildRedirectManifest } from "./redirectManifest";

export type RedirectBatchReviewItem = {
  topicKey: string;
  sourceHref: string;
  destinationHref: string;
  priority: "high" | "medium" | "low";
  overlapType: string;
  recommendedOwner: string;
  pipelineTitle?: string;
  legacyTitle?: string;
  rationale: string;
  alreadyExecuted: boolean;
  recommendedBatchAction: "keep_live" | "promote_to_next_batch" | "hold";
};

export type RedirectBatchReviewReport = {
  items: RedirectBatchReviewItem[];
};

function loadLiveRedirectSources(): Set<string> {
  const candidates = [
    path.join(process.cwd(), "src/lib/encyclopedia/generated/liveEncyclopediaRedirects.json"),
    path.join(process.cwd(), "src/lib/encyclopedia/generated/executableEncyclopediaRedirects.json"),
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const raw = fs.readFileSync(p, "utf8");
      const rows = JSON.parse(raw) as { source: string }[];
      return new Set(rows.map((r) => r.source));
    } catch {
      /* try next */
    }
  }
  return new Set();
}

/**
 * Compares full redirectLater manifest (all priorities) against live rollout JSON.
 * Does not change live redirects — planning only.
 */
export function buildRedirectBatchReviewReport(): RedirectBatchReviewReport {
  const liveSources = loadLiveRedirectSources();
  const { items } = buildRedirectManifest({ minPriority: "low" });

  const reviewItems: RedirectBatchReviewItem[] = items.map((row) => {
    const alreadyExecuted = liveSources.has(row.sourceHref);
    let recommendedBatchAction: RedirectBatchReviewItem["recommendedBatchAction"];
    if (alreadyExecuted) {
      recommendedBatchAction = "keep_live";
    } else if (row.priority === "high") {
      recommendedBatchAction = "promote_to_next_batch";
    } else {
      recommendedBatchAction = "hold";
    }

    return {
      topicKey: row.topicKey,
      sourceHref: row.sourceHref,
      destinationHref: row.destinationHref,
      priority: row.priority,
      overlapType: row.overlapType,
      recommendedOwner: row.recommendedOwner,
      pipelineTitle: row.pipelineTitle,
      legacyTitle: row.legacyTitle,
      rationale: row.rationale,
      alreadyExecuted,
      recommendedBatchAction,
    };
  });

  reviewItems.sort((a, b) => a.sourceHref.localeCompare(b.sourceHref));
  return { items: reviewItems };
}

export function summarizeRedirectBatchReviewReport(report: RedirectBatchReviewReport): {
  total: number;
  keepLive: number;
  promoteToNextBatch: number;
  hold: number;
  notYetExecutedHigh: number;
} {
  return {
    total: report.items.length,
    keepLive: report.items.filter((i) => i.recommendedBatchAction === "keep_live").length,
    promoteToNextBatch: report.items.filter((i) => i.recommendedBatchAction === "promote_to_next_batch")
      .length,
    hold: report.items.filter((i) => i.recommendedBatchAction === "hold").length,
    notYetExecutedHigh: report.items.filter((i) => i.priority === "high" && !i.alreadyExecuted).length,
  };
}
