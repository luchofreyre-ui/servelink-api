import { fingerprintForCase, shortMessageFromCase } from "./fingerprint.js";
import { isFailedStatus } from "./status.js";
import type { GroupEvidenceSummary, IntelCase, SystemTestCaseRowInput } from "./types.js";

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

export function intelCaseFromRow(c: SystemTestCaseRowInput): IntelCase {
  return {
    filePath: c.filePath,
    suite: c.suite,
    title: c.title,
    fullName: c.fullName,
    status: c.status,
    errorMessage: c.errorMessage,
    errorStack: c.errorStack,
  };
}

export function evidenceSummaryFromRow(c: SystemTestCaseRowInput): {
  route: string | null;
  selector: string | null;
  line: number | null;
  column: number | null;
  artifactPaths: string[];
  firstErrorLine: string;
} {
  const ic = intelCaseFromRow(c);
  return {
    route: c.route,
    selector: c.selector,
    line: c.line,
    column: c.column,
    artifactPaths: artifactPaths(c.artifactJson),
    firstErrorLine: shortMessageFromCase(ic),
  };
}

export function mergeEvidenceForGroup(
  members: SystemTestCaseRowInput[],
  maxSamples = 6,
): GroupEvidenceSummary {
  const routes = new Set<string>();
  const selectors = new Set<string>();
  const artifactPaths = new Set<string>();
  const sampleLines: string[] = [];

  for (const c of members) {
    const ev = evidenceSummaryFromRow(c);
    if (ev.route) routes.add(ev.route);
    if (ev.selector) selectors.add(ev.selector);
    for (const p of ev.artifactPaths) artifactPaths.add(p);
    if (ev.firstErrorLine && !sampleLines.includes(ev.firstErrorLine)) {
      sampleLines.push(ev.firstErrorLine);
      if (sampleLines.length >= maxSamples) break;
    }
  }

  return {
    routes: [...routes].sort((a, b) => a.localeCompare(b)),
    selectors: [...selectors].sort((a, b) => a.localeCompare(b)),
    artifactPaths: [...artifactPaths].sort((a, b) => a.localeCompare(b)),
    sampleLines,
  };
}

export function casesByFingerprintKey(
  failedCases: SystemTestCaseRowInput[],
  key: string,
): SystemTestCaseRowInput[] {
  return failedCases.filter(
    (c) => fingerprintForCase(intelCaseFromRow(c)) === key,
  );
}

const STACK_PREVIEW_MAX = 480;

export function diagnosticPreviewForGroup(
  members: SystemTestCaseRowInput[],
  maxChars = STACK_PREVIEW_MAX,
): string {
  const parts: string[] = [];
  let n = 0;
  for (const c of members) {
    const line =
      c.errorMessage?.trim() ||
      (c.errorStack ? String(c.errorStack).split(/\r?\n/)[0]?.trim() : "") ||
      "";
    if (!line) continue;
    parts.push(line);
    n += line.length;
    if (n >= maxChars) break;
  }
  const joined = parts.join(" | ");
  return joined.length > maxChars ? `${joined.slice(0, maxChars)}…` : joined;
}

export function filterFailedCases(
  cases: SystemTestCaseRowInput[],
): SystemTestCaseRowInput[] {
  return cases.filter((c) => isFailedStatus(c.status));
}
