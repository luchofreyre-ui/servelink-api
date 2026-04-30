import { BookingEventType, BookingStatus } from "@prisma/client";
import { ReliabilityOpsController } from "../src/common/reliability/reliability-ops.controller";
import { PaymentReliabilityService } from "../src/modules/bookings/payment-reliability/payment-reliability.service";
import { EstimateLearningService } from "../src/modules/estimate/estimate-learning.service";
import { createBookingsServiceTestHarness } from "./helpers/createBookingsServiceTestHarness";
import {
  assertValidLearningGovernance,
  CONTROLLED_ADMIN_LEARNING_GOVERNANCE,
} from "../src/modules/bookings/learning-governance";

function snapshotOutputJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    legacy: { durationMinutes: 165, priceCents: 44634, confidence: 0.9 },
    estimateV2: {
      snapshotVersion: "estimate_engine_v2_core_v1",
      expectedMinutes: 480,
      riskLevel: "high",
    },
    rawNormalizedIntake: { service_type: "deep_clean" },
    ...overrides,
  });
}

function learningPayload(input: {
  bookingId: string;
  actualMinutes: number;
  winner: "legacy_v1" | "estimate_v2" | "tie" | "insufficient_data";
  legacyVariance?: number | null;
  v2Variance?: number | null;
  riskLevel?: string | null;
  computedAt?: string;
}) {
  return {
    kind: "estimate_learning_result",
    bookingId: input.bookingId,
    actualMinutes: input.actualMinutes,
    ...(input.legacyVariance == null
      ? {}
      : {
          legacyV1: {
            engine: "legacy_v1",
            predictedMinutes: input.actualMinutes - input.legacyVariance,
            actualMinutes: input.actualMinutes,
            varianceMinutes: input.legacyVariance,
            variancePercent: input.legacyVariance / input.actualMinutes,
            category: "on_target",
          },
        }),
    ...(input.v2Variance == null
      ? {}
      : {
          estimateV2: {
            engine: "estimate_v2",
            predictedMinutes: input.actualMinutes - input.v2Variance,
            actualMinutes: input.actualMinutes,
            varianceMinutes: input.v2Variance,
            variancePercent: input.v2Variance / input.actualMinutes,
            category: "on_target",
          },
        }),
    winner: input.winner,
    winnerReason: "test",
    riskLevel: input.riskLevel ?? null,
    computedAt: input.computedAt ?? "2030-06-01T12:00:00.000Z",
  };
}

function makeCompletionHarness(args?: {
  actualMinutes?: number | null;
  existingLearningEvent?: boolean;
  learningCreateRejects?: boolean;
  snapshot?: string | null;
}) {
  const initialBooking = {
    id: "booking_1",
    status: BookingStatus.in_progress,
    currency: "usd",
    foId: "fo_1",
    paymentStatus: "paid",
    estimatedHours: 2,
  };
  const completedBooking = {
    ...initialBooking,
    status: BookingStatus.completed,
  };
  const tx = {
    booking: {
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      findUnique: jest.fn().mockResolvedValue(completedBooking),
    },
    bookingEvent: { create: jest.fn().mockResolvedValue({}) },
  };
  const bookingEventCreate = jest.fn().mockResolvedValue({});
  if (args?.learningCreateRejects) {
    bookingEventCreate
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("learning write failed"));
  }
  const db = {
    $transaction: jest.fn(async (fn: (inner: typeof tx) => unknown) => fn(tx)),
    booking: {
      findUnique: jest
        .fn()
        .mockResolvedValueOnce(initialBooking)
        .mockResolvedValueOnce({
          id: "booking_1",
          foId: "fo_1",
          estimateSnapshot: {
            outputJson: args?.snapshot === undefined ? snapshotOutputJson() : args.snapshot,
          },
        }),
    },
    bookingEvent: {
      findFirst: jest
        .fn()
        .mockResolvedValue(args?.existingLearningEvent ? { id: "evt_existing" } : null),
      create: bookingEventCreate,
    },
    franchiseOwnerReliabilityStats: { upsert: jest.fn().mockResolvedValue({}) },
    franchiseOwner: { update: jest.fn().mockResolvedValue({}) },
  };
  const remainingBalanceCapture = {
    captureRemainingBalanceForBooking: jest.fn().mockResolvedValue({ ok: true }),
  };
  const reputationService = { recomputeForFoSafe: jest.fn() };
  const ledger = { recognizeRevenueForBooking: jest.fn().mockResolvedValue({}) };
  const { service } = createBookingsServiceTestHarness({
    db: db as never,
    ledger: ledger as never,
    remainingBalanceCapture: remainingBalanceCapture as never,
    reputationService: reputationService as never,
  });
  return { service, db, tx, bookingEventCreate };
}

