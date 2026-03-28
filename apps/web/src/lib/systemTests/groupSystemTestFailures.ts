import {
  fingerprintForCase as canonicalFingerprintForCase,
  groupFailures as canonicalGroupFailures,
  normalizeMessageForFingerprint,
  type IntelCase,
} from "@servelink/system-test-intelligence";

import { isFailedCaseStatus } from "@/lib/system-tests/shared";
import {
  extractDiagnosticPreviewFromCase,
  extractSystemTestEvidenceFromCase,
  mergeEvidenceSummaries,
} from "@/lib/systemTests/extractSystemTestEvidence";
import type {
  SystemTestCaseResult,
  SystemTestFailureEvidenceSummary,
  SystemTestFailureGroup,
} from "@/types/systemTests";

/** Re-export for callers that need the same normalization as the canonical engine. */
export { normalizeMessageForFingerprint };

function normalizeWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function firstMeaningfulMessageLine(message: string | null | undefined): string {
  if (!message) return "";
  const lines = message.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines[0] ? normalizeWhitespace(lines[0]) : "";
}

/** UI-oriented short line (evidence extractors); grouping keys use the shared package. */
export function shortMessageFromCase(c: SystemTestCaseResult): string {
  const ev = extractSystemTestEvidenceFromCase(c);
  if (ev.messageLine) return ev.messageLine;
  return firstMeaningfulMessageLine(c.errorStack);
}

function toIntelCase(c: SystemTestCaseResult): IntelCase {
  return {
    filePath: c.filePath,
    suite: c.suite ?? "",
    title: c.title,
    fullName: c.fullName,
    status: c.status,
    errorMessage: c.errorMessage ?? null,
    errorStack: c.errorStack ?? null,
    fingerprint: (c as { fingerprint?: string }).fingerprint ?? null,
  };
}

function evidenceLinesFromSummary(summary: SystemTestFailureEvidenceSummary): string[] {
  const lines: string[] = [];
  if (summary.assertionLine) lines.push(summary.assertionLine);
  else if (summary.messageLine) lines.push(summary.messageLine);
  if (summary.locationLine) lines.push(summary.locationLine);
  for (const d of summary.diagnosticLines) {
    if (lines.length >= 2) break;
    lines.push(d);
  }
  return lines.slice(0, 2);
}

export function groupSystemTestFailures(cases: SystemTestCaseResult[]): SystemTestFailureGroup[] {
  const canon = canonicalGroupFailures(cases.map(toIntelCase));
  const failed = cases.filter((c) => isFailedCaseStatus(c.status));

  return canon.map((g) => {
    const members = failed.filter(
      (c) => canonicalFingerprintForCase(toIntelCase(c)) === g.key,
    );
    const first = members[0];
    if (!first) {
      return {
        key: g.key,
        fingerprint: g.key,
        file: g.file,
        projectName: null,
        title: g.title,
        shortMessage: g.shortMessage,
        fullMessage: null,
        finalStatus: null,
        occurrences: g.occurrences,
        testTitles: g.testTitles,
        evidenceLines: [],
        evidenceSummary: {
          messageLine: null,
          assertionLine: null,
          locationLine: null,
          diagnosticLines: [],
        },
        diagnosticPreview: null,
      };
    }

    const file = first.filePath || "unknown";
    const projectName = first.suite?.trim() ? first.suite.trim() : null;
    const title = first.title?.trim() || first.fullName?.trim() || g.title;
    let evidenceSummary = extractSystemTestEvidenceFromCase(first);
    let diagnosticPreview = extractDiagnosticPreviewFromCase(first);
    const testTitles = new Set<string>(g.testTitles);

    for (const c of members.slice(1)) {
      evidenceSummary = mergeEvidenceSummaries([
        evidenceSummary,
        extractSystemTestEvidenceFromCase(c),
      ]);
      const label = c.fullName?.trim() || c.title?.trim() || title;
      testTitles.add(label);
      if (!diagnosticPreview) {
        diagnosticPreview = extractDiagnosticPreviewFromCase(c);
      }
    }

    const last = members[members.length - 1]!;

    return {
      key: g.key,
      fingerprint: g.key,
      file,
      projectName,
      title,
      shortMessage: shortMessageFromCase(first),
      fullMessage: first.errorMessage ?? null,
      finalStatus: last.status,
      occurrences: g.occurrences,
      testTitles: [...testTitles].sort((a, b) => a.localeCompare(b)),
      evidenceLines: evidenceLinesFromSummary(evidenceSummary),
      evidenceSummary,
      diagnosticPreview,
    };
  });
}
