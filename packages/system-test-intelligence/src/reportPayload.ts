import { isFailedStatus } from "./status.js";
import type { SystemTestCaseRowInput, SystemTestRunRowInput } from "./types.js";

/** Run row plus ingest metadata for operator-facing diagnostic text. */
export type DiagnosticReportRunInput = SystemTestRunRowInput & {
  source: string;
  branch: string | null;
  commitSha: string | null;
};

const STACK_EXCERPT_MAX_CHARS = 2400;

function formatIso(iso: string): string {
  return iso.includes("T") ? iso : new Date(iso).toISOString();
}

function artifactPaths(artifactJson: unknown): string[] {
  if (
    artifactJson == null ||
    typeof artifactJson !== "object" ||
    Array.isArray(artifactJson)
  ) {
    return [];
  }
  const o = artifactJson as Record<string, unknown>;
  const paths: string[] = [];
  for (const key of ["trace", "video", "screenshot"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) {
      paths.push(`${key}: ${v}`);
    }
  }
  return paths;
}

function stackExcerpt(stack: string | null | undefined): string {
  if (!stack?.trim()) {
    return "";
  }
  const s = stack.trim();
  if (s.length <= STACK_EXCERPT_MAX_CHARS) {
    return s;
  }
  return `${s.slice(0, STACK_EXCERPT_MAX_CHARS)}\n… (truncated)`;
}

/**
 * Plain-text diagnostic report (parity with legacy API diagnosticReport string).
 */
export function buildDiagnosticReportPlainText(
  run: DiagnosticReportRunInput,
  cases: SystemTestCaseRowInput[],
): string {
  const lines: string[] = [];

  lines.push(`Run ID: ${run.id}`);
  lines.push(`Created at: ${formatIso(run.createdAt)}`);
  lines.push(`Source: ${run.source}`);
  lines.push(`Branch: ${run.branch ?? "—"}`);
  lines.push(`Commit: ${run.commitSha ?? "—"}`);
  lines.push(`Status: ${run.status}`);
  lines.push("");
  lines.push("Totals:");
  lines.push(`  total:   ${run.totalCount}`);
  lines.push(`  passed:  ${run.passedCount}`);
  lines.push(`  failed:  ${run.failedCount}`);
  lines.push(`  skipped: ${run.skippedCount}`);
  lines.push(`  flaky:   ${run.flakyCount}`);
  if (run.durationMs != null) {
    lines.push(`  durationMs: ${run.durationMs}`);
  }
  lines.push("");

  const failed = cases.filter((c) => isFailedStatus(c.status));
  lines.push(`Failed tests (${failed.length}):`);
  lines.push("");

  if (!failed.length) {
    lines.push("  (none)");
    lines.push("");
    return lines.join("\n");
  }

  for (const c of failed) {
    lines.push(`— ${c.fullName}`);
    lines.push(`  suite:    ${c.suite}`);
    lines.push(`  file:     ${c.filePath}`);
    lines.push(`  title:    ${c.title}`);
    lines.push(`  status:   ${c.status}`);
    lines.push(`  retries:  ${c.retryCount}`);
    if (c.route) {
      lines.push(`  route:    ${c.route}`);
    }
    if (c.selector) {
      lines.push(`  selector: ${c.selector}`);
    }
    if (c.line != null || c.column != null) {
      lines.push(`  location: line ${c.line ?? "?"}, column ${c.column ?? "?"}`);
    }
    if (c.errorMessage) {
      lines.push(`  error:    ${c.errorMessage}`);
    }
    const ex = stackExcerpt(c.errorStack ?? undefined);
    if (ex) {
      lines.push("  stack excerpt:");
      for (const row of ex.split("\n")) {
        lines.push(`    ${row}`);
      }
    }
    const arts = artifactPaths(c.artifactJson);
    if (arts.length) {
      lines.push(`  artifacts:`);
      for (const a of arts) {
        lines.push(`    ${a}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}
