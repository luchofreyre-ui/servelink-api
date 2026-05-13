import { OperationalAnalyticsWarehouseRefreshCronService } from "../src/modules/operational-analytics/operational-analytics-warehouse-refresh.cron";
import { OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME } from "../src/modules/operational-analytics/operational-analytics.constants";

describe("OperationalAnalyticsWarehouseRefreshCronService", () => {
  const envKey = "ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON";
  const prev = process.env[envKey];

  afterEach(() => {
    if (prev === undefined) delete process.env[envKey];
    else process.env[envKey] = prev;
  });

  function mockLedger() {
    return {
      recordSkipped: jest.fn(async () => undefined),
      recordStarted: jest.fn(async () => "ledger_1"),
      recordSucceeded: jest.fn(async () => undefined),
      recordFailed: jest.fn(async () => undefined),
    };
  }

  it("does not call refresh when env flag is not exactly true", async () => {
    delete process.env[envKey];
    const ledger = mockLedger();
    const refresh = jest.fn();
    const svc = new OperationalAnalyticsWarehouseRefreshCronService(
      { refreshPlatformOperationalSnapshots: refresh } as never,
      ledger as never,
    );
    await svc.tick();
    expect(ledger.recordSkipped).toHaveBeenCalledWith(
      OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON_JOB_NAME,
      "disabled_by_env",
      expect.objectContaining({
        envFlag: envKey,
      }),
    );
    expect(refresh).not.toHaveBeenCalled();
    expect(ledger.recordStarted).not.toHaveBeenCalled();
  });

  it("calls refresh once and records metadata on success when enabled", async () => {
    process.env[envKey] = "true";
    const ledger = mockLedger();
    const result = {
      snapshotsWritten: 3,
      aggregatesWritten: 2,
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
    const refresh = jest.fn(async () => result);
    const svc = new OperationalAnalyticsWarehouseRefreshCronService(
      { refreshPlatformOperationalSnapshots: refresh } as never,
      ledger as never,
    );
    await svc.tick();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(ledger.recordSucceeded).toHaveBeenCalledWith(
      "ledger_1",
      expect.objectContaining({
        snapshotsWritten: 3,
        aggregatesWritten: 2,
        operationalReplaySessionsWritten: 0,
      }),
    );
  });

  it("records failure without throwing", async () => {
    process.env[envKey] = "true";
    const ledger = mockLedger();
    const refresh = jest.fn(async () => {
      throw new Error("warehouse_refresh_test_failure");
    });
    const svc = new OperationalAnalyticsWarehouseRefreshCronService(
      { refreshPlatformOperationalSnapshots: refresh } as never,
      ledger as never,
    );
    await expect(svc.tick()).resolves.toBeUndefined();
    expect(ledger.recordFailed).toHaveBeenCalledWith(
      "ledger_1",
      expect.any(Error),
      expect.objectContaining({ aggregateWindow: "as_of_now" }),
    );
  });
});