describe("EstimateLearningService", () => {
  const service = new EstimateLearningService();

  it("calculateEngineVariance classifies under/on_target/over", () => {
    expect(
      service.calculateEngineVariance({
        engine: "legacy_v1",
        predictedMinutes: 100,
        actualMinutes: 80,
      })?.category,
    ).toBe("under");
    expect(
      service.calculateEngineVariance({
        engine: "legacy_v1",
        predictedMinutes: 100,
        actualMinutes: 110,
      })?.category,
    ).toBe("on_target");
    expect(
      service.calculateEngineVariance({
        engine: "legacy_v1",
        predictedMinutes: 100,
        actualMinutes: 130,
      })?.category,
    ).toBe("over");
  });

  it("returns estimate_v2 winner when v2 absolute error is lower", () => {
    const result = service.calculateEstimateLearningResult({
      bookingId: "b1",
      actualMinutes: 470,
      legacyV1Minutes: 165,
      estimateV2ExpectedMinutes: 480,
    });
    expect(result.winner).toBe("estimate_v2");
  });

  it("returns legacy_v1 winner when v1 absolute error is lower", () => {
    const result = service.calculateEstimateLearningResult({
      bookingId: "b1",
      actualMinutes: 170,
      legacyV1Minutes: 165,
      estimateV2ExpectedMinutes: 480,
    });
    expect(result.winner).toBe("legacy_v1");
  });

  it("returns tie within five minutes absolute error difference", () => {
    const result = service.calculateEstimateLearningResult({
      bookingId: "b1",
      actualMinutes: 200,
      legacyV1Minutes: 190,
      estimateV2ExpectedMinutes: 212,
    });
    expect(result.winner).toBe("tie");
  });

  it("returns insufficient_data with invalid actual minutes", () => {
    const result = service.calculateEstimateLearningResult({
      bookingId: "b1",
      actualMinutes: 0,
      legacyV1Minutes: 165,
      estimateV2ExpectedMinutes: 480,
    });
    expect(result.winner).toBe("insufficient_data");
  });

  it("extracts legacy and v2 predictions from snapshot outputJson", () => {
    expect(service.extractLearningInputsFromSnapshot(snapshotOutputJson())).toEqual({
      legacyV1Minutes: 165,
      estimateV2ExpectedMinutes: 480,
      snapshotVersion: "estimate_engine_v2_core_v1",
      riskLevel: "high",
      serviceType: "deep_clean",
    });
  });
});

