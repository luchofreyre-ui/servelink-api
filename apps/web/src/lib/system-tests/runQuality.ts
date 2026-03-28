import type {
  SystemTestRunDetailResponse,
  SystemTestRunsListItem,
  SystemTestsRunsResponse,
} from "@/types/systemTests";

export type SystemTestsRunProvenance =
  | "trusted_ci"
  | "local_dev"
  | "manual"
  | "synthetic"
  | "unknown";

/** @deprecated Use SystemTestsRunProvenance */
export type RunProvenance = SystemTestsRunProvenance;

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

export function classifyRunProvenance(input: {
  source?: string | null;
  branch?: string | null;
  commitSha?: string | null;
}): SystemTestsRunProvenance {
  const source = normalize(input.source);
  const branch = normalize(input.branch);
  const hasCommit = Boolean((input.commitSha ?? "").trim());

  if (source === "github-actions") {
    return "trusted_ci";
  }

  if (source === "local-dev") {
    return "local_dev";
  }

  if (
    source === "ci" ||
    source === "playwright-json" ||
    source === "playwright-local" ||
    source === "older" ||
    source === "newer" ||
    source === "second-run" ||
    source === "manual" ||
    source === "fixture" ||
    source === "synthetic"
  ) {
    return "synthetic";
  }

  if (source === "local" && branch === "main" && hasCommit) {
    return "local_dev";
  }

  if (!source && !branch && !hasCommit) {
    return "unknown";
  }

  return "manual";
}

export function isTrustedIntelligenceRun(input: {
  source?: string | null;
  branch?: string | null;
  commitSha?: string | null;
}): boolean {
  const provenance = classifyRunProvenance(input);
  return provenance === "trusted_ci" || provenance === "local_dev";
}

export function isStrictTrustedCIRun(input: {
  source?: string | null;
  branch?: string | null;
  commitSha?: string | null;
}): boolean {
  return classifyRunProvenance(input) === "trusted_ci";
}

export function isNoisyIntelligenceRun(input: {
  source?: string | null;
  branch?: string | null;
  commitSha?: string | null;
}): boolean {
  return !isTrustedIntelligenceRun(input);
}

/** @deprecated Prefer isStrictTrustedCIRun */
export function isTrustedCIRun(meta: { source: string; branch?: string | null; commitSha?: string | null }): boolean {
  return isStrictTrustedCIRun(meta);
}

/** @deprecated No longer used for intelligence; kept for legacy call sites if any */
export function isNoisyProvenance(p: SystemTestsRunProvenance): boolean {
  return p === "manual" || p === "synthetic" || p === "unknown";
}

export type IntelligenceWindowPick = {
  primary: SystemTestRunDetailResponse[];
  usedFallback: boolean;
  trustedCount: number;
  noisyCount: number;
  totalCount: number;
  scope: "trusted" | "mixed_fallback" | "thin";
};

/**
 * Trusted-only window for exports: same rules as dashboard intelligenceRuns (1+ trusted details, asc by time).
 */
export function pickRunDetailsForIntelligence(
  details: SystemTestRunDetailResponse[],
  _minTrusted = 2,
): IntelligenceWindowPick {
  const sorted = [...details].sort(
    (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
  );
  const trusted = sorted.filter((d) =>
    isTrustedIntelligenceRun({
      source: d.run.source,
      branch: d.run.branch,
      commitSha: d.run.commitSha,
    }),
  );
  const noisyCount = sorted.filter((d) => isNoisyIntelligenceRun(d.run)).length;
  const trustedCount = trusted.length;
  const totalCount = sorted.length;

  const primary =
    trusted.length >= 2 ? trusted : trusted.length === 1 ? trusted : [];

  return {
    primary,
    usedFallback: false,
    trustedCount,
    noisyCount,
    totalCount,
    scope: primary.length >= 2 ? "trusted" : primary.length === 1 ? "thin" : "thin",
  };
}

/** Trend series: trusted CI + local-dev uploads only, chronological asc */
export function pickTrendRunItems(
  runs: SystemTestsRunsResponse | null,
): { items: SystemTestRunsListItem[]; mode: "trusted_ci" | "all_runs" } {
  if (!runs?.items.length) return { items: [], mode: "all_runs" };
  const trusted = runs.items.filter((r) =>
    isTrustedIntelligenceRun({
      source: r.source,
      branch: r.branch,
      commitSha: r.commitSha,
    }),
  );
  if (!trusted.length) return { items: [], mode: "all_runs" };
  return {
    items: [...trusted].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
    mode: "trusted_ci",
  };
}

export function provenanceBadgeLabel(p: SystemTestsRunProvenance): string {
  switch (p) {
    case "trusted_ci":
      return "Trusted CI";
    case "local_dev":
      return "Local dev";
    case "manual":
      return "Manual";
    case "synthetic":
      return "Synthetic";
    default:
      return "Unknown";
  }
}
