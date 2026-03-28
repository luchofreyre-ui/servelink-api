import { formatEvidenceSummaryForReport } from "@/lib/systemTests/extractSystemTestEvidence";
import type {
  SystemTestFailureEvidenceSummary,
  SystemTestFailureFamilySummary,
  SystemTestIncidentSummary,
  SystemTestReportPayload,
  SystemTestRunComparison,
} from "@/types/systemTests";

function pushCompactEvidence(lines: string[], ev: SystemTestFailureEvidenceSummary | null | undefined) {
  if (!ev) return;
  const block = formatEvidenceSummaryForReport(ev);
  if (!block.length) return;
  lines.push("Evidence summary:");
  for (const line of block) {
    lines.push(`- ${line}`);
  }
  lines.push("");
}

function pushDebuggingHint(lines: string[], hint: string | null | undefined) {
  if (!hint?.trim()) return;
  lines.push(`Debugging hint: ${hint.trim()}`);
  lines.push("");
}

function pushFamilyHints(
  lines: string[],
  family: SystemTestFailureFamilySummary | null | undefined,
) {
  if (!family) return;
  lines.push(`Family: ${family.displayTitle}`);
  lines.push(
    `Family status: ${family.status} · trend ${family.trendKind} · ${family.recurrenceLine}`,
  );
  lines.push("");
}

function pushIncidentHints(
  lines: string[],
  incident: SystemTestIncidentSummary | null | undefined,
) {
  if (!incident) return;
  lines.push(`Incident: ${incident.displayTitle}`);
  lines.push(
    `Incident severity: ${incident.severity} · trend ${incident.trendKind} · ${incident.status}`,
  );
  lines.push("");
}

