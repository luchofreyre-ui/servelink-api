import type {
  SystemTestRunDetailResponse,
  SystemTestRunsListItem,
  SystemTestsRunsResponse,
} from "@/types/systemTests";

/**
 * Coarse provenance for operator trust — derived from `source` + `branch` only (no backend changes).
 */
export type RunProvenance = "trusted_ci" | "local" | "manual" | "synthetic" | "unknown";

const TRUSTED_RE =
  /github|gitea|actions|workflow|ci[/_-]|hosted|pipeline|railway|vercel|circle|jenkins|gitlab|buildkite|azure.?devops/i;
const LOCAL_RE = /local|localhost|127\.0\.0\.1|workstation|dev\s*machine|my\s*machine/i;
const MANUAL_RE = /manual|adhoc|ad-hoc|cursor|one[-_]?off|upload[-_]?only|hand[-_]?run/i;
const SYNTH_RE =
  /synthetic|fixture|seed|dev[-_]?only|pw[-_]?fixture|test[-_]?harness|playwright[-_]?fixture|mock[-_]?run|fake[-_]?ci/i;

export function classifyRunProvenance(meta: {
  source: string;
  branch?: string | null;
}): RunProvenance {
  const s = (meta.source ?? "").toLowerCase().trim();
  const b = (meta.branch ?? "").toLowerCase().trim();
  const blob = `${s} ${b}`;

  if (SYNTH_RE.test(blob) || /fixture|synthetic|seed-only|dev\/playwright/i.test(b)) {
    return "synthetic";
  }
  if (LOCAL_RE.test(blob)) return "local";
  if (MANUAL_RE.test(blob)) return "manual";
  if (TRUSTED_RE.test(blob)) return "trusted_ci";
  if (!s || s === "unknown" || s === "—") return "unknown";
  return "unknown";
}

export function isTrustedCIRun(meta: { source: string; branch?: string | null }): boolean {
  return classifyRunProvenance(meta) === "trusted_ci";
}

export function isNoisyProvenance(p: RunProvenance): boolean {
  return p === "local" || p === "manual" || p === "synthetic";
}

export type IntelligenceWindowPick = {
  /** Runs used for flaky/patterns/historical (chronological asc). */
  primary: SystemTestRunDetailResponse[];
  /** True when we fell back to all runs because trusted count was low. */
  usedFallback: boolean;
  trustedCount: number;
  noisyCount: number;
  totalCount: number;
  /** Human-readable scope for UI. */
  scope: "trusted" | "mixed_fallback" | "thin";
};

const MIN_TRUSTED_FOR_PRIMARY = 2;

/**
 * Prefer trusted CI runs for intelligence; fall back to full window with clear labeling.
 */
export function pickRunDetailsForIntelligence(
  details: SystemTestRunDetailResponse[],
  minTrusted = MIN_TRUSTED_FOR_PRIMARY,
): IntelligenceWindowPick {
  const sorted = [...details].sort(
    (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
  );
  const totalCount = sorted.length;
  const trusted = sorted.filter((d) => isTrustedCIRun(d.run));
  const noisyCount = sorted.filter((d) => isNoisyProvenance(classifyRunProvenance(d.run))).length;
  const trustedCount = trusted.length;

  if (trusted.length >= minTrusted && totalCount >= 2) {
    return {
      primary: trusted,
      usedFallback: false,
      trustedCount,
      noisyCount,
      totalCount,
      scope: noisyCount > 0 ? "mixed_fallback" : "trusted",
    };
  }

  if (sorted.length >= 2) {
    return {
      primary: sorted,
      usedFallback: trusted.length < minTrusted,
      trustedCount,
      noisyCount,
      totalCount,
      scope: trustedCount === 0 ? "thin" : "mixed_fallback",
    };
  }

  return {
    primary: sorted,
    usedFallback: true,
    trustedCount,
    noisyCount,
    totalCount,
    scope: "thin",
  };
}

/** Build a runs response slice for trend charts — prefer trusted CI rows when enough exist. */
export function pickTrendRunItems(
  runs: SystemTestsRunsResponse | null,
  minTrusted = 3,
): { items: SystemTestRunsListItem[]; mode: "trusted_ci" | "all_runs" } {
  if (!runs?.items.length) return { items: [], mode: "all_runs" };
  const trusted = runs.items.filter((r) => isTrustedCIRun(r));
  if (trusted.length >= minTrusted) {
    return {
      items: [...trusted].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
      mode: "trusted_ci",
    };
  }
  return {
    items: [...runs.items].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
    mode: "all_runs",
  };
}

export function provenanceBadgeLabel(p: RunProvenance): string {
  switch (p) {
    case "trusted_ci":
      return "Trusted CI";
    case "local":
      return "Local";
    case "manual":
      return "Manual";
    case "synthetic":
      return "Synthetic";
    default:
      return "Unknown";
  }
}
