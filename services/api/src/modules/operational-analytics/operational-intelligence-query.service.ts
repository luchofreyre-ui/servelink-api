import { Injectable } from "@nestjs/common";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { PrismaService } from "../../prisma";
import type { AdminPortfolioOrchestrationSummary } from "../workflow/operational-portfolio-orchestration.service";
import { OperationalPortfolioOrchestrationService } from "../workflow/operational-portfolio-orchestration.service";
import { ESCALATION_STATE } from "../workflow/operational-policy.constants";
import {
  WORKFLOW_APPROVAL_RECORD_STATE,
  WORKFLOW_EXECUTION_STATE,
  WORKFLOW_GOVERNANCE_OUTCOME_STEP,
} from "../workflow/workflow.constants";
import {
  ANALYTICS_AGGREGATE_WINDOW,
  ANALYTICS_METRIC_KEY,
  OPERATIONAL_ANALYTICS_ENGINE_VERSION,
  OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME,
} from "./operational-analytics.constants";
import {
  assertPolicyAnalyticsVersionAlignment,
  OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION,
} from "./operational-analytics-governance";
import {
  OPERATIONAL_BALANCING_ENGINE_VERSION,
  WORKFLOW_CONGESTION_ENGINE_VERSION,
} from "./operational-balancing.constants";
import { OPERATIONAL_OUTCOME_ENGINE_VERSION } from "./operational-outcome.constants";
import {
  OPERATIONAL_EXPERIMENT_ENGINE_VERSION,
  WORKFLOW_BENCHMARK_ENGINE_VERSION,
} from "./operational-benchmark.constants";
import {
  CAUSAL_ATTRIBUTION_ENGINE_VERSION,
  EXPERIMENT_CERTIFICATION_ENGINE_VERSION,
  OPERATIONAL_SIM_LAB_ENGINE_VERSION,
} from "./operational-simulation-lab.constants";
import { OPERATIONAL_LONGITUDINAL_ENGINE_VERSION } from "./operational-longitudinal.constants";
import {
  INTERVENTION_EVALUATION_ENGINE_VERSION,
  OPERATIONAL_COHORT_ENGINE_VERSION,
  OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION,
} from "./operational-science.constants";
import {
  CONTROL_COHORT_ENGINE_VERSION,
  OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION,
  OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION,
} from "./operational-intervention-validity.constants";
import { OPERATIONAL_INCIDENT_ENGINE_VERSION } from "./operational-incident-command.constants";
import { OPERATIONAL_ENTITY_GRAPH_ENGINE_VERSION } from "./operational-entity-graph.constants";
import { OPERATIONAL_GRAPH_HISTORY_ENGINE_VERSION } from "./operational-replay.constants";
import { OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION } from "./operational-replay-analysis.constants";
import {
  classifyWarehouseOperationalFreshness,
  type WarehouseOperationalFreshness,
} from "./warehouse-operational-freshness";

const PAYMENT_ATTENTION_STATUSES = [
  "unpaid",
  "checkout_created",
  "payment_pending",
  "failed",
] as const;

export type DeterministicIntelligenceHint = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
};

export type PersistedVsLiveMetricDrift = {
  metricKey: string;
  persistedValue: number;
  liveValue: number;
  delta: number;
};

/** Human-governed informational seams only — no automatic execution. */
export type SafeOrchestrationActivationCandidate = {
  id: string;
  kind: "warehouse_refresh" | "timer_wake_tick" | "execution_review" | "approval_queue_review";
  title: string;
  detail: string;
  /** Routing hints for admins (paths / verbs), not invoked by the API. */
  suggestedAdminHints: string[];
};

/** Explain-only sequencing substrate — humans decide ordering; lower sortKey is not auto-applied. */
export type DeterministicPrioritizationSignal = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
  sortKey: number;
};

export type FoLoadBalancingHint = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
};

