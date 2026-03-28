import { formatEvidenceSummaryForReport } from "@/lib/systemTests/extractSystemTestEvidence";
import type {
  SystemTestFailureGroup,
  SystemTestHistoricalAnalysis,
  SystemTestReportPayload,
  SystemTestRunSummary,
} from "@/types/systemTests";

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function sortRerunGroups(
  groups: SystemTestFailureGroup[],
  profiles: SystemTestHistoricalAnalysis["failureProfiles"],
): SystemTestFailureGroup[] {
  return [...groups].sort((a, b) => {
    const pa = profiles[a.key];
    const pb = profiles[b.key];
    const sa = pa?.rerunPriorityScore ?? 0;
    const sb = pb?.rerunPriorityScore ?? 0;
    if (sb !== sa) return sb - sa;
    if (b.occurrences !== a.occurrences) return b.occurrences - a.occurrences;
    const f = a.file.localeCompare(b.file);
    if (f !== 0) return f;
    return a.title.localeCompare(b.title);
  });
}

export function buildSystemTestTriageReportFromPayload(payload: SystemTestReportPayload): string {
  if (!payload.historicalAnalysis) {
    throw new Error("buildSystemTestTriageReportFromPayload requires historicalAnalysis on the payload.");
  }
  return buildSystemTestTriageReport(
    payload.run.summary,
    payload.historicalAnalysis,
    payload.run.failureGroups,
  );
}

export function buildSystemTestTriageReport(
  summary: SystemTestRunSummary,
  analysis: SystemTestHistoricalAnalysis,
  groups: SystemTestFailureGroup[],
): string {
  const lines: string[] = [];
  const profiles = analysis.failureProfiles;

  lines.push("SYSTEM TEST TRIAGE REPORT");
  lines.push(`Run ID: ${summary.id}`);
  lines.push(`Created At: ${summary.createdAt}`);
  lines.push(`History Window Size: ${analysis.historyWindowSize}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(`Status: ${summary.status}`);
  lines.push(`Total: ${summary.totalCount}`);
  lines.push(`Passed: ${summary.passedCount}`);
  lines.push(`Failed: ${summary.failedCount}`);
  lines.push(`Skipped: ${summary.skippedCount}`);
  lines.push(`Pass Rate: ${fmtPct(summary.passRate)}`);
  lines.push("");
  lines.push("HISTORICAL INSIGHTS");
  if (analysis.historyChronologyNote) {
    lines.push(`- Chronology: ${analysis.historyChronologyNote}`);
  }
  if (!analysis.historicalInsights.length) {
    lines.push("- —");
  } else {
    for (const ins of analysis.historicalInsights) {
      lines.push(`- ${ins}`);
    }
  }
  lines.push("");
  lines.push("RERUN PRIORITIES");

  const sorted = sortRerunGroups(groups, profiles);
  if (!sorted.length) {
    lines.push("(none)");
  } else {
    sorted.forEach((g, i) => {
      const p = profiles[g.key];
      lines.push(`${i + 1}) ${g.key}`);
      lines.push(`Priority: ${p?.rerunPriorityBand ?? "low"}`);
      lines.push(`Score: ${p?.rerunPriorityScore ?? 0}`);
      lines.push(`File: ${g.file}`);
      lines.push(`Project: ${g.projectName ?? "unknown"}`);
      lines.push(`Occurrences: ${g.occurrences}`);
      lines.push(`Likely Flaky: ${p?.likelyFlaky ? "yes" : "no"}`);
      lines.push(`Likely Recurring: ${p?.likelyRecurring ? "yes" : "no"}`);
      lines.push(`Seen In Prior Runs: ${p?.seenInPriorRuns ?? 0}/${p?.historyWindowSize ?? analysis.historyWindowSize}`);
      lines.push(`Last Seen Run ID: ${p?.lastSeenRunId ?? "none"}`);
      lines.push(`Consecutive Streak: ${p?.consecutiveStreak ?? 0}`);
      lines.push("Reason(s):");
      const reasons = p?.rerunPriorityReasons ?? [];
      if (!reasons.length) {
        lines.push("- —");
      } else {
        for (const r of reasons) {
          lines.push(`- ${r}`);
        }
      }
      const evLines = formatEvidenceSummaryForReport(g.evidenceSummary);
      if (evLines.length) {
        lines.push("Evidence summary:");
        for (const el of evLines) {
          lines.push(`- ${el}`);
        }
      }
      if (g.debuggingHint?.trim()) {
        lines.push(`Debugging hint: ${g.debuggingHint.trim()}`);
      }
      if (g.family) {
        lines.push(`Root-cause family: ${g.family.displayTitle}`);
        lines.push(
          `Family spread: ${g.family.seenInWindowLabel} window · ${g.family.recurrenceLine} · trend ${g.family.trendKind}`,
        );
      }
      if (g.incident) {
        lines.push(`Incident: ${g.incident.displayTitle}`);
        lines.push(
          `Fix track: ${g.incident.fixTrackPrimaryArea} / ${g.incident.fixTrackFirstStep}`,
        );
      }
      lines.push("");
    });
  }

  lines.push("UNSTABLE FILES");
  const unstableListed = analysis.unstableFiles.filter(
    (f) => f.failedInPriorRuns > 0 || f.worstFailedCount > 0 || f.instabilityScore > 0,
  );
  if (!unstableListed.length) {
    lines.push("- —");
  } else {
    for (const f of unstableListed) {
      lines.push(
        `- ${f.file}: failed in ${f.failedInPriorRuns}/${f.historyWindowSize} prior runs, instability score ${f.instabilityScore}`,
      );
    }
  }

  lines.push("");
  lines.push("NOTES");
  lines.push("- Generated from admin system test dashboard triage view");
  lines.push("- Deterministic formatting enabled");

  return lines.join("\n");
}
