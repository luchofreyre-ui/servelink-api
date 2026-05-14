import { createHash } from "crypto";
import { Injectable } from "@nestjs/common";
import {
  OperationalAnalyticsRefreshRunStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { OperationalAnalyticsAggregationService } from "./operational-analytics-aggregation.service";
import { OperationalIntelligenceQueryService } from "./operational-intelligence-query.service";
import {
  classifyOperationalAnalyticsReplayFromSuccessfulRuns,
  type OperationalAnalyticsReplayClassification,
} from "./operational-analytics-refresh-replay.classification";
import {
  OPERATIONAL_ANALYTICS_REFRESH_ALREADY_RUNNING_ERROR_CODE,
  OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_CODE,
  OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_MESSAGE,
  OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_WARNING,
  OPERATIONAL_ANALYTICS_REFRESH_STARTED_STALE_AFTER_MS,
} from "./operational-analytics.constants";
import { serializeWarehouseOperationalFreshness } from "./warehouse-operational-freshness";

const MANUAL_REFRESH_SOURCE_ROUTE =
  "/api/v1/admin/operational-intelligence/refresh-snapshots";

export type WarehouseRefreshAggregationCounts =
  Awaited<
    ReturnType<
      OperationalAnalyticsAggregationService["refreshPlatformOperationalSnapshots"]
    >
  >;

export type ManualWarehouseRefreshSuccessEnvelope = {
  ok: true;
  refreshRunId: string;
  status: "succeeded";
  aggregateWindow: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  beforeFreshnessState: string;
  afterFreshnessState: string;
  rowsTouchedByWarehouseTable: Record<string, number>;
  warnings: string[];
} & WarehouseRefreshAggregationCounts;

export type ManualWarehouseRefreshFailureEnvelope = {
  ok: false;
  refreshRunId: string;
  status: "failed";
  aggregateWindow: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  errorCode: string;
  errorMessage: string;
};

export type ManualWarehouseRefreshBlockedEnvelope = {
  ok: false;
  status: "blocked";
  errorCode: typeof OPERATIONAL_ANALYTICS_REFRESH_ALREADY_RUNNING_ERROR_CODE;
  activeRefreshRunId: string;
  activeStartedAt: string;
  activeDurationMs: number;
};

export type ManualWarehouseRefreshOutcome =
  | ManualWarehouseRefreshSuccessEnvelope
  | ManualWarehouseRefreshFailureEnvelope
  | ManualWarehouseRefreshBlockedEnvelope;

function stableStackHash(parts: { errorCode: string; errorMessage: string }): string {
  return createHash("sha256")
    .update(`${parts.errorCode}\n${parts.errorMessage}`)
    .digest("hex");
}

function deterministicIdempotencyFingerprint(args: {
  requestedByUserId: string | null;
  aggregateWindow: string;
  startedAtIso: string;
}): string {
  return createHash("sha256")
    .update(
      `${args.requestedByUserId ?? ""}|${args.aggregateWindow}|${args.startedAtIso}`,
    )
    .digest("hex");
}

function rowsTouchedFromRefreshResult(result: Record<string, unknown>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(result)) {
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = v;
    }
  }
  return out;
}

function normalizeWarningsJson(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string") out.push(item);
  }
  return out;
}

function mergeWarningsJson(
  existing: Prisma.JsonValue,
  additions: string[],
): Prisma.InputJsonValue {
  const merged = [...normalizeWarningsJson(existing)];
  for (const a of additions) {
    if (!merged.includes(a)) merged.push(a);
  }
  return merged as unknown as Prisma.InputJsonValue;
}

function isPrismaSerializationFailure(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === "P2034"
  );
}

type RefreshRunListItem = {
  refreshRunId: string;
  triggerSource: string;
  requestedByEmail: string | null;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  status: OperationalAnalyticsRefreshRunStatus;
  beforeFreshnessState: string;
  afterFreshnessState: string | null;
  rowsTouchedByWarehouseTable: Record<string, number> | null;
  warnings: string[];
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
};

export type OperationalAnalyticsRefreshRunsPayload = {
  items: RefreshRunListItem[];
  latestReplayClassification: OperationalAnalyticsReplayClassification;
  activeRun: null | {
    refreshRunId: string;
    startedAt: string;
    durationMs: number;
  };
  staleReconciledCount: number;
};

