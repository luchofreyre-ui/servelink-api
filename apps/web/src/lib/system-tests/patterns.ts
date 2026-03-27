import type {
  SystemTestCaseResult,
  SystemTestRunDetailResponse,
  SystemTestsFailurePattern,
  SystemTestsFailurePatternSeverity,
  SystemTestsPatternCategory,
} from "@/types/systemTests";
import { sortPatternsByImpact } from "./prioritization";
import { isFailedCaseStatus, stableCaseKey } from "./shared";

const DEFAULT_MAX_RUNS = 12;
const MAX_AFFECTED_CASES = 12;
const MAX_EXAMPLES = 4;

function collapseWs(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Normalize dynamic fragments for clustering. */
export function normalizeFailureSignature(raw: string | null | undefined): string {
  if (raw == null) return "";
  let s = collapseWs(raw);
  if (!s) return "";
  s = s.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "<uuid>");
  s = s.replace(/\b[0-9a-f]{24,}\b/gi, "<id>");
  s = s.replace(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/g, "<ts>");
  s = s.replace(/\b\d{10,15}\b/g, "<n>");
  s = s.replace(/\b\d+(?:\.\d+)?ms\b/gi, "<dur>");
  s = s.replace(/\b\d+(?:\.\d+)?s\b/gi, "<dur>");
  s = s.replace(/[?&][^=\s]+=[^&\s]*/g, "<q>");
  s = s.replace(/\/[^\s]+/g, "<path>");
  s = s.replace(/\(\d+:\d+\)/g, "(<loc>)");
  return collapseWs(s);
}

function firstMeaningfulStackLine(stack: string | null | undefined): string {
  if (!stack) return "";
  const lines = stack.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/at\s/i.test(line) || /\.(spec|test)\./i.test(line) || /playwright/i.test(line)) {
      return collapseWs(line.slice(0, 220));
    }
  }
  return collapseWs((lines[0] ?? "").slice(0, 220));
}