function fmtPct(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

function fmtPassRateDelta(delta: number): string {
  const pct = delta * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

function dashNum(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return String(n);
}

export function buildSystemTestComparisonReportFromPayload(payload: SystemTestReportPayload): string {
  if (!payload.comparison) {
    throw new Error("buildSystemTestComparisonReportFromPayload requires comparison on the payload.");
  }
  return buildSystemTestComparisonReport(payload.comparison);
}

export function buildSystemTestComparisonReport(c: SystemTestRunComparison): string {
  const b = c.baseRun.summary;
  const t = c.targetRun.summary;
  const lines: string[] = [];

  lines.push("SYSTEM TEST COMPARISON REPORT");
  lines.push(`Base Run ID: ${b.id}`);
  lines.push(`Target Run ID: ${t.id}`);
  lines.push("");
  if (c.chronologyNote) {
    lines.push("CHRONOLOGY");
    lines.push(c.chronologyNote);
    if (c.chronologyCorrected) {
      lines.push("Runs were reordered to semantic meaning: base = older, target = newer.");
    }
    lines.push("");
  }
  lines.push("BASE SUMMARY");
  lines.push(`Status: ${b.status}`);
  lines.push(`Created At: ${b.createdAt}`);
  lines.push(`Duration Ms: ${dashNum(b.durationMs)}`);
  lines.push(`Total: ${b.totalCount}`);
  lines.push(`Passed: ${b.passedCount}`);
  lines.push(`Failed: ${b.failedCount}`);
  lines.push(`Skipped: ${b.skippedCount}`);
  lines.push(`Pass Rate: ${fmtPct(b.passRate)}`);
  lines.push("");
  lines.push("TARGET SUMMARY");
  lines.push(`Status: ${t.status}`);
  lines.push(`Created At: ${t.createdAt}`);
  lines.push(`Duration Ms: ${dashNum(t.durationMs)}`);
  lines.push(`Total: ${t.totalCount}`);
  lines.push(`Passed: ${t.passedCount}`);
  lines.push(`Failed: ${t.failedCount}`);
  lines.push(`Skipped: ${t.skippedCount}`);
  lines.push(`Pass Rate: ${fmtPct(t.passRate)}`);
  lines.push("");
  lines.push("DELTAS");
  lines.push(`Pass Rate Delta: ${fmtPassRateDelta(c.passRateDelta)}`);
  lines.push(`Failed Delta: ${c.failedDelta >= 0 ? "+" : ""}${c.failedDelta}`);
  lines.push(`Duration Delta Ms: ${c.durationDeltaMs == null ? "—" : `${c.durationDeltaMs >= 0 ? "+" : ""}${c.durationDeltaMs}`}`);
  lines.push(`New Failure Groups: ${c.newFailures.length}`);
  lines.push(`Resolved Failure Groups: ${c.resolvedFailures.length}`);
  lines.push(`Persistent Failure Groups: ${c.persistentFailures.length}`);
  lines.push("");
  lines.push("NEW FAILURES");

  if (!c.newFailures.length) {
    lines.push("(none)");
  } else {
    c.newFailures.forEach((g, i) => {
      lines.push(`${i + 1}) ${g.key}`);
      lines.push(`File: ${g.file}`);
      lines.push(`Project: ${g.projectName ?? "unknown"}`);
      lines.push(`Occurrences: ${g.targetOccurrences}`);
      lines.push("Message:");
      lines.push(g.shortMessage || "—");
      lines.push("");
      pushCompactEvidence(lines, g.evidenceSummary);
      pushDebuggingHint(lines, g.debuggingHint);
      pushFamilyHints(lines, g.family);
      pushIncidentHints(lines, g.incident);
    });
  }

  lines.push("RESOLVED FAILURES");

  if (!c.resolvedFailures.length) {
    lines.push("(none)");
  } else {
    c.resolvedFailures.forEach((g, i) => {
      lines.push(`${i + 1}) ${g.key}`);
      lines.push(`File: ${g.file}`);
      lines.push(`Project: ${g.projectName ?? "unknown"}`);
      lines.push(`Previous Occurrences: ${g.baseOccurrences}`);
      lines.push("Message:");
      lines.push(g.shortMessage || "—");
      lines.push("");
      pushCompactEvidence(lines, g.evidenceSummary);
      pushDebuggingHint(lines, g.debuggingHint);
      pushFamilyHints(lines, g.family);
      pushIncidentHints(lines, g.incident);
    });
  }

  lines.push("PERSISTENT FAILURES");

  if (!c.persistentFailures.length) {
    lines.push("(none)");
  } else {
    c.persistentFailures.forEach((g, i) => {
      lines.push(`${i + 1}) ${g.key}`);
      lines.push(`File: ${g.file}`);
      lines.push(`Project: ${g.projectName ?? "unknown"}`);
      lines.push(`Base Occurrences: ${g.baseOccurrences}`);
      lines.push(`Target Occurrences: ${g.targetOccurrences}`);
      lines.push(`Delta: ${g.deltaOccurrences >= 0 ? "+" : ""}${g.deltaOccurrences}`);
      lines.push("Message:");
      lines.push(g.shortMessage || "—");
      lines.push("");
      pushCompactEvidence(lines, g.evidenceSummary);
      pushDebuggingHint(lines, g.debuggingHint);
      pushFamilyHints(lines, g.family);
      pushIncidentHints(lines, g.incident);
    });
  }

  lines.push("FILE HEALTH CHANGES");
  for (const r of c.fileHealthChanges) {
    lines.push(
      `- ${r.file}: failed ${r.baseFailedCount} -> ${r.targetFailedCount}, pass rate ${fmtPct(r.basePassRate)} -> ${fmtPct(r.targetPassRate)}, trend ${r.trend}`,
    );
  }
  if (!c.fileHealthChanges.length) {
    lines.push("- —");
  }
  lines.push("");
  lines.push("OPERATOR INSIGHTS");
  if (!c.operatorInsights.length) {
    lines.push("- —");
  } else {
    for (const ins of c.operatorInsights) {
      lines.push(`- ${ins}`);
    }
  }
  lines.push("");
  lines.push("NOTES");
  lines.push("- Generated from admin system test dashboard compare view");
  lines.push("- Deterministic formatting enabled");

  return lines.join("\n");
}
