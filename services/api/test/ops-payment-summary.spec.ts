import { OpsVisibilityService } from "../src/common/reliability/ops-visibility.service";

type MockRow = Record<string, unknown>;

function matchesWhere(row: MockRow, where?: Record<string, unknown>): boolean {
  if (!where) return true;

  return Object.entries(where).every(([key, expected]) => {
    const actual = row[key];
    if (
      expected &&
      typeof expected === "object" &&
      !(expected instanceof Date) &&
      !Array.isArray(expected)
    ) {
      const condition = expected as Record<string, unknown>;
      if (Array.isArray(condition.in) && !condition.in.includes(actual)) {
        return false;
      }
      if (Array.isArray(condition.notIn) && condition.notIn.includes(actual)) {
        return false;
      }
      if ("gte" in condition && actual instanceof Date) {
        if (actual < (condition.gte as Date)) return false;
      }
      if ("lt" in condition && actual instanceof Date) {
        if (actual >= (condition.lt as Date)) return false;
      }
      return true;
    }

    return actual === expected;
  });
}

function delegate(rows: MockRow[]) {
  return {
    count: jest.fn(async (args?: { where?: Record<string, unknown> }) =>
      rows.filter((row) => matchesWhere(row, args?.where)).length,
    ),
    groupBy: jest.fn(
      async (args: { by: string[]; where?: Record<string, unknown> }) => {
        const field = args.by[0];
        const counts = new Map<string, number>();
        for (const row of rows.filter((item) => matchesWhere(item, args.where))) {
          const key = String(row[field] ?? "unknown");
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return [...counts.entries()].map(([key, count]) => ({
          [field]: key,
          _count: { _all: count },
        }));
      },
    ),
  };
}

describe("OpsVisibilityService payment summary", () => {
  it("summarizes booking payment states, anomalies, stale buckets, and flags", async () => {
    const now = new Date("2030-01-31T12:00:00.000Z");
    const minutesAgo = (minutes: number) =>
      new Date(now.getTime() - minutes * 60 * 1000);

    const prisma = {
      booking: delegate([
        {
          id: "pending_recent",
          status: "pending_payment",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(10),
        },
        {
          id: "pending_1h",
          status: "pending_payment",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(60),
        },
        {
          id: "pending_3h",
          status: "pending_payment",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(180),
        },
        {
          id: "pending_3d",
          status: "pending_payment",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(3 * 24 * 60),
        },
        {
          id: "pending_10d",
          status: "pending_payment",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(10 * 24 * 60),
        },
        {
          id: "pending_31d",
          status: "pending_payment",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(31 * 24 * 60),
        },
        {
          id: "authorized",
          status: "assigned",
          paymentStatus: "authorized",
          publicDepositStatus: "deposit_succeeded",
          publicDepositPaymentIntentId: "pi_deposit_ok",
          createdAt: minutesAgo(45),
        },
        {
          id: "deposit_mismatch",
          status: "assigned",
          paymentStatus: "payment_pending",
          publicDepositStatus: "deposit_succeeded",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(45),
        },
        {
          id: "completed_unpaid",
          status: "completed",
          paymentStatus: "unpaid",
          publicDepositStatus: "deposit_required",
          publicDepositPaymentIntentId: null,
          createdAt: minutesAgo(45),
        },
      ]),
      paymentAnomaly: delegate([
        {
          id: "pa_recent",
          kind: "public_booking_deposit_failed",
          status: "open",
          detectedAt: minutesAgo(20),
        },
        {
          id: "pa_old",
          kind: "public_deposit_succeeded_missing_payment_intent",
          status: "open",
          detectedAt: minutesAgo(2 * 24 * 60),
        },
        {
          id: "pa_resolved",
          kind: "public_booking_deposit_failed",
          status: "resolved",
          detectedAt: minutesAgo(20),
        },
      ]),
      opsAnomaly: delegate([
        {
          id: "oa_payment",
          type: "payment_missing",
          status: "open",
          createdAt: minutesAgo(30),
        },
        {
          id: "oa_dispatch",
          type: "dispatch_failed",
          status: "open",
          createdAt: minutesAgo(30),
        },
      ]),
    };

    const service = new OpsVisibilityService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const summary = await (
      service as unknown as {
        buildPaymentSummary: (now: Date) => Promise<Record<string, any>>;
      }
    ).buildPaymentSummary(now);

    expect(summary.bookingStates).toEqual(
      expect.objectContaining({
        available: true,
        pendingPayment: 6,
        authorized: 1,
        depositSucceeded: 2,
        completedMissingPaymentAlignment: 1,
        depositStateMismatch: 1,
      }),
    );
    expect(summary.staleBuckets).toEqual({
      available: true,
      "0-30m": 1,
      "30m-2h": 1,
      "2h-24h": 1,
      "1-7d": 1,
      "7-30d": 1,
      ">30d": 1,
    });
    expect(summary.anomalies).toEqual(
      expect.objectContaining({
        available: true,
        total: 3,
        recentPaymentAnomaliesLast24h: 2,
      }),
    );
    expect(summary.anomalies.paymentAnomaly.byType).toEqual({
      public_booking_deposit_failed: 1,
      public_deposit_succeeded_missing_payment_intent: 1,
    });
    expect(summary.anomalies.opsAnomaly.byType).toEqual({
      payment_missing: 1,
    });
    expect(summary.flags).toEqual({
      hasRecentPaymentFailures: true,
      hasStalePendingPayments: true,
      hasDepositStateMismatch: true,
    });
  });
});
