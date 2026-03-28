import { passRateFromSnapshot } from "./normalizeRun";
import type { ComparisonResult, FailureGroup, IntelRunSnapshot } from "./types";

export function compareFailureGroups(
  base: { run: IntelRunSnapshot; groups: FailureGroup[] },
  target: { run: IntelRunSnapshot; groups: FailureGroup[] },
): ComparisonResult {
  const baseMap = new Map(base.groups.map((g) => [g.key, g]));
  const targetMap = new Map(target.groups.map((g) => [g.key, g]));

  const newGroups: FailureGroup[] = [];
  for (const t of target.groups) {
    if (!baseMap.has(t.key)) newGroups.push(t);
  }

  const resolvedGroups: FailureGroup[] = [];
  for (const b of base.groups) {
    if (!targetMap.has(b.key)) resolvedGroups.push(b);
  }

  const persistentGroups: FailureGroup[] = [];
  for (const t of target.groups) {
    const b = baseMap.get(t.key);
    if (b) persistentGroups.push(t);
  }

  const failedDelta = target.run.failedCount - base.run.failedCount;
  const passRateDelta =
    passRateFromSnapshot(target.run) - passRateFromSnapshot(base.run);

  let headline = "No material change";
  if (newGroups.length > 0 && resolvedGroups.length > 0) headline = "Mixed change";
  else if (newGroups.length > 0) headline = "Regression detected";
  else if (resolvedGroups.length > 0) headline = "Improvement detected";
  else if (failedDelta > 0 || passRateDelta < -1e-9) headline = "Regression detected";
  else if (failedDelta < 0 || passRateDelta > 1e-9) headline = "Improvement detected";

  return {
    newGroups,
    resolvedGroups,
    persistentGroups,
    headline,
    failedDelta,
    passRateDelta,
  };
}
