import { isFailedStatus } from "./status.js";
import type { FailureGroup, IntelCase } from "./types.js";

export function rerunScoreForGroup(
  g: FailureGroup,
  priorKeys: Set<string>,
  immediatePriorOcc: Map<string, number>,
  fileFailedDelta: Map<string, number>,
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const priorOcc = immediatePriorOcc.get(g.key) ?? 0;

  if (!priorKeys.has(g.key)) {
    score += 30;
    reasons.push("New failure fingerprint vs immediate prior run (+30).");
  }
  if (priorOcc > 0 && g.occurrences > priorOcc) {
    score += 20;
    reasons.push("Occurrences increased vs immediate prior (+20).");
  }
  if (g.occurrences >= 2) {
    score += 10;
    reasons.push("Multiple failing cases in this group (+10).");
  }
  const fd = fileFailedDelta.get(g.file) ?? 0;
  if (fd >= 2) {
    score += 15;
    reasons.push("Broad file regression (+15).");
  }
  return { score, reasons };
}

export function buildImmediatePriorMaps(
  currentGroups: FailureGroup[],
  priorGroups: FailureGroup[],
): { priorKeys: Set<string>; immediatePriorOcc: Map<string, number> } {
  const priorKeys = new Set(priorGroups.map((g) => g.key));
  const immediatePriorOcc = new Map<string, number>();
  for (const g of priorGroups) {
    immediatePriorOcc.set(g.key, g.occurrences);
  }
  return { priorKeys, immediatePriorOcc };
}

export function fileFailedDeltaMap(
  currentCases: IntelCase[],
  priorCases: IntelCase[],
): Map<string, number> {
  const countFailed = (cases: IntelCase[]) => {
    const m = new Map<string, number>();
    for (const c of cases) {
      if (!isFailedStatus(c.status)) continue;
      const f = c.filePath || "unknown";
      m.set(f, (m.get(f) ?? 0) + 1);
    }
    return m;
  };
  const cur = countFailed(currentCases);
  const pr = countFailed(priorCases);
  const files = new Set([...cur.keys(), ...pr.keys()]);
  const out = new Map<string, number>();
  for (const f of files) {
    out.set(f, (cur.get(f) ?? 0) - (pr.get(f) ?? 0));
  }
  return out;
}

export function unstableFilesFromRuns(
  runCases: IntelCase[][],
  maxFiles = 8,
): Array<{ file: string; failedRunsInWindow: number; windowSize: number }> {
  const windowSize = runCases.length;
  const fileFailCounts = new Map<string, number>();

  for (const cases of runCases) {
    const failedFiles = new Set<string>();
    for (const c of cases) {
      if (isFailedStatus(c.status)) failedFiles.add(c.filePath || "unknown");
    }
    for (const f of failedFiles) {
      fileFailCounts.set(f, (fileFailCounts.get(f) ?? 0) + 1);
    }
  }

  return [...fileFailCounts.entries()]
    .map(([file, failedRunsInWindow]) => ({ file, failedRunsInWindow, windowSize }))
    .sort((a, b) => {
      if (b.failedRunsInWindow !== a.failedRunsInWindow)
        return b.failedRunsInWindow - a.failedRunsInWindow;
      return a.file.localeCompare(b.file);
    })
    .slice(0, maxFiles);
}

export function stableFileSharpRegression(
  baseCases: IntelCase[],
  targetCases: IntelCase[],
): boolean {
  const failedByFile = (cases: IntelCase[]) => {
    const m = new Map<string, number>();
    for (const c of cases) {
      if (!isFailedStatus(c.status)) continue;
      const f = c.filePath || "unknown";
      m.set(f, (m.get(f) ?? 0) + 1);
    }
    return m;
  };
  const b = failedByFile(baseCases);
  const t = failedByFile(targetCases);
  for (const [file, tc] of t) {
    const bc = b.get(file) ?? 0;
    if (bc === 0 && tc >= 2) return true;
    if (tc - bc >= 2) return true;
  }
  return false;
}
