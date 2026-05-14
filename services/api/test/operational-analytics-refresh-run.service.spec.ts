import { OperationalAnalyticsRefreshRunStatus } from "@prisma/client";
import {
  OPERATIONAL_ANALYTICS_REFRESH_ALREADY_RUNNING_ERROR_CODE,
  OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_CODE,
  OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_MESSAGE,
  OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_WARNING,
} from "../src/modules/operational-analytics/operational-analytics.constants";
import { OperationalAnalyticsRefreshRunService } from "../src/modules/operational-analytics/operational-analytics-refresh-run.service";

function buildTransactionalPrisma(runHandlers: {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
}) {
  const txClient = {
    operationalAnalyticsRefreshRun: runHandlers,
  };
  return {
    operationalAnalyticsRefreshRun: runHandlers,
    $transaction: jest.fn(async (fn: (tx: typeof txClient) => Promise<unknown>) =>
      fn(txClient),
    ),
  };
}

describe("OperationalAnalyticsRefreshRunService — concurrency + stale reconciliation", () => {
  const cronEnvKey = "ENABLE_OPERATIONAL_ANALYTICS_WAREHOUSE_REFRESH_CRON";

  const freshBase = {
    label: "NOT_REFRESHED" as const,
    warehouseBatchRefreshedAt: null as string | null,
    latestCronStatus: null as string | null,
    lastCronSuccessFinishedAt: null as string | null,
    anchorRefreshedAt: null as string | null,
  };

  const aggMinimal = {
    snapshotsWritten: 2,
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
  };

  function prismaRow(
    id: string,
    startedIso: string,
    status: OperationalAnalyticsRefreshRunStatus,
  ) {
    const startedAt = new Date(startedIso);
    return {
      refreshRunId: id,
      triggerSource: "manual_http",
      requestedByUserId: null as string | null,
      requestedByEmail: null as string | null,
      sourceRoute: "/api/v1/admin/operational-intelligence/refresh-snapshots",
      aggregateWindow: "as_of_now",
      idempotencyKey: null as string | null,
      startedAt,
      finishedAt: startedAt,
      durationMs: 1,
      status,
      beforeFreshnessState: "{}",
      afterFreshnessState: "{}",
      rowsTouchedByWarehouseTable: aggMinimal,
      warnings: [],
      errorCode: null as string | null,
      errorMessage: null as string | null,
      stackHash: null as string | null,
      createdAt: startedAt,
    };
  }

  it("blocks manual refresh when a non-stale started run exists (no create, no aggregation)", async () => {
    const create = jest.fn();
    const updateMany = jest.fn();
    const activeStarted = new Date();
    const findFirst = jest.fn().mockResolvedValue({
      refreshRunId: "running_1",
      startedAt: activeStarted,
    });
    const findMany = jest.fn().mockImplementation(async (args: unknown) => {
      const q = args as { where?: { startedAt?: { lt?: Date } } };
      if (q.where?.startedAt?.lt) return [];
      return [];
    });
    const prisma = buildTransactionalPrisma({
      findMany,
      findFirst,
      create,
      update: jest.fn(),
      updateMany,
    });
    const aggregation = {
      refreshPlatformOperationalSnapshots: jest.fn(async () => aggMinimal),
    };
    const intelligence = {
      getWarehouseOperationalFreshnessSnapshot: jest
        .fn()
        .mockResolvedValue({ ...freshBase }),
    };
    const svc = new OperationalAnalyticsRefreshRunService(
      prisma as never,
      aggregation as never,
      intelligence as never,
    );

    const out = await svc.executeManualWarehouseRefresh({
      aggregateWindow: "as_of_now",
      requestedByUserId: "u1",
      requestedByEmail: "a@b.com",
    });

    expect(out.ok).toBe(false);
    if (!("status" in out) || out.status !== "blocked") throw new Error("blocked");
    expect(out.errorCode).toBe(
      OPERATIONAL_ANALYTICS_REFRESH_ALREADY_RUNNING_ERROR_CODE,
    );
    expect(out.activeRefreshRunId).toBe("running_1");
    expect(typeof out.activeDurationMs).toBe("number");
    expect(out.activeDurationMs).toBeGreaterThanOrEqual(0);
    expect(create).not.toHaveBeenCalled();
    expect(aggregation.refreshPlatformOperationalSnapshots).not.toHaveBeenCalled();
  });

  it("reconciles stale started runs then allows refresh (aggregation runs once)", async () => {
    const oldStarted = new Date(Date.now() - 20 * 60 * 1000);
    let stalePass = 0;
    const findMany = jest.fn().mockImplementation(async (args: unknown) => {
      const q = args as { where?: { startedAt?: { lt?: Date }; status?: string } };
      if (q.where?.startedAt?.lt) {
        stalePass++;
        return stalePass === 1 ?
            [
              {
                refreshRunId: "stale_1",
                startedAt: oldStarted,
                warnings: [],
              },
            ]
          : [];
      }
      return [];
    });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const findFirst = jest.fn().mockResolvedValue(null);
    const create = jest.fn(async () => ({
      refreshRunId: "rid_new",
      startedAt: new Date(),
    }));
    const update = jest.fn(async () => ({}));
    const prisma = buildTransactionalPrisma({
      findMany,
      findFirst,
      create,
      update,
      updateMany,
    });
    const aggregation = {
      refreshPlatformOperationalSnapshots: jest.fn(async () => aggMinimal),
    };
    const intelligence = {
      getWarehouseOperationalFreshnessSnapshot: jest
        .fn()
        .mockResolvedValueOnce({ ...freshBase })
        .mockResolvedValueOnce({ ...freshBase, label: "FRESH" }),
    };
    const svc = new OperationalAnalyticsRefreshRunService(
      prisma as never,
      aggregation as never,
      intelligence as never,
    );

    const out = await svc.executeManualWarehouseRefresh({
      aggregateWindow: "as_of_now",
      requestedByUserId: null,
      requestedByEmail: null,
    });

    expect(out.ok).toBe(true);
    expect(updateMany).toHaveBeenCalled();
    const stalePayload = (updateMany.mock.calls as unknown[][])[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(stalePayload?.data?.errorCode).toBe(
      OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_CODE,
    );
    expect(stalePayload?.data?.errorMessage).toBe(
      OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_MESSAGE,
    );
    expect(stalePayload?.data?.warnings).toEqual(
      expect.arrayContaining([OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_WARNING]),
    );
    expect(aggregation.refreshPlatformOperationalSnapshots).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it("stale reconciliation is idempotent (second pass updates zero rows)", async () => {
    let stalePass = 0;
    const findMany = jest.fn().mockImplementation(async (args: unknown) => {
      const q = args as { where?: { startedAt?: { lt?: Date } } };
      if (q.where?.startedAt?.lt) {
        stalePass++;
        return stalePass === 1 ?
            [
              {
                refreshRunId: "stale_id",
                startedAt: new Date(0),
                warnings: [],
              },
            ]
          : [];
      }
      return [];
    });
    const updateMany = jest.fn().mockResolvedValue({ count: 1 });
    const prisma = buildTransactionalPrisma({
      findMany,
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany,
    });
    const svc = new OperationalAnalyticsRefreshRunService(
      prisma as never,
      {} as never,
      {} as never,
    );

    await prisma.$transaction(async (tx) => {
      const n = await svc.reconcileStaleStartedRunsInTx(tx as never, new Date());
      expect(n).toBe(1);
    });
    await prisma.$transaction(async (tx) => {
      const n = await svc.reconcileStaleStartedRunsInTx(tx as never, new Date());
      expect(n).toBe(0);
    });

    expect(updateMany).toHaveBeenCalledTimes(1);
  });

  it("creates exactly one succeeded run on happy path", async () => {
    const create = jest.fn(async () => ({
      refreshRunId: "rid_ok",
      startedAt: new Date(),
    }));
    const update = jest.fn(async () => ({}));
    const findMany = jest.fn().mockImplementation(async (args: unknown) => {
      const q = args as { where?: { startedAt?: { lt?: Date } } };
      if (q.where?.startedAt?.lt) return [];
      return [];
    });
    const prisma = buildTransactionalPrisma({
      findMany,
      findFirst: jest.fn().mockResolvedValue(null),
      create,
      update,
      updateMany: jest.fn(),
    });
    const aggregation = {
      refreshPlatformOperationalSnapshots: jest.fn(async () => aggMinimal),
    };
    const intelligence = {
      getWarehouseOperationalFreshnessSnapshot: jest
        .fn()
        .mockResolvedValueOnce({ ...freshBase })
        .mockResolvedValueOnce({ ...freshBase, label: "FRESH" }),
    };
    const svc = new OperationalAnalyticsRefreshRunService(
      prisma as never,
      aggregation as never,
      intelligence as never,
    );
    const prevCron = process.env[cronEnvKey];
    delete process.env[cronEnvKey];

    const out = await svc.executeManualWarehouseRefresh({
      aggregateWindow: "as_of_now",
      requestedByUserId: "u1",
      requestedByEmail: "admin@example.com",
    });

    if (prevCron === undefined) delete process.env[cronEnvKey];
    else process.env[cronEnvKey] = prevCron;

    expect(out.ok).toBe(true);
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(process.env[cronEnvKey]).not.toBe("true");
  });

  it("persists failed audit row without raw stack trace content", async () => {
    const create = jest.fn(async () => ({
      refreshRunId: "rid_fail",
      startedAt: new Date(),
    }));
    const update = jest.fn(async () => ({}));
    const findMany = jest.fn().mockImplementation(async (args: unknown) => {
      const q = args as { where?: { startedAt?: { lt?: Date } } };
      if (q.where?.startedAt?.lt) return [];
      return [];
    });
    const prisma = buildTransactionalPrisma({
      findMany,
      findFirst: jest.fn().mockResolvedValue(null),
      create,
      update,
      updateMany: jest.fn(),
    });
    const err = new Error("warehouse_refresh_test_failure");
    err.stack = `Error: warehouse_refresh_test_failure\n    at hidden.ts:1:1`;
    const aggregation = {
      refreshPlatformOperationalSnapshots: jest.fn(async () => {
        throw err;
      }),
    };
    const intelligence = {
      getWarehouseOperationalFreshnessSnapshot: jest
        .fn()
        .mockResolvedValue({ ...freshBase }),
    };
    const svc = new OperationalAnalyticsRefreshRunService(
      prisma as never,
      aggregation as never,
      intelligence as never,
    );
    const out = await svc.executeManualWarehouseRefresh({
      aggregateWindow: "as_of_now",
      requestedByUserId: null,
      requestedByEmail: null,
    });
    expect(out.ok).toBe(false);
    if (out.ok || out.status !== "failed") throw new Error("expected failure");
    expect(out.refreshRunId).toBe("rid_fail");
    expect(create).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    const failCall = (update.mock.calls as unknown[][])[0]?.[0] as {
      data: Record<string, unknown>;
    };
    const payload = failCall?.data;
    expect(payload?.stackHash).toEqual(expect.any(String));
    expect(JSON.stringify(payload)).not.toContain("hidden.ts");
  });

  it("refresh-runs returns newest items, activeRun, stale count, replay classification", async () => {
    const newer = prismaRow(
      "newer",
      "2026-05-10T12:00:00.000Z",
      OperationalAnalyticsRefreshRunStatus.succeeded,
    );
    const older = prismaRow(
      "older",
      "2026-05-09T12:00:00.000Z",
      OperationalAnalyticsRefreshRunStatus.succeeded,
    );
    const activeStarted = new Date("2026-05-11T10:00:00.000Z");
    const findMany = jest.fn().mockImplementation(async (args: unknown) => {
      const q = args as {
        where?: { startedAt?: { lt?: Date }; status?: string };
        orderBy?: { startedAt?: string; finishedAt?: string };
      };
      if (q.where?.startedAt?.lt) return [];
      if (q.where?.status === OperationalAnalyticsRefreshRunStatus.succeeded) {
        return [newer, older];
      }
      if (q.orderBy?.startedAt === "desc") return [newer, older];
      return [];
    });
    const findFirst = jest.fn().mockResolvedValue({
      refreshRunId: "live",
      startedAt: activeStarted,
    });
    const prisma = buildTransactionalPrisma({
      findMany,
      findFirst,
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    });
    const svc = new OperationalAnalyticsRefreshRunService(
      prisma as never,
      {} as never,
      {} as never,
    );
    const listed = await svc.listRefreshRunsWithReplayClassification({
      limit: 10,
    });
    expect(listed.items[0]?.refreshRunId).toBe("newer");
    expect(listed.activeRun?.refreshRunId).toBe("live");
    expect(listed.activeRun?.durationMs).toBeGreaterThanOrEqual(0);
    expect(listed.staleReconciledCount).toBe(0);
    expect(listed.latestReplayClassification).toBe("REPLAY_STABLE");
  });
});