/** Stable category for grouping similar failures (timeouts, nav, auth, etc.). */
export function classifyFailureCategory(
  message: string,
  stack: string | null | undefined,
): SystemTestsPatternCategory {
  const t = `${message}\n${stack ?? ""}`.toLowerCase();
  if (/\b401\b|unauthorized|not authenticated|session expired|invalid.*token|jwt|csrf/.test(t)) return "auth";
  if (/\b403\b|forbidden/.test(t)) return "api";
  if (/\b5\d{2}\b|internal server|server error|bad gateway|service unavailable/.test(t)) return "api";
  if (/timeout|timed out|time ?out|exceeded|navigation|waiting for|page\.goto|locator\.waitfor/.test(t))
    return "navigation";
  if (/not visible|not attached|not found|locator|strict mode violation|expect\s*\(|received|to match|to equal|to contain|assertion/.test(t))
    return "assertion";
  if (/layout|viewport|overflow|render|hydration|cls/.test(t)) return "rendering";
  if (/seed|fixture|scenario|test data|missing user|not found in db|prisma|foreign key/.test(t)) return "data/seed";
  if (/net::|failed to fetch|econnrefused|network|socket|dns/.test(t)) return "api";
  return "unknown";
}

export function patternCategoryDisplayLabel(category: SystemTestsPatternCategory): string {
  switch (category) {
    case "auth":
      return "Authentication / session";
    case "navigation":
      return "Navigation / timeout";
    case "api":
      return "API / network error";
    case "assertion":
      return "Assertion / locator";
    case "rendering":
      return "Rendering / layout";
    case "data/seed":
      return "Data / seed / fixture";
    default:
      return "Unknown error type";
  }
}

/** @deprecated Prefer classifyFailureCategory + patternCategoryDisplayLabel */
export function classifyFailureLabel(message: string, stack: string | null | undefined): string {
  return patternCategoryDisplayLabel(classifyFailureCategory(message, stack));
}

function patternKeyFromCase(c: SystemTestCaseResult): {
  key: string;
  sig: string;
  label: string;
  patternCategory: SystemTestsPatternCategory;
} {
  const msg = c.errorMessage?.trim() ?? "";
  const normMsg = normalizeFailureSignature(msg);
  const stackLine = firstMeaningfulStackLine(c.errorStack);
  const normStack = normalizeFailureSignature(stackLine);
  const patternCategory = classifyFailureCategory(msg, c.errorStack);
  const label = patternCategoryDisplayLabel(patternCategory);

  let sig = normMsg;
  if (sig.length < 12 && normStack) sig = normStack;
  if (sig.length < 8) {
    const fp = c.filePath?.trim() ?? "";
    sig = `file:${fp}:${c.title ?? ""}`;
  }

  const key =
    collapseWs(`${patternCategory}::${sig}`).slice(0, 400) || `unknown::${stableCaseKey(c)}`;
  return { key, sig: sig.slice(0, 320), label, patternCategory };
}

/**
 * Cluster failures across recent runs (newest-weighted for latestRunCount).
 */
export function buildFailurePatterns(
  details: SystemTestRunDetailResponse[],
  options?: { maxRuns?: number },
): SystemTestsFailurePattern[] {
  const maxRuns = Math.max(1, options?.maxRuns ?? DEFAULT_MAX_RUNS);
  const slice = details.slice(0, maxRuns);
  const sortedDesc = [...slice].sort(
    (a, b) => new Date(b.run.createdAt).getTime() - new Date(a.run.createdAt).getTime(),
  );
  const latestId = sortedDesc[0]?.run.id;

  type Acc = {
    label: string;
    patternCategory: SystemTestsPatternCategory;
    signature: string;
    count: number;
    latestRunCount: number;
    caseKeys: Set<string>;
    files: Set<string>;
    examples: string[];
  };

  const map = new Map<string, Acc>();

  for (const d of sortedDesc) {
    const isLatest = d.run.id === latestId;
    for (const c of d.cases) {
      if (!isFailedCaseStatus(c.status)) continue;
      const { key, sig, label, patternCategory } = patternKeyFromCase(c);
      const ck = stableCaseKey(c);
      const cur =
        map.get(key) ??
        ({
          label,
          patternCategory,
          signature: sig,
          count: 0,
          latestRunCount: 0,
          caseKeys: new Set<string>(),
          files: new Set<string>(),
          examples: [] as string[],
        } satisfies Acc);
      cur.count++;
      if (isLatest) cur.latestRunCount++;
      cur.caseKeys.add(ck);
      if (c.filePath?.trim()) cur.files.add(c.filePath.trim());
      const ex = c.errorMessage?.trim();
      if (ex && cur.examples.length < MAX_EXAMPLES && !cur.examples.includes(ex)) {
        cur.examples.push(ex.slice(0, 280));
      }
      map.set(key, cur);
    }
  }

  const patterns: SystemTestsFailurePattern[] = [];

  for (const [patternKey, acc] of map) {
    const fileCount = acc.files.size;
    const caseSpread = acc.caseKeys.size;
    let severity: SystemTestsFailurePatternSeverity = "low";
    if (acc.latestRunCount >= 3 || (fileCount >= 3 && acc.count >= 5)) severity = "high";
    else if (acc.latestRunCount >= 2 || fileCount >= 2 || acc.count >= 4 || caseSpread >= 4)
      severity = "medium";

    patterns.push({
      patternKey,
      label: acc.label,
      patternCategory: acc.patternCategory,
      count: acc.count,
      latestRunCount: acc.latestRunCount,
      affectedCases: [...acc.caseKeys].slice(0, MAX_AFFECTED_CASES),
      affectedFiles: [...acc.files].sort().slice(0, 20),
      signature: acc.signature,
      examples: acc.examples,
      severity,
    });
  }

  return sortPatternsByImpact(patterns);
}