@Injectable()
export class OperationalAnalyticsRefreshRunService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aggregation: OperationalAnalyticsAggregationService,
    private readonly intelligence: OperationalIntelligenceQueryService,
  ) {}

  /**
   * Marks orphan `started` rows older than OPERATIONAL_ANALYTICS_REFRESH_STARTED_STALE_AFTER_MS as failed.
   * Idempotent: rows not in `started` state are skipped via updateMany guards.
   */
  async reconcileStaleStartedRunsInTx(
    tx: Prisma.TransactionClient,
    now: Date,
  ): Promise<number> {
    const cutoff = new Date(now.getTime() - OPERATIONAL_ANALYTICS_REFRESH_STARTED_STALE_AFTER_MS);
    const staleRows = await tx.operationalAnalyticsRefreshRun.findMany({
      where: {
        status: OperationalAnalyticsRefreshRunStatus.started,
        startedAt: { lt: cutoff },
      },
      select: {
        refreshRunId: true,
        startedAt: true,
        warnings: true,
      },
    });

    let reconciled = 0;
    for (const r of staleRows) {
      const res = await tx.operationalAnalyticsRefreshRun.updateMany({
        where: {
          refreshRunId: r.refreshRunId,
          status: OperationalAnalyticsRefreshRunStatus.started,
        },
        data: {
          status: OperationalAnalyticsRefreshRunStatus.failed,
          finishedAt: now,
          durationMs: now.getTime() - r.startedAt.getTime(),
          errorCode: OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_CODE,
          errorMessage: OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_ERROR_MESSAGE,
          warnings: mergeWarningsJson(r.warnings, [
            OPERATIONAL_ANALYTICS_REFRESH_STALE_RECONCILED_WARNING,
          ]),
        },
      });
      reconciled += res.count;
    }
    return reconciled;
  }

  async executeManualWarehouseRefresh(args: {
    aggregateWindow: string;
    requestedByUserId: string | null;
    requestedByEmail: string | null;
  }): Promise<ManualWarehouseRefreshOutcome> {
    const windowKey = args.aggregateWindow.trim();

    const beforeFresh =
      await this.intelligence.getWarehouseOperationalFreshnessSnapshot(windowKey);
    const beforeFreshnessState = serializeWarehouseOperationalFreshness(beforeFresh);

    const gate = await this.runSerializableRefreshGate({
      windowKey,
      beforeFreshnessState,
      requestedByUserId: args.requestedByUserId,
      requestedByEmail: args.requestedByEmail,
    });

    if (gate.kind === "blocked") {
      const active = gate.active;
      const nowMs = Date.now();
      return {
        ok: false,
        status: "blocked",
        errorCode: OPERATIONAL_ANALYTICS_REFRESH_ALREADY_RUNNING_ERROR_CODE,
        activeRefreshRunId: active.refreshRunId,
        activeStartedAt: active.startedAt.toISOString(),
        activeDurationMs: nowMs - active.startedAt.getTime(),
      };
    }

    const { refreshRunId, startedAt } = gate;

    try {
      const aggResult = await this.aggregation.refreshPlatformOperationalSnapshots({
        aggregateWindow: windowKey,
      });
      const rowsTouched = rowsTouchedFromRefreshResult(
        aggResult as unknown as Record<string, unknown>,
      );
      const afterFresh =
        await this.intelligence.getWarehouseOperationalFreshnessSnapshot(windowKey);
      const afterFreshnessState = serializeWarehouseOperationalFreshness(afterFresh);

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      await this.prisma.operationalAnalyticsRefreshRun.update({
        where: { refreshRunId },
        data: {
          finishedAt,
          durationMs,
          status: OperationalAnalyticsRefreshRunStatus.succeeded,
          afterFreshnessState,
          rowsTouchedByWarehouseTable: rowsTouched as Prisma.InputJsonValue,
        },
      });

      return {
        ok: true,
        refreshRunId,
        status: "succeeded",
        aggregateWindow: windowKey,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs,
        beforeFreshnessState,
        afterFreshnessState,
        rowsTouchedByWarehouseTable: rowsTouched,
        warnings: [],
        ...aggResult,
      };
    } catch (err) {
      let afterFreshnessState: string | null = null;
      try {
        const afterFresh =
          await this.intelligence.getWarehouseOperationalFreshnessSnapshot(windowKey);
        afterFreshnessState = serializeWarehouseOperationalFreshness(afterFresh);
      } catch {
        afterFreshnessState = null;
      }

      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const errorMessageRaw =
        err instanceof Error ? err.message : String(err);
      const errorMessage =
        errorMessageRaw.length > 2_000 ?
          `${errorMessageRaw.slice(0, 2_000)}…`
        : errorMessageRaw;
      const errorCode = "WAREHOUSE_REFRESH_EXECUTION_FAILED";
      const stackHash = stableStackHash({ errorCode, errorMessage });

      await this.prisma.operationalAnalyticsRefreshRun.update({
        where: { refreshRunId },
        data: {
          finishedAt,
          durationMs,
          status: OperationalAnalyticsRefreshRunStatus.failed,
          afterFreshnessState: afterFreshnessState ?? undefined,
          errorCode,
          errorMessage,
          stackHash,
        },
      });

      return {
        ok: false,
        refreshRunId,
        status: "failed",
        aggregateWindow: windowKey,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        durationMs,
        errorCode,
        errorMessage,
      };
    }
  }

  private async runSerializableRefreshGate(args: {
    windowKey: string;
    beforeFreshnessState: string;
    requestedByUserId: string | null;
    requestedByEmail: string | null;
  }): Promise<
    | { kind: "blocked"; active: { refreshRunId: string; startedAt: Date } }
    | { kind: "proceed"; refreshRunId: string; startedAt: Date }
  > {
    const maxAttempts = 3;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const now = new Date();
            await this.reconcileStaleStartedRunsInTx(tx, now);

            const active = await tx.operationalAnalyticsRefreshRun.findFirst({
              where: { status: OperationalAnalyticsRefreshRunStatus.started },
              orderBy: { startedAt: "asc" },
              select: { refreshRunId: true, startedAt: true },
            });

            if (active) {
              return { kind: "blocked" as const, active };
            }

            const startedAt = new Date();
            const created = await tx.operationalAnalyticsRefreshRun.create({
              data: {
                triggerSource: "manual_http",
                requestedByUserId: args.requestedByUserId ?? undefined,
                requestedByEmail: args.requestedByEmail ?? undefined,
                sourceRoute: MANUAL_REFRESH_SOURCE_ROUTE,
                aggregateWindow: args.windowKey,
                idempotencyKey: deterministicIdempotencyFingerprint({
                  requestedByUserId: args.requestedByUserId,
                  aggregateWindow: args.windowKey,
                  startedAtIso: startedAt.toISOString(),
                }),
                startedAt,
                status: OperationalAnalyticsRefreshRunStatus.started,
                beforeFreshnessState: args.beforeFreshnessState,
                warnings: [],
              },
              select: { refreshRunId: true, startedAt: true },
            });

            return {
              kind: "proceed" as const,
              refreshRunId: created.refreshRunId,
              startedAt: created.startedAt,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 30_000,
          },
        );
      } catch (err) {
        lastErr = err;
        if (isPrismaSerializationFailure(err) && attempt < maxAttempts - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }

  async listRefreshRunsWithReplayClassification(args: {
    limit: number;
  }): Promise<OperationalAnalyticsRefreshRunsPayload> {
    const limit = args.limit;
    const now = new Date();

    const maxAttempts = 3;
    let lastErr: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const { staleReconciledCount, activeRun, items, succeededPair } =
          await this.prisma.$transaction(
            async (tx) => {
              const staleReconciledCount =
                await this.reconcileStaleStartedRunsInTx(tx, now);

              const activeRow =
                await tx.operationalAnalyticsRefreshRun.findFirst({
                  where: { status: OperationalAnalyticsRefreshRunStatus.started },
                  orderBy: { startedAt: "asc" },
                });

              const activeRun =
                activeRow ?
                  {
                    refreshRunId: activeRow.refreshRunId,
                    startedAt: activeRow.startedAt.toISOString(),
                    durationMs: now.getTime() - activeRow.startedAt.getTime(),
                  }
                : null;

              const rows = await tx.operationalAnalyticsRefreshRun.findMany({
                orderBy: { startedAt: "desc" },
                take: limit,
              });

              const succeededPairRows =
                await tx.operationalAnalyticsRefreshRun.findMany({
                  where: {
                    status: OperationalAnalyticsRefreshRunStatus.succeeded,
                    finishedAt: { not: null },
                  },
                  orderBy: { finishedAt: "desc" },
                  take: 2,
                });

              return {
                staleReconciledCount,
                activeRun,
                items: rows,
                succeededPair: succeededPairRows,
              };
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
              timeout: 30_000,
            },
          );

        const latestReplayClassification =
          classifyOperationalAnalyticsReplayFromSuccessfulRuns(
            succeededPair.map((r) => ({
              afterFreshnessState: r.afterFreshnessState,
              rowsTouchedByWarehouseTable: r.rowsTouchedByWarehouseTable,
            })),
          );

        return {
          staleReconciledCount,
          activeRun,
          latestReplayClassification,
          items: items.map((r) => ({
            refreshRunId: r.refreshRunId,
            triggerSource: r.triggerSource,
            requestedByEmail: r.requestedByEmail,
            startedAt: r.startedAt.toISOString(),
            finishedAt: r.finishedAt?.toISOString() ?? null,
            durationMs: r.durationMs,
            status: r.status,
            beforeFreshnessState: r.beforeFreshnessState,
            afterFreshnessState: r.afterFreshnessState,
            rowsTouchedByWarehouseTable: parseWarehouseRowsUnknown(
              r.rowsTouchedByWarehouseTable,
            ),
            warnings: normalizeWarningsJson(r.warnings),
            errorCode: r.errorCode,
            errorMessage: r.errorMessage,
            createdAt: r.createdAt.toISOString(),
          })),
        };
      } catch (err) {
        lastErr = err;
        if (isPrismaSerializationFailure(err) && attempt < maxAttempts - 1) {
          continue;
        }
        throw err;
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
  }
}

function parseWarehouseRowsUnknown(raw: unknown): Record<string, number> | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v !== "number" || !Number.isFinite(v)) return null;
    out[k] = v;
  }
  return out;
}
