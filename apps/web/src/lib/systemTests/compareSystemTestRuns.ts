import { mergeEvidenceSummaries } from "@/lib/systemTests/extractSystemTestEvidence";
import { normalizeSystemTestRunDetail } from "@/lib/systemTests/normalizeSystemTestRun";
import { parseSystemTestRunTimeMs } from "@/lib/systemTests/sortSystemTestRuns";
import type {
  SystemTestFailureGroup,
  SystemTestFailureGroupComparison,
  SystemTestFileHealthComparisonRow,
  SystemTestRunComparison,
  SystemTestRunDetailResponse,
  SystemTestSpecBreakdownRow,
} from "@/types/systemTests";

const EPS = 1e-9;

function normalizeFamilyKey(file: string, title: string): string {
  return `${file}|${title.trim().replace(/\s+/g, " ")}`;
}

function buildFamilyMap(groups: SystemTestFailureGroup[]): Map<string, SystemTestFailureGroup[]> {
  const m = new Map<string, SystemTestFailureGroup[]>();
  for (const g of groups) {
    const k = normalizeFamilyKey(g.file, g.title);
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(g);
  }
  return m;
}

function emptySpecRow(file: string): SystemTestSpecBreakdownRow {
  return {
    file,
    totalCount: 0,
    passedCount: 0,
    failedCount: 0,
    skippedCount: 0,
    passRate: 0,
  };
}

function sortNew(
  a: SystemTestFailureGroupComparison,
  b: SystemTestFailureGroupComparison,
): number {
  if (b.targetOccurrences !== a.targetOccurrences) return b.targetOccurrences - a.targetOccurrences;
  const f = a.file.localeCompare(b.file);
  if (f !== 0) return f;
  return a.title.localeCompare(b.title);
}

function sortResolved(
  a: SystemTestFailureGroupComparison,
  b: SystemTestFailureGroupComparison,
): number {
  if (b.baseOccurrences !== a.baseOccurrences) return b.baseOccurrences - a.baseOccurrences;
  const f = a.file.localeCompare(b.file);
  if (f !== 0) return f;
  return a.title.localeCompare(b.title);
}

function sortPersistent(
  a: SystemTestFailureGroupComparison,
  b: SystemTestFailureGroupComparison,
): number {
  if (b.deltaOccurrences !== a.deltaOccurrences) return b.deltaOccurrences - a.deltaOccurrences;
  if (b.targetOccurrences !== a.targetOccurrences) return b.targetOccurrences - a.targetOccurrences;
  const f = a.file.localeCompare(b.file);
  if (f !== 0) return f;
  return a.title.localeCompare(b.title);
}

function sortFileHealth(a: SystemTestFileHealthComparisonRow, b: SystemTestFileHealthComparisonRow): number {
  if (b.failedDelta !== a.failedDelta) return b.failedDelta - a.failedDelta;
  if (a.passRateDelta !== b.passRateDelta) return a.passRateDelta - b.passRateDelta;
  return a.file.localeCompare(b.file);
}

