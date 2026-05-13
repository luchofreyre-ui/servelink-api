import { apiFetch } from "@/lib/api";
import type { PortfolioOrchestrationSummary } from "@/lib/api/adminPortfolioOrchestration";

export type FoLoadBalancingHint = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
};

export type FoOperationalIntelligenceSummary = {
  portfolio: PortfolioOrchestrationSummary;
  bookingsPaymentAttention: number;
  workflowsCompletedLast7d: number;
  loadBalancingHints: FoLoadBalancingHint[];
  closedLoopOutcomeHints: FoLoadBalancingHint[];
  experimentationHints: FoLoadBalancingHint[];
  simulationLabHints: FoLoadBalancingHint[];
  longitudinalHints: FoLoadBalancingHint[];
  operationalScienceHints: FoLoadBalancingHint[];
  interventionValidityHints: FoLoadBalancingHint[];
};

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

export type SafeOrchestrationActivationCandidate = {
  id: string;
  kind: "warehouse_refresh" | "timer_wake_tick" | "execution_review" | "approval_queue_review";
  title: string;
  detail: string;
  suggestedAdminHints: string[];
};

export type DeterministicPrioritizationSignal = {
  id: string;
  severity: "info" | "attention";
  title: string;
  detail: string;
  sortKey: number;
};

export type WarehouseOperationalFreshnessLabel =
  | "NOT_REFRESHED"
  | "FRESH"
  | "STALE"
  | "FAILED"
  | "EMPTY_BUT_VALID";

export type WarehouseOperationalFreshness = {
  label: WarehouseOperationalFreshnessLabel;
  warehouseBatchRefreshedAt: string | null;
  latestCronStatus: string | null;
  lastCronSuccessFinishedAt: string | null;
  anchorRefreshedAt: string | null;
};

export type AdminOperationalIntelligenceDashboard = {
  analyticsGovernanceVersion: string;
  analyticsEngineVersion: string;
  policyEngineAlignment: {
    aligned: boolean;
    analyticsRefsPolicy: string;
    activePolicyEngine: string;
  };
  live: {
    portfolio: PortfolioOrchestrationSummary;
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
    snapshots: Array<{ metricCategory: string; metricKey: string; metricValue: number }>;
    workflowRollups: Array<{
      workflowType: string;
      orchestrationCategory: string;
      countsJson: unknown;
    }>;
  };
  deterministicIntelligenceHints: DeterministicIntelligenceHint[];
  persistedVsLiveDrift: PersistedVsLiveMetricDrift[];
  safeOrchestrationActivationCandidates: SafeOrchestrationActivationCandidate[];
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
  deterministicPrioritizationSignals: DeterministicPrioritizationSignal[];
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
  warehouseOperationalFreshness: WarehouseOperationalFreshness;
};

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function fetchAdminOperationalIntelligenceDashboard(): Promise<AdminOperationalIntelligenceDashboard> {
  const res = await apiFetch("/admin/operational-intelligence/dashboard");
  const body = (await readJson(res)) as {
    ok?: boolean;
    dashboard?: AdminOperationalIntelligenceDashboard;
  } | null;
  if (!res.ok || !body?.ok || !body.dashboard) {
    throw new Error(`Operational intelligence dashboard failed (${res.status})`);
  }
  return body.dashboard;
}

