import { formatEvidenceSummaryForReport } from "@/lib/systemTests/extractSystemTestEvidence";
import type {
  SystemTestFailureGroup,
  SystemTestReportPayload,
  SystemTestRunSummary,
  SystemTestRunTrendVsPrevious,
  SystemTestSpecBreakdownRow,
} from "@/types/systemTests";

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function fmtPctDelta(delta: number | null): string {
  if (delta === null || Number.isNaN(delta)) return "—";
  const pct = delta * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function dashNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return String(n);
}

function dashStr(s: string | null | undefined): string {
  if (s === null || s === undefined || s === "") return "—";
  return s;
}

function branchOrUnknown(branch: string | null): string {
  return branch?.trim() ? branch.trim() : "unknown";
}

function shaOrUnknown(sha: string | null): string {
  return sha?.trim() ? sha.trim() : "unknown";
}

export type BuildSystemTestReportInput = {
  summary: SystemTestRunSummary;
  trendVsPrevious: SystemTestRunTrendVsPrevious;
  failureGroups: SystemTestFailureGroup[];
  topFiles: SystemTestSpecBreakdownRow[];
};

export function buildSystemTestReportFromPayload(payload: SystemTestReportPayload): string {
  return buildSystemTestReport({
    summary: payload.run.summary,
    trendVsPrevious: payload.trendVsPrevious,
    failureGroups: payload.run.failureGroups,
    topFiles: payload.run.specs,
  });
}

export function buildSystemTestReport(input: BuildSystemTestReportInput): string {
  const { summary, trendVsPrevious, failureGroups, topFiles } = input;
  const lines: string[] = [];

  lines.push("SYSTEM TEST REPORT");
  lines.push(`Run ID: ${summary.id}`);
  lines.push(`Status: ${summary.status}`);
  lines.push(`Created At: ${summary.createdAt}`);
  lines.push(`Duration Ms: ${dashNum(summary.durationMs)}`);
  lines.push(`Branch: ${branchOrUnknown(summary.branch)}`);
  lines.push(`Commit SHA: ${shaOrUnknown(summary.commitSha)}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(`Total: ${summary.totalCount}`);
  lines.push(`Passed: ${summary.passedCount}`);
  lines.push(`Failed: ${summary.failedCount}`);
  lines.push(`Skipped: ${summary.skippedCount}`);
  lines.push(`Pass Rate: ${fmtPct(summary.passRate)}`);
  lines.push("");
  lines.push("TRENDS VS PREVIOUS");
  lines.push(`Previous Run ID: ${dashStr(trendVsPrevious.previousRunId)}`);
  lines.push(`Pass Rate Delta: ${fmtPctDelta(trendVsPrevious.passRateDelta)}`);
  lines.push(`Failed Delta: ${dashNum(trendVsPrevious.failedDelta)}`);
  lines.push(`Duration Delta Ms: ${dashNum(trendVsPrevious.durationDeltaMs)}`);
  lines.push("");
  lines.push("FAILURE GROUPS");

  if (!failureGroups.length) {
    lines.push("(none)");
  } else {
    failureGroups.forEach((g, i) => {
      lines.push(`${i + 1}) ${g.fingerprint}`);
      lines.push(`File: ${g.file}`);
      lines.push(`Project: ${g.projectName ?? "unknown"}`);
      lines.push(`Occurrences: ${g.occurrences}`);
      lines.push(`Final Status: ${g.finalStatus ?? "unknown"}`);
      lines.push("Message:");
      lines.push(g.shortMessage || "—");
      const evLines = formatEvidenceSummaryForReport(g.evidenceSummary);
      if (evLines.length) {
        lines.push("Evidence summary:");
        for (const el of evLines) {
          lines.push(`- ${el}`);
        }
        lines.push("");
      }
      if (g.debuggingHint?.trim()) {
        lines.push(`Debugging hint: ${g.debuggingHint.trim()}`);
        lines.push("");
      }
      if (g.family) {
        lines.push(`Family: ${g.family.displayTitle}`);
        lines.push(
          `Family trend: ${g.family.recurrenceLine} (${g.family.trendKind}, ${g.family.status})`,
        );
        lines.push("");
      }
      if (g.incident) {
        lines.push(`Incident: ${g.incident.displayTitle}`);
        lines.push(`Incident severity: ${g.incident.severity}`);
        lines.push("");
      }
      lines.push("Tests:");
      for (const t of g.testTitles) {
        lines.push(`- ${t}`);
      }
      lines.push("");
      lines.push("Evidence:");
      if (g.evidenceLines.length === 0) {
        lines.push("- —");
        lines.push("- —");
      } else {
        lines.push(`- ${g.evidenceLines[0] ?? "—"}`);
        lines.push(`- ${g.evidenceLines[1] ?? "—"}`);
      }
      lines.push("");
    });
  }

  lines.push("TOP FILES");
  const failing = topFiles.filter((r) => r.failedCount > 0);
  if (!failing.length) {
    lines.push("- —");
  } else {
    for (const r of failing) {
      lines.push(`- ${r.file}: ${r.failedCount}/${r.totalCount} failed`);
    }
  }
  lines.push("");
  lines.push("NOTES");
  lines.push("- Generated from admin system test dashboard");
  lines.push("- Deterministic formatting enabled");

  return lines.join("\n");
}