function normalizeMsg(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

function fileHealthTrend(
  failedDelta: number,
  passRateDelta: number,
): "regressed" | "improved" | "unchanged" {
  if (failedDelta > 0) return "regressed";
  if (failedDelta < 0) return "improved";
  if (passRateDelta < -EPS) return "regressed";
  if (passRateDelta > EPS) return "improved";
  return "unchanged";
}

function computeHeadline(c: {
  newCount: number;
  resolvedCount: number;
  failedDelta: number;
  passRateDelta: number;
  persistentWorseCount: number;
  persistentBetterCount: number;
}): SystemTestRunComparison["headline"] {
  const { newCount, resolvedCount, failedDelta, passRateDelta, persistentWorseCount, persistentBetterCount } =
    c;

  const conflict =
    (failedDelta > EPS && passRateDelta > EPS) || (failedDelta < -EPS && passRateDelta < -EPS);

  if (newCount > 0 && resolvedCount > 0) {
    return "Mixed change";
  }

  if (newCount > 0 && resolvedCount === 0) {
    return "Regression detected";
  }

  if (resolvedCount > 0 && newCount === 0) {
    return "Improvement detected";
  }

  if (newCount === 0 && resolvedCount === 0) {
    if (Math.abs(failedDelta) < EPS && Math.abs(passRateDelta) < EPS && persistentWorseCount === 0) {
      return "No material change";
    }

    if (conflict) {
      return "Mixed change";
    }

    if (failedDelta > EPS || persistentWorseCount > 0) {
      return "Regression detected";
    }

    if (failedDelta < -EPS || persistentBetterCount > 0 || passRateDelta > EPS) {
      return "Improvement detected";
    }

    if (passRateDelta < -EPS) {
      return "Regression detected";
    }

    return "No material change";
  }

  return "Mixed change";
}

function buildOperatorInsights(comparison: SystemTestRunComparison): string[] {
  const insights: string[] = [];
  const {
    newFailures,
    resolvedFailures,
    persistentFailures,
    fileHealthChanges,
    passRateDelta,
    failedDelta,
    durationDeltaMs,
  } = comparison;

  const pts = (d: number) => `${(d * 100).toFixed(2)} pts`;

  if (newFailures.length > 0) {
    insights.push(`${newFailures.length} new failure group(s) appeared in the target run.`);
  }

  const expanded = newFailures.filter((g) => g.novelty === "expanded").length;
  if (expanded > 0) {
    insights.push(`${expanded} failure group(s) expanded (same file/title family, stronger signal than base).`);
  }

  if (resolvedFailures.length > 0) {
    insights.push(`${resolvedFailures.length} failure group(s) resolved since the base run.`);
  }

  const regressedFiles = fileHealthChanges
    .filter((r) => r.trend === "regressed")
    .sort((a, b) => b.failedDelta - a.failedDelta || a.passRateDelta - b.passRateDelta || a.file.localeCompare(b.file));
  if (regressedFiles.length > 0) {
    const top = regressedFiles[0];
    insights.push(
      `Biggest regression file: ${top.file} (+${top.failedDelta} failed, pass rate ${pts(top.passRateDelta)}).`,
    );
  }

  const improvedFiles = fileHealthChanges
    .filter((r) => r.trend === "improved")
    .sort((a, b) => a.failedDelta - b.failedDelta || b.passRateDelta - a.passRateDelta || a.file.localeCompare(b.file));
  if (improvedFiles.length > 0) {
    const top = improvedFiles[0];
    const fd = top.failedDelta;
    insights.push(
      `Largest file-level improvement: ${top.file} (${fd} failed, pass rate ${pts(top.passRateDelta)}).`,
    );
  }

  const persistentSorted = [...persistentFailures].sort(
    (a, b) => b.targetOccurrences - a.targetOccurrences || a.file.localeCompare(b.file),
  );
  if (persistentSorted.length > 0) {
    const p = persistentSorted[0];
    insights.push(
      `Most repeated persistent failure: ${p.title} (${p.targetOccurrences} occurrence(s) in target).`,
    );
  }

  insights.push(`Pass rate moved ${pts(passRateDelta)} (target vs base); failed count delta ${failedDelta >= 0 ? "+" : ""}${failedDelta}.`);

  if (durationDeltaMs != null && failedDelta !== 0) {
    if ((durationDeltaMs > 0 && failedDelta > 0) || (durationDeltaMs < 0 && failedDelta < 0)) {
      insights.push(
        `Duration ${durationDeltaMs > 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(durationDeltaMs))} ms while failed count also ${failedDelta > 0 ? "increased" : "decreased"}.`,
      );
    }
  }

  const fullyRecovered = fileHealthChanges.filter(
    (r) => r.trend === "improved" && r.baseFailedCount > 0 && r.targetFailedCount === 0,
  );
  if (fullyRecovered.length > 0) {
    fullyRecovered.sort((a, b) => b.baseFailedCount - a.baseFailedCount || a.file.localeCompare(b.file));
    const files = [...new Set(fullyRecovered.map((r) => r.file))].sort((a, b) => a.localeCompare(b));
    insights.push(`Target run recovered fully from ${files.join(", ")}.`);
  }

  return insights;
}

function effectiveDetailTimeMs(run: SystemTestRunDetailResponse["run"]): number | null {
  return parseSystemTestRunTimeMs(run.createdAt) ?? parseSystemTestRunTimeMs(run.updatedAt);
}

export function compareSystemTestRuns(
  baseDetail: SystemTestRunDetailResponse,
  targetDetail: SystemTestRunDetailResponse,
): SystemTestRunComparison {
  let baseResp = baseDetail;
  let targetResp = targetDetail;
  let chronologyCorrected = false;
  let chronologyNote: string | null = null;
  let chronologyWarning = false;

  const baseMs = effectiveDetailTimeMs(baseDetail.run);
  const targetMs = effectiveDetailTimeMs(targetDetail.run);

  if (baseMs != null && targetMs != null && baseMs > targetMs) {
    baseResp = targetDetail;
    targetResp = baseDetail;
    chronologyCorrected = true;
    chronologyNote =
      "Base was newer than target by timestamp; comparison was corrected so base = older run and target = newer run.";
  } else if (baseMs == null || targetMs == null) {
    chronologyWarning = true;
    chronologyNote =
      "One or both runs lack parseable createdAt/updatedAt; comparison uses the runs exactly as selected (base vs target labels unchanged).";
  }

  const baseRun = normalizeSystemTestRunDetail(baseResp);
  const targetRun = normalizeSystemTestRunDetail(targetResp);

  const baseMap = new Map(baseRun.failureGroups.map((g) => [g.key, g]));
  const targetMap = new Map(targetRun.failureGroups.map((g) => [g.key, g]));
  const baseFamily = buildFamilyMap(baseRun.failureGroups);

  const newFailures: SystemTestFailureGroupComparison[] = [];
  for (const t of targetRun.failureGroups) {
    if (baseMap.has(t.key)) continue;

    const fam = normalizeFamilyKey(t.file, t.title);
    const siblings = baseFamily.get(fam) ?? [];
    const maxBaseOcc = siblings.reduce((m, s) => Math.max(m, s.occurrences), 0);
    const novelty: "new" | "expanded" =
      siblings.length > 0 && t.occurrences > maxBaseOcc ? "expanded" : "new";

    newFailures.push({
      key: t.key,
      file: t.file,
      projectName: t.projectName,
      title: t.title,
      shortMessage: t.shortMessage,
      baseOccurrences: 0,
      targetOccurrences: t.occurrences,
      deltaOccurrences: t.occurrences,
      status: "new",
      testTitles: [...t.testTitles],
      novelty,
      evidenceSummary: t.evidenceSummary,
      richEvidence: t.richEvidence ?? null,
      artifactRefs: t.artifactRefs ?? [],
      debuggingHint: t.debuggingHint ?? null,
      family: t.family ?? null,
      incident: t.incident ?? null,
    });
  }
  newFailures.sort(sortNew);

  const resolvedFailures: SystemTestFailureGroupComparison[] = [];
  for (const b of baseRun.failureGroups) {
    if (targetMap.has(b.key)) continue;
    resolvedFailures.push({
      key: b.key,
      file: b.file,
      projectName: b.projectName,
      title: b.title,
      shortMessage: b.shortMessage,
      baseOccurrences: b.occurrences,
      targetOccurrences: 0,
      deltaOccurrences: -b.occurrences,
      status: "resolved",
      testTitles: [...b.testTitles],
      evidenceSummary: b.evidenceSummary,
      richEvidence: b.richEvidence ?? null,
      artifactRefs: b.artifactRefs ?? [],
      debuggingHint: b.debuggingHint ?? null,
      family: b.family ?? null,
      incident: b.incident ?? null,
    });
  }
  resolvedFailures.sort(sortResolved);

  const persistentFailures: SystemTestFailureGroupComparison[] = [];
  let persistentWorseCount = 0;
  let persistentBetterCount = 0;
  for (const t of targetRun.failureGroups) {
    const b = baseMap.get(t.key);
    if (!b) continue;

    const delta = t.occurrences - b.occurrences;
    let changeVersusBase: "worse" | "better" | "same" = "same";
    if (delta > 0) {
      changeVersusBase = "worse";
      persistentWorseCount += 1;
    } else if (delta < 0) {
      changeVersusBase = "better";
      persistentBetterCount += 1;
    }

    const sameMsg = normalizeMsg(b.shortMessage) === normalizeMsg(t.shortMessage);
    const shortMessage = sameMsg
      ? t.shortMessage
      : `Base: ${b.shortMessage || "—"} | Target: ${t.shortMessage || "—"}`;

    const titles = [...new Set([...b.testTitles, ...t.testTitles])].sort((a, b) => a.localeCompare(b));

    persistentFailures.push({
      key: t.key,
      file: t.file,
      projectName: t.projectName,
      title: t.title,
      shortMessage,
      baseOccurrences: b.occurrences,
      targetOccurrences: t.occurrences,
      deltaOccurrences: delta,
      status: "persistent",
      testTitles: titles,
      changeVersusBase,
      baseShortMessage: b.shortMessage,
      targetShortMessage: t.shortMessage,
      evidenceSummary: mergeEvidenceSummaries([b.evidenceSummary, t.evidenceSummary]),
      richEvidence: t.richEvidence ?? null,
      artifactRefs: t.artifactRefs ?? [],
      debuggingHint: t.debuggingHint ?? null,
      family: t.family ?? null,
      incident: t.incident ?? null,
    });
  }
  persistentFailures.sort(sortPersistent);

  const fileKeys = new Set<string>();
  for (const s of baseRun.specs) fileKeys.add(s.file);
  for (const s of targetRun.specs) fileKeys.add(s.file);

  const baseSpecMap = new Map(baseRun.specs.map((s) => [s.file, s]));
  const targetSpecMap = new Map(targetRun.specs.map((s) => [s.file, s]));

  const fileHealthChanges: SystemTestFileHealthComparisonRow[] = [];
  for (const file of [...fileKeys].sort((a, b) => a.localeCompare(b))) {
    const b = baseSpecMap.get(file) ?? emptySpecRow(file);
    const t = targetSpecMap.get(file) ?? emptySpecRow(file);
    const failedDelta = t.failedCount - b.failedCount;
    const passRateDelta = t.passRate - b.passRate;
    fileHealthChanges.push({
      file,
      baseTotalCount: b.totalCount,
      baseFailedCount: b.failedCount,
      basePassRate: b.passRate,
      targetTotalCount: t.totalCount,
      targetFailedCount: t.failedCount,
      targetPassRate: t.passRate,
      failedDelta,
      passRateDelta,
      trend: fileHealthTrend(failedDelta, passRateDelta),
    });
  }
  fileHealthChanges.sort(sortFileHealth);

  const failedDelta = targetRun.summary.failedCount - baseRun.summary.failedCount;
  const passRateDelta = targetRun.summary.passRate - baseRun.summary.passRate;
  const durationDeltaMs =
    targetRun.summary.durationMs != null && baseRun.summary.durationMs != null
      ? targetRun.summary.durationMs - baseRun.summary.durationMs
      : null;

  const headline = computeHeadline({
    newCount: newFailures.length,
    resolvedCount: resolvedFailures.length,
    failedDelta,
    passRateDelta,
    persistentWorseCount,
    persistentBetterCount,
  });

  const comparison: SystemTestRunComparison = {
    baseRun,
    targetRun,
    passRateDelta,
    failedDelta,
    durationDeltaMs,
    newFailures,
    resolvedFailures,
    persistentFailures,
    fileHealthChanges,
    operatorInsights: [],
    headline,
    chronologyCorrected,
    chronologyNote,
    chronologyWarning,
  };

  comparison.operatorInsights = buildOperatorInsights(comparison);

  return comparison;
}