/** Explicit warehouse refresh — server recomputes snapshots (admin-only). */
export async function postOperationalAnalyticsRefreshSnapshots(): Promise<{
  snapshotsWritten: number;
  aggregatesWritten: number;
  balancingSnapshotsWritten?: number;
  workflowCongestionSnapshotsWritten?: number;
  workflowOutcomeEvaluationsWritten?: number;
  simulationAccuracySnapshotsWritten?: number;
  operationalDriftSnapshotsWritten?: number;
  workflowBenchmarkScenariosWritten?: number;
  operationalExperimentSnapshotsWritten?: number;
  simulationLabRunsWritten?: number;
  experimentCertificationsWritten?: number;
  causalAttributionSnapshotsWritten?: number;
  experimentLineageWritten?: number;
  counterfactualSnapshotsWritten?: number;
  replayAlignmentsWritten?: number;
  cohortSnapshotsWritten?: number;
  interventionSandboxesWritten?: number;
  interventionEvaluationsWritten?: number;
  interventionAssignmentsWritten?: number;
  controlCohortSnapshotsWritten?: number;
  validityCertificationsWritten?: number;
  operationalIncidentsWritten?: number;
  operationalIncidentLinksWritten?: number;
  operationalInvestigationTrailsWritten?: number;
  operationalEntityNodesWritten?: number;
  operationalEntityEdgesWritten?: number;
  operationalChronologyFramesWritten?: number;
  operationalGraphHistoryWritten?: number;
  operationalReplaySessionsWritten?: number;
  operationalReplayFramesWritten?: number;
  operationalReplayDiffsWritten?: number;
  operationalChronologyDeltasWritten?: number;
  replayInterpretationSnapshotsWritten?: number;
  operationalReplayPairingsWritten?: number;
  operationalChronologySemanticAlignmentsWritten?: number;
  operationalReplayTopologySnapshotsWritten?: number;
  operationalReplayInterventionBridgesWritten?: number;
}> {
  const res = await apiFetch("/admin/operational-intelligence/refresh-snapshots", {
    method: "POST",
    json: {},
  });
  const body = (await readJson(res)) as {
    ok?: boolean;
    snapshotsWritten?: number;
    aggregatesWritten?: number;
    balancingSnapshotsWritten?: number;
    workflowCongestionSnapshotsWritten?: number;
    workflowOutcomeEvaluationsWritten?: number;
    simulationAccuracySnapshotsWritten?: number;
    operationalDriftSnapshotsWritten?: number;
    workflowBenchmarkScenariosWritten?: number;
    operationalExperimentSnapshotsWritten?: number;
    simulationLabRunsWritten?: number;
    experimentCertificationsWritten?: number;
    causalAttributionSnapshotsWritten?: number;
    experimentLineageWritten?: number;
    counterfactualSnapshotsWritten?: number;
    replayAlignmentsWritten?: number;
    cohortSnapshotsWritten?: number;
    interventionSandboxesWritten?: number;
    interventionEvaluationsWritten?: number;
    interventionAssignmentsWritten?: number;
    controlCohortSnapshotsWritten?: number;
    validityCertificationsWritten?: number;
    operationalIncidentsWritten?: number;
    operationalIncidentLinksWritten?: number;
    operationalInvestigationTrailsWritten?: number;
    operationalEntityNodesWritten?: number;
    operationalEntityEdgesWritten?: number;
    operationalChronologyFramesWritten?: number;
    operationalGraphHistoryWritten?: number;
    operationalReplaySessionsWritten?: number;
    operationalReplayFramesWritten?: number;
    operationalReplayDiffsWritten?: number;
    operationalChronologyDeltasWritten?: number;
    replayInterpretationSnapshotsWritten?: number;
    operationalReplayPairingsWritten?: number;
    operationalChronologySemanticAlignmentsWritten?: number;
    operationalReplayTopologySnapshotsWritten?: number;
    operationalReplayInterventionBridgesWritten?: number;
  } | null;
  if (!res.ok || !body?.ok) {
    throw new Error(`Analytics snapshot refresh failed (${res.status})`);
  }
  return {
    snapshotsWritten: body.snapshotsWritten ?? 0,
    aggregatesWritten: body.aggregatesWritten ?? 0,
    balancingSnapshotsWritten: body.balancingSnapshotsWritten ?? 0,
    workflowCongestionSnapshotsWritten:
      body.workflowCongestionSnapshotsWritten ?? 0,
    workflowOutcomeEvaluationsWritten:
      body.workflowOutcomeEvaluationsWritten ?? 0,
    simulationAccuracySnapshotsWritten:
      body.simulationAccuracySnapshotsWritten ?? 0,
    operationalDriftSnapshotsWritten:
      body.operationalDriftSnapshotsWritten ?? 0,
    workflowBenchmarkScenariosWritten:
      body.workflowBenchmarkScenariosWritten ?? 0,
    operationalExperimentSnapshotsWritten:
      body.operationalExperimentSnapshotsWritten ?? 0,
    simulationLabRunsWritten: body.simulationLabRunsWritten ?? 0,
    experimentCertificationsWritten:
      body.experimentCertificationsWritten ?? 0,
    causalAttributionSnapshotsWritten:
      body.causalAttributionSnapshotsWritten ?? 0,
    experimentLineageWritten: body.experimentLineageWritten ?? 0,
    counterfactualSnapshotsWritten:
      body.counterfactualSnapshotsWritten ?? 0,
    replayAlignmentsWritten: body.replayAlignmentsWritten ?? 0,
    cohortSnapshotsWritten: body.cohortSnapshotsWritten ?? 0,
    interventionSandboxesWritten: body.interventionSandboxesWritten ?? 0,
    interventionEvaluationsWritten: body.interventionEvaluationsWritten ?? 0,
    interventionAssignmentsWritten:
      body.interventionAssignmentsWritten ?? 0,
    controlCohortSnapshotsWritten:
      body.controlCohortSnapshotsWritten ?? 0,
    validityCertificationsWritten:
      body.validityCertificationsWritten ?? 0,
    operationalIncidentsWritten: body.operationalIncidentsWritten ?? 0,
    operationalIncidentLinksWritten:
      body.operationalIncidentLinksWritten ?? 0,
    operationalInvestigationTrailsWritten:
      body.operationalInvestigationTrailsWritten ?? 0,
    operationalEntityNodesWritten:
      body.operationalEntityNodesWritten ?? 0,
    operationalEntityEdgesWritten:
      body.operationalEntityEdgesWritten ?? 0,
    operationalChronologyFramesWritten:
      body.operationalChronologyFramesWritten ?? 0,
    operationalGraphHistoryWritten:
      body.operationalGraphHistoryWritten ?? 0,
    operationalReplaySessionsWritten:
      body.operationalReplaySessionsWritten ?? 0,
    operationalReplayFramesWritten:
      body.operationalReplayFramesWritten ?? 0,
    operationalReplayDiffsWritten:
      body.operationalReplayDiffsWritten ?? 0,
    operationalChronologyDeltasWritten:
      body.operationalChronologyDeltasWritten ?? 0,
    replayInterpretationSnapshotsWritten:
      body.replayInterpretationSnapshotsWritten ?? 0,
    operationalReplayPairingsWritten:
      body.operationalReplayPairingsWritten ?? 0,
    operationalChronologySemanticAlignmentsWritten:
      body.operationalChronologySemanticAlignmentsWritten ?? 0,
    operationalReplayTopologySnapshotsWritten:
      body.operationalReplayTopologySnapshotsWritten ?? 0,
    operationalReplayInterventionBridgesWritten:
      body.operationalReplayInterventionBridgesWritten ?? 0,
  };
}