export type AdminOperationalIntelligenceDashboard = {
  analyticsGovernanceVersion: typeof OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION;
  analyticsEngineVersion: typeof OPERATIONAL_ANALYTICS_ENGINE_VERSION;
  policyEngineAlignment: ReturnType<typeof assertPolicyAnalyticsVersionAlignment>;
  live: {
    portfolio: Awaited<
      ReturnType<OperationalPortfolioOrchestrationService["getAdminPortfolioOrchestrationSummary"]>
    >;
    delivery24h: { attempts: number; successes: number };
    workflowByState: Record<string, number>;
    paymentAttentionBookings: number;
    bookingsWithRecurringPlan: number;
    governanceStepsBlocked7d: number;
    escalationDensity: {
      open: number;
      openPerPendingApprovalApprox: number;
    };
  };
  persisted: {
    aggregateWindow: string;
    refreshedAt: string | null;
    snapshots: Array<{
      metricCategory: string;
      metricKey: string;
      metricValue: number;
    }>;
    workflowRollups: Array<{
      workflowType: string;
      orchestrationCategory: string;
      countsJson: unknown;
    }>;
  };
  /** Phase 18 — deterministic posture hints (not ML, not auto-actions). */
  deterministicIntelligenceHints: DeterministicIntelligenceHint[];
  /** Snapshot batch vs live counters — informational drift only. */
  persistedVsLiveDrift: PersistedVsLiveMetricDrift[];
  /** Read-only semi-automation seams — humans trigger explicitly. */
  safeOrchestrationActivationCandidates: SafeOrchestrationActivationCandidate[];
  /** Phase 22 — latest persisted balancing + congestion batch (warehouse refresh). */
  persistedBalancing: {
    refreshedAt: string | null;
    aggregateWindow: string;
    balancingSnapshots: Array<{
      balancingCategory: string;
      severity: string;
      payloadJson: unknown;
    }>;
    congestionSnapshots: Array<{
      workflowType: string;
      congestionCategory: string;
      severity: string;
      payloadJson: unknown;
    }>;
  };
  /** Explainable prioritization substrate — not automatic queue reordering. */
  deterministicPrioritizationSignals: DeterministicPrioritizationSignal[];
  /** Phase 23 — persisted outcome / simulation-accuracy / warehouse drift batches (warehouse refresh). */
  persistedClosedLoopOperationalIntelligence: {
    refreshedAt: string | null;
    aggregateWindow: string;
    workflowOutcomeSamples: Array<{
      workflowExecutionId: string;
      activationId: string | null;
      evaluationCategory: string;
      evaluationResult: string;
      effectivenessScore: number;
      payloadJson: unknown;
    }>;
    simulationAccuracySnapshots: Array<{
      workflowExecutionId: string;
      simulationScenarioId: string;
      accuracyCategory: string;
      predictedJson: unknown;
      actualJson: unknown;
      payloadJson: unknown;
    }>;
    operationalDriftSnapshots: Array<{
      driftCategory: string;
      severity: string;
      payloadJson: unknown;
    }>;
  };
  /** Phase 24 — deterministic experimentation + benchmark batches (warehouse refresh). */
  persistedOperationalExperimentation: {
    refreshedAt: string | null;
    aggregateWindow: string;
    experimentSnapshots: Array<{
      experimentCategory: string;
      evaluationResult: string;
      payloadJson: unknown;
    }>;
    benchmarkScenarios: Array<{
      benchmarkCategory: string;
      benchmarkState: string;
      workflowExecutionId: string;
      simulationScenarioId: string | null;
      resultJson: unknown;
    }>;
  };
  /** Phase 25 — simulation lab frames, certifications, associative attribution (warehouse refresh). */
  persistedOperationalSimulationLab: {
    refreshedAt: string | null;
    aggregateWindow: string;
    labRuns: Array<{
      simulationCategory: string;
      benchmarkScenarioId: string | null;
      simulationState: string;
      payloadJson: unknown;
      resultJson: unknown;
    }>;
    certifications: Array<{
      experimentCategory: string;
      certificationState: string;
      evaluationSummary: string;
      payloadJson: unknown;
    }>;
    causalSnapshots: Array<{
      attributionCategory: string;
      attributionResult: string;
      payloadJson: unknown;
    }>;
  };
  /** Phase 26 — longitudinal lineage, counterfactual scaffolding, replay alignment (warehouse refresh). */
  persistedLongitudinalOperationalIntelligence: {
    refreshedAt: string | null;
    aggregateWindow: string;
    experimentLineage: Array<{
      lineageCategory: string;
      sourceExperimentId: string | null;
      comparisonExperimentId: string | null;
      payloadJson: unknown;
    }>;
    counterfactualSnapshots: Array<{
      evaluationCategory: string;
      comparisonWindow: string;
      payloadJson: unknown;
    }>;
    replayAlignments: Array<{
      replayCategory: string;
      replayState: string;
      payloadJson: unknown;
    }>;
  };
  /** Phase 27 — cohort mirrors, intervention observation sandboxes, deterministic evaluations (warehouse refresh). */
  persistedOperationalScience: {
    refreshedAt: string | null;
    aggregateWindow: string;
    cohortSnapshots: Array<{
      cohortCategory: string;
      payloadJson: unknown;
    }>;
    interventionSandboxes: Array<{
      sandboxCategory: string;
      sandboxState: string;
      workflowExecutionId: string;
      activationId: string | null;
      payloadJson: unknown;
      resultJson: unknown;
    }>;
    interventionEvaluations: Array<{
      evaluationCategory: string;
      evaluationResult: string;
      payloadJson: unknown;
    }>;
  };
  /** Phase 28 — deterministic assignments, control/holdout cohort summaries, validity certifications (warehouse refresh). */
  persistedOperationalInterventionValidity: {
    refreshedAt: string | null;
    aggregateWindow: string;
    interventionAssignments: Array<{
      assignmentCategory: string;
      cohortType: string;
      workflowExecutionId: string;
      activationId: string | null;
      assignmentState: string;
      payloadJson: unknown;
    }>;
    controlCohortSnapshots: Array<{
      cohortCategory: string;
      payloadJson: unknown;
    }>;
    validityCertifications: Array<{
      certificationCategory: string;
      certificationState: string;
      payloadJson: unknown;
    }>;
  };
  /** Phase 30 — coordination incidents + drilldown investigation graph (warehouse refresh). */
  persistedOperationalIncidentCommand: {
    refreshedAt: string | null;
    aggregateWindow: string;
    incidents: Array<{
      id: string;
      incidentCategory: string;
      incidentState: string;
      severity: string;
      payloadJson: unknown;
      links: Array<{
        linkedObjectType: string;
        linkedObjectId: string;
        payloadJson: unknown;
      }>;
      trails: Array<{
        trailCategory: string;
        payloadJson: unknown;
      }>;
    }>;
  };
  /** Phase 31 — deterministic entity graph + chronology (warehouse refresh). */
  persistedOperationalEntityGraph: {
    refreshedAt: string | null;
    aggregateWindow: string;
    nodes: Array<{
      id: string;
      entityCategory: string;
      entityState: string;
      idempotencyKey: string | null;
      payloadJson: unknown;
    }>;
    edges: Array<{
      id: string;
      edgeCategory: string;
      sourceNodeId: string;
      targetNodeId: string;
      payloadJson: unknown;
    }>;
    chronologyFrames: Array<{
      chronologyCategory: string;
      payloadJson: unknown;
    }>;
  };
  /** Phase 32 — multi-batch replay timeline (append-only graph archives + replay frames). */
  persistedOperationalReplayTimeline: {
    refreshedAt: string | null;
    aggregateWindow: string;
    histories: Array<{
      id: string;
      historyCategory: string;
      payloadJson: unknown;
      createdAt: string;
      replaySession: null | {
        id: string;
        replayCategory: string;
        replayState: string;
        payloadJson: unknown;
        topologySnapshot: null | { payloadJson: unknown };
        interventionBridge: null | { payloadJson: unknown };
        frames: Array<{
          frameCategory: string;
          sequenceIndex: number;
          payloadJson: unknown;
        }>;
      };
    }>;
  };
  /** Phase 33 — deterministic consecutive-batch replay diffs + interpretation (read-only analysis). */
  persistedOperationalReplayAnalysis: {
    refreshedAt: string | null;
    aggregateWindow: string;
    diffs: Array<{
      id: string;
      diffCategory: string;
      sourceReplaySessionId: string;
      comparisonReplaySessionId: string;
      payloadJson: unknown;
      createdAt: string;
      chronologyDeltas: Array<{
        id: string;
        deltaCategory: string;
        payloadJson: unknown;
      }>;
      interpretation: null | {
        interpretationCategory: string;
        payloadJson: unknown;
      };
      pairingLineage: null | {
        pairingCategory: string;
        orderedOlderReplaySessionId: string;
        orderedNewerReplaySessionId: string;
        payloadJson: unknown;
      };
      semanticAlignment: null | {
        payloadJson: unknown;
      };
    }>;
  };
  /** Warehouse batch + cron-ledger derived freshness (analytics read-model only). */
  warehouseOperationalFreshness: WarehouseOperationalFreshness;
};

export type FoOperationalIntelligenceSummary = {
  portfolio: Awaited<
    ReturnType<OperationalPortfolioOrchestrationService["getFoPortfolioOrchestrationSummary"]>
  >;
  bookingsPaymentAttention: number;
  workflowsCompletedLast7d: number;
  loadBalancingHints: FoLoadBalancingHint[];
  /** Phase 23 — selective closed-loop visibility (explain-only; no auto-tuning). */
  closedLoopOutcomeHints: FoLoadBalancingHint[];
  /** Phase 24 — selective experimentation / benchmark visibility (no auto-tuning). */
  experimentationHints: FoLoadBalancingHint[];
  /** Phase 25 — selective simulation lab / certification visibility (no autonomy). */
  simulationLabHints: FoLoadBalancingHint[];
  /** Phase 26 — selective longitudinal / continuity visibility (no autonomy). */
  longitudinalHints: FoLoadBalancingHint[];
  /** Phase 27 — selective cohort / sandbox science visibility (observe/compare only). */
  operationalScienceHints: FoLoadBalancingHint[];
  /** Phase 28 — selective intervention validity / holdout visibility (labels only). */
  interventionValidityHints: FoLoadBalancingHint[];
};

function buildLiveMetricMap(args: {
  livePortfolio: AdminOperationalIntelligenceDashboard["live"]["portfolio"];
  workflowByState: Record<string, number>;
  deliveryAttempts24h: number;
  deliverySuccess24h: number;
  paymentAttentionBookings: number;
  bookingsWithRecurringPlan: number;
  governanceStepsBlocked7d: number;
}): Record<string, number> {
  const w = args.workflowByState;
  return {
    [ANALYTICS_METRIC_KEY.WORKFLOW_WAITING_APPROVAL]:
      args.livePortfolio.workflowsWaitingApproval,
    [ANALYTICS_METRIC_KEY.WORKFLOW_GOVERNANCE_BLOCKED]:
      args.livePortfolio.workflowsGovernanceBlocked,
    [ANALYTICS_METRIC_KEY.APPROVAL_PENDING]:
      args.livePortfolio.pendingApprovals,
    [ANALYTICS_METRIC_KEY.ESCALATION_OPEN]: args.livePortfolio.openEscalations,
    [ANALYTICS_METRIC_KEY.POLICY_ATTENTION_EVALUATIONS]:
      args.livePortfolio.policyAttentionEvaluations,
    [ANALYTICS_METRIC_KEY.DELIVERY_ATTEMPTS_24H]: args.deliveryAttempts24h,
    [ANALYTICS_METRIC_KEY.DELIVERY_SUCCESS_24H]: args.deliverySuccess24h,
    [ANALYTICS_METRIC_KEY.PAYMENT_ATTENTION_BOOKINGS]:
      args.paymentAttentionBookings,
    [ANALYTICS_METRIC_KEY.BOOKINGS_WITH_RECURRING_PLAN]:
      args.bookingsWithRecurringPlan,
    [ANALYTICS_METRIC_KEY.WORKFLOW_STEPS_GOVERNANCE_BLOCKED_7D]:
      args.governanceStepsBlocked7d,
    [ANALYTICS_METRIC_KEY.WORKFLOW_COMPLETED]:
      w[WORKFLOW_EXECUTION_STATE.COMPLETED] ?? 0,
    [ANALYTICS_METRIC_KEY.WORKFLOW_FAILED]:
      w[WORKFLOW_EXECUTION_STATE.FAILED] ?? 0,
    [ANALYTICS_METRIC_KEY.WORKFLOW_RUNNING]:
      w[WORKFLOW_EXECUTION_STATE.RUNNING] ?? 0,
    [ANALYTICS_METRIC_KEY.WORKFLOW_CANCELLED]:
      w[WORKFLOW_EXECUTION_STATE.CANCELLED] ?? 0,
  };
}

