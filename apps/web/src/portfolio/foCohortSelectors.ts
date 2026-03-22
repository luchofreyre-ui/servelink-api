import type { OperationalBookingSignal } from "./portfolioOperationalSnapshot";
import type { FoCohortId, FoCohortModel, FoCohortSegment } from "./foCohortModel";

type FoAgg = {
  foId: string;
  signals: OperationalBookingSignal[];
};

function trendForSignals(signals: OperationalBookingSignal[]): "improving" | "stable" | "worsening" {
  const n = signals.length || 1;
  const acute = signals.filter((s) => s.slaMiss || s.noAcceptance).length / n;
  const load = signals.filter((s) => s.overloadRisk).length / n;
  if (acute < 0.1 && load < 0.15) return "improving";
  if (acute > 0.25 || load > 0.35) return "worsening";
  return "stable";
}

function classifyFo(agg: FoAgg): FoCohortId {
  const s = agg.signals;
  const n = s.length || 1;
  const overloadRate = s.filter((x) => x.overloadRisk).length / n;
  const slaRate = s.filter((x) => x.slaMiss).length / n;
  const noAcceptRate = s.filter((x) => x.noAcceptance).length / n;
  const reassignRate = s.filter((x) => x.reassignment).length / n;
  const noShowRate = s.filter((x) => x.noShowRisk).length / n;
  const offerExpiredRate = s.filter((x) => x.offerExpired).length / n;

  const improving = trendForSignals(s) === "improving" && overloadRate < 0.2 && slaRate < 0.1;

  if (improving) return "improving_after_coaching";
  if (overloadRate > 0.3 && noAcceptRate > 0.15) return "overloaded_risky";
  if (overloadRate > 0.25) return "overloaded_stable";
  if (slaRate > 0.2) return "high_rework";
  if (offerExpiredRate > 0.25 && reassignRate > 0.15) return "documentation_drift";
  if (reassignRate > 0.35 || noAcceptRate > 0.3) return "recovery_heavy";
  if (overloadRate > 0.15 || noShowRate > 0.2) return "tight_supervision";
  if (trendForSignals(s) === "worsening") return "watched_operators";
  return "stable_operators";
}

const COHORT_COPY: Record<
  FoCohortId,
  Omit<FoCohortSegment, "count" | "foIds" | "recentTrend">
> = {
  stable_operators: {
    id: "stable_operators",
    label: "Stable operators",
    dominantRisk: "Limited acute risk; maintain standards cadence.",
    dominantImprovementArea: "Share proof discipline playbooks as stretch goal.",
    recommendedAdminPosture: "Light-touch monitoring; celebrate consistency.",
  },
  watched_operators: {
    id: "watched_operators",
    label: "Watched operators",
    dominantRisk: "Drift in quality or economics pressure emerging.",
    dominantImprovementArea: "Tighten pre-job checklist and margin guardrails.",
    recommendedAdminPosture: "Weekly checkpoint until trend stabilizes.",
  },
  tight_supervision: {
    id: "tight_supervision",
    label: "Tight-supervision operators",
    dominantRisk: "Elevated supervision tier with execution sensitivity.",
    dominantImprovementArea: "Reduce variance on documentation and customer comms.",
    recommendedAdminPosture: "Pair with coach; require sign-offs on exceptions.",
  },
  high_rework: {
    id: "high_rework",
    label: "High-rework operators",
    dominantRisk: "Rework load compressing schedule integrity.",
    dominantImprovementArea: "Quality pause + crew alignment before next wave.",
    recommendedAdminPosture: "Quality lead owns playbook adherence.",
  },
  documentation_drift: {
    id: "documentation_drift",
    label: "Documentation-drift operators",
    dominantRisk: "Paper trail lagging operational reality.",
    dominantImprovementArea: "Close documentation same-day policy.",
    recommendedAdminPosture: "Ops reviewer embedded until green.",
  },
  recovery_heavy: {
    id: "recovery_heavy",
    label: "Recovery-heavy operators",
    dominantRisk: "Issue volume consuming supervisory bandwidth.",
    dominantImprovementArea: "Issue aging ladder + owner mapping.",
    recommendedAdminPosture: "Supervisor reclaims oldest threads first.",
  },
  overloaded_stable: {
    id: "overloaded_stable",
    label: "Overloaded-but-stable",
    dominantRisk: "High load but economics still defendable.",
    dominantImprovementArea: "Load shedding and deferral hygiene.",
    recommendedAdminPosture: "Capacity planning twice weekly.",
  },
  overloaded_risky: {
    id: "overloaded_risky",
    label: "Overloaded-and-risky",
    dominantRisk: "Overload intersecting thin margin / proof gaps.",
    dominantImprovementArea: "Stop-loss on new intake until proof + margin recover.",
    recommendedAdminPosture: "Executive escalation on intake decisions.",
  },
  improving_after_coaching: {
    id: "improving_after_coaching",
    label: "Improving-after-coaching",
    dominantRisk: "Relapse if coaching stops too early.",
    dominantImprovementArea: "Codify wins into SOP checkpoints.",
    recommendedAdminPosture: "Graduated release with metrics gates.",
  },
};

export function buildFoCohortModel(signals: OperationalBookingSignal[]): FoCohortModel {
  const byFo = new Map<string, OperationalBookingSignal[]>();
  let unassigned = 0;
  for (const sig of signals) {
    const fid = sig.foId;
    if (!fid || fid === "unassigned") {
      unassigned += 1;
      continue;
    }
    const list = byFo.get(fid) ?? [];
    list.push(sig);
    byFo.set(fid, list);
  }

  const cohortBuckets = new Map<FoCohortId, string[]>();
  for (const [foId, list] of byFo) {
    const id = classifyFo({ foId, signals: list });
    const cur = cohortBuckets.get(id) ?? [];
    cur.push(foId);
    cohortBuckets.set(id, cur);
  }

  const segments: FoCohortSegment[] = (Object.keys(COHORT_COPY) as FoCohortId[]).map((cid) => {
    const foIds = cohortBuckets.get(cid) ?? [];
    const copy = COHORT_COPY[cid];
    const cohortSignals = foIds.flatMap((fid) => byFo.get(fid) ?? []);
    return {
      ...copy,
      count: foIds.length,
      foIds,
      recentTrend: trendForSignals(cohortSignals.length ? cohortSignals : signals),
    };
  });

  return { segments, unassignedCount: unassigned };
}
