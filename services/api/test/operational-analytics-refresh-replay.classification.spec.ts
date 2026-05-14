import {
  classifyOperationalAnalyticsReplayForSuccessfulPair,
  classifyOperationalAnalyticsReplayFromSuccessfulRuns,
} from "../src/modules/operational-analytics/operational-analytics-refresh-replay.classification";

function warehouseRows(
  overrides: Record<string, number> = {},
): Record<string, number> {
  return {
    snapshotsWritten: 1,
    aggregatesWritten: 1,
    balancingSnapshotsWritten: 0,
    workflowCongestionSnapshotsWritten: 0,
    workflowOutcomeEvaluationsWritten: 0,
    simulationAccuracySnapshotsWritten: 0,
    operationalDriftSnapshotsWritten: 0,
    workflowBenchmarkScenariosWritten: 0,
    operationalExperimentSnapshotsWritten: 0,
    simulationLabRunsWritten: 0,
    experimentCertificationsWritten: 0,
    causalAttributionSnapshotsWritten: 0,
    experimentLineageWritten: 0,
    counterfactualSnapshotsWritten: 0,
    replayAlignmentsWritten: 0,
    cohortSnapshotsWritten: 0,
    interventionSandboxesWritten: 0,
    interventionEvaluationsWritten: 0,
    interventionAssignmentsWritten: 0,
    controlCohortSnapshotsWritten: 0,
    validityCertificationsWritten: 0,
    operationalIncidentsWritten: 0,
    operationalIncidentLinksWritten: 0,
    operationalInvestigationTrailsWritten: 0,
    operationalEntityNodesWritten: 0,
    operationalEntityEdgesWritten: 0,
    operationalChronologyFramesWritten: 0,
    operationalGraphHistoryWritten: 0,
    operationalReplaySessionsWritten: 0,
    operationalReplayFramesWritten: 0,
    operationalReplayDiffsWritten: 0,
    operationalChronologyDeltasWritten: 0,
    replayInterpretationSnapshotsWritten: 0,
    operationalReplayPairingsWritten: 0,
    operationalChronologySemanticAlignmentsWritten: 0,
    operationalReplayTopologySnapshotsWritten: 0,
    operationalReplayInterventionBridgesWritten: 0,
    ...overrides,
  };
}

describe("operational-analytics-refresh-replay.classification", () => {
  it("returns NO_PRIOR_SUCCESS when fewer than two successful runs", () => {
    expect(classifyOperationalAnalyticsReplayFromSuccessfulRuns([])).toBe(
      "NO_PRIOR_SUCCESS",
    );
    expect(
      classifyOperationalAnalyticsReplayFromSuccessfulRuns([
        {
          afterFreshnessState: '{"label":"FRESH"}',
          rowsTouchedByWarehouseTable: warehouseRows(),
        },
      ]),
    ).toBe("NO_PRIOR_SUCCESS");
  });

  it("returns REPLAY_FAILED when counters are malformed", () => {
    expect(
      classifyOperationalAnalyticsReplayForSuccessfulPair({
        newerAfterFreshnessState: "{}",
        olderAfterFreshnessState: "{}",
        newerRows: { snapshotsWritten: "x" },
        olderRows: warehouseRows(),
      }),
    ).toBe("REPLAY_FAILED");
  });

  it("returns REPLAY_STABLE when freshness and full counters match", () => {
    const freshness = '{"label":"FRESH"}';
    const rows = warehouseRows();
    expect(
      classifyOperationalAnalyticsReplayForSuccessfulPair({
        newerAfterFreshnessState: freshness,
        olderAfterFreshnessState: freshness,
        newerRows: rows,
        olderRows: { ...rows },
      }),
    ).toBe("REPLAY_STABLE");
  });

  it("returns REPLAY_CHANGED_WITHOUT_SOURCE_COUNTER_DELTA when freshness changes but source snapshot counters match", () => {
    const rows = warehouseRows({ snapshotsWritten: 5 });
    expect(
      classifyOperationalAnalyticsReplayForSuccessfulPair({
        newerAfterFreshnessState: '{"label":"STALE"}',
        olderAfterFreshnessState: '{"label":"FRESH"}',
        newerRows: rows,
        olderRows: { ...rows },
      }),
    ).toBe("REPLAY_CHANGED_WITHOUT_SOURCE_COUNTER_DELTA");
  });

  it("returns REPLAY_CHANGED_WITH_SOURCE_COUNTER_DELTA when source metadata counters drift", () => {
    const freshness = '{"label":"FRESH"}';
    expect(
      classifyOperationalAnalyticsReplayForSuccessfulPair({
        newerAfterFreshnessState: freshness,
        olderAfterFreshnessState: freshness,
        newerRows: warehouseRows({ snapshotsWritten: 2 }),
        olderRows: warehouseRows({ snapshotsWritten: 1 }),
      }),
    ).toBe("REPLAY_CHANGED_WITH_SOURCE_COUNTER_DELTA");
  });
});