function computePersistedVsLiveDrift(
  persistedSnapshots: Array<{ metricKey: string; metricValue: number }>,
  liveMap: Record<string, number>,
): PersistedVsLiveMetricDrift[] {
  const byKey = new Map(
    persistedSnapshots.map((s) => [s.metricKey, s.metricValue]),
  );
  const out: PersistedVsLiveMetricDrift[] = [];
  for (const [metricKey, persistedValue] of byKey) {
    if (!(metricKey in liveMap)) continue;
    const liveValue = liveMap[metricKey] ?? 0;
    out.push({
      metricKey,
      persistedValue,
      liveValue,
      delta: liveValue - persistedValue,
    });
  }
  return out.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

function buildDeterministicHints(args: {
  livePortfolio: AdminOperationalIntelligenceDashboard["live"]["portfolio"];
  deliveryAttempts24h: number;
  deliverySuccess24h: number;
  governanceStepsBlocked7d: number;
  drift: PersistedVsLiveMetricDrift[];
  warehouseRefreshedAt: string | null;
}): DeterministicIntelligenceHint[] {
  const hints: DeterministicIntelligenceHint[] = [];

  if (args.livePortfolio.workflowsGovernanceBlocked > 0) {
    hints.push({
      id: "governance_hotspot_executions",
      severity: "attention",
      title: "Governance-blocked executions on file",
      detail:
        `${args.livePortfolio.workflowsGovernanceBlocked} workflow(s) failed at governance boundaries — review execution timelines before changing dispatch or billing.`,
    });
  }

  if (args.livePortfolio.waitingApprovalWorkflowsAged72hPlus > 0) {
    hints.push({
      id: "workflow_approval_congestion_72h",
      severity: "attention",
      title: "Approval pause aging (72h+)",
      detail:
        `${args.livePortfolio.waitingApprovalWorkflowsAged72hPlus} workflow(s) remain waiting on approval with engine staleness beyond 72h — deterministic backlog signal only.`,
    });
  }

  if (args.livePortfolio.overdueWorkflowTimers > 0) {
    hints.push({
      id: "timer_wake_backlog",
      severity: "attention",
      title: "Due workflow timers awaiting wake processing",
      detail:
        `${args.livePortfolio.overdueWorkflowTimers} pending timer(s) are past wakeAt — run an explicit admin timer batch if cron is disabled.`,
    });
  }

  if (
    args.deliveryAttempts24h > 10 &&
    args.deliverySuccess24h < args.deliveryAttempts24h * 0.85
  ) {
    hints.push({
      id: "delivery_reliability_soft_signal",
      severity: "attention",
      title: "Delivery attempt success ratio (24h)",
      detail:
        "Recent delivery attempts show <85% successes — inspect operational outbox / channels; not an automatic verdict.",
    });
  }

  if (args.governanceStepsBlocked7d > 0) {
    hints.push({
      id: "step_governance_volume_7d",
      severity: "info",
      title: "Governance-blocked steps (7d)",
      detail:
        `${args.governanceStepsBlocked7d} step-level governance blocks recorded in the trailing week — hotspot density for safety rails.`,
    });
  }

  const significantDrift = args.drift.filter((d) => Math.abs(d.delta) >= 3);
  if (significantDrift.length > 0) {
    hints.push({
      id: "warehouse_live_drift",
      severity: "info",
      title: "Warehouse vs live counter drift",
      detail:
        `${significantDrift.length} metric key(s) diverge by ≥3 vs last warehouse batch — refresh snapshots if you need aligned historical reporting.`,
    });
  }

  if (!args.warehouseRefreshedAt) {
    hints.push({
      id: "warehouse_never_refreshed",
      severity: "info",
      title: "Analytics warehouse empty",
      detail:
        "No persisted operational analytics batch yet — live tiles still valid; refresh snapshots when you want frozen comparables.",
    });
  }

  return hints;
}

function buildSafeActivationCandidates(args: {
  livePortfolio: AdminOperationalIntelligenceDashboard["live"]["portfolio"];
}): SafeOrchestrationActivationCandidate[] {
  const c: SafeOrchestrationActivationCandidate[] = [
    {
      id: "candidate_refresh_analytics_warehouse",
      kind: "warehouse_refresh",
      title: "Refresh operational analytics warehouse",
      detail:
        "Recomputes deterministic analytics plus Phase 22 balancing/congestion snapshots — explicit POST on demand; optional governed cron exists but stays default-off until operators set ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON=true after manual proof.",
      suggestedAdminHints: [
        "POST /api/v1/admin/operational-intelligence/refresh-snapshots",
      ],
    },
    {
      id: "candidate_timer_wake_batch",
      kind: "timer_wake_tick",
      title: "Process due workflow timers (batch)",
      detail:
        "Advances visibility timers / escalations per governance rules — no booking transitions without existing flows.",
      suggestedAdminHints: [
        "POST /api/v1/admin/workflow-executions/timers/process-once",
      ],
    },
    {
      id: "candidate_review_approval_queues",
      kind: "approval_queue_review",
      title: "Review approval queue posture",
      detail:
        "Use booking-scoped workflow approvals UI — bulk approve/deny remains unsupported by design.",
      suggestedAdminHints: [
        "GET /api/v1/admin/workflow-approvals/queue-summary",
        "GET /api/v1/admin/workflow-approvals?bookingId={id}",
      ],
    },
  ];

  if (args.livePortfolio.workflowsGovernanceBlocked > 0) {
    c.push({
      id: "candidate_review_governance_executions",
      kind: "execution_review",
      title: "Inspect governance-blocked workflow executions",
      detail:
        `${args.livePortfolio.workflowsGovernanceBlocked} execution(s) need human verification — coordinator remains guarded.`,
      suggestedAdminHints: [
        "GET /api/v1/admin/workflow-executions?bookingId={id}",
      ],
    });
  }

  return c;
}

function buildDeterministicPrioritizationSignals(args: {
  portfolio: AdminPortfolioOrchestrationSummary;
  openEscalations: number;
  openPerPendingApprovalApprox: number;
}): DeterministicPrioritizationSignal[] {
  const out: DeterministicPrioritizationSignal[] = [];
  const p = args.portfolio;

  if (p.waitingApprovalWorkflowsAged72hPlus > 0) {
    out.push({
      id: "prioritize_approval_pause_elder",
      severity: "attention",
      title: "Elder approval-pause workflows (72h+)",
      detail:
        `${p.waitingApprovalWorkflowsAged72hPlus} workflow(s) — sequencing hint only; operators choose booking order manually.`,
      sortKey: 10,
    });
  }

  if (p.pendingApprovalsAged48hPlus > 0) {
    out.push({
      id: "prioritize_stale_pending_approvals",
      severity:
        p.pendingApprovalsAged48hPlus >= 8 ? "attention" : "info",
      title: "Stale pending approval rows",
      detail:
        `${p.pendingApprovalsAged48hPlus} approval row(s) pending ≥48h — breadth signal.`,
      sortKey: 20,
    });
  }

  if (args.openEscalations > 0) {
    out.push({
      id: "prioritize_escalation_inventory",
      severity:
        args.openPerPendingApprovalApprox >= 0.35 ? "attention" : "info",
      title: "Escalation density vs approvals",
      detail:
        `${args.openEscalations} open escalation(s); approx ${args.openPerPendingApprovalApprox.toFixed(2)} per pending approval — not auto-triage.`,
      sortKey: 30,
    });
  }

  if (p.workflowsGovernanceBlocked > 0) {
    out.push({
      id: "prioritize_governance_blocked_executions",
      severity: "attention",
      title: "Governance-blocked executions",
      detail:
        `${p.workflowsGovernanceBlocked} execution(s) — inspect before expanding dispatch or billing surface area.`,
      sortKey: 40,
    });
  }

  if (p.overdueWorkflowTimers > 0) {
    out.push({
      id: "prioritize_overdue_timers",
      severity: "attention",
      title: "Overdue workflow timers",
      detail:
        `${p.overdueWorkflowTimers} pending timer(s) past wakeAt — wake handling stays explicitly triggered.`,
      sortKey: 50,
    });
  }

  if (p.pendingApprovals > 0) {
    out.push({
      id: "prioritize_approval_depth",
      severity: p.pendingApprovals >= 15 ? "attention" : "info",
      title: "Approval queue depth",
      detail: `${p.pendingApprovals} pending approval row(s) portfolio-wide.`,
      sortKey: 60,
    });
  }

  out.sort((a, b) => a.sortKey - b.sortKey);
  return out;
}

function buildFoLoadBalancingHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];

  if (portfolio.overdueWorkflowTimers > 0) {
    hints.push({
      id: "fo_timer_overdue_load",
      severity: "attention",
      title: "Timer congestion (scoped)",
      detail:
        `${portfolio.overdueWorkflowTimers} overdue timer(s) on your bookings — not auto-woken from this UI.`,
    });
  }

  if (portfolio.activeWorkflowWaits >= 5) {
    hints.push({
      id: "fo_active_waits_load",
      severity: "info",
      title: "Active workflow waits",
      detail:
        `${portfolio.activeWorkflowWaits} active wait row(s) — visibility backlog signal.`,
    });
  }

  if (portfolio.orchestrationSafety.dryRunsFailedLast24h > 0) {
    hints.push({
      id: "fo_dry_run_failures",
      severity:
        portfolio.orchestrationSafety.dryRunsFailedLast24h >= 2 ?
          "attention"
        : "info",
      title: "Dry-run friction (24h)",
      detail:
        `${portfolio.orchestrationSafety.dryRunsFailedLast24h} failed dry-run(s) — review simulations before activations.`,
    });
  }

  if (portfolio.orchestrationSafety.safetyEvaluationsAttentionLast24h > 0) {
    hints.push({
      id: "fo_safety_eval_attention",
      severity: "attention",
      title: "Safety evaluations (attention)",
      detail:
        `${portfolio.orchestrationSafety.safetyEvaluationsAttentionLast24h} attention-tier evaluation(s) in the last 24h.`,
    });
  }

  return hints;
}

function buildFoClosedLoopOutcomeHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];
  const os = portfolio.orchestrationSafety;

  if (os.simulationsCompletedLast24h > 0) {
    hints.push({
      id: "fo_closed_loop_simulation_accuracy_visibility",
      severity:
        os.safetyEvaluationsAttentionLast24h >= 3 ? "attention" : "info",
      title: "Simulation vs live posture (observation)",
      detail:
        `${os.simulationsCompletedLast24h} completed simulation(s) in the last 24h on your bookings — operators can refresh the analytics warehouse to persist deterministic accuracy mirrors; nothing here auto-tunes orchestration.`,
    });
  }

  if (os.activationsFailed > 0) {
    hints.push({
      id: "fo_closed_loop_activation_failures",
      severity: "attention",
      title: "Activation failures on your portfolio",
      detail:
        `${os.activationsFailed} activation row(s) failed — review guided activation posture with operators; execution stays explicitly human-governed.`,
    });
  }

  return hints;
}

function buildFoExperimentationHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];
  const os = portfolio.orchestrationSafety;

  if (
    os.simulationsCompletedLast24h > 0 &&
    os.safetyEvaluationsAttentionLast24h >= 4
  ) {
    hints.push({
      id: "fo_experimentation_benchmark_visibility",
      severity: "attention",
      title: "Benchmarking / experimentation signals (scoped)",
      detail:
        "Elevated safety-attention evaluations alongside recent simulations on your bookings — operators compare persisted benchmark batches after an analytics warehouse refresh; nothing here auto-changes orchestration.",
    });
  } else if (os.simulationsCompletedLast24h >= 3) {
    hints.push({
      id: "fo_experimentation_baseline_visibility",
      severity: "info",
      title: "Experimentation substrate (scoped)",
      detail:
        "Several simulations completed recently on your bookings — deterministic benchmark anchors are recorded when operators refresh the analytics warehouse.",
    });
  }

  return hints;
}

function buildFoSimulationLabHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];
  const os = portfolio.orchestrationSafety;

  if (os.simulationsCompletedLast24h >= 2) {
    hints.push({
      id: "fo_simulation_lab_substrate",
      severity:
        os.safetyEvaluationsAttentionLast24h >= 4 ? "attention" : "info",
      title: "Simulation lab substrate (scoped)",
      detail:
        "Recent simulations on your bookings feed governed lab frames and associative attribution summaries when operators refresh the analytics warehouse — not autonomous replay, tuning, or customer execution.",
    });
  }

  return hints;
}

function buildFoLongitudinalHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];
  const os = portfolio.orchestrationSafety;

  if (
    os.simulationsCompletedLast24h >= 3 &&
    os.safetyEvaluationsAttentionLast24h >= 2
  ) {
    hints.push({
      id: "fo_longitudinal_continuity_visibility",
      severity: "attention",
      title: "Longitudinal continuity signals (scoped)",
      detail:
        "Elevated simulation cadence with ongoing safety-attention evaluations — operators can compare consecutive warehouse batches for lineage and replay alignment; nothing here runs autonomous optimizations.",
    });
  } else if (os.simulationsCompletedLast24h >= 4) {
    hints.push({
      id: "fo_longitudinal_baseline_visibility",
      severity: "info",
      title: "Historical batch contrast substrate (scoped)",
      detail:
        "Frequent simulations on your bookings mean ServeLink can persist consecutive-batch contrasts after warehouse refresh — descriptive only.",
    });
  }

  return hints;
}

function buildFoOperationalScienceHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];
  const os = portfolio.orchestrationSafety;

  if (os.activationsRegistered >= 10 && os.simulationsCompletedLast24h >= 3) {
    hints.push({
      id: "fo_operational_science_substrate",
      severity:
        os.activationsFailed >= 2 ? "attention" : "info",
      title: "Operational science substrate (scoped)",
      detail:
        "Warehouse refresh can persist cohort mirrors and non-executing intervention observation frames for your portfolio slice — deterministic labels only; operators interpret outcomes; nothing dispatches, bills, or self-tunes.",
    });
  }

  return hints;
}

function buildFoInterventionValidityHints(
  portfolio: AdminPortfolioOrchestrationSummary,
): FoLoadBalancingHint[] {
  const hints: FoLoadBalancingHint[] = [];
  const os = portfolio.orchestrationSafety;

  if (
    os.activationsApprovedForInvoke >= 6 &&
    os.simulationsCompletedLast24h >= 3
  ) {
    hints.push({
      id: "fo_intervention_validity_substrate",
      severity: os.activationsFailed >= 3 ? "attention" : "info",
      title: "Intervention validity substrate (scoped)",
      detail:
        "After warehouse refresh, operators may persist deterministic control vs comparison-mirror labels from sandbox frames — descriptive partitioning only; does not execute interventions, change bookings, or optimize routing automatically.",
    });
  }

  return hints;
}

/**
 * Read-side operational intelligence — merges live deterministic counts with latest persisted warehouse batch.
 */
