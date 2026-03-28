import { normalizeSystemTestRunDetail } from "@/lib/systemTests/normalizeSystemTestRun";
import { sortSystemTestDetailResponsesNewestFirst } from "@/lib/systemTests/sortSystemTestRuns";
import type {
  SystemTestFailureGroup,
  SystemTestFailureHistoryProfile,
  SystemTestFileHistoryProfile,
  SystemTestHistoricalAnalysis,
  SystemTestRunDetail,
  SystemTestRunDetailResponse,
} from "@/types/systemTests";

const MAX_PRIOR_RUNS = 9;

function specFailedByFile(detail: SystemTestRunDetail): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of detail.specs) {
    m.set(s.file, s.failedCount);
  }
  return m;
}

function groupOccMap(detail: SystemTestRunDetail): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of detail.failureGroups) {
    m.set(g.key, g.occurrences);
  }
  return m;
}

function hasFailureKey(detail: SystemTestRunDetail, key: string): boolean {
  return detail.failureGroups.some((g) => g.key === key);
}

/** Prior runs only, newest-first (same order as input). */
function consecutiveStreakFromCurrent(
  current: SystemTestRunDetail,
  priorsNewestFirst: SystemTestRunDetail[],
  key: string,
): number {
  if (!hasFailureKey(current, key)) return 0;
  let streak = 1;
  for (const p of priorsNewestFirst) {
    if (hasFailureKey(p, key)) streak += 1;
    else break;
  }
  return streak;
}

function intermittentTransitions(priorsOldestFirst: SystemTestRunDetail[], key: string): number {
  if (priorsOldestFirst.length < 2) return 0;
  let t = 0;
  let prev = hasFailureKey(priorsOldestFirst[0], key);
  for (let i = 1; i < priorsOldestFirst.length; i++) {
    const cur = hasFailureKey(priorsOldestFirst[i], key);
    if (cur !== prev) t += 1;
    prev = cur;
  }
  return t;
}

function lastSeenPriorRunId(priorsNewestFirst: SystemTestRunDetail[], key: string): string | null {
  for (const p of priorsNewestFirst) {
    if (hasFailureKey(p, key)) return p.summary.id;
  }
  return null;
}

function seenInPriorRunsCount(priorsNewestFirst: SystemTestRunDetail[], key: string): number {
  let n = 0;
  for (const p of priorsNewestFirst) {
    if (hasFailureKey(p, key)) n += 1;
  }
  return n;
}

function broadFileRegression(
  current: SystemTestRunDetail,
  immediatePrior: SystemTestRunDetail | null,
  file: string,
): boolean {
  if (!immediatePrior) return false;
  const cf = specFailedByFile(current);
  const pf = specFailedByFile(immediatePrior);
  const c = cf.get(file) ?? 0;
  const p = pf.get(file) ?? 0;
  return c - p >= 2;
}

function fileFailedDelta(current: SystemTestRunDetail, immediatePrior: SystemTestRunDetail | null, file: string): number {
  if (!immediatePrior) return 0;
  const cf = specFailedByFile(current);
  const pf = specFailedByFile(immediatePrior);
  return (cf.get(file) ?? 0) - (pf.get(file) ?? 0);
}

function groupsInFile(g: SystemTestFailureGroup[], file: string): number {
  return g.filter((x) => x.file === file).length;
}

