import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { describe, expect, it } from "vitest";
import { buildOperationalAttentionSignals } from "./buildOperationalAttentionSignals";

function baseDashboard(): AdminOperationalIntelligenceDashboard {
  const orchestrationSafety = {
    activationsRegistered: 0,
    activationsApprovedForInvoke: 0,
    activationsFailed: 0,
    dryRunsFailedLast24h: 0,
    safetyEvaluationsAttentionLast24h: 0,
    simulationsCompletedLast24h: 0,
    deliveryAttemptsLast24h: null,
    deliverySuccessesLast24h: null,
  };

  const portfolio = {
    workflowsWaitingApproval: 0,
    workflowsGovernanceBlocked: 0,
    pendingApprovals: 0,
    openEscalations: 0,
    policyAttentionEvaluations: 0,
    workflowsRunning: 0,
    workflowsPendingState: 0,
    waitingApprovalWorkflowsAged24hPlus: 0,
    waitingApprovalWorkflowsAged72hPlus: 0,
    oldestPendingApprovalRequestedAt: null,
    pendingApprovalsAged48hPlus: 0,
    openEscalationsAged24hPlus: 0,
    pendingWorkflowTimers: 0,
    overdueWorkflowTimers: 0,
    activeWorkflowWaits: 0,
    bookingsWithRecurringPlan: 0,
    orchestrationSafety,
  };

  return {
    analyticsGovernanceVersion: "governance_v1",
    analyticsEngineVersion: "analytics_v1",
    policyEngineAlignment: {
      aligned: true,
      analyticsRefsPolicy: "policy_ref",
      activePolicyEngine: "policy_ref",
    },
    live: {
      portfolio,
      delivery24h: { attempts: 0, successes: 0 },
      workflowByState: {},
      paymentAttentionBookings: 0,
      bookingsWithRecurringPlan: 0,
      governanceStepsBlocked7d: 0,
      escalationDensity: { open: 0, openPerPendingApprovalApprox: 0 },
    },
    persisted: {
      aggregateWindow: "as_of_now",
      refreshedAt: "2026-01-01T00:00:00.000Z",
      snapshots: [],
      workflowRollups: [],
    },
    deterministicIntelligenceHints: [],
    persistedVsLiveDrift: [],
    safeOrchestrationActivationCandidates: [],
    persistedBalancing: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      balancingSnapshots: [],
      congestionSnapshots: [],
    },
    deterministicPrioritizationSignals: [],
    persistedClosedLoopOperationalIntelligence: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      workflowOutcomeSamples: [],
      simulationAccuracySnapshots: [],
      operationalDriftSnapshots: [],
    },
    persistedOperationalExperimentation: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      experimentSnapshots: [],
      benchmarkScenarios: [],
    },
    persistedOperationalSimulationLab: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      labRuns: [],
      certifications: [],
      causalSnapshots: [],
    },
    persistedLongitudinalOperationalIntelligence: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      experimentLineage: [],
      counterfactualSnapshots: [],
      replayAlignments: [],
    },
    persistedOperationalScience: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      cohortSnapshots: [],
      interventionSandboxes: [],
      interventionEvaluations: [],
    },
    persistedOperationalInterventionValidity: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      interventionAssignments: [],
      controlCohortSnapshots: [],
      validityCertifications: [],
    },
    persistedOperationalIncidentCommand: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      incidents: [],
    },
    persistedOperationalEntityGraph: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      nodes: [],
      edges: [],
      chronologyFrames: [],
    },
    persistedOperationalReplayTimeline: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      histories: [],
    },
    persistedOperationalReplayAnalysis: {
      refreshedAt: null,
      aggregateWindow: "as_of_now",
      diffs: [],
    },
  };
}

describe("buildOperationalAttentionSignals", () => {
  it("surfaces governance-blocked executions deterministically", () => {
    const dash = baseDashboard();
    dash.live.portfolio.workflowsGovernanceBlocked = 2;
    const rows = buildOperationalAttentionSignals(dash);
    expect(rows.some((r) => r.id === "governance_blocked_executions")).toBe(
      true,
    );
    expect(rows[0]?.severity).toBe("attention");
  });

  it("sorts attention before informational signals", () => {
    const dash = baseDashboard();
    dash.persisted.refreshedAt = null;
    dash.live.portfolio.workflowsGovernanceBlocked = 1;
    const rows = buildOperationalAttentionSignals(dash);
    const firstInfoIdx = rows.findIndex((r) => r.severity === "info");
    const lastAttentionIdx = rows.map((r) => r.severity).lastIndexOf("attention");
    expect(firstInfoIdx).toBeGreaterThan(-1);
    expect(lastAttentionIdx).toBeLessThan(firstInfoIdx);
  });
});