@Injectable()
export class OperationalIntelligenceQueryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly portfolio: OperationalPortfolioOrchestrationService,
    private readonly cronRunLedger: CronRunLedgerService,
  ) {}

  /** Lightweight freshness projection reused before/after explicit warehouse refresh (matches dashboard classification). */
  async getWarehouseOperationalFreshnessSnapshot(
    aggregateWindow?: string,
  ): Promise<WarehouseOperationalFreshness> {
    const ENGINE = OPERATIONAL_ANALYTICS_ENGINE_VERSION;
    const WINDOW = aggregateWindow?.trim() || ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;

    const latestStampRow =
      await this.prisma.workflowAnalyticsAggregate.findFirst({
        where: {
          analyticsEngineVersion: ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const refreshedAt = latestStampRow?.createdAt ?? null;

    const cronRunsGrouped = await this.cronRunLedger.getLatestRuns(25);
    const warehouseJobRunsRaw =
      cronRunsGrouped[OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME] ?? [];
    const latestJobRuns = warehouseJobRunsRaw.map((r: Record<string, unknown>) => ({
      status: String(r.status ?? ""),
      finishedAt: typeof r.finishedAt === "string" ? r.finishedAt : null,
      metadata: r.metadata,
    }));

    return classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: refreshedAt?.toISOString() ?? null,
      latestJobRuns,
      nowMs: Date.now(),
    });
  }

  async getFoOperationalIntelligenceSummary(
    franchiseOwnerId: string,
  ): Promise<FoOperationalIntelligenceSummary> {
    const portfolio =
      await this.portfolio.getFoPortfolioOrchestrationSummary(franchiseOwnerId);

    const bookings = await this.prisma.booking.findMany({
      where: { foId: franchiseOwnerId },
      select: { id: true },
      take: 500,
    });
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length === 0) {
      return {
        portfolio,
        bookingsPaymentAttention: 0,
        workflowsCompletedLast7d: 0,
        loadBalancingHints: buildFoLoadBalancingHints(portfolio),
        closedLoopOutcomeHints: buildFoClosedLoopOutcomeHints(portfolio),
        experimentationHints: buildFoExperimentationHints(portfolio),
        simulationLabHints: buildFoSimulationLabHints(portfolio),
        longitudinalHints: buildFoLongitudinalHints(portfolio),
        operationalScienceHints: buildFoOperationalScienceHints(portfolio),
        interventionValidityHints: buildFoInterventionValidityHints(portfolio),
      };
    }

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [bookingsPaymentAttention, workflowsCompletedLast7d] =
      await Promise.all([
        this.prisma.booking.count({
          where: {
            id: { in: bookingIds },
            paymentStatus: { in: [...PAYMENT_ATTENTION_STATUSES] },
          },
        }),
        this.prisma.workflowExecution.count({
          where: {
            aggregateType: "booking",
            aggregateId: { in: bookingIds },
            state: WORKFLOW_EXECUTION_STATE.COMPLETED,
            completedAt: { gte: since7d },
          },
        }),
      ]);

    return {
      portfolio,
      bookingsPaymentAttention,
      workflowsCompletedLast7d,
      loadBalancingHints: buildFoLoadBalancingHints(portfolio),
      closedLoopOutcomeHints: buildFoClosedLoopOutcomeHints(portfolio),
      experimentationHints: buildFoExperimentationHints(portfolio),
      simulationLabHints: buildFoSimulationLabHints(portfolio),
      longitudinalHints: buildFoLongitudinalHints(portfolio),
      operationalScienceHints: buildFoOperationalScienceHints(portfolio),
      interventionValidityHints: buildFoInterventionValidityHints(portfolio),
    };
  }

  async getAdminOperationalIntelligenceDashboard(): Promise<AdminOperationalIntelligenceDashboard> {
    const ENGINE = OPERATIONAL_ANALYTICS_ENGINE_VERSION;
    const WINDOW = ANALYTICS_AGGREGATE_WINDOW.AS_OF_NOW;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      livePortfolio,
      deliveryAttempts24h,
      deliverySuccess24h,
      wfGroups,
      paymentAttentionBookings,
      bookingsWithRecurringPlan,
      governanceStepsBlocked7d,
      pendingApprovals,
      openEscalations,
    ] = await Promise.all([
      this.portfolio.getAdminPortfolioOrchestrationSummary(),
      this.prisma.operationalOutboxDeliveryAttempt.count({
        where: { createdAt: { gte: since24h } },
      }),
      this.prisma.operationalOutboxDeliveryAttempt.count({
        where: { createdAt: { gte: since24h }, success: true },
      }),
      this.prisma.workflowExecution.groupBy({
        by: ["state"],
        _count: { _all: true },
      }),
      this.prisma.booking.count({
        where: {
          paymentStatus: { in: [...PAYMENT_ATTENTION_STATUSES] },
        },
      }),
      this.prisma.booking.count({
        where: { recurringPlans: { some: {} } },
      }),
      this.prisma.workflowExecutionStep.count({
        where: {
          governanceOutcome: WORKFLOW_GOVERNANCE_OUTCOME_STEP.BLOCKED,
          failedAt: { gte: since7d },
        },
      }),
      this.prisma.workflowApproval.count({
        where: { approvalState: WORKFLOW_APPROVAL_RECORD_STATE.PENDING },
      }),
      this.prisma.workflowApprovalEscalation.count({
        where: { escalationState: ESCALATION_STATE.OPEN },
      }),
    ]);

    const workflowByState: Record<string, number> = {};
    for (const row of wfGroups) {
      workflowByState[row.state] = row._count._all;
    }

    const pendingDenom = Math.max(pendingApprovals, 1);
    const openPerPendingApprovalApprox = openEscalations / pendingDenom;

    const latestStampRow =
      await this.prisma.workflowAnalyticsAggregate.findFirst({
        where: {
          analyticsEngineVersion: ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });

    const refreshedAt = latestStampRow?.createdAt ?? null;

    const persistedSnapshots = refreshedAt
      ? await this.prisma.operationalAnalyticsSnapshot.findMany({
          where: {
            analyticsEngineVersion: ENGINE,
            aggregateWindow: WINDOW,
            createdAt: refreshedAt,
          },
          select: {
            metricCategory: true,
            metricKey: true,
            metricValue: true,
          },
          orderBy: [{ metricCategory: "asc" }, { metricKey: "asc" }],
        })
      : [];

    const persistedRollups = refreshedAt
      ? await this.prisma.workflowAnalyticsAggregate.findMany({
          where: {
            analyticsEngineVersion: ENGINE,
            aggregateWindow: WINDOW,
            createdAt: refreshedAt,
          },
          select: {
            workflowType: true,
            orchestrationCategory: true,
            countsJson: true,
          },
          orderBy: [{ workflowType: "asc" }],
        })
      : [];

    const liveMetricMap = buildLiveMetricMap({
      livePortfolio,
      workflowByState,
      deliveryAttempts24h,
      deliverySuccess24h,
      paymentAttentionBookings,
      bookingsWithRecurringPlan,
      governanceStepsBlocked7d,
    });

    const persistedVsLiveDrift = computePersistedVsLiveDrift(
      persistedSnapshots,
      liveMetricMap,
    );

    const deterministicIntelligenceHints = buildDeterministicHints({
      livePortfolio,
      deliveryAttempts24h,
      deliverySuccess24h,
      governanceStepsBlocked7d,
      drift: persistedVsLiveDrift,
      warehouseRefreshedAt: refreshedAt?.toISOString() ?? null,
    });

    const safeOrchestrationActivationCandidates =
      buildSafeActivationCandidates({ livePortfolio });

    const [balancingStamp, congestionStamp] = await Promise.all([
      this.prisma.operationalBalancingSnapshot.findFirst({
        where: {
          balancingEngineVersion: OPERATIONAL_BALANCING_ENGINE_VERSION,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.workflowCongestionSnapshot.findFirst({
        where: {
          congestionEngineVersion: WORKFLOW_CONGESTION_ENGINE_VERSION,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const [persistedBalancingSnapshots, persistedCongestionSnapshots] =
      await Promise.all([
        balancingStamp
          ? this.prisma.operationalBalancingSnapshot.findMany({
              where: {
                balancingEngineVersion: OPERATIONAL_BALANCING_ENGINE_VERSION,
                aggregateWindow: WINDOW,
                createdAt: balancingStamp.createdAt,
              },
              select: {
                balancingCategory: true,
                severity: true,
                payloadJson: true,
              },
              orderBy: [{ balancingCategory: "asc" }],
            })
          : [],
        congestionStamp
          ? this.prisma.workflowCongestionSnapshot.findMany({
              where: {
                congestionEngineVersion: WORKFLOW_CONGESTION_ENGINE_VERSION,
                aggregateWindow: WINDOW,
                createdAt: congestionStamp.createdAt,
              },
              select: {
                workflowType: true,
                congestionCategory: true,
                severity: true,
                payloadJson: true,
              },
              orderBy: [{ workflowType: "asc" }],
            })
          : [],
      ]);

    let balancingRefreshedAt: string | null = null;
    if (balancingStamp || congestionStamp) {
      const t1 = balancingStamp?.createdAt.getTime() ?? 0;
      const t2 = congestionStamp?.createdAt.getTime() ?? 0;
      balancingRefreshedAt = new Date(Math.max(t1, t2)).toISOString();
    }

    const deterministicPrioritizationSignals =
      buildDeterministicPrioritizationSignals({
        portfolio: livePortfolio,
        openEscalations,
        openPerPendingApprovalApprox,
      });

    const OUTCOME_ENGINE = OPERATIONAL_OUTCOME_ENGINE_VERSION;

    const [woEvalStamp, simAccStamp, driftStamp] = await Promise.all([
      this.prisma.workflowOutcomeEvaluation.findFirst({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.simulationAccuracySnapshot.findFirst({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.operationalDriftSnapshot.findFirst({
        where: {
          outcomeEngineVersion: OUTCOME_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const [
      workflowOutcomeSamples,
      simulationAccuracySnapshots,
      operationalDriftSnapshots,
    ] = await Promise.all([
      woEvalStamp
        ? this.prisma.workflowOutcomeEvaluation.findMany({
            where: {
              outcomeEngineVersion: OUTCOME_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: woEvalStamp.createdAt,
            },
            orderBy: [
              { effectivenessScore: "asc" },
              { workflowExecutionId: "asc" },
            ],
            take: 40,
            select: {
              workflowExecutionId: true,
              activationId: true,
              evaluationCategory: true,
              evaluationResult: true,
              effectivenessScore: true,
              payloadJson: true,
            },
          })
        : [],
      simAccStamp
        ? this.prisma.simulationAccuracySnapshot.findMany({
            where: {
              outcomeEngineVersion: OUTCOME_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: simAccStamp.createdAt,
            },
            orderBy: [{ workflowExecutionId: "asc" }],
            take: 28,
            select: {
              workflowExecutionId: true,
              simulationScenarioId: true,
              accuracyCategory: true,
              predictedJson: true,
              actualJson: true,
              payloadJson: true,
            },
          })
        : [],
      driftStamp
        ? this.prisma.operationalDriftSnapshot.findMany({
            where: {
              outcomeEngineVersion: OUTCOME_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: driftStamp.createdAt,
            },
            orderBy: [{ severity: "desc" }, { driftCategory: "asc" }],
            take: 32,
            select: {
              driftCategory: true,
              severity: true,
              payloadJson: true,
            },
          })
        : [],
    ]);

    const closedLoopTimes = [
      woEvalStamp?.createdAt.getTime(),
      simAccStamp?.createdAt.getTime(),
      driftStamp?.createdAt.getTime(),
    ].filter((t): t is number => t != null);
    const closedLoopRefreshedAt =
      closedLoopTimes.length === 0 ?
        null
      : new Date(Math.max(...closedLoopTimes)).toISOString();

    const EXP_ENGINE = OPERATIONAL_EXPERIMENT_ENGINE_VERSION;
    const BENCH_ENGINE = WORKFLOW_BENCHMARK_ENGINE_VERSION;

    const [expStamp, benchStamp] = await Promise.all([
      this.prisma.operationalExperimentSnapshot.findFirst({
        where: {
          experimentEngineVersion: EXP_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.workflowBenchmarkScenario.findFirst({
        where: {
          benchmarkEngineVersion: BENCH_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const [experimentSnapshots, benchmarkScenarios] = await Promise.all([
      expStamp
        ? this.prisma.operationalExperimentSnapshot.findMany({
            where: {
              experimentEngineVersion: EXP_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: expStamp.createdAt,
            },
            select: {
              experimentCategory: true,
              evaluationResult: true,
              payloadJson: true,
            },
            orderBy: [{ experimentCategory: "asc" }],
          })
        : [],
      benchStamp
        ? this.prisma.workflowBenchmarkScenario.findMany({
            where: {
              benchmarkEngineVersion: BENCH_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: benchStamp.createdAt,
            },
            select: {
              benchmarkCategory: true,
              benchmarkState: true,
              workflowExecutionId: true,
              simulationScenarioId: true,
              resultJson: true,
            },
            take: 40,
            orderBy: [{ workflowExecutionId: "asc" }],
          })
        : [],
    ]);

    const experimentationTimes = [
      expStamp?.createdAt.getTime(),
      benchStamp?.createdAt.getTime(),
    ].filter((t): t is number => t != null);
    const experimentationRefreshedAt =
      experimentationTimes.length === 0 ?
        null
      : new Date(Math.max(...experimentationTimes)).toISOString();

    const LAB_ENGINE = OPERATIONAL_SIM_LAB_ENGINE_VERSION;
    const CERT_ENGINE = EXPERIMENT_CERTIFICATION_ENGINE_VERSION;
    const CAUSAL_ENGINE = CAUSAL_ATTRIBUTION_ENGINE_VERSION;

    const [labStamp, certStamp, causalStamp] = await Promise.all([
      this.prisma.operationalSimulationLabRun.findFirst({
        where: {
          labEngineVersion: LAB_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.experimentCertificationRecord.findFirst({
        where: {
          certificationEngineVersion: CERT_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.causalAttributionSnapshot.findFirst({
        where: {
          causalEngineVersion: CAUSAL_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const [labRuns, certifications, causalSnapshots] = await Promise.all([
      labStamp
        ? this.prisma.operationalSimulationLabRun.findMany({
            where: {
              labEngineVersion: LAB_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: labStamp.createdAt,
            },
            select: {
              simulationCategory: true,
              benchmarkScenarioId: true,
              simulationState: true,
              payloadJson: true,
              resultJson: true,
            },
            orderBy: [{ id: "asc" }],
            take: 45,
          })
        : [],
      certStamp
        ? this.prisma.experimentCertificationRecord.findMany({
            where: {
              certificationEngineVersion: CERT_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: certStamp.createdAt,
            },
            select: {
              experimentCategory: true,
              certificationState: true,
              evaluationSummary: true,
              payloadJson: true,
            },
            orderBy: [{ experimentCategory: "asc" }],
          })
        : [],
      causalStamp
        ? this.prisma.causalAttributionSnapshot.findMany({
            where: {
              causalEngineVersion: CAUSAL_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: causalStamp.createdAt,
            },
            select: {
              attributionCategory: true,
              attributionResult: true,
              payloadJson: true,
            },
            orderBy: [{ attributionCategory: "asc" }],
          })
        : [],
    ]);

    const simulationLabTimes = [
      labStamp?.createdAt.getTime(),
      certStamp?.createdAt.getTime(),
      causalStamp?.createdAt.getTime(),
    ].filter((t): t is number => t != null);
    const simulationLabRefreshedAt =
      simulationLabTimes.length === 0 ?
        null
      : new Date(Math.max(...simulationLabTimes)).toISOString();

    const LONG_ENGINE = OPERATIONAL_LONGITUDINAL_ENGINE_VERSION;

    const [lineageStamp, counterfactualStamp, replayStamp] = await Promise.all([
      this.prisma.operationalExperimentLineage.findFirst({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.counterfactualEvaluationSnapshot.findFirst({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      this.prisma.operationalReplayAlignment.findFirst({
        where: {
          longitudinalEngineVersion: LONG_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const longitudinalBatchTimes = [
      lineageStamp?.createdAt.getTime(),
      counterfactualStamp?.createdAt.getTime(),
      replayStamp?.createdAt.getTime(),
    ].filter((t): t is number => t != null);
    const longitudinalBatchAt =
      longitudinalBatchTimes.length === 0 ?
        null
      : new Date(Math.max(...longitudinalBatchTimes));

    const [experimentLineage, counterfactualSnapshots, replayAlignments] =
      longitudinalBatchAt ?
        await Promise.all([
          this.prisma.operationalExperimentLineage.findMany({
            where: {
              longitudinalEngineVersion: LONG_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: longitudinalBatchAt,
            },
            select: {
              lineageCategory: true,
              sourceExperimentId: true,
              comparisonExperimentId: true,
              payloadJson: true,
            },
            orderBy: [{ lineageCategory: "asc" }],
            take: 40,
          }),
          this.prisma.counterfactualEvaluationSnapshot.findMany({
            where: {
              longitudinalEngineVersion: LONG_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: longitudinalBatchAt,
            },
            select: {
              evaluationCategory: true,
              comparisonWindow: true,
              payloadJson: true,
            },
            orderBy: [{ evaluationCategory: "asc" }],
          }),
          this.prisma.operationalReplayAlignment.findMany({
            where: {
              longitudinalEngineVersion: LONG_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: longitudinalBatchAt,
            },
            select: {
              replayCategory: true,
              replayState: true,
              payloadJson: true,
            },
            orderBy: [{ replayCategory: "asc" }],
          }),
        ])
      : [[], [], []];

    const longitudinalRefreshedAt =
      longitudinalBatchAt?.toISOString() ?? null;

    const COHORT_ENGINE = OPERATIONAL_COHORT_ENGINE_VERSION;
    const SANDBOX_ENGINE = OPERATIONAL_INTERVENTION_SANDBOX_ENGINE_VERSION;
    const EVAL_ENGINE = INTERVENTION_EVALUATION_ENGINE_VERSION;

    const cohortScienceStamp =
      await this.prisma.operationalCohortSnapshot.findFirst({
        where: {
          cohortEngineVersion: COHORT_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const scienceBatchAt = cohortScienceStamp?.createdAt ?? null;

    const [cohortSnapshots, interventionSandboxes, interventionEvaluations] =
      scienceBatchAt ?
        await Promise.all([
          this.prisma.operationalCohortSnapshot.findMany({
            where: {
              cohortEngineVersion: COHORT_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: scienceBatchAt,
            },
            select: { cohortCategory: true, payloadJson: true },
            orderBy: [{ cohortCategory: "asc" }],
          }),
          this.prisma.operationalInterventionSandbox.findMany({
            where: {
              sandboxEngineVersion: SANDBOX_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: scienceBatchAt,
            },
            select: {
              sandboxCategory: true,
              sandboxState: true,
              workflowExecutionId: true,
              activationId: true,
              payloadJson: true,
              resultJson: true,
            },
            orderBy: [{ workflowExecutionId: "asc" }],
            take: 28,
          }),
          this.prisma.interventionEvaluationSnapshot.findMany({
            where: {
              evaluationEngineVersion: EVAL_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: scienceBatchAt,
            },
            select: {
              evaluationCategory: true,
              evaluationResult: true,
              payloadJson: true,
            },
            orderBy: [{ evaluationCategory: "asc" }],
          }),
        ])
      : [[], [], []];

    const scienceRefreshedAt = scienceBatchAt?.toISOString() ?? null;

    const ASSIGN_ENGINE = OPERATIONAL_INTERVENTION_ASSIGNMENT_ENGINE_VERSION;
    const VALIDITY_CERT_ENGINE = OPERATIONAL_VALIDITY_CERT_ENGINE_VERSION;
    const CTRL_SNAPSHOT_ENGINE = CONTROL_COHORT_ENGINE_VERSION;

    const controlValidityStamp =
      await this.prisma.controlCohortSnapshot.findFirst({
        where: {
          controlCohortEngineVersion: CTRL_SNAPSHOT_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const interventionValidityBatchAt =
      controlValidityStamp?.createdAt ?? null;

    const [
      interventionAssignments,
      controlCohortSnapshotsValidity,
      validityCertifications,
    ] =
      interventionValidityBatchAt ?
        await Promise.all([
          this.prisma.operationalInterventionAssignment.findMany({
            where: {
              assignmentEngineVersion: ASSIGN_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: interventionValidityBatchAt,
            },
            select: {
              assignmentCategory: true,
              cohortType: true,
              workflowExecutionId: true,
              activationId: true,
              assignmentState: true,
              payloadJson: true,
            },
            orderBy: [{ cohortType: "asc" }, { workflowExecutionId: "asc" }],
            take: 28,
          }),
          this.prisma.controlCohortSnapshot.findMany({
            where: {
              controlCohortEngineVersion: CTRL_SNAPSHOT_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: interventionValidityBatchAt,
            },
            select: { cohortCategory: true, payloadJson: true },
            orderBy: [{ cohortCategory: "asc" }],
          }),
          this.prisma.operationalValidityCertification.findMany({
            where: {
              validityEngineVersion: VALIDITY_CERT_ENGINE,
              aggregateWindow: WINDOW,
              createdAt: interventionValidityBatchAt,
            },
            select: {
              certificationCategory: true,
              certificationState: true,
              payloadJson: true,
            },
            orderBy: [{ certificationCategory: "asc" }],
          }),
        ])
      : [[], [], []];

    const interventionValidityRefreshedAt =
      interventionValidityBatchAt?.toISOString() ?? null;

    const INCIDENT_ENGINE = OPERATIONAL_INCIDENT_ENGINE_VERSION;
    const incidentStamp =
      await this.prisma.operationalIncident.findFirst({
        where: {
          incidentEngineVersion: INCIDENT_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const incidentBatchAt = incidentStamp?.createdAt ?? null;

    const operationalIncidentCoordination =
      incidentBatchAt ?
        await this.prisma.operationalIncident.findMany({
          where: {
            incidentEngineVersion: INCIDENT_ENGINE,
            aggregateWindow: WINDOW,
            createdAt: incidentBatchAt,
          },
          orderBy: [{ severity: "asc" }, { incidentCategory: "asc" }],
          take: 12,
          select: {
            id: true,
            incidentCategory: true,
            incidentState: true,
            severity: true,
            payloadJson: true,
            links: {
              select: {
                linkedObjectType: true,
                linkedObjectId: true,
                payloadJson: true,
              },
              orderBy: { linkedObjectId: "asc" },
            },
            trails: {
              select: {
                trailCategory: true,
                payloadJson: true,
              },
              orderBy: { trailCategory: "asc" },
            },
          },
        })
      : [];

    const incidentCommandRefreshedAt =
      incidentBatchAt?.toISOString() ?? null;

    const GRAPH_ENGINE = OPERATIONAL_ENTITY_GRAPH_ENGINE_VERSION;
    const graphStamp =
      await this.prisma.operationalEntityNode.findFirst({
        where: {
          graphEngineVersion: GRAPH_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
    const graphBatchAt = graphStamp?.createdAt ?? null;

    let entityGraphNodes: AdminOperationalIntelligenceDashboard["persistedOperationalEntityGraph"]["nodes"] =
      [];
    let entityGraphEdges: AdminOperationalIntelligenceDashboard["persistedOperationalEntityGraph"]["edges"] =
      [];
    let chronologyFrames: AdminOperationalIntelligenceDashboard["persistedOperationalEntityGraph"]["chronologyFrames"] =
      [];

    if (graphBatchAt) {
      const [n, e, c] = await Promise.all([
        this.prisma.operationalEntityNode.findMany({
          where: {
            graphEngineVersion: GRAPH_ENGINE,
            aggregateWindow: WINDOW,
            createdAt: graphBatchAt,
          },
          orderBy: [{ entityCategory: "asc" }, { idempotencyKey: "asc" }],
          select: {
            id: true,
            entityCategory: true,
            entityState: true,
            idempotencyKey: true,
            payloadJson: true,
          },
        }),
        this.prisma.operationalEntityEdge.findMany({
          where: {
            graphEngineVersion: GRAPH_ENGINE,
            aggregateWindow: WINDOW,
            createdAt: graphBatchAt,
          },
          orderBy: [
            { edgeCategory: "asc" },
            { sourceNodeId: "asc" },
            { targetNodeId: "asc" },
          ],
          select: {
            id: true,
            edgeCategory: true,
            sourceNodeId: true,
            targetNodeId: true,
            payloadJson: true,
          },
        }),
        this.prisma.operationalChronologyFrame.findMany({
          where: {
            graphEngineVersion: GRAPH_ENGINE,
            aggregateWindow: WINDOW,
            createdAt: graphBatchAt,
          },
          orderBy: { createdAt: "asc" },
          select: {
            chronologyCategory: true,
            payloadJson: true,
          },
        }),
      ]);
      entityGraphNodes = n;
      entityGraphEdges = e;
      chronologyFrames = c;
    }

    const entityGraphRefreshedAt =
      graphBatchAt?.toISOString() ?? null;

    const GRAPH_HIST_ENGINE = OPERATIONAL_GRAPH_HISTORY_ENGINE_VERSION;
    const replayHistoryRows =
      await this.prisma.operationalGraphHistory.findMany({
        where: {
          graphHistoryEngineVersion: GRAPH_HIST_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        take: 15,
        select: {
          id: true,
          historyCategory: true,
          payloadJson: true,
          createdAt: true,
          replaySession: {
            select: {
              id: true,
              replayCategory: true,
              replayState: true,
              payloadJson: true,
              topologySnapshot: {
                select: { payloadJson: true },
              },
              interventionBridge: {
                select: { payloadJson: true },
              },
              frames: {
                select: {
                  frameCategory: true,
                  sequenceIndex: true,
                  payloadJson: true,
                },
                orderBy: { sequenceIndex: "asc" },
              },
            },
          },
        },
      });

    const replayTimelineRefreshedAt =
      replayHistoryRows[0]?.createdAt.toISOString() ?? null;

    const replayHistories =
      replayHistoryRows.map((h) => ({
        id: h.id,
        historyCategory: h.historyCategory,
        payloadJson: h.payloadJson,
        createdAt: h.createdAt.toISOString(),
        replaySession:
          h.replaySession ?
            {
              id: h.replaySession.id,
              replayCategory: h.replaySession.replayCategory,
              replayState: h.replaySession.replayState,
              payloadJson: h.replaySession.payloadJson,
              topologySnapshot:
                h.replaySession.topologySnapshot ?
                  { payloadJson: h.replaySession.topologySnapshot.payloadJson }
                : null,
              interventionBridge:
                h.replaySession.interventionBridge ?
                  {
                    payloadJson:
                      h.replaySession.interventionBridge.payloadJson,
                  }
                : null,
              frames: h.replaySession.frames.map((f) => ({
                frameCategory: f.frameCategory,
                sequenceIndex: f.sequenceIndex,
                payloadJson: f.payloadJson,
              })),
            }
          : null,
      }));

    const REPLAY_ANALYSIS_ENGINE =
      OPERATIONAL_REPLAY_ANALYSIS_ENGINE_VERSION;
    const replayDiffRows =
      await this.prisma.operationalReplayDiff.findMany({
        where: {
          replayAnalysisEngineVersion: REPLAY_ANALYSIS_ENGINE,
          aggregateWindow: WINDOW,
        },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          id: true,
          diffCategory: true,
          sourceReplaySessionId: true,
          comparisonReplaySessionId: true,
          payloadJson: true,
          createdAt: true,
          chronologyDeltas: {
            select: {
              id: true,
              deltaCategory: true,
              payloadJson: true,
            },
          },
          interpretation: {
            select: {
              interpretationCategory: true,
              payloadJson: true,
            },
          },
          pairingLineage: {
            select: {
              pairingCategory: true,
              orderedOlderReplaySessionId: true,
              orderedNewerReplaySessionId: true,
              payloadJson: true,
            },
          },
          semanticAlignment: {
            select: { payloadJson: true },
          },
        },
      });

    const replayAnalysisRefreshedAt =
      replayDiffRows[0]?.createdAt.toISOString() ?? null;

    const replayAnalysisDiffs =
      replayDiffRows.map((d) => ({
        id: d.id,
        diffCategory: d.diffCategory,
        sourceReplaySessionId: d.sourceReplaySessionId,
        comparisonReplaySessionId: d.comparisonReplaySessionId,
        payloadJson: d.payloadJson,
        createdAt: d.createdAt.toISOString(),
        chronologyDeltas: d.chronologyDeltas.map((c) => ({
          id: c.id,
          deltaCategory: c.deltaCategory,
          payloadJson: c.payloadJson,
        })),
        interpretation:
          d.interpretation ?
            {
              interpretationCategory:
                d.interpretation.interpretationCategory,
              payloadJson: d.interpretation.payloadJson,
            }
          : null,
        pairingLineage:
          d.pairingLineage ?
            {
              pairingCategory: d.pairingLineage.pairingCategory,
              orderedOlderReplaySessionId:
                d.pairingLineage.orderedOlderReplaySessionId,
              orderedNewerReplaySessionId:
                d.pairingLineage.orderedNewerReplaySessionId,
              payloadJson: d.pairingLineage.payloadJson,
            }
          : null,
        semanticAlignment:
          d.semanticAlignment ?
            { payloadJson: d.semanticAlignment.payloadJson }
          : null,
      }));

    const cronRunsGrouped = await this.cronRunLedger.getLatestRuns(25);
    const warehouseJobRunsRaw =
      cronRunsGrouped[OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME] ?? [];
    const latestJobRuns = warehouseJobRunsRaw.map((r: Record<string, unknown>) => ({
      status: String(r.status ?? ""),
      finishedAt: typeof r.finishedAt === "string" ? r.finishedAt : null,
      metadata: r.metadata,
    }));
    const warehouseOperationalFreshness = classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: refreshedAt?.toISOString() ?? null,
      latestJobRuns,
      nowMs: Date.now(),
    });

    return {
      analyticsGovernanceVersion: OPERATIONAL_ANALYTICS_GOVERNANCE_VERSION,
      analyticsEngineVersion: ENGINE,
      policyEngineAlignment: assertPolicyAnalyticsVersionAlignment(),
      live: {
        portfolio: livePortfolio,
        delivery24h: {
          attempts: deliveryAttempts24h,
          successes: deliverySuccess24h,
        },
        workflowByState,
        paymentAttentionBookings,
        bookingsWithRecurringPlan,
        governanceStepsBlocked7d,
        escalationDensity: {
          open: openEscalations,
          openPerPendingApprovalApprox,
        },
      },
      persisted: {
        aggregateWindow: WINDOW,
        refreshedAt: refreshedAt?.toISOString() ?? null,
        snapshots: persistedSnapshots,
        workflowRollups: persistedRollups,
      },
      deterministicIntelligenceHints,
      persistedVsLiveDrift,
      safeOrchestrationActivationCandidates,
      persistedBalancing: {
        refreshedAt: balancingRefreshedAt,
        aggregateWindow: WINDOW,
        balancingSnapshots: persistedBalancingSnapshots,
        congestionSnapshots: persistedCongestionSnapshots,
      },
      deterministicPrioritizationSignals,
      persistedClosedLoopOperationalIntelligence: {
        refreshedAt: closedLoopRefreshedAt,
        aggregateWindow: WINDOW,
        workflowOutcomeSamples,
        simulationAccuracySnapshots,
        operationalDriftSnapshots,
      },
      persistedOperationalExperimentation: {
        refreshedAt: experimentationRefreshedAt,
        aggregateWindow: WINDOW,
        experimentSnapshots,
        benchmarkScenarios,
      },
      persistedOperationalSimulationLab: {
        refreshedAt: simulationLabRefreshedAt,
        aggregateWindow: WINDOW,
        labRuns,
        certifications,
        causalSnapshots,
      },
      persistedLongitudinalOperationalIntelligence: {
        refreshedAt: longitudinalRefreshedAt,
        aggregateWindow: WINDOW,
        experimentLineage,
        counterfactualSnapshots,
        replayAlignments,
      },
      persistedOperationalScience: {
        refreshedAt: scienceRefreshedAt,
        aggregateWindow: WINDOW,
        cohortSnapshots,
        interventionSandboxes,
        interventionEvaluations,
      },
      persistedOperationalInterventionValidity: {
        refreshedAt: interventionValidityRefreshedAt,
        aggregateWindow: WINDOW,
        interventionAssignments,
        controlCohortSnapshots: controlCohortSnapshotsValidity,
        validityCertifications,
      },
      persistedOperationalIncidentCommand: {
        refreshedAt: incidentCommandRefreshedAt,
        aggregateWindow: WINDOW,
        incidents: operationalIncidentCoordination,
      },
      persistedOperationalEntityGraph: {
        refreshedAt: entityGraphRefreshedAt,
        aggregateWindow: WINDOW,
        nodes: entityGraphNodes,
        edges: entityGraphEdges,
        chronologyFrames,
      },
      persistedOperationalReplayTimeline: {
        refreshedAt: replayTimelineRefreshedAt,
        aggregateWindow: WINDOW,
        histories: replayHistories,
      },
      persistedOperationalReplayAnalysis: {
        refreshedAt: replayAnalysisRefreshedAt,
        aggregateWindow: WINDOW,
        diffs: replayAnalysisDiffs,
      },
      warehouseOperationalFreshness,
    };
  }
}
