import { CronRunLedgerService } from "../src/common/reliability/cron-run-ledger.service";
import { OpsVisibilityService } from "../src/common/reliability/ops-visibility.service";

type LedgerRow = {
  id: string;
  jobName: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
};

function createLedgerPrisma() {
  const rows: LedgerRow[] = [];
  let nextId = 1;

  const cronRunLedger = {
    create: jest.fn(async ({ data, select }: any) => {
      const now = new Date();
      const row: LedgerRow = {
        id: `ledger_${nextId++}`,
        jobName: data.jobName,
        status: data.status,
        startedAt: data.startedAt ?? now,
        finishedAt: data.finishedAt ?? null,
        durationMs: data.durationMs ?? null,
        errorMessage: data.errorMessage ?? null,
        errorCode: data.errorCode ?? null,
        metadata: data.metadata ?? null,
        createdAt: data.createdAt ?? now,
      };
      rows.push(row);
      return select?.id ? { id: row.id } : { ...row };
    }),
    findUnique: jest.fn(async ({ where }: any) => {
      const row = rows.find((item) => item.id === where.id);
      return row ? { ...row } : null;
    }),
    update: jest.fn(async ({ where, data }: any) => {
      const index = rows.findIndex((item) => item.id === where.id);
      if (index < 0) throw new Error("not found");
      rows[index] = { ...rows[index], ...data };
      return { ...rows[index] };
    }),
    findMany: jest.fn(async () =>
      [...rows]
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .map((row) => ({ ...row })),
    ),
  };

  return { prisma: { cronRunLedger }, rows, cronRunLedger };
}

describe("CronRunLedgerService", () => {
  it("records started and succeeded", async () => {
    const { prisma, rows, cronRunLedger } = createLedgerPrisma();
    const service = new CronRunLedgerService(prisma as never);

    const id = await service.recordStarted("payment_lifecycle_reconciliation", {
      batchSize: 25,
    });
    await service.recordSucceeded(id, { processed: 2 });

    expect(cronRunLedger.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobName: "payment_lifecycle_reconciliation",
          status: "started",
        }),
      }),
    );
    expect(rows[0]).toEqual(
      expect.objectContaining({
        status: "succeeded",
        finishedAt: expect.any(Date),
        durationMs: expect.any(Number),
        metadata: { batchSize: 25, processed: 2 },
      }),
    );
  });

  it("records failure with a safe error message", async () => {
    const { prisma, rows } = createLedgerPrisma();
    const service = new CronRunLedgerService(prisma as never);
    const id = await service.recordStarted("remaining_balance_authorization");

    const error = new Error(`${"stripe_down ".repeat(80)}secret_stack_details`);
    (error as any).code = "stripe_api_error";
    await service.recordFailed(id, error);

    expect(rows[0].status).toBe("failed");
    expect(rows[0].errorCode).toBe("stripe_api_error");
    expect(rows[0].errorMessage).toContain("stripe_down");
    expect(rows[0].errorMessage?.length).toBeLessThanOrEqual(500);
    expect(rows[0].errorMessage).not.toContain("secret_stack_details");
  });

  it("records skipped with a reason", async () => {
    const { prisma, rows } = createLedgerPrisma();
    const service = new CronRunLedgerService(prisma as never);

    await service.recordSkipped("refund_reconciliation", "disabled_by_env", {
      envFlag: "ENABLE_REFUND_CRON",
    });

    expect(rows[0]).toEqual(
      expect.objectContaining({
        jobName: "refund_reconciliation",
        status: "skipped",
        finishedAt: expect.any(Date),
        durationMs: 0,
        metadata: {
          envFlag: "ENABLE_REFUND_CRON",
          reason: "disabled_by_env",
        },
      }),
    );
  });

  it("groups summary by jobName with latest status and recent counts", async () => {
    const { prisma, rows } = createLedgerPrisma();
    const service = new CronRunLedgerService(prisma as never);
    const now = new Date("2030-01-02T12:00:00.000Z");

    rows.push(
      {
        id: "old",
        jobName: "slot_hold_cleanup",
        status: "failed",
        startedAt: new Date("2030-01-01T00:00:00.000Z"),
        finishedAt: new Date("2030-01-01T00:00:01.000Z"),
        durationMs: 1000,
        errorMessage: "old failure",
        errorCode: null,
        metadata: null,
        createdAt: new Date("2030-01-01T00:00:00.000Z"),
      },
      {
        id: "recent-failed",
        jobName: "slot_hold_cleanup",
        status: "failed",
        startedAt: new Date("2030-01-02T11:00:00.000Z"),
        finishedAt: new Date("2030-01-02T11:00:01.000Z"),
        durationMs: 1000,
        errorMessage: "recent failure",
        errorCode: null,
        metadata: null,
        createdAt: new Date("2030-01-02T11:00:00.000Z"),
      },
      {
        id: "latest",
        jobName: "slot_hold_cleanup",
        status: "succeeded",
        startedAt: new Date("2030-01-02T11:30:00.000Z"),
        finishedAt: new Date("2030-01-02T11:30:01.000Z"),
        durationMs: 1000,
        errorMessage: null,
        errorCode: null,
        metadata: null,
        createdAt: new Date("2030-01-02T11:30:00.000Z"),
      },
    );

    const summary = await service.getSummary(now);

    expect(summary).toEqual({
      available: true,
      jobs: {
        slot_hold_cleanup: {
          lastStatus: "succeeded",
          lastStartedAt: "2030-01-02T11:30:00.000Z",
          lastFinishedAt: "2030-01-02T11:30:01.000Z",
          lastDurationMs: 1000,
          lastErrorMessage: null,
          recentFailures24h: 1,
          recentRuns24h: 2,
        },
      },
    });
  });
});

describe("OpsVisibilityService cron ledger summary", () => {
  it("includes available cronLedger summary", async () => {
    const cronLedger = {
      getSummary: jest.fn(async () => ({
        available: true,
        jobs: {
          integrity_sweep: {
            lastStatus: "succeeded",
            lastStartedAt: "2030-01-02T11:30:00.000Z",
            lastFinishedAt: "2030-01-02T11:30:01.000Z",
            lastDurationMs: 1000,
            lastErrorMessage: null,
            recentFailures24h: 0,
            recentRuns24h: 1,
          },
        },
      })),
    };
    const zeroCountDelegate = { count: jest.fn(async () => 0) };
    const prisma = {
      booking: zeroCountDelegate,
      bookingDispatchControl: zeroCountDelegate,
      dispatchDecision: zeroCountDelegate,
      opsAnomaly: zeroCountDelegate,
      systemTestIncident: zeroCountDelegate,
      systemTestAutomationJob: zeroCountDelegate,
      paymentAnomaly: {
        count: jest.fn(async () => 0),
        groupBy: jest.fn(async () => []),
      },
    };
    const service = new OpsVisibilityService(
      prisma as never,
      { getHealth: () => ({ ok: true }) } as never,
      { snapshot: () => ({}) } as never,
      cronLedger as never,
      { getHealthSnapshot: () => ({}) } as never,
      { getHealthSnapshot: () => ({}) } as never,
      { getSlotHoldIntegritySummary: jest.fn(async () => ({ available: true })) } as never,
    );

    const summary = await service.getSummary();

    expect(summary.cronLedger).toEqual(
      expect.objectContaining({
        available: true,
        jobs: expect.objectContaining({
          integrity_sweep: expect.objectContaining({ lastStatus: "succeeded" }),
        }),
      }),
    );
    expect(summary.cron).toBeTruthy();
  });
});
