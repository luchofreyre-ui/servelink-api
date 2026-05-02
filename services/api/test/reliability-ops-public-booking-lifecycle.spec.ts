import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import { ReliabilityOpsController } from "../src/common/reliability/reliability-ops.controller";

function anomaly(input: {
  kind: string;
  bookingId?: string | null;
  detectedAt?: Date;
  details?: Record<string, unknown> | null;
}) {
  return {
    id: `anom_${Math.random()}`,
    stripeEventId: null,
    severity: "warning",
    status: "open",
    message: "test anomaly",
    resolvedAt: null,
    bookingId: input.bookingId ?? null,
    kind: input.kind,
    details: input.details ?? null,
    detectedAt: input.detectedAt ?? new Date("2030-06-01T12:00:00.000Z"),
  };
}

describe("PaymentReliabilityService.getPublicBookingLifecycleSummary", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns lifecycle summary from persisted public booking anomalies", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2030-06-01T12:00:00.000Z"));
    const findMany = jest.fn().mockResolvedValue([
      anomaly({
        kind: "public_booking_hold_failed",
        bookingId: "bk_hold",
        details: {
          code: "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
          stage: "availability_revalidation",
          holdId: "hold_1",
        },
      }),
      anomaly({
        kind: "public_booking_confirm_failed",
        bookingId: "bk_confirm",
        details: {
          code: "PUBLIC_BOOKING_HOLD_EXPIRED",
          stage: "validate_hold",
          holdId: "hold_2",
        },
      }),
    ]);
    const service = new PaymentReliabilityService({
      paymentAnomaly: { findMany },
    } as never);

    const summary = await service.getPublicBookingLifecycleSummary();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          kind: {
            in: [
              "public_booking_hold_failed",
              "public_booking_deposit_failed",
              "public_booking_confirm_failed",
            ],
          },
          detectedAt: { gte: new Date("2030-05-31T12:00:00.000Z") },
        }),
        orderBy: { detectedAt: "desc" },
        take: 200,
      }),
    );
    expect(summary).toEqual(
      expect.objectContaining({
        window: "24h",
        totals: expect.objectContaining({
          availabilityResults: 0,
          holdAttempts: 1,
          holdSucceeded: 0,
          holdFailed: 1,
          depositPrepareResults: 0,
          confirmAttempts: 1,
          confirmSucceeded: 0,
          confirmFailed: 1,
        }),
        rates: {
          holdFailureRate: 1,
          confirmFailureRate: 1,
        },
        observabilityCoverage: {
          successCountsPersisted: false,
          failureCountsPersisted: true,
        },
      }),
    );
    expect(summary.failureBreakdown).toEqual(
      expect.objectContaining({
        PUBLIC_BOOKING_SLOT_NOT_AVAILABLE: 1,
        PUBLIC_BOOKING_HOLD_EXPIRED: 1,
        UNKNOWN: 0,
      }),
    );
    expect(summary.recentFailures[0]).toEqual(
      expect.objectContaining({
        kind: "public_booking_hold_failed",
        bookingId: "bk_hold",
        holdId: "hold_1",
        code: "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
        stage: "availability_revalidation",
        createdAt: "2030-06-01T12:00:00.000Z",
      }),
    );
  });

  it("endpoint handler returns public booking lifecycle summary", async () => {
    const item = {
      window: "24h",
      totals: {
        availabilityResults: 0,
        holdAttempts: 0,
        holdSucceeded: 0,
        holdFailed: 0,
        depositPrepareResults: 0,
        confirmAttempts: 0,
        confirmSucceeded: 0,
        confirmFailed: 0,
      },
      rates: { holdFailureRate: 0, confirmFailureRate: 0 },
      failureBreakdown: {
        PUBLIC_BOOKING_INVALID_SLOT_ID: 0,
        PUBLIC_BOOKING_SLOT_NOT_AVAILABLE: 0,
        PUBLIC_BOOKING_SLOT_IN_PAST: 0,
        PUBLIC_BOOKING_HOLD_EXPIRED: 0,
        PUBLIC_BOOKING_HOLD_NOT_FOUND: 0,
        PUBLIC_BOOKING_DEPOSIT_UNRESOLVED: 0,
        UNKNOWN: 0,
      },
      recentFailures: [],
      observabilityCoverage: {
        successCountsPersisted: false,
        failureCountsPersisted: true,
      },
      alerts: [],
    };
    const paymentReliability = {
      getPublicBookingLifecycleSummary: jest.fn().mockResolvedValue(item),
    };
    const recurringFollowUpTasks = {
      syncRecurringFollowUpTasks: jest.fn(),
      completeTask: jest.fn(),
      dismissTask: jest.fn(),
    };
    const controller = new ReliabilityOpsController(
      {} as never,
      {} as never,
      paymentReliability as never,
      recurringFollowUpTasks as never,
    );

    await expect(controller.getPublicBookingLifecycleSummary()).resolves.toBe(item);
    expect(paymentReliability.getPublicBookingLifecycleSummary).toHaveBeenCalledTimes(1);
  });

  it("groups unknown failure codes as UNKNOWN", async () => {
    const service = new PaymentReliabilityService({
      paymentAnomaly: {
        findMany: jest.fn().mockResolvedValue([
          anomaly({
            kind: "public_booking_confirm_failed",
            details: { code: "SOMETHING_NEW", stage: "finalize_booking" },
          }),
        ]),
      },
    } as never);

    const summary = await service.getPublicBookingLifecycleSummary();

    expect(summary.failureBreakdown.UNKNOWN).toBe(1);
    expect(summary.recentFailures[0].code).toBe("UNKNOWN");
    expect(summary.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PUBLIC_BOOKING_UNKNOWN_FAILURE_PRESENT",
          value: 1,
          threshold: 0,
        }),
      ]),
    );
  });

  it("adds alert when failure rate thresholds are exceeded", async () => {
    const service = new PaymentReliabilityService({
      paymentAnomaly: {
        findMany: jest.fn().mockResolvedValue([
          anomaly({
            kind: "public_booking_hold_failed",
            details: { code: "PUBLIC_BOOKING_INVALID_SLOT_ID", stage: "decode_slot_id" },
          }),
          anomaly({
            kind: "public_booking_confirm_failed",
            details: { code: "PUBLIC_BOOKING_DEPOSIT_UNRESOLVED", stage: "deposit_gate" },
          }),
        ]),
      },
    } as never);

    const summary = await service.getPublicBookingLifecycleSummary();

    expect(summary.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "PUBLIC_BOOKING_HOLD_FAILURE_RATE_HIGH",
          value: 1,
          threshold: 0.15,
        }),
        expect.objectContaining({
          code: "PUBLIC_BOOKING_CONFIRM_FAILURE_RATE_HIGH",
          value: 1,
          threshold: 0.05,
        }),
      ]),
    );
  });

  it("returns empty zeros without crashing", async () => {
    const service = new PaymentReliabilityService({
      paymentAnomaly: { findMany: jest.fn().mockResolvedValue([]) },
    } as never);

    const summary = await service.getPublicBookingLifecycleSummary();

    expect(summary.totals).toEqual({
      availabilityResults: 0,
      holdAttempts: 0,
      holdSucceeded: 0,
      holdFailed: 0,
      depositPrepareResults: 0,
      confirmAttempts: 0,
      confirmSucceeded: 0,
      confirmFailed: 0,
    });
    expect(summary.rates).toEqual({
      holdFailureRate: 0,
      confirmFailureRate: 0,
    });
    expect(summary.failureBreakdown).toEqual({
      PUBLIC_BOOKING_INVALID_SLOT_ID: 0,
      PUBLIC_BOOKING_SLOT_NOT_AVAILABLE: 0,
      PUBLIC_BOOKING_SLOT_IN_PAST: 0,
      PUBLIC_BOOKING_HOLD_EXPIRED: 0,
      PUBLIC_BOOKING_HOLD_NOT_FOUND: 0,
      PUBLIC_BOOKING_DEPOSIT_UNRESOLVED: 0,
      UNKNOWN: 0,
    });
    expect(summary.recentFailures).toEqual([]);
    expect(summary.alerts).toEqual([]);
  });
});
