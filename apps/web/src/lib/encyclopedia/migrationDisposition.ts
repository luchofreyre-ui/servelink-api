import {
  type ConvergenceAuditRow,
  getConvergenceAuditRows,
} from "./convergenceAudit";

export type MigrationDispositionBucket =
  | "redirectLater"
  | "keepForNow"
  | "review";

export type MigrationDispositionPriority = "high" | "medium" | "low";

export type MigrationDispositionItem = {
  topicKey: string;
  kind: string;
  pipelineHref?: string;
  legacyHref?: string;
  pipelineTitle?: string;
  legacyTitle?: string;
  overlapType: string;
  recommendedOwner: string;
  bucket: MigrationDispositionBucket;
  priority: MigrationDispositionPriority;
  rationale: string;
};

export type MigrationDispositionReport = {
  redirectLater: MigrationDispositionItem[];
  keepForNow: MigrationDispositionItem[];
  review: MigrationDispositionItem[];
};

export function buildMigrationDispositionReport(): MigrationDispositionReport {
  const rows = getConvergenceAuditRows();

  const items = rows
    .filter((row) => row.treatment !== "bridge_to_pipeline")
    .map((row) => {
      const bucket = resolveBucket(row);
      return {
        topicKey: row.topicKey,
        kind: getKindFromTopicKey(row.topicKey),
        pipelineHref: row.pipelineHref ?? undefined,
        legacyHref: row.legacyHref ?? undefined,
        pipelineTitle: row.pipelineTitle ?? undefined,
        legacyTitle: row.legacyTitle ?? undefined,
        overlapType: row.overlapType,
        recommendedOwner: row.recommendedOwner,
        bucket,
        priority: resolvePriority(row, bucket),
        rationale: buildRationale(row, bucket),
      } satisfies MigrationDispositionItem;
    });

  return {
    redirectLater: items.filter((item) => item.bucket === "redirectLater"),
    keepForNow: items.filter((item) => item.bucket === "keepForNow"),
    review: items.filter((item) => item.bucket === "review"),
  };
}

function resolveBucket(row: ConvergenceAuditRow): MigrationDispositionBucket {
  if (row.recommendedOwner === "review" || row.overlapType === "conflict") {
    return "review";
  }

  if (row.treatment === "candidate_redirect_later") {
    return "redirectLater";
  }

  return "keepForNow";
}

function resolvePriority(
  row: ConvergenceAuditRow,
  bucket: MigrationDispositionBucket,
): MigrationDispositionPriority {
  if (bucket === "review") {
    return "medium";
  }

  if (bucket === "redirectLater") {
    if (
      row.overlapType === "exact" &&
      row.recommendedOwner === "pipeline" &&
      row.pipelineHref &&
      row.legacyHref
    ) {
      return "high";
    }

    if (row.overlapType === "near") {
      return "medium";
    }

    return "low";
  }

  if (bucket === "keepForNow") {
    if (!row.pipelineHref || !row.legacyHref) {
      return "medium";
    }

    return "low";
  }

  return "low";
}

function buildRationale(row: ConvergenceAuditRow, bucket: MigrationDispositionBucket): string {
  if (bucket === "review") {
    if (row.overlapType === "conflict") {
      return "Conflicting overlap signals require manual ownership review.";
    }

    return "Manual review required before migration action.";
  }

  if (bucket === "redirectLater") {
    if (row.overlapType === "exact") {
      return "Exact overlap with pipeline-preferred ownership; suitable redirect candidate after validation period.";
    }

    return "Strong overlap with pipeline-preferred ownership, but not yet safe enough for immediate redirect.";
  }

  if (!row.pipelineHref) {
    return "No clean pipeline equivalent exists yet; keep legacy page active for now.";
  }

  if (row.recommendedOwner === "legacy") {
    return "Legacy page still serves a distinct or compatibility-oriented role.";
  }

  return "Keep for now until migration confidence improves or supporting pipeline coverage expands.";
}

function getKindFromTopicKey(topicKey: string): string {
  return topicKey.split(":")[0] ?? "unknown";
}

export function summarizeMigrationDispositionReport(report: MigrationDispositionReport) {
  return {
    redirectLater: {
      total: report.redirectLater.length,
      high: report.redirectLater.filter((x) => x.priority === "high").length,
      medium: report.redirectLater.filter((x) => x.priority === "medium").length,
      low: report.redirectLater.filter((x) => x.priority === "low").length,
    },
    keepForNow: {
      total: report.keepForNow.length,
    },
    review: {
      total: report.review.length,
    },
  };
}
