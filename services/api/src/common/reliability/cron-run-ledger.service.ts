import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma";

export type CronRunLedgerStatus = "started" | "succeeded" | "failed" | "skipped";

type CronRunLedgerRow = {
  id: string;
  jobName: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
  metadata: unknown;
};

type CronRunSummaryJob = {
  lastStatus: string | null;
  lastStartedAt: string | null;
  lastFinishedAt: string | null;
  lastDurationMs: number | null;
  lastErrorMessage: string | null;
  recentFailures24h: number;
  recentRuns24h: number;
};

const MAX_ERROR_MESSAGE_LENGTH = 500;
const DEFAULT_LATEST_RUNS_PER_JOB = 5;

@Injectable()
export class CronRunLedgerService {
  private readonly log = new Logger(CronRunLedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordStarted(
    jobName: string,
    metadata?: Record<string, unknown>,
  ): Promise<string | null> {
    try {
      const row = await this.getDelegate().create({
        data: {
          jobName,
          status: "started",
          metadata: this.toJsonInput(metadata),
        },
        select: { id: true },
      });
      return row.id;
    } catch (error) {
      this.logLedgerWriteFailure("recordStarted", jobName, error);
      return null;
    }
  }

  async recordSucceeded(
    id: string | null | undefined,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!id) return;
    try {
      const existing = await this.findRunById(id);
      if (!existing) return;
      const finishedAt = new Date();
      await this.getDelegate().update({
        where: { id },
        data: {
          status: "succeeded",
          finishedAt,
          durationMs: this.durationMs(existing.startedAt, finishedAt),
          metadata: this.toJsonInput(this.mergeMetadata(existing.metadata, metadata)),
        },
      });
    } catch (error) {
      this.logLedgerWriteFailure("recordSucceeded", id, error);
    }
  }

  async recordFailed(
    id: string | null | undefined,
    error: unknown,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!id) return;
    try {
      const existing = await this.findRunById(id);
      if (!existing) return;
      const finishedAt = new Date();
      await this.getDelegate().update({
        where: { id },
        data: {
          status: "failed",
          finishedAt,
          durationMs: this.durationMs(existing.startedAt, finishedAt),
          errorMessage: this.safeErrorMessage(error),
          errorCode: this.safeErrorCode(error),
          metadata: this.toJsonInput(this.mergeMetadata(existing.metadata, metadata)),
        },
      });
    } catch (ledgerError) {
      this.logLedgerWriteFailure("recordFailed", id, ledgerError);
    }
  }

  async recordSkipped(
    jobName: string,
    reason: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const now = new Date();
    try {
      await this.getDelegate().create({
        data: {
          jobName,
          status: "skipped",
          startedAt: now,
          finishedAt: now,
          durationMs: 0,
          metadata: this.toJsonInput({ ...(metadata ?? {}), reason }),
        },
      });
    } catch (error) {
      this.logLedgerWriteFailure("recordSkipped", jobName, error);
    }
  }

  async getLatestRuns(limitPerJob = DEFAULT_LATEST_RUNS_PER_JOB) {
    const delegate = this.getOptionalDelegate();
    if (!delegate || typeof delegate.findMany !== "function") {
      return {};
    }

    const safeLimit = Math.max(1, Math.min(50, Math.floor(limitPerJob) || 1));
    const rows = await delegate.findMany({
      orderBy: { startedAt: "desc" },
      take: 500,
      select: {
        id: true,
        jobName: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        errorMessage: true,
        errorCode: true,
        metadata: true,
      },
    });

    const grouped: Record<string, Array<Record<string, unknown>>> = {};
    for (const row of rows as CronRunLedgerRow[]) {
      const bucket = grouped[row.jobName] ?? [];
      if (bucket.length >= safeLimit) continue;
      bucket.push(this.serializeRun(row));
      grouped[row.jobName] = bucket;
    }
    return grouped;
  }

  async getSummary(now = new Date()) {
    const delegate = this.getOptionalDelegate();
    if (!delegate || typeof delegate.findMany !== "function") {
      return { available: false as const, reason: "model_or_table_unavailable" };
    }

    try {
      const rows = (await delegate.findMany({
        orderBy: { startedAt: "desc" },
        take: 500,
        select: {
          id: true,
          jobName: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          durationMs: true,
          errorMessage: true,
          errorCode: true,
          metadata: true,
        },
      })) as CronRunLedgerRow[];

      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const jobs: Record<string, CronRunSummaryJob> = {};

      for (const row of rows) {
        const existing = jobs[row.jobName];
        if (!existing) {
          jobs[row.jobName] = {
            lastStatus: row.status,
            lastStartedAt: row.startedAt.toISOString(),
            lastFinishedAt: row.finishedAt?.toISOString() ?? null,
            lastDurationMs: row.durationMs,
            lastErrorMessage: row.errorMessage,
            recentFailures24h: 0,
            recentRuns24h: 0,
          };
        }

        if (row.startedAt >= last24h) {
          jobs[row.jobName].recentRuns24h += 1;
          if (row.status === "failed") {
            jobs[row.jobName].recentFailures24h += 1;
          }
        }
      }

      return { available: true as const, jobs };
    } catch (error) {
      this.logLedgerWriteFailure("getSummary", "cron_ledger", error);
      return { available: false as const, reason: "model_or_table_unavailable" };
    }
  }

  private async findRunById(id: string): Promise<CronRunLedgerRow | null> {
    return this.getDelegate().findUnique({
      where: { id },
      select: {
        id: true,
        jobName: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        durationMs: true,
        errorMessage: true,
        errorCode: true,
        metadata: true,
      },
    }) as Promise<CronRunLedgerRow | null>;
  }

  private getDelegate() {
    const delegate = this.getOptionalDelegate();
    if (!delegate) {
      throw new Error("CronRunLedger delegate unavailable");
    }
    return delegate;
  }

  private getOptionalDelegate(): any {
    return (this.prisma as any).cronRunLedger;
  }

  private durationMs(startedAt: Date, finishedAt: Date) {
    return Math.max(0, finishedAt.getTime() - startedAt.getTime());
  }

  private mergeMetadata(existing: unknown, next?: Record<string, unknown>) {
    const base =
      existing && typeof existing === "object" && !Array.isArray(existing)
        ? (existing as Record<string, unknown>)
        : {};
    return { ...base, ...(next ?? {}) };
  }

  private toJsonInput(value?: Record<string, unknown>): Prisma.InputJsonValue | undefined {
    if (!value) return undefined;
    return value as Prisma.InputJsonValue;
  }

  private safeErrorMessage(error: unknown): string {
    const raw =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error ?? "unknown error");
    return raw.slice(0, MAX_ERROR_MESSAGE_LENGTH);
  }

  private safeErrorCode(error: unknown): string | null {
    const code = (error as { code?: unknown })?.code;
    return typeof code === "string" && code.trim() ? code.trim().slice(0, 100) : null;
  }

  private serializeRun(row: CronRunLedgerRow) {
    return {
      id: row.id,
      jobName: row.jobName,
      status: row.status,
      startedAt: row.startedAt.toISOString(),
      finishedAt: row.finishedAt?.toISOString() ?? null,
      durationMs: row.durationMs,
      errorMessage: row.errorMessage,
      errorCode: row.errorCode,
      metadata: row.metadata,
    };
  }

  private logLedgerWriteFailure(operation: string, subject: string, error: unknown) {
    this.log.warn({
      kind: "cron_run_ledger",
      operation,
      subject,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
