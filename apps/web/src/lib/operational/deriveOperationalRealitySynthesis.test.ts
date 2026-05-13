import type { PortfolioOrchestrationSummary } from "@/lib/api/adminPortfolioOrchestration";
import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { describe, expect, it } from "vitest";
import { buildOperationalRealitySynthesis } from "./deriveOperationalRealitySynthesis";

const ZERO_SAFETY: PortfolioOrchestrationSummary["orchestrationSafety"] = {
  activationsRegistered: 0,
  activationsApprovedForInvoke: 0,
  activationsFailed: 0,
  dryRunsFailedLast24h: 0,
  safetyEvaluationsAttentionLast24h: 0,
  simulationsCompletedLast24h: 0,
  deliveryAttemptsLast24h: null,
  deliverySuccessesLast24h: null,
};

function zeroPortfolio(): PortfolioOrchestrationSummary {
  return {
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
    orchestrationSafety: ZERO_SAFETY,
  };
}

/** Narrow fixture — fields referenced by buildOperationalRealitySynthesis only. */
function realityDash(
  patch: Partial<AdminOperationalIntelligenceDashboard>,
): AdminOperationalIntelligenceDashboard {
  const base = {
    live: {
      portfolio: zeroPortfolio(),
      escalationDensity: { open: 0, openPerPendingApprovalApprox: 0 },
      delivery24h: { attempts: 0, successes: 0 },
      workflowByState: {} as Record<string, number>,
      paymentAttentionBookings: 0,
      bookingsWithRecurringPlan: 0,
      governanceStepsBlocked7d: 0,
    },
    persisted: {
      aggregateWindow: "7d",
      refreshedAt: "2026-01-01T00:00:00.000Z",
      snapshots: [],
      workflowRollups: [],
    },
    persistedVsLiveDrift: [],
    persistedBalancing: {
      refreshedAt: null,
      aggregateWindow: "",
      balancingSnapshots: [],
      congestionSnapshots: [],
    },
    persistedOperationalReplayTimeline: {
      refreshedAt: null,
      aggregateWindow: "",
      histories: [],
    },
    persistedOperationalReplayAnalysis: {
      refreshedAt: null,
      aggregateWindow: "",
      diffs: [],
    },
    persistedOperationalEntityGraph: {
      refreshedAt: null,
      aggregateWindow: "",
      nodes: [],
      edges: [],
    },
    persistedOperationalIncidentCommand: {
      refreshedAt: null,
      aggregateWindow: "",
      incidents: [],
    },
    persistedOperationalScience: {
      refreshedAt: null,
      aggregateWindow: "",
      cohortSnapshots: [],
      interventionSandboxes: [],
      interventionEvaluations: [],
    },
    persistedOperationalInterventionValidity: {
      refreshedAt: null,
      aggregateWindow: "",
      interventionAssignments: [],
      controlCohortSnapshots: [],
      validityCertifications: [],
    },
    persistedOperationalExperimentation: {
      refreshedAt: null,
      aggregateWindow: "",
      experimentSnapshots: [],
      benchmarkScenarios: [],
    },
    warehouseOperationalFreshness: {
      label: "FRESH",
      warehouseBatchRefreshedAt: "2026-01-01T00:00:00.000Z",
      latestCronStatus: null,
      lastCronSuccessFinishedAt: null,
      anchorRefreshedAt: "2026-01-01T00:00:00.000Z",
    },
  };

  return {
    ...(base as unknown as AdminOperationalIntelligenceDashboard),
    ...patch,
    live: {
      ...(base.live as AdminOperationalIntelligenceDashboard["live"]),
      ...(patch.live ?? {}),
      portfolio: {
        ...zeroPortfolio(),
        ...(patch.live?.portfolio ?? {}),
      },
      escalationDensity: {
        ...base.live.escalationDensity,
        ...(patch.live?.escalationDensity ?? {}),
      },
      delivery24h: {
        ...base.live.delivery24h,
        ...(patch.live?.delivery24h ?? {}),
      },
    },
    persisted: {
      ...base.persisted,
      ...(patch.persisted ?? {}),
    },
    persistedVsLiveDrift: patch.persistedVsLiveDrift ?? base.persistedVsLiveDrift,
    persistedBalancing: {
      ...base.persistedBalancing,
      ...(patch.persistedBalancing ?? {}),
    },
    persistedOperationalReplayTimeline: {
      ...base.persistedOperationalReplayTimeline,
      ...(patch.persistedOperationalReplayTimeline ?? {}),
    },
    persistedOperationalReplayAnalysis: {
      ...base.persistedOperationalReplayAnalysis,
      ...(patch.persistedOperationalReplayAnalysis ?? {}),
    },
    persistedOperationalEntityGraph: {
      ...base.persistedOperationalEntityGraph,
      ...(patch.persistedOperationalEntityGraph ?? {}),
    },
    persistedOperationalIncidentCommand: {
      ...base.persistedOperationalIncidentCommand,
      ...(patch.persistedOperationalIncidentCommand ?? {}),
    },
    persistedOperationalScience: {
      ...base.persistedOperationalScience,
      ...(patch.persistedOperationalScience ?? {}),
    },
    persistedOperationalInterventionValidity: {
      ...base.persistedOperationalInterventionValidity,
      ...(patch.persistedOperationalInterventionValidity ?? {}),
    },
    persistedOperationalExperimentation: {
      ...base.persistedOperationalExperimentation,
      ...(patch.persistedOperationalExperimentation ?? {}),
    },
  } as AdminOperationalIntelligenceDashboard;
}

describe("buildOperationalRealitySynthesis", () => {
  it("returns empty pillars and hydration guidance when dashboard is null", () => {
    const r = buildOperationalRealitySynthesis(null);
    expect(r.pillars).toHaveLength(0);
    expect(r.tacticalWhyLines).toHaveLength(0);
    expect(r.hydrationNote).toMatch(/hydrate/i);
  });

  it("emits five deterministic pillars for a hydrated dashboard shell", () => {
    const r = buildOperationalRealitySynthesis(realityDash({}));
    expect(r.hydrationNote).toBeNull();
    expect(r.pillars.map((p) => p.id)).toEqual([
      "pillar_live_orchestration",
      "pillar_warehouse_timing",
      "pillar_replay",
      "pillar_graph",
      "pillar_science_validity",
    ]);
  });

  it("adds a governance-facing tactical line when portfolio reports blocked workflows", () => {
    const r = buildOperationalRealitySynthesis(
      realityDash({
        live: {
          portfolio: { workflowsGovernanceBlocked: 2 },
        },
      }),
    );
    expect(
      r.tacticalWhyLines.some((line) =>
        line.toLowerCase().includes("governance-blocked"),
      ),
    ).toBe(true);
  });

  it("notes multi-batch replay when two histories exist", () => {
    const r = buildOperationalRealitySynthesis(
      realityDash({
        persistedOperationalReplayTimeline: {
          histories: [
            {
              id: "h1",
              historyCategory: "batch_a",
              payloadJson: { batchCreatedAtIso: "2026-01-01T00:00:00.000Z" },
              createdAt: "2026-01-01T00:00:00.000Z",
            },
            {
              id: "h2",
              historyCategory: "batch_b",
              payloadJson: { batchCreatedAtIso: "2026-01-02T00:00:00.000Z" },
              createdAt: "2026-01-02T00:00:00.000Z",
            },
          ],
        },
      }),
    );
    expect(
      r.tacticalWhyLines.some((line) => line.includes("Several archived batches")),
    ).toBe(true);
  });
});
