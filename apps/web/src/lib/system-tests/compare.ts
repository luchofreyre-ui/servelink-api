import type {
  SystemTestCaseResult,
  SystemTestRunDetailResponse,
  SystemTestsCompareCaseFlakyHint,
  SystemTestsCompareIntelligence,
  SystemTestsDurationRegression,
  SystemTestsHistoricalCaseRef,
  SystemTestsHistoricalChanges,
  SystemTestsFlakyCaseRow,
} from "@/types/systemTests";
import {
  isFailedCaseStatus,
  isPassedCaseStatus,
  stableCaseKey,
} from "./shared";
import { buildFlakyCaseAnalysis } from "./flaky";

function caseMap(cases: SystemTestCaseResult[]): Map<string, SystemTestCaseResult> {
  const m = new Map<string, SystemTestCaseResult>();
  for (const c of cases) {
    const k = stableCaseKey(c);
    if (!m.has(k)) m.set(k, c);
  }
  return m;
}

/**
 * Compare chronologically adjacent runs (second-to-last → latest) inside the window,
 * plus window-level persistent / duration signals.
 */
export function buildHistoricalChanges(
  details: SystemTestRunDetailResponse[],
  options?: { maxRuns?: number },
): SystemTestsHistoricalChanges | null {
  const maxRuns = Math.max(2, options?.maxRuns ?? 12);
  const slice = details.slice(0, maxRuns);
  const asc = [...slice].sort(
    (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
  );
  if (asc.length < 2) {
    return {
      newRegressions: [],
      resolvedFailures: [],
      persistentFailures: [],
      newPasses: [],
      addedCases: [],
      removedCases: [],
      slowestRegressions: [],
      biggestDurationDeltas: [],
    };
  }

  const prev = asc[asc.length - 2];
  const latest = asc[asc.length - 1];
  const prevMap = caseMap(prev.cases);
  const latestMap = caseMap(latest.cases);

  const newRegressions: SystemTestsHistoricalCaseRef[] = [];
  const resolvedFailures: SystemTestsHistoricalCaseRef[] = [];
  const newPasses: SystemTestsHistoricalCaseRef[] = [];
  const addedCases: SystemTestsHistoricalCaseRef[] = [];
  const removedCases: SystemTestsHistoricalCaseRef[] = [];

  for (const [k, lc] of latestMap) {
    const pc = prevMap.get(k);
    const lf = isFailedCaseStatus(lc.status);
    const lp = isPassedCaseStatus(lc.status);
    const pf = pc ? isFailedCaseStatus(pc.status) : false;
    const pp = pc ? isPassedCaseStatus(pc.status) : false;

    if (!pc) {
      addedCases.push({
        caseKey: k,
        title: lc.title,
        filePath: lc.filePath,
      });
      continue;
    }
    if (lf && pp) {
      newRegressions.push({
        caseKey: k,
        title: lc.title,
        filePath: lc.filePath,
        detail: lc.errorMessage?.slice(0, 200) ?? undefined,
      });
    }
    if (pf && lp) {
      resolvedFailures.push({
        caseKey: k,
        title: lc.title,
        filePath: lc.filePath,
      });
    }
    if (lp && pf) {
      newPasses.push({
        caseKey: k,
        title: lc.title,
        filePath: lc.filePath,
      });
    }
  }

  for (const [k, pc] of prevMap) {
    if (!latestMap.has(k)) {
      removedCases.push({
        caseKey: k,
        title: pc.title,
        filePath: pc.filePath,
      });
    }
  }

  const failCounts = new Map<string, number>();
  for (const run of asc) {
    for (const c of run.cases) {
      if (!isFailedCaseStatus(c.status)) continue;
      const k = stableCaseKey(c);
      failCounts.set(k, (failCounts.get(k) ?? 0) + 1);
    }
  }

  const persistentFailures: SystemTestsHistoricalCaseRef[] = [];
  for (const [k, lc] of latestMap) {
    if (!isFailedCaseStatus(lc.status)) continue;
    const n = failCounts.get(k) ?? 0;
    if (n >= 2) {
      persistentFailures.push({
        caseKey: k,
        title: lc.title,
        filePath: lc.filePath,
        detail: `${n} failing observations in window`,
      });
    }
  }

  const durationRows: SystemTestsDurationRegression[] = [];
  for (const [k, lc] of latestMap) {
    const pc = prevMap.get(k);
    if (!pc) continue;
    const a = pc.durationMs;
    const b = lc.durationMs;
    if (a == null || b == null) continue;
    const delta = b - a;
    if (delta > 0) {
      durationRows.push({
        caseKey: k,
        title: lc.title,
        filePath: lc.filePath,
        previousDurationMs: a,
        latestDurationMs: b,
        deltaMs: delta,
      });
    }
  }

  durationRows.sort((x, y) => y.deltaMs - x.deltaMs);
  const slowestRegressions = durationRows
    .filter((r) => r.deltaMs >= 500 && (r.latestDurationMs ?? 0) >= (r.previousDurationMs ?? 0) * 1.25)
    .slice(0, 20);
  const biggestDurationDeltas = durationRows.slice(0, 20);

  return {
    newRegressions,
    resolvedFailures,
    persistentFailures,
    newPasses,
    addedCases,
    removedCases,
    slowestRegressions,
    biggestDurationDeltas,
  };
}

function refFromCase(c: SystemTestCaseResult): SystemTestsHistoricalCaseRef {
  return {
    caseKey: stableCaseKey(c),
    title: c.title,
    filePath: c.filePath,
    detail: c.errorMessage?.slice(0, 200) ?? undefined,
  };
}

/**
 * Run-to-run intelligence: base = older, target = newer (same convention as API compare).
 */
export function buildCompareRunIntelligence(
  baseDetail: SystemTestRunDetailResponse,
  targetDetail: SystemTestRunDetailResponse,
  recentContext?: SystemTestRunDetailResponse[],
): SystemTestsCompareIntelligence {
  const baseMap = caseMap(baseDetail.cases);
  const targetMap = caseMap(targetDetail.cases);

  const newRegressions: SystemTestsHistoricalCaseRef[] = [];
  const resolvedFailures: SystemTestsHistoricalCaseRef[] = [];
  const persistentFailures: SystemTestsHistoricalCaseRef[] = [];
  const newPasses: SystemTestsHistoricalCaseRef[] = [];
  const addedCases: SystemTestsHistoricalCaseRef[] = [];
  const removedCases: SystemTestsHistoricalCaseRef[] = [];

  for (const [k, tc] of targetMap) {
    const bc = baseMap.get(k);
    if (!bc) {
      addedCases.push(refFromCase(tc));
      continue;
    }
    const tf = isFailedCaseStatus(tc.status);
    const tb = isPassedCaseStatus(tc.status);
    const bf = isFailedCaseStatus(bc.status);
    const bp = isPassedCaseStatus(bc.status);
    if (tf && bp) newRegressions.push(refFromCase(tc));
    if (bf && tb) resolvedFailures.push(refFromCase(tc));
    if (tf && bf) persistentFailures.push({ ...refFromCase(tc), detail: "Failed in both base and target" });
    if (tb && bf) newPasses.push(refFromCase(tc));
  }
  for (const [k, bc] of baseMap) {
    if (!targetMap.has(k)) removedCases.push(refFromCase(bc));
  }

  const durationRows: SystemTestsDurationRegression[] = [];
  for (const [k, tc] of targetMap) {
    const bc = baseMap.get(k);
    if (!bc) continue;
    if (bc.durationMs == null || tc.durationMs == null) continue;
    const delta = tc.durationMs - bc.durationMs;
    if (delta > 0) {
      durationRows.push({
        caseKey: k,
        title: tc.title,
        filePath: tc.filePath,
        previousDurationMs: bc.durationMs,
        latestDurationMs: tc.durationMs,
        deltaMs: delta,
      });
    }
  }
  durationRows.sort((a, b) => b.deltaMs - a.deltaMs);
  const biggestDurationDeltas = durationRows.slice(0, 20);
  const slowestRegressions = durationRows
    .filter((r) => r.deltaMs >= 400 && (r.latestDurationMs ?? 0) >= (r.previousDurationMs ?? 0) * 1.2)
    .slice(0, 15);

  const flakyRows: SystemTestsFlakyCaseRow[] = recentContext?.length
    ? buildFlakyCaseAnalysis(recentContext, { maxRuns: 12 })
    : [];

  const flakyByKey = new Map(flakyRows.map((r) => [r.caseKey, r]));

  const changedFailureKeys = new Set<string>();
  for (const r of newRegressions) changedFailureKeys.add(r.caseKey);
  for (const r of persistentFailures) changedFailureKeys.add(r.caseKey);

  const flakyHintsForChangedFailures: SystemTestsCompareCaseFlakyHint[] = [];
  for (const k of changedFailureKeys) {
    const row = flakyByKey.get(k);
    flakyHintsForChangedFailures.push({
      caseKey: k,
      historicallyFlaky: row != null && (row.transitionCount >= 2 || row.flakyScore >= 6),
      flakyScore: row?.flakyScore ?? null,
      transitionCount: row?.transitionCount ?? null,
    });
  }
  flakyHintsForChangedFailures.sort((a, b) => (b.flakyScore ?? 0) - (a.flakyScore ?? 0));

  return {
    newRegressions,
    resolvedFailures,
    persistentFailures,
    newPasses,
    addedCases,
    removedCases,
    slowestRegressions,
    biggestDurationDeltas,
    flakyHintsForChangedFailures,
  };
}