/** Persist deterministic replay comparison for an arbitrary admin-selected pair (admin-only). */
export async function postOperationalReplayCompareSessions(payload: {
  aggregateWindow?: string;
  olderReplaySessionId: string;
  newerReplaySessionId: string;
}): Promise<{
  ok: boolean;
  aggregateWindow: string;
  operationalReplayDiffId: string;
  reused: boolean;
}> {
  const res = await apiFetch(
    "/admin/operational-intelligence/replay-compare",
    {
      method: "POST",
      json: payload,
    },
  );
  const body = (await readJson(res)) as {
    ok?: boolean;
    aggregateWindow?: string;
    operationalReplayDiffId?: string;
    reused?: boolean;
  } | null;
  if (
    !res.ok ||
    !body?.ok ||
    typeof body.operationalReplayDiffId !== "string" ||
    typeof body.aggregateWindow !== "string"
  ) {
    throw new Error(`Replay compare failed (${res.status})`);
  }
  return {
    ok: true,
    aggregateWindow: body.aggregateWindow,
    operationalReplayDiffId: body.operationalReplayDiffId,
    reused: Boolean(body.reused),
  };
}

export async function fetchFoOperationalIntelligenceSummary(): Promise<FoOperationalIntelligenceSummary> {
  const res = await apiFetch("/fo/operational-intelligence/summary");
  const body = (await readJson(res)) as {
    kind?: string;
    summary?: FoOperationalIntelligenceSummary;
  } | null;
  if (!res.ok) {
    throw new Error(`FO operational intelligence failed (${res.status})`);
  }
  if (
    body &&
    typeof body === "object" &&
    body.kind === "fo_operational_intelligence_summary" &&
    body.summary &&
    typeof body.summary === "object"
  ) {
    return {
      ...body.summary,
      loadBalancingHints: body.summary.loadBalancingHints ?? [],
      closedLoopOutcomeHints: body.summary.closedLoopOutcomeHints ?? [],
      experimentationHints: body.summary.experimentationHints ?? [],
      simulationLabHints: body.summary.simulationLabHints ?? [],
      longitudinalHints: body.summary.longitudinalHints ?? [],
      operationalScienceHints: body.summary.operationalScienceHints ?? [],
      interventionValidityHints: body.summary.interventionValidityHints ?? [],
    };
  }
  throw new Error("Unexpected FO operational intelligence response.");
}