function buildFileProfiles(
  current: SystemTestRunDetail,
  priorsNewestFirst: SystemTestRunDetail[],
): SystemTestFileHistoryProfile[] {
  const files = new Set<string>();
  for (const s of current.specs) files.add(s.file);
  for (const p of priorsNewestFirst) {
    for (const s of p.specs) files.add(s.file);
  }

  const historyWindowSize = priorsNewestFirst.length;
  const priorsOldestFirst = [...priorsNewestFirst].reverse();
  const rows: SystemTestFileHistoryProfile[] = [];

  for (const file of [...files].sort((a, b) => a.localeCompare(b))) {
    const failedCounts: number[] = [];
    let failedInPriorRuns = 0;
    for (const p of priorsNewestFirst) {
      const m = specFailedByFile(p);
      const fc = m.get(file) ?? 0;
      failedCounts.push(fc);
      if (fc > 0) failedInPriorRuns += 1;
    }
    const sum = failedCounts.reduce((a, b) => a + b, 0);
    const averageFailedCount = historyWindowSize > 0 ? sum / historyWindowSize : 0;
    const worstFailedCount = historyWindowSize > 0 ? Math.max(0, ...failedCounts) : 0;
    const instabilityScore = Math.round(
      failedInPriorRuns * 15 + worstFailedCount * 8 + averageFailedCount * 10,
    );

    let trend: SystemTestFileHistoryProfile["trend"] = "stable";
    if (historyWindowSize >= 4) {
      const mid = Math.floor(failedCounts.length / 2);
      const older = failedCounts.slice(mid);
      const newer = failedCounts.slice(0, mid);
      const oAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const nAvg = newer.reduce((a, b) => a + b, 0) / newer.length;
      const mean = sum / failedCounts.length;
      const varSum = failedCounts.reduce((a, b) => a + (b - mean) ** 2, 0) / failedCounts.length;
      const cv = mean > 0.25 ? Math.sqrt(varSum) / mean : 0;
      if (cv >= 0.45) trend = "noisy";
      else if (nAvg > oAvg + 0.51) trend = "worsening";
      else if (nAvg < oAvg - 0.51) trend = "improving";
      else trend = "stable";
    } else if (historyWindowSize >= 2) {
      const mean = sum / failedCounts.length;
      const varSum = failedCounts.reduce((a, b) => a + (b - mean) ** 2, 0) / failedCounts.length;
      const cv = mean > 0.25 ? Math.sqrt(varSum) / mean : 0;
      if (cv >= 0.5) trend = "noisy";
    }

    rows.push({
      file,
      failedInPriorRuns,
      historyWindowSize,
      averageFailedCount,
      worstFailedCount,
      instabilityScore,
      trend,
    });
  }

  rows.sort((a, b) => {
    if (b.instabilityScore !== a.instabilityScore) return b.instabilityScore - a.instabilityScore;
    if (b.failedInPriorRuns !== a.failedInPriorRuns) return b.failedInPriorRuns - a.failedInPriorRuns;
    return a.file.localeCompare(b.file);
  });

  return rows;
}

function computeLikelyRecurring(
  seenInPriorRuns: number,
  historyWindowSize: number,
  consecutiveStreak: number,
  fileProfile: SystemTestFileHistoryProfile | undefined,
): boolean {
  if (seenInPriorRuns >= 3) return true;
  if (consecutiveStreak >= 2) return true;
  if (fileProfile && fileProfile.failedInPriorRuns >= 3 && seenInPriorRuns >= 2) return true;
  return false;
}

function computeLikelyFlaky(
  g: SystemTestFailureGroup,
  ctx: {
    seenInPriorRuns: number;
    historyWindowSize: number;
    consecutiveStreak: number;
    intermittentCount: number;
    broadRegression: boolean;
    fileDelta: number;
    groupsInSameFile: number;
    fileTrend: SystemTestFileHistoryProfile["trend"] | undefined;
    brandNewSevere: boolean;
  },
): boolean {
  if (ctx.brandNewSevere) return false;
  if (ctx.broadRegression) return false;
  if (ctx.consecutiveStreak >= 3) return false;
  if (ctx.groupsInSameFile >= 4 && ctx.fileDelta >= 2) return false;

  const prior = ctx.historyWindowSize;
  const inSomeNotAll =
    ctx.seenInPriorRuns >= 2 && prior > 0 && ctx.seenInPriorRuns < prior;
  const intermittent = ctx.intermittentCount >= 2 || (ctx.seenInPriorRuns >= 2 && ctx.consecutiveStreak === 1);
  const moderateOcc = g.occurrences <= 3;

  const ruleA = inSomeNotAll && intermittent && moderateOcc && !ctx.broadRegression && ctx.fileDelta < 2;

  const togglePattern =
    prior >= 3 &&
    ctx.seenInPriorRuns >= 2 &&
    ctx.seenInPriorRuns < prior &&
    (ctx.fileTrend === "stable" || ctx.fileTrend === "improving") &&
    ctx.fileDelta <= 0;

  return ruleA || togglePattern;
}

