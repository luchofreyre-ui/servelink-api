import {
  classifyWarehouseOperationalFreshness,
  warehouseCronSuccessHasAllZeroCounters,
} from "../src/modules/operational-analytics/warehouse-operational-freshness";

const metaAllZero = {
  snapshotsWritten: 0,
  aggregatesWritten: 0,
  operationalReplaySessionsWritten: 0,
  operationalReplayDiffsWritten: 0,
  operationalEntityNodesWritten: 0,
  operationalEntityEdgesWritten: 0,
  cohortSnapshotsWritten: 0,
  operationalExperimentSnapshotsWritten: 0,
  interventionSandboxesWritten: 0,
  interventionAssignmentsWritten: 0,
  validityCertificationsWritten: 0,
};

describe("classifyWarehouseOperationalFreshness", () => {
  it("returns FAILED when latest cron row failed", () => {
    const r = classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: "2030-01-01T00:00:00.000Z",
      latestJobRuns: [
        { status: "failed", finishedAt: "2030-01-02T12:00:00.000Z", metadata: {} },
        { status: "succeeded", finishedAt: "2030-01-01T11:00:00.000Z", metadata: { snapshotsWritten: 2 } },
      ],
      nowMs: new Date("2030-01-02T12:05:00.000Z").getTime(),
    });
    expect(r.label).toBe("FAILED");
  });

  it("returns EMPTY_BUT_VALID when last success has zero counters", () => {
    const r = classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: null,
      latestJobRuns: [
        {
          status: "succeeded",
          finishedAt: "2030-01-02T11:00:00.000Z",
          metadata: metaAllZero,
        },
      ],
      nowMs: new Date("2030-01-02T11:30:00.000Z").getTime(),
    });
    expect(r.label).toBe("EMPTY_BUT_VALID");
  });

  it("returns NOT_REFRESHED without batch stamp and without success anchor", () => {
    const r = classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: null,
      latestJobRuns: [{ status: "skipped", finishedAt: "2030-01-02T10:00:00.000Z", metadata: {} }],
      nowMs: new Date("2030-01-02T12:00:00.000Z").getTime(),
    });
    expect(r.label).toBe("NOT_REFRESHED");
  });

  it("returns FRESH when anchor within 60 minutes", () => {
    const r = classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: "2030-01-02T11:30:00.000Z",
      latestJobRuns: [],
      nowMs: new Date("2030-01-02T12:00:00.000Z").getTime(),
    });
    expect(r.label).toBe("FRESH");
  });

  it("returns STALE when anchor older than 60 minutes", () => {
    const r = classifyWarehouseOperationalFreshness({
      warehouseBatchRefreshedAt: "2030-01-02T09:00:00.000Z",
      latestJobRuns: [],
      nowMs: new Date("2030-01-02T12:00:00.000Z").getTime(),
    });
    expect(r.label).toBe("STALE");
  });
});

describe("warehouseCronSuccessHasAllZeroCounters", () => {
  it("accepts full zero metadata", () => {
    expect(warehouseCronSuccessHasAllZeroCounters(metaAllZero)).toBe(true);
  });

  it("rejects partial metadata", () => {
    expect(warehouseCronSuccessHasAllZeroCounters({ snapshotsWritten: 0 })).toBe(false);
  });
});
