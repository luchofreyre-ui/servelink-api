import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import type { CommandCenterZoneId } from "@/lib/operational/commandCenterVocabulary";

export type OperationalAttentionSignal = {
  id: string;
  zone: CommandCenterZoneId;
  severity: "info" | "attention";
  title: string;
  detail: string;
  sortKey: number;
};

function countAttentionRows(rows: Array<{ severity: string }>): number {
  return rows.filter((r) => r.severity === "attention").length;
}

function validityAttentionStates(certStates: string[]): boolean {
  return certStates.some(
    (s) =>
      s.includes("attention") ||
      s.includes("skew") ||
      s.includes("insufficient_sample"),
  );
}

/**
 * Deterministic attention narratives — explicit thresholds only; no hidden ranking.
 */
export function buildOperationalAttentionSignals(
  dash: AdminOperationalIntelligenceDashboard,
): OperationalAttentionSignal[] {
  const out: OperationalAttentionSignal[] = [];
  const live = dash.live;
  const pf = live.portfolio;
  const os = pf.orchestrationSafety;
  const esc = live.escalationDensity;

  if (!dash.policyEngineAlignment.aligned) {
    out.push({
      id: "policy_analytics_misalignment",
      zone: "governance_pressure",
      severity: "attention",
      title: "Analytics vs policy engine version mismatch",
      detail:
        `Governance refs (${dash.policyEngineAlignment.analyticsRefsPolicy}) diverge from active policy (${dash.policyEngineAlignment.activePolicyEngine}) — reconcile before trusting persisted batches.`,
      sortKey: 5,
    });
  }

  if (pf.workflowsGovernanceBlocked > 0) {
    out.push({
      id: "governance_blocked_executions",
      zone: "orchestration_posture",
      severity: "attention",
      title: "Governance-blocked executions",
      detail: `${pf.workflowsGovernanceBlocked} workflow execution(s) failed at governance boundaries — review timelines before changing dispatch or billing posture.`,
      sortKey: 10,
    });
  }

  if (pf.overdueWorkflowTimers > 0) {
    out.push({
      id: "overdue_workflow_timers",
      zone: "orchestration_posture",
      severity: "attention",
      title: "Due workflow timers awaiting wake processing",
      detail: `${pf.overdueWorkflowTimers} pending timer(s) are past wakeAt — run explicit timer batch processing if cron is disabled.`,
      sortKey: 12,
    });
  }

  if (pf.waitingApprovalWorkflowsAged72hPlus > 0) {
    out.push({
      id: "approval_age_72h",
      zone: "approval_saturation",
      severity: "attention",
      title: "Approval backlog aging (72h+)",
      detail: `${pf.waitingApprovalWorkflowsAged72hPlus} workflow(s) waiting on approval beyond 72h staleness — deterministic backlog signal only.`,
      sortKey: 14,
    });
  }

  if (esc.open >= 3 || esc.openPerPendingApprovalApprox >= 0.35) {
    out.push({
      id: "escalation_concentration",
      zone: "approval_saturation",
      severity: "attention",
      title: "Escalation concentration vs approvals",
      detail: `${esc.open} open escalation(s); ~${esc.openPerPendingApprovalApprox.toFixed(2)} per pending approval — review queues individually.`,
      sortKey: 16,
    });
  }

  if (live.governanceStepsBlocked7d >= 5) {
    out.push({
      id: "step_governance_volume",
      zone: "governance_pressure",
      severity: "attention",
      title: "Elevated governance-blocked steps (7d)",
      detail: `${live.governanceStepsBlocked7d} step-level governance blocks in the trailing week — hotspot for safety rails.`,
      sortKey: 18,
    });
  }

  if (pf.policyAttentionEvaluations >= 25) {
    out.push({
      id: "policy_attention_volume",
      zone: "governance_pressure",
      severity: "attention",
      title: "High volume of policy attention evaluations",
      detail: `${pf.policyAttentionEvaluations} medium/high policy evaluations failing pass — inspect operational policy evaluations feed.`,
      sortKey: 20,
    });
  }

  const balancing = dash.persistedBalancing;
  const balAttention = countAttentionRows(balancing.balancingSnapshots);
  if (balAttention > 0) {
    out.push({
      id: "balancing_attention_snapshots",
      zone: "balancing_intelligence",
      severity: "attention",
      title: "Balancing snapshots flagged attention",
      detail: `${balAttention} persisted balancing row(s) at attention severity — compare with workflow congestion mirrors.`,
      sortKey: 22,
    });
  }

  const congAttention = countAttentionRows(balancing.congestionSnapshots);
  if (congAttention > 0) {
    out.push({
      id: "congestion_attention_snapshots",
      zone: "workflow_congestion",
      severity: "attention",
      title: "Workflow-type congestion at attention severity",
      detail: `${congAttention} congestion mirror row(s) at attention — backlog hotspots by workflow type.`,
      sortKey: 24,
    });
  }

  const del = live.delivery24h;
  if (
    del.attempts > 10 &&
    del.successes < del.attempts * 0.85
  ) {
    out.push({
      id: "delivery_success_ratio_soft",
      zone: "delivery_reliability",
      severity: "attention",
      title: "Delivery attempt success ratio below 85% (24h)",
      detail:
        "Recent delivery attempts show depressed success ratio — inspect operational outbox / channels; not an automatic verdict.",
      sortKey: 26,
    });
  }

  const driftHeavy = dash.persistedVsLiveDrift.filter(
    (d) => Math.abs(d.delta) >= 5,
  );
  if (driftHeavy.length > 0) {
    out.push({
      id: "warehouse_live_drift_material",
      zone: "operational_drift",
      severity: "attention",
      title: "Material warehouse vs live drift",
      detail: `${driftHeavy.length} metric key(s) diverge by ≥5 vs snapshots — refresh warehouse when reporting needs aligned comparables.`,
      sortKey: 28,
    });
  }

  const closedDrift = dash.persistedClosedLoopOperationalIntelligence;
  const outcomeDriftAttention = closedDrift.operationalDriftSnapshots.filter(
    (r) => r.severity === "attention",
  ).length;
  if (outcomeDriftAttention > 0) {
    out.push({
      id: "closed_loop_drift_attention",
      zone: "operational_drift",
      severity: "attention",
      title: "Closed-loop drift snapshots at attention",
      detail: `${outcomeDriftAttention} operational drift row(s) from outcome intelligence batch — review persisted closed-loop section.`,
      sortKey: 30,
    });
  }

  if (os.safetyEvaluationsAttentionLast24h >= 6) {
    out.push({
      id: "simulation_safety_attention_density",
      zone: "simulation_benchmark",
      severity: "attention",
      title: "Simulation safety evaluations — attention density",
      detail: `${os.safetyEvaluationsAttentionLast24h} attention-tier safety evaluations in 24h alongside ${os.simulationsCompletedLast24h} completed simulations — inspect lab/benchmark batches.`,
      sortKey: 32,
    });
  }

  if (os.dryRunsFailedLast24h >= 3) {
    out.push({
      id: "dry_run_failure_density",
      zone: "simulation_benchmark",
      severity: "attention",
      title: "Dry-run failures (24h)",
      detail: `${os.dryRunsFailedLast24h} dry-run failures recorded — review simulation posture before guided activations.`,
      sortKey: 34,
    });
  }

  const iv = dash.persistedOperationalInterventionValidity;
  const certStates = iv.validityCertifications.map((c) => c.certificationState);
  if (validityAttentionStates(certStates)) {
    out.push({
      id: "intervention_validity_cert_attention",
      zone: "intervention_validity",
      severity: "attention",
      title: "Intervention validity certifications need review",
      detail:
        "Latest validity batch includes attention-tier structural checks (skew or insufficient sample) — cohort labels are descriptive only; reconcile batch before comparative narratives.",
      sortKey: 36,
    });
  }

  if (!dash.persisted.refreshedAt) {
    out.push({
      id: "warehouse_empty_info",
      zone: "operational_drift",
      severity: "info",
      title: "Warehouse batch not yet refreshed",
      detail:
        "Live tiles are authoritative for counters; refresh snapshots when you need frozen cohort and drift comparables.",
      sortKey: 90,
    });
  }

  if (
    pf.workflowsWaitingApproval > 0 &&
    pf.pendingApprovals > 0 &&
    esc.open === 0
  ) {
    out.push({
      id: "approval_queue_active_calm_escalations",
      zone: "approval_saturation",
      severity: "info",
      title: "Approval queue active — no open escalations",
      detail: `${pf.workflowsWaitingApproval} workflow(s) waiting approval with ${pf.pendingApprovals} pending approval record(s); escalations currently clear.`,
      sortKey: 92,
    });
  }

  const sorted = [...out].sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === "attention" ? -1 : 1;
    }
    return a.sortKey - b.sortKey;
  });

  return sorted;
}
