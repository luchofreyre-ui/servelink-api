import { readFileSync } from "node:fs";
import { join } from "node:path";
import { CronRunLedgerService } from "../src/common/reliability/cron-run-ledger.service";
import { OpsVisibilityService } from "../src/common/reliability/ops-visibility.service";

const repoRoot = join(__dirname, "..");

function read(relativePath: string) {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("System Truth V6 invariants", () => {
  it("locks the required contract document sections", () => {
    const doc = read("SYSTEM_TRUTH_V6.md");

    expect(doc).toContain("## Non-Negotiable Invariants");
    expect(doc).toContain("### 1. Booking + Payment Invariants");
    expect(doc).toContain("### 2. Learning Pipeline Invariants");
    expect(doc).toContain("### 3. Reconciliation Invariants");
    expect(doc).toContain("### 4. Cron Invariants");
    expect(doc).toContain("### 5. Ops Visibility Invariants");
    expect(doc).toContain("### 6. Slot + Hold Invariants");
    expect(doc).toContain("### 7. FO Matching Invariants");
    expect(doc).toContain("paymentStatus = payment_pending");
    expect(doc).toContain("publicDepositStatus = deposit_succeeded");
    expect(doc).toContain("active blockers: NONE");
  });

  it("keeps public deposit success aligned to authorized payment state", () => {
    const depositService = read(
      "src/modules/public-booking-orchestrator/public-booking-deposit.service.ts",
    );
    const stripeService = read("src/modules/bookings/stripe/stripe-payment.service.ts");

    expect(depositService).toContain(
      "publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded",
    );
    expect(depositService).toContain(
      "paymentStatus: BookingPaymentStatus.authorized",
    );
    expect(depositService).toContain("alignDepositSucceededPaymentStatus");
    expect(stripeService).toContain(
      "publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded",
    );
    expect(stripeService).toContain(
      "paymentStatus: BookingPaymentStatus.authorized",
    );
  });

  it("keeps reconciliation manual, idempotent, scoped, and audited", () => {
    const script = read("scripts/reconcile-historical-deposit-mismatches.ts");

    expect(script).toContain("CONFIRMATION_PHRASE");
    expect(script).toContain("dryRun");
    expect(script).toContain("PAYMENT_RECONCILIATION_APPLIED");
    expect(script).toContain("historical_deposit_mismatch_fix");
    expect(script).toContain("paymentStatus: BookingPaymentStatus.payment_pending");
    expect(script).toContain(
      "publicDepositStatus: BookingPublicDepositStatus.deposit_succeeded",
    );
    expect(script).not.toContain("new Stripe(");
  });

  it("records cron runs durably and exposes cronLedger in ops summary", async () => {
    const rows: any[] = [];
    const prisma = {
      cronRunLedger: {
        create: jest.fn(async ({ data, select }: any) => {
          const row = {
            id: `ledger_${rows.length + 1}`,
            jobName: data.jobName,
            status: data.status,
            startedAt: data.startedAt ?? new Date(),
            finishedAt: data.finishedAt ?? null,
            durationMs: data.durationMs ?? null,
            errorMessage: null,
            errorCode: null,
            metadata: data.metadata ?? null,
          };
          rows.push(row);
          return select?.id ? { id: row.id } : row;
        }),
        findUnique: jest.fn(async ({ where }: any) =>
          rows.find((row) => row.id === where.id) ?? null,
        ),
        update: jest.fn(async ({ where, data }: any) => {
          const index = rows.findIndex((row) => row.id === where.id);
          rows[index] = { ...rows[index], ...data };
          return rows[index];
        }),
        findMany: jest.fn(async () => rows),
      },
    };
    const ledger = new CronRunLedgerService(prisma as never);

    const id = await ledger.recordStarted("system_truth_test_job");
    await ledger.recordSucceeded(id);
    const summary = await ledger.getSummary();

    expect(rows[0].status).toBe("succeeded");
    expect(summary).toEqual(
      expect.objectContaining({
        available: true,
        jobs: expect.objectContaining({
          system_truth_test_job: expect.objectContaining({
            lastStatus: "succeeded",
          }),
        }),
      }),
    );

    const opsSummary = read("src/common/reliability/ops-visibility.service.ts");
    expect(opsSummary).toContain("cronLedger");
    expect(opsSummary).toContain("payment: paymentSummary");
  });

  it("ops summary contract returns payment and cronLedger fields", async () => {
    const zeroCount = { count: jest.fn(async () => 0) };
    const service = new OpsVisibilityService(
      {
        booking: zeroCount,
        bookingDispatchControl: zeroCount,
        dispatchDecision: zeroCount,
        opsAnomaly: zeroCount,
        systemTestIncident: zeroCount,
        systemTestAutomationJob: zeroCount,
        paymentAnomaly: {
          count: jest.fn(async () => 0),
          groupBy: jest.fn(async () => []),
        },
      } as never,
      { getHealth: () => ({ ok: true }) } as never,
      { snapshot: () => ({}) } as never,
      { getSummary: jest.fn(async () => ({ available: true, jobs: {} })) } as never,
      { getHealthSnapshot: () => ({ stale: false }) } as never,
      { getHealthSnapshot: () => ({ stale: false }) } as never,
      {
        getHealthSnapshot: () => ({
          stale: false,
          lastRunAt: null,
          lastSuccessAt: null,
          lastFailureAt: null,
        }),
      } as never,
      { getSlotHoldIntegritySummary: jest.fn(async () => ({ active: 0 })) } as never,
    );

    const summary = await service.getSummary();

    expect(summary).toEqual(
      expect.objectContaining({
        payment: expect.objectContaining({
          bookingStates: expect.any(Object),
          anomalies: expect.any(Object),
          staleBuckets: expect.any(Object),
          flags: expect.any(Object),
        }),
        cronLedger: expect.objectContaining({ available: true }),
      }),
    );
  });
});
