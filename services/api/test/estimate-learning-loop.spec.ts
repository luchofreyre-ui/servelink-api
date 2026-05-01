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

function makeSequentialFindFirst(
  valuesByIdempotencyKey: Record<string, unknown[]>,
): jest.Mock {
  return jest.fn(({ where }: { where?: { idempotencyKey?: string } } = {}) => {
    const key = where?.idempotencyKey ?? "";
    const values = valuesByIdempotencyKey[key] ?? [];
    return Promise.resolve(values.length ? values.shift() : null);
  });
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
    existingAuditEvent?: boolean;
    learningEventAfterCompletion?: boolean;
    auditEventAfterCompletion?: boolean;
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
        findFirst: makeSequentialFindFirst({
          "estimate-learning-result:booking_1": args?.existingLearningEvent
            ? [{ id: "evt_existing" }]
            : [
                null,
                args?.learningEventAfterCompletion === false
                  ? null
                  : { id: "evt_learning" },
              ],
          "controlled-completion-audit:booking_1": args?.existingAuditEvent
            ? [{ id: "evt_existing_audit" }]
            : [null],
        }),
        create: jest.fn().mockResolvedValue({ id: "evt_audit" }),
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

  it("requires explicit confirmation, note, and valid actual minutes", async () => {
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
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("confirmControlledCompletion must be true");
    await expect(
      service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: " ",
      }),
    ).rejects.toThrow("note must be present for controlled completion");
  });

  it("refuses missing snapshot and unsupported booking statuses", async () => {
    await expect(
      makeControlledHarness({ snapshot: null }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("BOOKING_ESTIMATE_SNAPSHOT_REQUIRED");
    await expect(
      makeControlledHarness({
        status: BookingStatus.completed,
      }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("BOOKING_ALREADY_COMPLETED");
    await expect(
      makeControlledHarness({
        status: BookingStatus.pending_payment,
      }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("BOOKING_CONTROLLED_COMPLETION_STATE_INVALID");
    await expect(
      makeControlledHarness({
        status: BookingStatus.canceled,
      }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("BOOKING_CONTROLLED_COMPLETION_STATE_INVALID");
  });

  it("refuses repeat execution when learning or audit events already exist", async () => {
    await expect(
      makeControlledHarness({
        existingLearningEvent: true,
      }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("BOOKING_LEARNING_EVENT_ALREADY_EXISTS");
    await expect(
      makeControlledHarness({
        existingAuditEvent: true,
        learningEventAfterCompletion: false,
      }).service.completeBookingControlledByAdmin({
        bookingId: "booking_1",
        actualMinutes: 105,
        confirmControlledCompletion: true,
        note: "CONTROLLED_LEARNING_VALIDATION",
      }),
    ).rejects.toThrow("BOOKING_CONTROLLED_COMPLETION_AUDIT_ALREADY_EXISTS");
  });

  it("creates learning and audit events with synthetic governance", async () => {
    const { service, db, transitionBooking } = makeControlledHarness({
      status: BookingStatus.assigned,
    });
    const result = await service.completeBookingControlledByAdmin({
      bookingId: "booking_1",
      actualMinutes: 105,
      confirmControlledCompletion: true,
      note: "CONTROLLED_LEARNING_VALIDATION",
      executedBy: "admin@example.test",
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
      auditEventCreated: true,
      source: "SYNTHETIC",
      environment: "SANDBOX",
      eligibleForTraining: false,
      governanceReason: "controlled_admin_validation",
    });
    expect(db.bookingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: BookingEventType.CONTROLLED_COMPLETION_AUDIT,
          idempotencyKey: "controlled-completion-audit:booking_1",
          source: "SYNTHETIC",
          environment: "SANDBOX",
          eligibleForTraining: false,
          governanceReason: "controlled_admin_validation",
          createdBy: "admin",
          payload: expect.objectContaining({
            kind: "controlled_completion_audit",
            actualMinutes: 105,
            confirmationReceived: true,
            executedBy: "admin@example.test",
            eligibleForTraining: false,
            reason: "controlled_admin_validation",
          }),
        }),
      }),
    );
  });
});

describe("BookingsService controlled completion audit read model", () => {
  it("returns controlledCompletionAudit from the latest audit event payload", () => {
    const { service } = createBookingsServiceTestHarness();

    const result = service.mapBookingWithEvents({
      id: "booking_1",
      status: BookingStatus.completed,
      BookingEvent: [
        {
          id: "evt_old",
          bookingId: "booking_1",
          type: BookingEventType.CONTROLLED_COMPLETION_AUDIT,
          createdAt: new Date("2030-06-01T10:00:00.000Z"),
          payload: {
            executedBy: "old-admin@example.com",
            executedAt: "2030-06-01T10:00:00.000Z",
            reason: "controlled_admin_validation",
            note: "old note",
            actualMinutes: 90,
            previousStatus: "assigned",
            nextStatus: "completed",
            source: "SYNTHETIC",
            environment: "SANDBOX",
            eligibleForTraining: false,
            confirmationReceived: true,
          },
        },
        {
          id: "evt_new",
          bookingId: "booking_1",
          type: BookingEventType.CONTROLLED_COMPLETION_AUDIT,
          createdAt: new Date("2030-06-01T12:00:00.000Z"),
          payload: {
            executedBy: "admin@example.com",
            executedAt: "2030-06-01T12:00:00.000Z",
            reason: "controlled_admin_validation",
            note: "CONTROLLED_LEARNING_VALIDATION_20260430",
            actualMinutes: 105,
            previousStatus: "in_progress",
            nextStatus: "completed",
            source: "SYNTHETIC",
            environment: "SANDBOX",
            eligibleForTraining: false,
            confirmationReceived: true,
          },
        },
      ],
    });

    expect(result.controlledCompletionAudit).toEqual({
      exists: true,
      executedBy: "admin@example.com",
      executedAt: "2030-06-01T12:00:00.000Z",
      reason: "controlled_admin_validation",
      note: "CONTROLLED_LEARNING_VALIDATION_20260430",
      actualMinutes: 105,
      previousStatus: "in_progress",
      nextStatus: "completed",
      source: "SYNTHETIC",
      environment: "SANDBOX",
      eligibleForTraining: false,
      confirmationReceived: true,
    });
  });

  it("returns null without a controlled completion audit event and preserves learning events", () => {
    const { service } = createBookingsServiceTestHarness();
    const learningEvent = {
      id: "evt_learning",
      bookingId: "booking_1",
      type: BookingEventType.STATUS_CHANGED,
      createdAt: new Date("2030-06-01T12:00:00.000Z"),
      payload: learningPayload({
        bookingId: "booking_1",
        actualMinutes: 105,
        winner: "estimate_v2",
      }),
    };

    const result = service.mapBookingWithEvents({
      id: "booking_1",
      status: BookingStatus.completed,
      BookingEvent: [learningEvent],
    });

    expect(result.controlledCompletionAudit).toBeNull();
    expect(result.events).toEqual([learningEvent]);
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