describe("BookingsService estimate learning completion hook", () => {
  it("booking completion with actualMinutes writes one estimate_learning_result event", async () => {
    const { service, bookingEventCreate } = makeCompletionHarness();
    await service.transitionBooking({
      id: "booking_1",
      transition: "complete",
      actualMinutes: 470,
    });
    expect(bookingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: BookingEventType.NOTE,
          idempotencyKey: "estimate-learning-result:booking_1",
          source: "REAL",
          environment: "PRODUCTION",
          eligibleForTraining: true,
          governanceReason: "real_completion_learning_event",
          createdBy: "system",
          payload: expect.objectContaining({
            kind: "estimate_learning_result",
            bookingId: "booking_1",
            actualMinutes: 470,
            winner: "estimate_v2",
            legacyV1: expect.objectContaining({
              predictedMinutes: 165,
              actualMinutes: 470,
              varianceMinutes: 305,
            }),
            estimateV2: expect.objectContaining({
              predictedMinutes: 480,
              actualMinutes: 470,
              varianceMinutes: -10,
            }),
          }),
        }),
      }),
    );
  });

  it("governance blocks synthetic training-eligible learning events", async () => {
    expect(() =>
      assertValidLearningGovernance({
        source: "SYNTHETIC",
        environment: "PRODUCTION",
        eligibleForTraining: true,
        governanceReason: "invalid_test",
        createdBy: "admin",
      }),
    ).toThrow("INVALID_LEARNING_GOVERNANCE:SYNTHETIC:PRODUCTION:true");

    const { service, bookingEventCreate } = makeCompletionHarness();
    await expect(
      service.transitionBooking({
        id: "booking_1",
        transition: "complete",
        actualMinutes: 470,
        learningGovernance: {
          source: "SYNTHETIC",
          environment: "SANDBOX",
          eligibleForTraining: true,
          governanceReason: "invalid_test",
          createdBy: "admin",
        },
      }),
    ).rejects.toThrow("INVALID_LEARNING_GOVERNANCE:SYNTHETIC:SANDBOX:true");
    expect(bookingEventCreate).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: "estimate-learning-result:booking_1",
        }),
      }),
    );
  });

  it("controlled admin governance writes synthetic sandbox non-training metadata", async () => {
    const { service, bookingEventCreate } = makeCompletionHarness();
    await service.transitionBooking({
      id: "booking_1",
      transition: "complete",
      actualMinutes: 470,
      learningGovernance: CONTROLLED_ADMIN_LEARNING_GOVERNANCE,
    });
    expect(bookingEventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: "estimate-learning-result:booking_1",
          source: "SYNTHETIC",
          environment: "SANDBOX",
          eligibleForTraining: false,
          governanceReason: "controlled_admin_validation",
          createdBy: "admin",
        }),
      }),
    );
  });

  it("repeated completion does not duplicate learning event", async () => {
    const { service, bookingEventCreate } = makeCompletionHarness({
      existingLearningEvent: true,
    });
    await service.transitionBooking({
      id: "booking_1",
      transition: "complete",
      actualMinutes: 470,
    });
    expect(bookingEventCreate).not.toHaveBeenCalled();
  });

  it("missing actualMinutes does not fabricate learning result", async () => {
    const { service, bookingEventCreate } = makeCompletionHarness();
    await service.transitionBooking({ id: "booking_1", transition: "complete" });
    expect(bookingEventCreate).not.toHaveBeenCalled();
  });

  it("learning write failure does not block booking completion", async () => {
    const { service, bookingEventCreate } = makeCompletionHarness({
      learningCreateRejects: true,
    });
    await expect(
      service.transitionBooking({
        id: "booking_1",
        transition: "complete",
        actualMinutes: 470,
      }),
    ).resolves.toEqual(expect.objectContaining({ status: BookingStatus.completed }));
    expect(bookingEventCreate).toHaveBeenCalled();
  });
});

describe("BookingsService admin controlled completion", () => {
  function makeControlledHarness(args?: {
    status?: BookingStatus;
    snapshot?: string | null;
    existingLearningEvent?: boolean;
    learningEventAfterCompletion?: boolean;
  }) {
    const booking = {
      id: "booking_1",
      status: args?.status ?? BookingStatus.in_progress,
      estimateSnapshot: {
        outputJson:
          args?.snapshot === undefined
            ? snapshotOutputJson({ estimatedDurationMinutes: 165 })
            : args.snapshot,
      },
    };
    const db = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(booking),
      },
      bookingEvent: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(
            args?.existingLearningEvent ? { id: "evt_existing" } : null,
          )
          .mockResolvedValueOnce(
            args?.learningEventAfterCompletion === false
              ? null
              : { id: "evt_learning" },
          ),
      },
    };
    const { service } = createBookingsServiceTestHarness({ db: db as never });
    const transitionBooking = jest
      .spyOn(service, "transitionBooking")
      .mockResolvedValue({
        id: "booking_1",
        status: BookingStatus.completed,
      } as never);
    return { service, db, transitionBooking };
  }

  it("requires explicit confirmation and valid actual minutes", async () => {
    const { service } = makeControlledHarness();
    await expect(
      service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 0,
        confirmControlledCompletion: true,
      }),
    ).rejects.toThrow("actualMinutes must be between 1 and 1440");
    await expect(
      service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: false,
      }),
    ).rejects.toThrow("confirmControlledCompletion must be true");
  });

  it("refuses missing snapshot and already completed bookings", async () => {
    await expect(
      makeControlledHarness({ snapshot: null }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
      }),
    ).rejects.toThrow("BOOKING_ESTIMATE_SNAPSHOT_REQUIRED");
    await expect(
      makeControlledHarness({
        status: BookingStatus.completed,
      }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
      }),
    ).rejects.toThrow("BOOKING_ALREADY_COMPLETED");
  });

  it("uses existing transitions and reports learning readiness", async () => {
    const { service, transitionBooking } = makeControlledHarness({
      status: BookingStatus.assigned,
    });
    const result = await service.completeBookingControlledByAdmin({
      bookingId: "booking_1",
      actualMinutes: 105,
      confirmControlledCompletion: true,
      note: "CONTROLLED_LEARNING_VALIDATION",
    });

    expect(transitionBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "booking_1",
        transition: "start",
      }),
    );
    expect(transitionBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "booking_1",
        transition: "complete",
        actualMinutes: 105,
        learningGovernance: CONTROLLED_ADMIN_LEARNING_GOVERNANCE,
      }),
    );
    expect(result).toEqual({
      bookingId: "booking_1",
      beforeStatus: BookingStatus.assigned,
      afterStatus: BookingStatus.completed,
      estimatedDurationMinutes: 165,
      actualMinutes: 105,
      learningReady: true,
      learningEventCreated: true,
    });
  });
});

