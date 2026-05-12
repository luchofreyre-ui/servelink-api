import type { AdminOperationalIntelligenceDashboard } from "@/lib/api/operationalIntelligence";
import { describe, expect, it } from "vitest";
import { buildSituationPostureTiles } from "./deriveOperationalSituationPosture";

/** Narrow fixture — only fields referenced by buildSituationPostureTiles. */
function cockpitDash(
  patch: Partial<AdminOperationalIntelligenceDashboard>,
): AdminOperationalIntelligenceDashboard {
  const base = {
    live: {
      portfolio: {
        workflowsGovernanceBlocked: 0,
        overdueWorkflowTimers: 0,
        workflowsWaitingApproval: 0,
        pendingApprovals: 1,
        policyAttentionEvaluations: 0,
      },
      escalationDensity: { open: 0, openPerPendingApprovalApprox: 0 },
      delivery24h: { attempts: 0, successes: 0 },
      governanceStepsBlocked7d: 0,
      workflowByState: {} as Record<string, number>,
      paymentAttentionBookings: 0,
      bookingsWithRecurringPlan: 0,
    },
    persistedBalancing: {
      balancingSnapshots: [] as Array<{ severity: string }>,
      congestionSnapshots: [] as Array<{ severity: string }>,
    },
    persistedOperationalReplayAnalysis: {
      diffs: [] as AdminOperationalIntelligenceDashboard["persistedOperationalReplayAnalysis"]["diffs"],
    },
    persistedOperationalReplayTimeline: {
      histories: [] as AdminOperationalIntelligenceDashboard["persistedOperationalReplayTimeline"]["histories"],
    },
    persistedOperationalInterventionValidity: {
      interventionAssignments: [] as unknown[],
      validityCertifications: [] as Array<{ certificationState: string }>,
    },
  };

  return {
    ...(base as unknown as AdminOperationalIntelligenceDashboard),
    ...patch,
    live: {
      ...(base.live as AdminOperationalIntelligenceDashboard["live"]),
      ...(patch.live ?? {}),
      portfolio: {
        ...(base.live.portfolio as AdminOperationalIntelligenceDashboard["live"]["portfolio"]),
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
    persistedBalancing: {
      ...base.persistedBalancing,
      ...(patch.persistedBalancing ?? {}),
    },
    persistedOperationalReplayAnalysis: {
      ...base.persistedOperationalReplayAnalysis,
      ...(patch.persistedOperationalReplayAnalysis ?? {}),
    },
    persistedOperationalReplayTimeline: {
      ...base.persistedOperationalReplayTimeline,
      ...(patch.persistedOperationalReplayTimeline ?? {}),
    },
    persistedOperationalInterventionValidity: {
      ...base.persistedOperationalInterventionValidity,
      ...(patch.persistedOperationalInterventionValidity ?? {}),
    },
  } as AdminOperationalIntelligenceDashboard;
}

describe("buildSituationPostureTiles", () => {
  it("marks orchestration pressure when governance-blocked executions exist", () => {
    const tiles = buildSituationPostureTiles(
      cockpitDash({
        live: {
          portfolio: { workflowsGovernanceBlocked: 2 },
        },
      }),
    );
    const orch = tiles.find((t) => t.id === "sit_orchestration_posture");
    expect(orch?.tone).toBe("pressure");
  });

  it("marks replay watch when latest diff shows chronology category deltas", () => {
    const tiles = buildSituationPostureTiles(
      cockpitDash({
        persistedOperationalReplayAnalysis: {
          diffs: [
            {
              id: "d1",
              diffCategory: "test",
              sourceReplaySessionId: "a",
              comparisonReplaySessionId: "b",
              payloadJson: {
                chronologySlotsWithCategoryChange: 1,
                nodeCountDelta: 0,
              },
              createdAt: "2026-01-01T00:00:00.000Z",
              chronologyDeltas: [],
              interpretation: null,
              pairingLineage: null,
              semanticAlignment: null,
            },
          ],
        },
      }),
    );
    const replay = tiles.find((t) => t.id === "sit_replay_anomaly");
    expect(replay?.tone).toBe("watch");
  });
});
