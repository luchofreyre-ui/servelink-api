import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import type { CommandCenterZoneId } from "@/lib/operational/commandCenterVocabulary";

/**
 * Tactical cockpit tones — disclosed deterministic thresholds only; not urgency rankings or ML scoring.
 */
export type SituationPostureTone = "steady" | "watch" | "pressure";

export type SituationPostureTile = {
  id: string;
  zone: CommandCenterZoneId;
  tone: SituationPostureTone;
  title: string;
  headline: string;
  detail: string;
  anchorHref: string;
};

function diffNumeric(payload: unknown, key: string): number | null {
  if (!payload || typeof payload !== "object") return null;
  const v = (payload as Record<string, unknown>)[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function validityAttention(certStates: string[]): boolean {
  return certStates.some(
    (s) =>
      s.includes("attention") ||
      s.includes("skew") ||
      s.includes("insufficient_sample"),
  );
}

function failedWorkflowLikeCount(states: Record<string, number>): number {
  let n = 0;
  for (const [k, v] of Object.entries(states)) {
    if (!Number.isFinite(v)) continue;
    const ku = k.toUpperCase();
    if (ku.includes("FAIL") || ku.includes("CANCEL")) n += v;
  }
  return n;
}

/**
 * Compressed posture snapshots for the operational cockpit — mirrors deterministic rules elsewhere (attention routing).
 */
export function buildSituationPostureTiles(
  dash: AdminOperationalIntelligenceDashboard,
): SituationPostureTile[] {
  const pf = dash.live.portfolio;
  const esc = dash.live.escalationDensity;
  const del = dash.live.delivery24h;
  const govBlockedSteps = dash.live.governanceStepsBlocked7d;
  const balancing = dash.persistedBalancing;
  const balAttention = balancing.balancingSnapshots.filter(
    (r) => r.severity === "attention",
  ).length;
  const congAttention = balancing.congestionSnapshots.filter(
    (r) => r.severity === "attention",
  ).length;

  const wfBlocked = failedWorkflowLikeCount(dash.live.workflowByState ?? {});

  const latestDiff = dash.persistedOperationalReplayAnalysis.diffs[0];
  const chDelta =
    latestDiff ?
      diffNumeric(latestDiff.payloadJson, "chronologySlotsWithCategoryChange")
    : null;
  const nodeDeltaAbs =
    latestDiff ?
      Math.abs(diffNumeric(latestDiff.payloadJson, "nodeCountDelta") ?? 0)
    : 0;

  const replayHistories =
    dash.persistedOperationalReplayTimeline.histories ?? [];

  const tiles: SituationPostureTile[] = [];

  const orchTone: SituationPostureTone =
    pf.workflowsGovernanceBlocked > 0 || pf.overdueWorkflowTimers > 0 ?
      "pressure"
    : pf.workflowsWaitingApproval > 8 ? "watch"
    : "steady";

  tiles.push({
    id: "sit_orchestration_posture",
    zone: "orchestration_posture",
    tone: orchTone,
    title: "Orchestration pressure",
    headline:
      orchTone === "pressure" ?
        "Governance block or overdue timers active"
      : orchTone === "watch" ? "Elevated approval wait posture"
      : "Queues within disclosed steady band",
    detail:
      `Governance-blocked executions ${pf.workflowsGovernanceBlocked}; overdue timers ${pf.overdueWorkflowTimers}; waiting approval ${pf.workflowsWaitingApproval}; disclosed failures ${wfBlocked}. Threshold pressure when governance blocked > 0 or overdue timers > 0; watch when waiting approvals > 8.`,
    anchorHref: "/admin/ops#operational-attention-routing",
  });

  const govTone: SituationPostureTone =
    govBlockedSteps >= 5 || pf.policyAttentionEvaluations >= 25 ?
      "pressure"
    : govBlockedSteps > 0 || pf.policyAttentionEvaluations >= 12 ?
      "watch"
    : "steady";

  tiles.push({
    id: "sit_governance_saturation",
    zone: "governance_pressure",
    tone: govTone,
    title: "Governance saturation",
    headline:
      govTone === "pressure" ?
        "Step-level governance volume elevated"
      : govTone === "watch" ? "Governance signals accumulating"
      : "Governance surface steady",
    detail:
      `Governance-blocked steps (7d) ${govBlockedSteps}; policy attention evaluations ${pf.policyAttentionEvaluations}. Pressure tier matches deterministic routing rules (steps ≥5 or policy evaluations ≥25).`,
    anchorHref: "/admin/ops#operational-attention-routing",
  });

  const escTone: SituationPostureTone =
    esc.open >= 3 || esc.openPerPendingApprovalApprox >= 0.35 ?
      "pressure"
    : esc.open > 0 ? "watch"
    : "steady";

  tiles.push({
    id: "sit_escalation_heat",
    zone: "approval_saturation",
    tone: escTone,
    title: "Escalation heat vs approvals",
    headline:
      escTone === "pressure" ?
        "Escalation density crosses cockpit disclosure strip"
      : escTone === "watch" ? "Escalations open — correlate approvals"
      : "Escalation surface calm vs backlog",
    detail:
      `Open escalations ${esc.open}; pending approvals ${pf.pendingApprovals}; ratio escalations ÷ pending approvals ≈ ${esc.openPerPendingApprovalApprox.toFixed(2)}. Pressure when open ≥3 or ratio ≥0.35 (deterministic only).`,
    anchorHref: "/admin/ops#operational-incident-command-rail",
  });

  const congTone: SituationPostureTone =
    congAttention >= 2 ? "pressure"
    : congAttention === 1 ? "watch"
    : balAttention >= 2 ? "watch"
    : "steady";

  tiles.push({
    id: "sit_workflow_congestion",
    zone: "workflow_congestion",
    tone: congTone,
    title: "Workflow congestion mirrors",
    headline:
      congTone === "pressure" ?
        "Multiple congestion mirrors at attention severity"
      : congTone === "watch" ?
        "Balancing / congestion posture merits scan"
      : "Congestion mirrors steady",
    detail:
      `Congestion snapshots at attention severity ${congAttention}; balancing snapshots at attention ${balAttention}. Uses persisted warehouse rows only — no autonomous rerouting.`,
    anchorHref: "/admin/ops#operational-graph-relationship-rail",
  });

  const delTone: SituationPostureTone =
    del.attempts > 10 && del.successes < del.attempts * 0.85 ?
      "pressure"
    : del.attempts > 5 && del.successes < del.attempts * 0.92 ?
      "watch"
    : "steady";

  tiles.push({
    id: "sit_delivery_degradation",
    zone: "delivery_reliability",
    tone: delTone,
    title: "Delivery degradation posture",
    headline:
      delTone === "pressure" ?
        "24h success ratio below 85% with material attempts"
      : delTone === "watch" ? "Delivery softness vs steady benchmark"
      : "Delivery attempts within steady disclosure band",
    detail:
      `Attempts ${del.attempts}; successes ${del.successes}. Pressure rule: attempts >10 AND success ratio <85%; watch uses softer ratio when attempts >5.`,
    anchorHref: "/admin/ops#operational-intelligence-coordinated-strip",
  });

  let replayTone: SituationPostureTone = "steady";
  let replayHeadline = "Replay batches aligned with disclosed drift bands";
  if (!latestDiff && replayHistories.length < 2) {
    replayTone = "watch";
    replayHeadline = "Insufficient archived batches for diff posture";
  } else if (latestDiff && chDelta != null) {
    if (chDelta > 2 || nodeDeltaAbs >= 4) {
      replayTone = "pressure";
      replayHeadline =
        "Latest deterministic replay diff shows material chronology or graph delta";
    } else if (chDelta > 0 || nodeDeltaAbs >= 1) {
      replayTone = "watch";
      replayHeadline =
        "Replay comparison shows bounded chronology or graph movement";
    }
  }

  tiles.push({
    id: "sit_replay_anomaly",
    zone: "operational_drift",
    tone: replayTone,
    title: "Replay anomaly posture",
    headline: replayHeadline,
    detail:
      latestDiff ?
        `Latest diff category ${String(latestDiff.diffCategory)}; chronology slots with category change ${chDelta ?? "—"}; |Δ nodes| ${nodeDeltaAbs}. Thresholds mirror cockpit disclosure (not scoring).`
      : `Archived histories ${replayHistories.length}; refresh warehouse for lineage comparisons.`,
    anchorHref: "/admin/ops#operational-replay-analysis-strip",
  });

  const ivCerts =
    dash.persistedOperationalInterventionValidity.validityCertifications.map(
      (c) => c.certificationState,
    );
  const ivTone: SituationPostureTone =
    validityAttention(ivCerts) ? "pressure"
    : ivCerts.length > 0 ? "watch"
    : "steady";

  tiles.push({
    id: "sit_intervention_validity",
    zone: "intervention_validity",
    tone: ivTone,
    title: "Intervention validity posture",
    headline:
      ivTone === "pressure" ?
        "Validity certifications include disclosed attention structures"
      : ivTone === "watch" ?
        "Assignments observed — pair with cohort rails manually"
      : "Validity batch steady vs disclosures",
    detail:
      `Assignments mirrored ${dash.persistedOperationalInterventionValidity.interventionAssignments.length}; certifications ${ivCerts.length}. Attention-tier wording references deterministic cohort governance snapshots only.`,
    anchorHref: "/admin/ops#operational-replay-intelligence-suite-strip",
  });

  return tiles;
}