describe("PaymentReliabilityService estimate learning ops summary", () => {
  it("ops endpoint returns zeros with no events", async () => {
    const service = new PaymentReliabilityService({
      bookingEvent: { findMany: jest.fn().mockResolvedValue([]) },
    } as never);
    const summary = await service.getEstimateLearningSummary();
    expect(summary).toEqual(
      expect.objectContaining({
        window: "24h",
        totals: {
          completedWithActuals: 0,
          legacyV1Wins: 0,
          estimateV2Wins: 0,
          ties: 0,
          insufficientData: 0,
        },
        byRiskLevel: [],
        recentResults: [],
        observabilityCoverage: {
          learningResultsPersisted: true,
          requiresActualMinutes: true,
          autoTuningEnabled: false,
        },
      }),
    );
  });

  it("ops endpoint aggregates winners and average variances from persisted events", async () => {
    const service = new PaymentReliabilityService({
      bookingEvent: {
        findMany: jest.fn().mockResolvedValue([
          {
            bookingId: "b1",
            createdAt: new Date("2030-06-01T12:00:00.000Z"),
            payload: learningPayload({
              bookingId: "b1",
              actualMinutes: 470,
              winner: "estimate_v2",
              legacyVariance: 305,
              v2Variance: -10,
              riskLevel: "high",
            }),
          },
          {
            bookingId: "b2",
            createdAt: new Date("2030-06-01T11:00:00.000Z"),
            payload: learningPayload({
              bookingId: "b2",
              actualMinutes: 170,
              winner: "legacy_v1",
              legacyVariance: 5,
              v2Variance: -310,
              riskLevel: "high",
            }),
          },
        ]),
      },
    } as never);
    const summary = await service.getEstimateLearningSummary();
    expect(summary.totals).toEqual({
      completedWithActuals: 2,
      legacyV1Wins: 1,
      estimateV2Wins: 1,
      ties: 0,
      insufficientData: 0,
    });
    expect(summary.averages.legacyV1AbsVarianceMinutes).toBe(155);
    expect(summary.averages.estimateV2AbsVarianceMinutes).toBe(160);
    expect(summary.byRiskLevel[0]).toEqual(
      expect.objectContaining({
        riskLevel: "high",
        count: 2,
        legacyV1Wins: 1,
        estimateV2Wins: 1,
      }),
    );
    expect(summary.recentResults[0]).toEqual(
      expect.objectContaining({
        bookingId: "b1",
        actualMinutes: 470,
        winner: "estimate_v2",
        legacyV1VarianceMinutes: 305,
        estimateV2VarianceMinutes: -10,
      }),
    );
  });

  it("endpoint handler returns estimate learning summary", async () => {
    const summary = { window: "24h", totals: {} };
    const paymentReliability = {
      getEstimateLearningSummary: jest.fn().mockResolvedValue(summary),
    };
    const controller = new ReliabilityOpsController(
      {} as never,
      {} as never,
      paymentReliability as never,
    );
    await expect(controller.getEstimateLearningSummary()).resolves.toBe(summary);
    expect(paymentReliability.getEstimateLearningSummary).toHaveBeenCalledTimes(1);
  });
});
