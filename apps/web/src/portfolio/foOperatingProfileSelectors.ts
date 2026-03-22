import type { OperationalBookingSignal } from "./portfolioOperationalSnapshot";
import type { FoCohortId } from "./foCohortModel";
import { buildFoCohortModel } from "./foCohortSelectors";

export type FranchiseOwnerOperatingProfile = {
  foId: string;
  cohortId: FoCohortId;
  cohortLabel: string;
  operatingProfileSummary: string;
  biggestDrag: string;
  improvementToHealthierCohort: string;
  disciplineFocus: string;
};

/**
 * Constructive, FO-safe copy — no internal governance policing language.
 */
export function buildFranchiseOwnerOperatingProfile(
  signals: OperationalBookingSignal[],
  foId: string,
): FranchiseOwnerOperatingProfile | null {
  const mine = signals.filter((s) => s.foId === foId);
  if (mine.length === 0) return null;

  const model = buildFoCohortModel(signals);
  const segment = model.segments.find((s) => s.foIds.includes(foId));
  const cohortId = segment?.id ?? "stable_operators";
  const cohortLabel = segment?.label ?? "Stable operators";

  const stressRate =
    mine.filter((s) => s.slaMiss || s.noAcceptance || s.overloadRisk).length / mine.length;

  let biggestDrag = "Keeping visit quality consistent across your active jobs.";
  if (mine.some((s) => s.noShowRisk)) {
    biggestDrag = "Arrival reliability and ETA confirmation on upcoming visits.";
  } else if (mine.some((s) => s.overloadRisk)) {
    biggestDrag = "Load pacing — protecting quality as the schedule fills.";
  } else if (stressRate > 0.25) {
    biggestDrag = "Dispatch timing and acceptance — staying ahead of schedule risk.";
  }

  const improvementToHealthierCohort =
    cohortId === "stable_operators"
      ? "Stay the course: maintain checklist discipline and proactive customer updates."
      : "Confirm assignments early, communicate delays fast, and keep crew readiness visible.";

  const disciplineFocus =
    cohortId === "overloaded_stable" || cohortId === "overloaded_risky"
      ? "Load pacing and saying no to risky add-ons until quality is green."
      : cohortId === "high_rework" || cohortId === "documentation_drift"
        ? "Standard work order + photo checklist every visit."
        : "Clear customer expectations and on-time arrival windows.";

  return {
    foId,
    cohortId,
    cohortLabel,
    operatingProfileSummary: `Based on your current queue, you’re operating most like: ${cohortLabel}.`,
    biggestDrag,
    improvementToHealthierCohort,
    disciplineFocus,
  };
}

export function pickPrimaryFoId(signals: OperationalBookingSignal[]): string {
  const counts = new Map<string, number>();
  for (const s of signals) {
    const fid = s.foId;
    if (!fid || fid === "unassigned") continue;
    counts.set(fid, (counts.get(fid) ?? 0) + 1);
  }
  let best = "unassigned";
  let max = 0;
  for (const [id, c] of counts) {
    if (c > max) {
      max = c;
      best = id;
    }
  }
  return best;
}
