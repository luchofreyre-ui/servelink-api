import type { SystemTestCaseResult, SystemTestFailureEvidenceSummary } from "@/types/systemTests";

const ASSERTION_LIKE =
  /Expected:|Received:|Timed out|strict mode|locator|toBeVisible|toHaveText|toEqual|toContain|toMatch|AssertionError|expect\(|Error: expect/i;

const FILE_LOCATION = /\.(?:tsx?|jsx?|mjs|cjs|vue|svelte|cts|mts)(?::\d+){1,2}\b/;

const AT_STACK = /^\s*at\s+.+\([^)]+\)/;

function normWs(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function linesFrom(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => normWs(l))
    .filter(Boolean);
}

function readArtifactStrings(c: SystemTestCaseResult): string[] {
  const raw = (c as { artifact?: unknown; artifacts?: unknown }).artifact;
  const rawArr = (c as { artifacts?: unknown }).artifacts;
  const out: string[] = [];

  const pushFromUnknown = (v: unknown) => {
    if (typeof v === "string" && v.trim()) {
      out.push(v.trim());
      return;
    }
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      for (const k of ["stderr", "stdout", "message", "text", "body"]) {
        const x = o[k];
        if (typeof x === "string" && x.trim()) out.push(x.trim());
      }
      const msgs = o.messages;
      if (Array.isArray(msgs)) {
        for (const m of msgs) {
          if (typeof m === "string" && m.trim()) out.push(m.trim());
        }
      }
    }
  };

  pushFromUnknown(raw);
  if (Array.isArray(rawArr)) {
    for (const a of rawArr) pushFromUnknown(a);
  }

  return out;
}

function isLikelyStackFrame(line: string): boolean {
  return AT_STACK.test(line) || /^\s*at\s/.test(line);
}

function isDiagnosticCandidate(line: string, skip: Set<string>): boolean {
  if (skip.has(line)) return false;
  if (line.length > 220) return false;
  if (/^(Caused by|Timeout|Warning|Retry|Screenshot|Attachment|HTTP|ECONN)/i.test(line)) return true;
  if (/Error:/i.test(line) && !ASSERTION_LIKE.test(line)) return true;
  return false;
}

/** Deterministic evidence for one case; caps per-case diagnostics before group merge. */
export function extractSystemTestEvidenceFromCase(c: SystemTestCaseResult): SystemTestFailureEvidenceSummary {
  const msg = (c.errorMessage ?? "").trim();
  const stack = (c.errorStack ?? "").trim();
  const msgLines = linesFrom(msg);
  const stackLines = linesFrom(stack);
  const artifactChunks = readArtifactStrings(c).flatMap((s) => linesFrom(s));

  const allLines = [...msgLines, ...stackLines, ...artifactChunks];

  const messageLine =
    msgLines[0] ??
    stackLines.find((l) => !isLikelyStackFrame(l) && !FILE_LOCATION.test(l)) ??
    stackLines[0] ??
    null;

  const assertionLine = allLines.find((l) => ASSERTION_LIKE.test(l)) ?? null;

  let locationLine: string | null = null;
  if (c.filePath?.trim() && c.line != null && Number.isFinite(c.line)) {
    const fp = c.filePath.trim();
    const col = c.column != null && Number.isFinite(c.column) ? `:${c.column}` : "";
    locationLine = normWs(`${fp}:${c.line}${col}`);
  }
  if (!locationLine) {
    locationLine =
      allLines.find((l) => FILE_LOCATION.test(l) || (isLikelyStackFrame(l) && FILE_LOCATION.test(l))) ?? null;
  }

  const skip = new Set([messageLine, assertionLine, locationLine].filter(Boolean) as string[]);
  const diagnosticLines: string[] = [];
  let stackFramesSeen = 0;

  for (const line of allLines) {
    if (diagnosticLines.length >= 4) break;
    if (skip.has(line)) continue;
    if (isLikelyStackFrame(line)) {
      stackFramesSeen += 1;
      if (stackFramesSeen > 1) continue;
      if (FILE_LOCATION.test(line) && !locationLine) {
        /* keep location in locationLine only */
      }
      continue;
    }
    if (isDiagnosticCandidate(line, skip)) {
      diagnosticLines.push(line);
      skip.add(line);
    }
  }

  if (diagnosticLines.length < 4) {
    for (const line of allLines) {
      if (diagnosticLines.length >= 4) break;
      if (skip.has(line)) continue;
      if (isLikelyStackFrame(line)) continue;
      if (line === messageLine || line === assertionLine) continue;
      diagnosticLines.push(line.length > 200 ? `${line.slice(0, 197)}…` : line);
      skip.add(line);
    }
  }

  return {
    messageLine: messageLine ? normWs(messageLine) : null,
    assertionLine: assertionLine ? normWs(assertionLine) : null,
    locationLine: locationLine ? normWs(locationLine) : null,
    diagnosticLines: diagnosticLines.slice(0, 4).map((l) => (l.length > 200 ? `${l.slice(0, 197)}…` : l)),
  };
}

export function mergeEvidenceSummaries(summaries: SystemTestFailureEvidenceSummary[]): SystemTestFailureEvidenceSummary {
  let messageLine: string | null = null;
  let assertionLine: string | null = null;
  let locationLine: string | null = null;
  const seen = new Set<string>();
  const diagnosticLines: string[] = [];

  for (const s of summaries) {
    if (!messageLine && s.messageLine) messageLine = s.messageLine;
    if (!assertionLine && s.assertionLine) assertionLine = s.assertionLine;
    if (!locationLine && s.locationLine) locationLine = s.locationLine;
    for (const d of s.diagnosticLines) {
      const n = normWs(d);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      if (diagnosticLines.length < 4) diagnosticLines.push(n);
    }
  }

  return { messageLine, assertionLine, locationLine, diagnosticLines };
}

/** First raw message lines after the headline (compact preview, max 3 lines). */
export function extractDiagnosticPreviewFromCase(c: SystemTestCaseResult): string | null {
  const msg = (c.errorMessage ?? "").trim();
  if (!msg) return null;
  const msgLines = linesFrom(msg);
  if (msgLines.length <= 1) return null;
  const rest = msgLines.slice(1, 4);
  if (!rest.length) return null;
  return rest.join("\n");
}

/** Lines appended to deterministic text reports under "EVIDENCE SUMMARY". */
export function formatEvidenceSummaryForReport(ev: SystemTestFailureEvidenceSummary): string[] {
  const lines: string[] = [];
  if (ev.assertionLine) lines.push(`Assertion / error: ${ev.assertionLine}`);
  if (ev.locationLine) lines.push(`Location: ${ev.locationLine}`);
  for (const d of ev.diagnosticLines) {
    lines.push(`Diagnostic: ${d}`);
  }
  return lines.slice(0, 5);
}