function rerunBand(score: number): SystemTestFailureHistoryProfile["rerunPriorityBand"] {
  if (score >= 40) return "high";
  if (score >= 20) return "medium";
  return "low";
}

function buildFailureProfile(
  g: SystemTestFailureGroup,
  current: SystemTestRunDetail,
  priorsNewestFirst: SystemTestRunDetail[],
  fileProfileMap: Map<string, SystemTestFileHistoryProfile>,
): SystemTestFailureHistoryProfile {
  const historyWindowSize = priorsNewestFirst.length;
  const priorsOldestFirst = [...priorsNewestFirst].reverse();
  const seenInPriorRuns = seenInPriorRunsCount(priorsNewestFirst, g.key);
  const consecutiveStreak = consecutiveStreakFromCurrent(current, priorsNewestFirst, g.key);
  const intermittentCount = intermittentTransitions(priorsOldestFirst, g.key);
  const lastSeenRunId = lastSeenPriorRunId(priorsNewestFirst, g.key);
  const firstSeenInLoadedWindow = seenInPriorRuns === 0;

  const immediatePrior = priorsNewestFirst[0] ?? null;
  const broadRegression = broadFileRegression(current, immediatePrior, g.file);
  const fileDelta = fileFailedDelta(current, immediatePrior, g.file);
  const groupsSameFile = groupsInFile(current.failureGroups, g.file);
  const fp = fileProfileMap.get(g.file);
  const brandNewSevere = seenInPriorRuns === 0 && g.occurrences >= 3;

  const likelyRecurring = computeLikelyRecurring(seenInPriorRuns, historyWindowSize, consecutiveStreak, fp);

  const likelyFlaky = computeLikelyFlaky(g, {
    seenInPriorRuns,
    historyWindowSize,
    consecutiveStreak,
    intermittentCount,
    broadRegression,
    fileDelta,
    groupsInSameFile: groupsSameFile,
    fileTrend: fp?.trend,
    brandNewSevere,
  });

  const priorOcc = immediatePrior ? groupOccMap(immediatePrior).get(g.key) : undefined;
  const worseningPersistent = priorOcc != null && g.occurrences > priorOcc;

  let score = 0;
  const reasons: string[] = [];

  if (seenInPriorRuns === 0) {
    score += 30;
    reasons.push("New failure fingerprint vs loaded prior window (+30).");
  }
  if (worseningPersistent) {
    score += 20;
    reasons.push("Occurrences increased vs immediate prior run (+20).");
  }
  if (g.occurrences >= 2) {
    score += 10;
    reasons.push("Multiple failing cases in this group in current run (+10).");
  }
  if (broadRegression) {
    score += 15;
    reasons.push("Broad file regression (failed count jump vs prior) (+15).");
  }
  if (fp && fp.failedInPriorRuns <= 1 && seenInPriorRuns === 0 && (specFailedByFile(current).get(g.file) ?? 0) > 0) {
    score += 15;
    reasons.push("Historically quiet file now failing (+15).");
  }
  if (likelyRecurring) {
    score += 10;
    reasons.push("Likely recurring pattern across history (+10).");
  }
  if (likelyFlaky) {
    score -= 20;
    reasons.push("Likely flaky / intermittent pattern (−20).");
  }
  if (fp && (fp.trend === "noisy" || fp.instabilityScore >= 60)) {
    score -= 10;
    reasons.push("Unstable / noisy file history (−10).");
  }
  if (g.occurrences === 1 && intermittentCount >= 2) {
    score -= 5;
    reasons.push("Single occurrence with intermittent prior toggles (−5).");
  }

  const band = rerunBand(score);

  return {
    key: g.key,
    seenInPriorRuns,
    historyWindowSize,
    lastSeenRunId,
    consecutiveStreak,
    intermittentCount,
    firstSeenInLoadedWindow,
    likelyFlaky,
    likelyRecurring,
    rerunPriorityScore: score,
    rerunPriorityBand: band,
    rerunPriorityReasons: reasons,
  };
}

