import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { OpsVisibilityService } from "../src/common/reliability/ops-visibility.service";

const apiRoot = join(__dirname, "..");
const repoRoot = join(apiRoot, "..", "..");

function pathFromApiRoot(relativePath: string) {
  return join(apiRoot, relativePath);
}

function pathFromRepoRoot(relativePath: string) {
  return join(repoRoot, relativePath);
}

function readApi(relativePath: string) {
  return readFileSync(pathFromApiRoot(relativePath), "utf8");
}

function readRepo(relativePath: string) {
  return readFileSync(pathFromRepoRoot(relativePath), "utf8");
}

function expectContainsAll(source: string, required: string[]) {
  for (const expected of required) {
    expect(source).toContain(expected);
  }
}

describe("System Truth V7 invariants", () => {
  it("locks the System Truth V7 contract document sections", () => {
    const path = pathFromApiRoot("SYSTEM_TRUTH_V7.md");

    expect(existsSync(path)).toBe(true);

    const doc = readApi("SYSTEM_TRUTH_V7.md");
    expectContainsAll(doc, [
      "BOOKING + PAYMENT INVARIANTS",
      "LEARNING PIPELINE INVARIANTS",
      "RECONCILIATION INVARIANTS",
      "CRON INVARIANTS",
      "OPS VISIBILITY INVARIANTS",
      "SLOT + HOLD INVARIANTS",
      "FO MATCHING INVARIANTS",
      "EXPANSION LAYER",
      "OPS SUMMARY UI SURFACE",
      "FO SUPPLY VISIBILITY",
      "LEARNING DECISION LAYER",
      "BOOKING CONVERSION UX",
    ]);
  });

  it("keeps Prisma enum and model support for locked lifecycle contracts", () => {
    const schema = readApi("prisma/schema.prisma");

    expect(schema).toMatch(
      /enum BookingEventType \{[\s\S]*CONTROLLED_COMPLETION_AUDIT[\s\S]*PAYMENT_RECONCILIATION_APPLIED[\s\S]*\}/,
    );
    expect(schema).toContain("model CronRunLedger");
    expect(schema).toContain("paymentStatus");
    expect(schema).toContain("publicDepositStatus");
  });

  it("keeps ops summary exposing payment health and durable cron ledger fields", async () => {
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

  it("keeps learning summary exposing decision-layer contract fields", () => {
    const source = readApi(
      "src/modules/bookings/payment-reliability/payment-reliability.service.ts",
    );

    expectContainsAll(source, [
      "async getEstimateLearningSummary()",
      "available: true",
      "totalRecords",
      "latestRecords",
      "aggregate",
      "byServiceType",
      "flags",
      "hasEnoughData",
      "hasHighVarianceOutliers",
    ]);
  });

  it("keeps historical reconciliation manual, scoped, idempotent, and audited", () => {
    const path = pathFromApiRoot("scripts/reconcile-historical-deposit-mismatches.ts");

    expect(existsSync(path)).toBe(true);

    const script = readApi("scripts/reconcile-historical-deposit-mismatches.ts");
    expectContainsAll(script, [
      "--execute",
      "--confirm=",
      "RECONCILE_HISTORICAL_DEPOSIT_MISMATCHES",
      "historical_deposit_mismatch_fix",
      "PAYMENT_RECONCILIATION_APPLIED",
      "payment_pending",
      "deposit_succeeded",
      "authorized",
    ]);
  });

  it("keeps public booking conversion clarity in the web booking flow", () => {
    expect(readRepo(
      "apps/web/src/components/marketing/precision-luxury/booking/BookingStepHomeDetails.tsx",
    )).toContain("Add more details (optional)");
    expect(readRepo(
      "apps/web/src/components/marketing/precision-luxury/booking/BookingSummaryCard.tsx",
    )).toContain("What happens next");
    expect(readRepo(
      "apps/web/src/components/marketing/precision-luxury/booking/BookingSummaryCard.tsx",
    )).toContain("No surprises");
    expect(readRepo(
      "apps/web/src/components/marketing/precision-luxury/booking/BookingStepSchedule.tsx",
    )).toContain("This time is available");
    expect(readRepo(
      "apps/web/src/components/marketing/precision-luxury/booking/BookingFlowClient.tsx",
    )).toContain("Confirm Booking");
  });

  it("keeps FO supply visibility surfacing readiness concepts", () => {
    const path = pathFromRepoRoot(
      "apps/web/src/app/(app-shell)/(admin)/admin/ops/_components/FoSupplyReadinessSection.tsx",
    );

    expect(existsSync(path)).toBe(true);

    const source = readFileSync(path, "utf8").toLowerCase();
    expectContainsAll(source, ["match-ready", "provider", "schedule", "capacity", "geo"]);
  });

  it("keeps learning decision UI surfacing variance, service, and sufficiency signals", () => {
    const path = pathFromRepoRoot(
      "apps/web/src/app/(app-shell)/(admin)/admin/ops/_components/LearningDecisionLayerSection.tsx",
    );

    expect(existsSync(path)).toBe(true);

    const source = readFileSync(path, "utf8").toLowerCase();
    expectContainsAll(source, [
      "variance",
      "high variance",
      "service type",
      "insufficient data",
      "hasenoughdata",
    ]);
  });
});
