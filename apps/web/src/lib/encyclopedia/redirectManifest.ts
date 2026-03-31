import { buildMigrationDispositionReport } from "./migrationDisposition";

export type RedirectManifestItem = {
  topicKey: string;
  kind: string;
  sourceHref: string;
  destinationHref: string;
  priority: "high" | "medium" | "low";
  overlapType: string;
  recommendedOwner: string;
  pipelineTitle?: string;
  legacyTitle?: string;
  rationale: string;
};

export type RedirectManifest = {
  items: RedirectManifestItem[];
};

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
} as const;

export function buildRedirectManifest(options?: {
  minPriority?: "high" | "medium" | "low";
}): RedirectManifest {
  const minPriority = options?.minPriority ?? "high";
  const minPriorityScore = PRIORITY_ORDER[minPriority];
  const report = buildMigrationDispositionReport();

  const items = report.redirectLater
    .filter(
      (row) =>
        row.legacyHref &&
        row.pipelineHref &&
        PRIORITY_ORDER[row.priority] >= minPriorityScore,
    )
    .map((row) => ({
      topicKey: row.topicKey,
      kind: row.kind,
      sourceHref: row.legacyHref!,
      destinationHref: row.pipelineHref!,
      priority: row.priority,
      overlapType: row.overlapType,
      recommendedOwner: row.recommendedOwner,
      pipelineTitle: row.pipelineTitle,
      legacyTitle: row.legacyTitle,
      rationale: row.rationale,
    }));

  return { items };
}

export function summarizeRedirectManifest(manifest: RedirectManifest): {
  total: number;
  byPriority: Record<"high" | "medium" | "low", number>;
} {
  return {
    total: manifest.items.length,
    byPriority: {
      high: manifest.items.filter((x) => x.priority === "high").length,
      medium: manifest.items.filter((x) => x.priority === "medium").length,
      low: manifest.items.filter((x) => x.priority === "low").length,
    },
  };
}