function buildHistoricalInsights(
  historyWindowSize: number,
  failureProfiles: Record<string, SystemTestFailureHistoryProfile>,
  unstableFiles: SystemTestFileHistoryProfile[],
  groups: SystemTestFailureGroup[],
): string[] {
  const insights: string[] = [];
  const profiles = Object.values(failureProfiles);

  if (historyWindowSize === 0 && groups.length > 0) {
    insights.push("No prior runs loaded; historical recurrence and flaky tagging are limited.");
  }

  const flakyN = profiles.filter((p) => p.likelyFlaky).length;
  if (flakyN > 0) {
    insights.push(`${flakyN} failure group(s) are likely flaky based on intermittent recent history.`);
  }

  if (unstableFiles.length > 0) {
    const top = unstableFiles[0];
    insights.push(
      `Most unstable file in last ${top.historyWindowSize} prior run(s): ${top.file}.`,
    );
  }

  const sortedRerun = [...groups]
    .map((g) => ({ g, p: failureProfiles[g.key] }))
    .filter((x): x is { g: SystemTestFailureGroup; p: SystemTestFailureHistoryProfile } => Boolean(x.p))
    .sort((a, b) => {
      if (b.p.rerunPriorityScore !== a.p.rerunPriorityScore) return b.p.rerunPriorityScore - a.p.rerunPriorityScore;
      if (b.g.occurrences !== a.g.occurrences) return b.g.occurrences - a.g.occurrences;
      const f = a.g.file.localeCompare(b.g.file);
      if (f !== 0) return f;
      return a.g.title.localeCompare(b.g.title);
    });
  if (sortedRerun.length > 0) {
    const top = sortedRerun[0];
    insights.push(`Highest rerun priority: ${top.g.title} in ${top.g.file}.`);
  }

  const stableFileNew = groups.filter((g) => {
    const fp = unstableFiles.find((u) => u.file === g.file);
    const prof = failureProfiles[g.key];
    return prof?.firstSeenInLoadedWindow && fp && fp.failedInPriorRuns <= 1 && fp.instabilityScore < 40;
  });
  if (stableFileNew.length > 0) {
    insights.push(
      `Current run contains ${stableFileNew.length} new failure group(s) in historically stable files.`,
    );
  }

  const recurrence = [...profiles]
    .filter((p) => p.seenInPriorRuns >= 2)
    .sort((a, b) => b.seenInPriorRuns - a.seenInPriorRuns);
  if (recurrence.length > 0) {
    const p = recurrence[0];
    const g = groups.find((x) => x.key === p.key);
    insights.push(
      `Failure group "${g?.title ?? p.key}" appeared in ${p.seenInPriorRuns} of the last ${p.historyWindowSize} prior run(s).`,
    );
  }

  return insights;
}

/**
 * @param currentDetail — run under analysis
 * @param priorDetails — older runs only, newest-first, max 9 (caller slices from list)
 */
export function analyzeSystemTestHistory(
  currentDetail: SystemTestRunDetailResponse,
  priorDetails: SystemTestRunDetailResponse[],
): SystemTestHistoricalAnalysis {
  const current = normalizeSystemTestRunDetail(currentDetail);
  const { sorted: priorsChrono, listChronologyNote } = sortSystemTestDetailResponsesNewestFirst(priorDetails);
  const priorsNewestFirst = priorsChrono
    .slice(0, MAX_PRIOR_RUNS)
    .map((d) => normalizeSystemTestRunDetail(d));

  const fileProfilesList = buildFileProfiles(current, priorsNewestFirst);
  const fileProfileMap = new Map(fileProfilesList.map((f) => [f.file, f]));

  const failureProfiles: Record<string, SystemTestFailureHistoryProfile> = {};
  for (const g of current.failureGroups) {
    failureProfiles[g.key] = buildFailureProfile(g, current, priorsNewestFirst, fileProfileMap);
  }

  const historicalInsights = buildHistoricalInsights(
    priorsNewestFirst.length,
    failureProfiles,
    fileProfilesList,
    current.failureGroups,
  );

  return {
    runId: current.summary.id,
    historyWindowSize: priorsNewestFirst.length,
    failureProfiles,
    unstableFiles: fileProfilesList,
    historicalInsights,
    historyChronologyNote: listChronologyNote,
  };
}

export { MAX_PRIOR_RUNS };
