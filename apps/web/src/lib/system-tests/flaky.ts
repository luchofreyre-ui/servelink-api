import type {
  SystemTestCaseResult,
  SystemTestRunDetailResponse,
  SystemTestsFlakyCaseRow,
} from "@/types/systemTests";
import {
  isFailedCaseStatus,
  isFlakyCase,
  isPassedCaseStatus,
  isSkippedCaseStatus,
  stableCaseKeyPreferFileTitle,
} from "./shared";

const DEFAULT_MAX_RUNS = 12;

type Observed = {
  status: string;
  runCreatedAt: string;
  case: SystemTestCaseResult;
};

function statusBucket(status: string): "pass" | "fail" | "skip" | "flaky" | "other" {
  const s = status.toLowerCase();
  if (s === "flaky" || s === "flake") return "flaky";
  if (isPassedCaseStatus(status)) return "pass";
  if (isFailedCaseStatus(status)) return "fail";
  if (isSkippedCaseStatus(status)) return "skip";
  return "other";
}

function pushObservation(
  map: Map<string, Observed[]>,
  c: SystemTestCaseResult,
  runCreatedAt: string,
) {
  const key = stableCaseKeyPreferFileTitle(c);
  const list = map.get(key) ?? [];
  list.push({ status: c.status, runCreatedAt, case: c });
  map.set(key, list);
}

/**
 * Recent-run flaky analysis. Runs should be newest-first or any order; they are sorted asc by run time.
 */
export function buildFlakyCaseAnalysis(
  details: SystemTestRunDetailResponse[],
  options?: { maxRuns?: number },
): SystemTestsFlakyCaseRow[] {
  if (!details.length) return [];

  const maxRuns = Math.max(1, options?.maxRuns ?? DEFAULT_MAX_RUNS);
  const slice = details.slice(0, maxRuns);
  const sortedRuns = [...slice].sort(
    (a, b) => new Date(a.run.createdAt).getTime() - new Date(b.run.createdAt).getTime(),
  );

  const byKey = new Map<string, Observed[]>();
  for (const d of sortedRuns) {
    const t = d.run.createdAt;
    for (const c of d.cases) {
      pushObservation(byKey, c, t);
    }
  }

  const rows: SystemTestsFlakyCaseRow[] = [];

  for (const [caseKey, obs] of byKey) {
    if (obs.length < 2) continue;

    const chronological = [...obs].sort(
      (a, b) => new Date(a.runCreatedAt).getTime() - new Date(b.runCreatedAt).getTime(),
    );

    let passCount = 0;
    let failCount = 0;
    let skipCount = 0;
    let flakyMark = 0;
    const lastStatuses: string[] = [];
    let transitionCount = 0;
    let prevBucket: string | null = null;

    for (const o of chronological) {
      lastStatuses.push(o.status);
      const b = statusBucket(o.status);
      if (b === "pass") passCount++;
      else if (b === "fail") failCount++;
      else if (b === "skip") skipCount++;
      if (isFlakyCase(o.case) || b === "flaky") flakyMark++;

      const sig = b === "other" ? o.status.toLowerCase() : b;
      if (prevBucket !== null && prevBucket !== sig) transitionCount++;
      prevBucket = sig;
    }

    const latest = chronological[chronological.length - 1];
    const previous = chronological.length >= 2 ? chronological[chronological.length - 2] : null;

    const skipOnlyPersistent =
      failCount === 0 && passCount === 0 && skipCount === chronological.length;
    if (skipOnlyPersistent) continue;

    const isCurrentlyFailing = isFailedCaseStatus(latest.status);

    const mix = passCount > 0 && failCount > 0 ? (Math.min(passCount, failCount) / Math.max(passCount, failCount)) * 4 : 0;
    const recencyBoost =
      chronological
        .slice(-3)
        .filter((o) => isFlakyCase(o.case) || statusBucket(o.status) === "flaky").length * 2 +
      (isCurrentlyFailing ? 3 : 0);

    const flakyScore =
      transitionCount * 3 +
      mix * 5 +
      recencyBoost +
      flakyMark * 1.5 +
      Math.min(chronological.length, maxRuns) * 0.15;

    const title = latest.case.title?.trim() || caseKey;
    const file = latest.case.filePath?.trim() || "—";

    rows.push({
      caseKey,
      title,
      file,
      totalObservations: chronological.length,
      passCount,
      failCount,
      skipCount,
      transitionCount,
      flakyScore,
      lastStatuses: lastStatuses.slice(-8),
      latestStatus: latest.status,
      previousStatus: previous?.status ?? null,
      isCurrentlyFailing,
    });
  }

  return rows
    .filter(
      (item) =>
        item.transitionCount > 0 || item.isCurrentlyFailing || item.failCount > 0,
    )
    .sort((a, b) => {
      if (a.isCurrentlyFailing !== b.isCurrentlyFailing) {
        return a.isCurrentlyFailing ? -1 : 1;
      }
      return b.flakyScore - a.flakyScore;
    });
}
