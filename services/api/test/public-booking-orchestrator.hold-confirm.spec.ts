import { BookingRecoveryStatus, BookingStatus } from "@prisma/client";
import { BadRequestException, ConflictException, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../src/prisma";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";
import { SlotHoldsService } from "../src/modules/slot-holds/slot-holds.service";
import { PublicBookingOrchestratorService } from "../src/modules/public-booking-orchestrator/public-booking-orchestrator.service";
import type { PublicBookingDepositService } from "../src/modules/public-booking-orchestrator/public-booking-deposit.service";
import {
  decodePublicSlotId,
  encodePublicSlotId,
} from "../src/modules/slot-holds/public-slot-id";

const noopPublicDeposit = {
  ensurePublicDepositResolvedBeforeConfirm: jest.fn().mockResolvedValue(undefined),
} as unknown as PublicBookingDepositService;

const START = "2030-06-01T14:00:00.000Z";
const END = "2030-06-01T15:00:00.000Z";

function decodeSlotEnvelope(slotId: string) {
  return JSON.parse(Buffer.from(slotId, "base64url").toString("utf8")) as {
    v?: number;
    payload?: Record<string, unknown>;
    sig?: string;
  };
}

function encodeSlotEnvelope(envelope: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(envelope), "utf8").toString("base64url");
}

function unsignedLegacySlotId(input: {
  foId: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
}) {
  return Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
}

/** FO row that yields 60m crew-adjusted slots for default parse labor (120m) + 1h hold window. */
function franchiseOwnerRowForPublicHoldTests() {
  return {
    teamSize: 4,
    minCrewSize: 2,
    preferredCrewSize: 2,
    maxCrewSize: 6,
  };
}

function schedulableHoldBooking() {
  return {
    id: "bk_hold",
    status: BookingStatus.pending_payment,
    foId: null,
    preferredFoId: null,
    scheduledStart: null,
    estimatedHours: 1,
    siteLat: null,
    siteLng: null,
    estimateSnapshot: {
      outputJson: JSON.stringify({
        matchedCleaners: [{ id: "fo_a" }, { id: "fo_b" }],
      }),
      inputJson: "{}",
    },
  };
}

describe("PublicBookingOrchestratorService — public hold + confirm", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("createHold: happy path delegates to slot holds and returns public hold shape", async () => {
    const start = new Date(START);
    const end = new Date(END);
    const createHold = jest.fn().mockResolvedValue({
      id: "hold_1",
      expiresAt: new Date("2030-06-01T16:00:00.000Z"),
      foId: "fo_a",
      startAt: start,
      endAt: end,
    });
    const bookingUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
        update: bookingUpdate,
      },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
    } as unknown as PrismaService;

    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([{ startAt: start, endAt: end }]),
    } as unknown as SlotAvailabilityService;

    const slotHolds = { createHold } as unknown as SlotHoldsService;
    const bookings = {} as unknown as BookingsService;
    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
      matchFOs: jest.fn(),
    } as unknown as FoService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      slotHolds,
      bookings,
      fo,
      noopPublicDeposit,
    );

    const res = await svc.createHold({
      bookingId: "bk_hold",
      foId: "fo_a",
      startAt: START,
      endAt: END,
    });

    expect(res.kind).toBe("public_booking_hold");
    if (res.kind !== "public_booking_hold") throw new Error("unexpected kind");
    expect(res.holdId).toBe("hold_1");
    expect(res.bookingId).toBe("bk_hold");
    expect(res.expiresAt).toMatch(/2030-06-01/);
    expect(res.window.foId).toBe("fo_a");
    expect(createHold).toHaveBeenCalledWith({
      bookingId: "bk_hold",
      foId: "fo_a",
      startAt: start,
      endAt: end,
    });
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: "bk_hold" },
      data: { preferredFoId: "fo_a" },
    });
  });

  it("availability: returns deterministic slotId for each public window", async () => {
    const start = new Date(START);
    const end = new Date("2030-06-01T16:00:00.000Z");
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          ...schedulableHoldBooking(),
          foId: "fo_a",
        }),
      },
      franchiseOwner: {
        findUnique: jest.fn().mockResolvedValue({
          id: "fo_a",
          displayName: "North Team",
          teamSize: null,
          minCrewSize: null,
          preferredCrewSize: null,
          maxCrewSize: null,
        }),
      },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([{ startAt: start, endAt: end }]),
    } as unknown as SlotAvailabilityService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      {} as SlotHoldsService,
      {} as BookingsService,
      {
        getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
        matchFOs: jest.fn(),
      } as unknown as FoService,
      noopPublicDeposit,
    );

    const res = await svc.availability({ bookingId: "bk_hold", foId: "fo_a" });

    expect(res.kind).toBe("public_booking_team_availability");
    if (res.kind !== "public_booking_team_availability") {
      throw new Error("unexpected kind");
    }
    expect(res.windows[0]).toEqual(
      expect.objectContaining({
        slotId: expect.any(String),
        foId: "fo_a",
        startAt: START,
        endAt: end.toISOString(),
        durationMinutes: 120,
      }),
    );
    expect(decodePublicSlotId(res.windows[0].slotId)).toEqual(expect.objectContaining({
      foId: "fo_a",
      startAt: START,
      endAt: end.toISOString(),
      durationMinutes: 120,
      issuedAt: expect.any(String),
      expiresAt: expect.any(String),
    }));
    const envelope = decodeSlotEnvelope(res.windows[0].slotId);
    expect(envelope).toEqual(
      expect.objectContaining({
        v: 1,
        payload: expect.objectContaining({
          foId: "fo_a",
          startAt: START,
          endAt: end.toISOString(),
          durationMinutes: 120,
          issuedAt: expect.any(String),
          expiresAt: expect.any(String),
        }),
        sig: expect.any(String),
      }),
    );
  });

  it("slotId: decodes before expiration and rejects after expiration", () => {
    jest.useFakeTimers().setSystemTime(new Date("2030-06-01T13:00:00.000Z"));
    const slotId = encodePublicSlotId({
      foId: "fo_a",
      startAt: START,
      endAt: END,
      durationMinutes: 60,
    });

    expect(decodePublicSlotId(slotId)).toEqual(
      expect.objectContaining({
        foId: "fo_a",
        startAt: START,
        endAt: END,
        durationMinutes: 60,
        issuedAt: "2030-06-01T13:00:00.000Z",
        expiresAt: "2030-06-01T13:05:00.000Z",
      }),
    );

    jest.setSystemTime(new Date("2030-06-01T13:05:00.001Z"));
    expect(decodePublicSlotId(slotId)).toBeNull();
  });

  it("slotId: tampered expiresAt fails signature verification", () => {
    jest.useFakeTimers().setSystemTime(new Date("2030-06-01T13:00:00.000Z"));
    const slotId = encodePublicSlotId({
      foId: "fo_a",
      startAt: START,
      endAt: END,
      durationMinutes: 60,
    });
    const envelope = decodeSlotEnvelope(slotId);
    const tamperedSlotId = encodeSlotEnvelope({
      ...envelope,
      payload: {
        ...envelope.payload,
        expiresAt: "2030-06-01T14:00:00.000Z",
      },
    });

    expect(decodePublicSlotId(tamperedSlotId)).toBeNull();
  });

  it("createHold: rejects expired signed slotId as invalid without creating hold", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2030-06-01T13:00:00.000Z"));
    const createHold = jest.fn();
    const anomalyCreate = jest.fn().mockResolvedValue({});
    const slotId = encodePublicSlotId({
      foId: "fo_a",
      startAt: START,
      endAt: END,
      durationMinutes: 60,
    });
    jest.setSystemTime(new Date("2030-06-01T13:05:00.001Z"));
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      paymentAnomaly: { create: anomalyCreate },
    } as unknown as PrismaService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({ bookingId: "bk_hold", slotId }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_INVALID_SLOT_ID",
      }),
    });
    expect(createHold).not.toHaveBeenCalled();
    expect(anomalyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: "public_booking_hold_failed",
          details: expect.objectContaining({
            code: "PUBLIC_BOOKING_INVALID_SLOT_ID",
            stage: "decode_slot_id",
            decodedSlotIdValid: false,
          }),
        }),
      }),
    );
  });

  it("createHold: accepts exact server slotId", async () => {
    const start = new Date(START);
    const end = new Date(END);
    const slotId = encodePublicSlotId({
      foId: "fo_a",
      startAt: start,
      endAt: end,
      durationMinutes: 60,
    });
    const createHold = jest.fn().mockResolvedValue({
      id: "hold_1",
      expiresAt: new Date("2030-06-01T16:00:00.000Z"),
      foId: "fo_a",
      startAt: start,
      endAt: end,
    });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
        update: jest.fn().mockResolvedValue({}),
      },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([{ startAt: start, endAt: end }]),
    } as unknown as SlotAvailabilityService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {
        getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
        matchFOs: jest.fn(),
      } as unknown as FoService,
      noopPublicDeposit,
    );

    const res = await svc.createHold({ bookingId: "bk_hold", slotId });

    expect(res.kind).toBe("public_booking_hold");
    expect(createHold).toHaveBeenCalledWith({
      bookingId: "bk_hold",
      foId: "fo_a",
      startAt: start,
      endAt: end,
    });
  });

  it("createHold: rejects tampered signed slotId without creating hold", async () => {
    const createHold = jest.fn();
    const slotId = encodePublicSlotId({
      foId: "fo_a",
      startAt: START,
      endAt: END,
      durationMinutes: 60,
    });
    const envelope = decodeSlotEnvelope(slotId);
    const tamperedSlotId = encodeSlotEnvelope({
      ...envelope,
      payload: {
        ...envelope.payload,
        foId: "fo_b",
      },
    });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
    } as unknown as PrismaService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({ bookingId: "bk_hold", slotId: tamperedSlotId }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_INVALID_SLOT_ID",
      }),
    });
    expect(createHold).not.toHaveBeenCalled();
  });

  it("createHold: rejects unsigned legacy slotId without creating hold", async () => {
    const createHold = jest.fn();
    const slotId = unsignedLegacySlotId({
      foId: "fo_a",
      startAt: START,
      endAt: END,
      durationMinutes: 60,
    });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
    } as unknown as PrismaService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({ bookingId: "bk_hold", slotId }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_INVALID_SLOT_ID",
      }),
    });
    expect(decodePublicSlotId(slotId)).toBeNull();
    expect(createHold).not.toHaveBeenCalled();
  });

  it("createHold: rejects invalid slotId without creating hold", async () => {
    const createHold = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
    } as unknown as PrismaService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({ bookingId: "bk_hold", slotId: "not-base64-json" }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_INVALID_SLOT_ID",
      }),
    });
    expect(createHold).not.toHaveBeenCalled();
  });

  it("createHold: rejects stale slotId that is no longer offered", async () => {
    const logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    const createHold = jest.fn();
    const anomalyCreate = jest.fn().mockResolvedValue({});
    const slotId = encodePublicSlotId({
      foId: "fo_a",
      startAt: START,
      endAt: END,
      durationMinutes: 60,
    });
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
      paymentAnomaly: { create: anomalyCreate },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([
        {
          startAt: new Date("2030-06-01T16:00:00.000Z"),
          endAt: new Date("2030-06-01T17:00:00.000Z"),
        },
      ]),
    } as unknown as SlotAvailabilityService;
    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {
        getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
        matchFOs: jest.fn(),
      } as unknown as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({ bookingId: "bk_hold", slotId }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
      }),
    });
    expect(createHold).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "public_booking_lifecycle",
        event: "hold_failed",
        bookingId: "bk_hold",
        failureCode: "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
        failureStage: "availability_revalidation",
      }),
    );
    expect(anomalyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          kind: "public_booking_hold_failed",
          details: expect.objectContaining({
            code: "PUBLIC_BOOKING_SLOT_NOT_AVAILABLE",
            stage: "availability_revalidation",
          }),
        }),
      }),
    );
  });

  it("createHold: rejects foId not in candidate set and does not create hold", async () => {
    const createHold = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {
        getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
        matchFOs: jest.fn(),
      } as unknown as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({
        bookingId: "bk_hold",
        foId: "fo_not_in_snapshot",
        startAt: START,
        endAt: END,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(createHold).not.toHaveBeenCalled();
  });

  it("createHold: rejects slot not matching availability and does not create hold", async () => {
    const createHold = jest.fn();
    const start = new Date(START);
    const end = new Date(END);
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
    } as unknown as PrismaService;

    const slotAvailability = {
      listAvailableWindows: jest
        .fn()
        .mockResolvedValue([
          {
            startAt: new Date("2030-06-01T09:00:00.000Z"),
            endAt: new Date("2030-06-01T10:00:00.000Z"),
          },
        ]),
    } as unknown as SlotAvailabilityService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {
        getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
        matchFOs: jest.fn(),
      } as unknown as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({
        bookingId: "bk_hold",
        foId: "fo_a",
        startAt: START,
        endAt: END,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(createHold).not.toHaveBeenCalled();
  });

  it("createHold: does not persist preferredFoId when hold service rejects a past start", async () => {
    const bookingUpdate = jest.fn();
    const start = new Date(START);
    const end = new Date(END);
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
        update: bookingUpdate,
      },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([{ startAt: start, endAt: end }]),
    } as unknown as SlotAvailabilityService;
    const createHold = jest.fn().mockRejectedValue(
      new ConflictException({
        code: "PUBLIC_BOOKING_SLOT_IN_PAST",
        message:
          "Selected arrival time is no longer available. Please choose a future time.",
      }),
    );

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      { createHold } as unknown as SlotHoldsService,
      {} as BookingsService,
      {
        getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
        matchFOs: jest.fn(),
      } as unknown as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.createHold({
        bookingId: "bk_hold",
        foId: "fo_a",
        startAt: START,
        endAt: END,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_SLOT_IN_PAST",
      }),
    });

    expect(createHold).toHaveBeenCalled();
    expect(bookingUpdate).not.toHaveBeenCalled();
  });

  it("confirmHold: happy path delegates to BookingsService.confirmBookingFromHold", async () => {
    const logSpy = jest.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    const scheduled = new Date("2030-06-01T14:00:00.000Z");
    const holdEnd = new Date(scheduled.getTime() + 184 * 60 * 1000);
    const confirmBookingFromHold = jest.fn().mockResolvedValue({
      id: "bk_hold",
      scheduledStart: scheduled,
      estimatedHours: 12.07,
      status: BookingStatus.assigned,
      alreadyApplied: false,
    });
    const deposit = {
      ensurePublicDepositResolvedBeforeConfirm: jest.fn().mockResolvedValue(undefined),
    } as unknown as PublicBookingDepositService;

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "bk_hold",
          foId: "fo_a",
          startAt: scheduled,
          endAt: holdEnd,
          expiresAt: new Date("2030-06-01T20:00:00.000Z"),
        }),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      deposit,
    );

    const res = await svc.confirmHold(
      { bookingId: "bk_hold", holdId: "hold_1" },
      "idem-key-1",
    );

    expect(deposit.ensurePublicDepositResolvedBeforeConfirm).toHaveBeenCalledWith({
      bookingId: "bk_hold",
      holdId: "hold_1",
      stripePaymentMethodId: null,
      idempotencyKey: "idem-key-1",
    });
    expect(res.kind).toBe("public_booking_confirmation");
    if (res.kind !== "public_booking_confirmation") throw new Error("unexpected kind");
    expect(res.bookingId).toBe("bk_hold");
    expect(res.status).toBe(BookingStatus.assigned);
    expect(confirmBookingFromHold).toHaveBeenCalledWith({
      bookingId: "bk_hold",
      holdId: "hold_1",
      note: undefined,
      idempotencyKey: "idem-key-1",
      useHoldElapsedDurationModel: true,
    });
    expect(res.scheduledStart).toBe(scheduled.toISOString());
    expect(res.scheduledEnd).toBe(holdEnd.toISOString());
    expect(res.scheduledEnd).not.toBe(
      new Date(
        scheduled.getTime() + 12.07 * 60 * 60 * 1000,
      ).toISOString(),
    );
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "public_booking_lifecycle",
        event: "confirm_succeeded",
        bookingId: "bk_hold",
        holdId: "hold_1",
      }),
    );
  });

  it("confirmHold: rejects past hold before deposit mutation", async () => {
    const now = new Date("2030-06-01T14:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    const pastStart = new Date("2030-06-01T14:00:00.000Z");
    const pastEnd = new Date("2030-06-01T15:00:00.000Z");
    const confirmBookingFromHold = jest.fn();
    const deposit = {
      ensurePublicDepositResolvedBeforeConfirm: jest.fn().mockResolvedValue(undefined),
    } as unknown as PublicBookingDepositService;
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "bk_hold",
          foId: "fo_a",
          startAt: pastStart,
          endAt: pastEnd,
          expiresAt: new Date("2030-06-01T16:00:00.000Z"),
        }),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      deposit,
    );

    await expect(
      svc.confirmHold({ bookingId: "bk_hold", holdId: "hold_1" }, "idem-key-1"),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_SLOT_IN_PAST",
      }),
    });

    expect(deposit.ensurePublicDepositResolvedBeforeConfirm).not.toHaveBeenCalled();
    expect(confirmBookingFromHold).not.toHaveBeenCalled();
  });

  it("confirmHold: missing hold returns structured not found", async () => {
    const confirmBookingFromHold = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.confirmHold({ bookingId: "bk_hold", holdId: "missing" }, null),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(confirmBookingFromHold).not.toHaveBeenCalled();
  });

  it("confirmHold: hold for different booking does not confirm", async () => {
    const confirmBookingFromHold = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "other_booking",
        }),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    await expect(
      svc.confirmHold({ bookingId: "bk_hold", holdId: "hold_1" }, null),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(confirmBookingFromHold).not.toHaveBeenCalled();
  });

  it("confirmHold: duplicate retry after successful finalization returns existing booking", async () => {
    const scheduled = new Date("2030-06-01T14:00:00.000Z");
    const booking = {
      ...schedulableHoldBooking(),
      status: BookingStatus.assigned,
      scheduledStart: scheduled,
      estimatedHours: 1,
      estimateSnapshot: {
        outputJson: JSON.stringify({ estimatedDurationMinutes: 60 }),
        inputJson: "{}",
      },
    };
    const confirmBookingFromHold = jest.fn();
    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(booking),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      noopPublicDeposit,
    );

    const res = await svc.confirmHold(
      { bookingId: "bk_hold", holdId: "deleted_hold" },
      "idem-key-1",
    );

    expect(res.alreadyApplied).toBe(true);
    expect(res.bookingId).toBe("bk_hold");
    expect(res.scheduledStart).toBe(scheduled.toISOString());
    expect(res.scheduledEnd).toBe("2030-06-01T15:00:00.000Z");
    expect(confirmBookingFromHold).not.toHaveBeenCalled();
  });

  it("confirmHold: payment success + expired hold recovers the same wall-clock slot", async () => {
    const scheduled = new Date("2030-06-01T14:00:00.000Z");
    const holdEnd = new Date(scheduled.getTime() + 184 * 60 * 1000);
    const recoveryUpdate = jest.fn().mockResolvedValue({});
    const anomalyCreate = jest.fn().mockResolvedValue({});
    const confirmBookingFromHold = jest
      .fn()
      .mockRejectedValueOnce(new ConflictException("BOOKING_SLOT_HOLD_EXPIRED"))
      .mockResolvedValueOnce({
        id: "bk_hold",
        scheduledStart: scheduled,
        estimatedHours: 12.07,
        status: BookingStatus.assigned,
        alreadyApplied: false,
      });
    const deposit = {
      ensurePublicDepositResolvedBeforeConfirm: jest.fn().mockResolvedValue(undefined),
    } as unknown as PublicBookingDepositService;

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
        update: recoveryUpdate,
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "bk_hold",
          foId: "fo_a",
          startAt: scheduled,
          endAt: holdEnd,
          expiresAt: new Date("2030-06-01T20:00:00.000Z"),
        }),
      },
      paymentAnomaly: {
        create: anomalyCreate,
      },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest
        .fn()
        .mockResolvedValue([{ startAt: scheduled, endAt: holdEnd }]),
    } as unknown as SlotAvailabilityService;
    const slotHolds = {
      createHold: jest.fn().mockResolvedValue({
        id: "hold_recovered",
        bookingId: "bk_hold",
        foId: "fo_a",
        startAt: scheduled,
        endAt: holdEnd,
        expiresAt: new Date("2030-06-01T20:00:00.000Z"),
      }),
    } as unknown as SlotHoldsService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      slotHolds,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      deposit,
    );

    const res = await svc.confirmHold(
      { bookingId: "bk_hold", holdId: "hold_1" },
      "idem-key-1",
    );

    expect(res.status).toBe(BookingStatus.assigned);
    expect(res.scheduledEnd).toBe(holdEnd.toISOString());
    expect(confirmBookingFromHold).toHaveBeenCalledTimes(2);
    expect(slotAvailability.listAvailableWindows).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: 184 }),
    );
    expect(recoveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recoveryStatus: BookingRecoveryStatus.none,
          originalRequestedTime: scheduled,
          recoveryAttemptedAt: expect.any(Date),
        }),
      }),
    );
    expect(anomalyCreate).not.toHaveBeenCalled();
  });

  it("confirmHold: payment success + slot taken finds an alternative and marks auto-adjusted", async () => {
    const scheduled = new Date("2030-06-01T14:00:00.000Z");
    const holdEnd = new Date(scheduled.getTime() + 60 * 60 * 1000);
    const altStart = new Date("2030-06-01T16:00:00.000Z");
    const altEnd = new Date("2030-06-01T17:00:00.000Z");
    const recoveryUpdate = jest.fn().mockResolvedValue({});
    const anomalyCreate = jest.fn().mockResolvedValue({});
    const confirmBookingFromHold = jest
      .fn()
      .mockRejectedValueOnce(new ConflictException("FO_SLOT_ALREADY_BOOKED"))
      .mockResolvedValueOnce({
        id: "bk_hold",
        scheduledStart: altStart,
        estimatedHours: 1,
        status: BookingStatus.assigned,
        alreadyApplied: false,
      });
    const deposit = {
      ensurePublicDepositResolvedBeforeConfirm: jest.fn().mockResolvedValue(undefined),
    } as unknown as PublicBookingDepositService;

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
        update: recoveryUpdate,
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "bk_hold",
          foId: "fo_a",
          startAt: scheduled,
          endAt: holdEnd,
          expiresAt: new Date("2030-06-01T20:00:00.000Z"),
        }),
      },
      paymentAnomaly: { create: anomalyCreate },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ startAt: altStart, endAt: altEnd }]),
    } as unknown as SlotAvailabilityService;
    const slotHolds = {
      createHold: jest.fn().mockResolvedValue({
        id: "hold_recovered",
        bookingId: "bk_hold",
        foId: "fo_a",
        startAt: altStart,
        endAt: altEnd,
        expiresAt: new Date("2030-06-01T20:00:00.000Z"),
      }),
    } as unknown as SlotHoldsService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      slotHolds,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      deposit,
    );

    const res = await svc.confirmHold(
      { bookingId: "bk_hold", holdId: "hold_1" },
      "idem-key-1",
    );

    expect(res.scheduledStart).toBe(altStart.toISOString());
    expect(res.scheduledEnd).toBe(altEnd.toISOString());
    expect(slotHolds.createHold).toHaveBeenCalledTimes(1);
    expect(confirmBookingFromHold).toHaveBeenCalledTimes(2);
    expect(recoveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recoveryStatus: BookingRecoveryStatus.auto_adjusted,
          originalRequestedTime: scheduled,
          recoveryAttemptedAt: expect.any(Date),
        }),
      }),
    );
    expect(anomalyCreate).not.toHaveBeenCalled();
  });

  it("confirmHold: payment success + no recovery slots marks failed and records anomaly", async () => {
    const scheduled = new Date("2030-06-01T14:00:00.000Z");
    const holdEnd = new Date(scheduled.getTime() + 60 * 60 * 1000);
    const recoveryUpdate = jest.fn().mockResolvedValue({});
    const anomalyCreate = jest.fn().mockResolvedValue({});
    const confirmBookingFromHold = jest
      .fn()
      .mockRejectedValue(new ConflictException("FO_SLOT_ALREADY_BOOKED"));
    const deposit = {
      ensurePublicDepositResolvedBeforeConfirm: jest.fn().mockResolvedValue(undefined),
    } as unknown as PublicBookingDepositService;

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
        update: recoveryUpdate,
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "bk_hold",
          foId: "fo_a",
          startAt: scheduled,
          endAt: holdEnd,
          expiresAt: new Date("2030-06-01T20:00:00.000Z"),
        }),
      },
      paymentAnomaly: { create: anomalyCreate },
      franchiseOwner: {
        findUnique: jest
          .fn()
          .mockResolvedValue(franchiseOwnerRowForPublicHoldTests()),
      },
    } as unknown as PrismaService;
    const slotAvailability = {
      listAvailableWindows: jest.fn().mockResolvedValue([]),
    } as unknown as SlotAvailabilityService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      slotAvailability,
      { createHold: jest.fn() } as unknown as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
      deposit,
    );

    await expect(
      svc.confirmHold({ bookingId: "bk_hold", holdId: "hold_1" }, "idem-key-1"),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(recoveryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          recoveryStatus: BookingRecoveryStatus.failed,
          originalRequestedTime: scheduled,
          recoveryAttemptedAt: expect.any(Date),
        }),
      }),
    );

    expect(anomalyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: "bk_hold",
          kind: "public_deposit_succeeded_booking_finalization_failed",
          status: "open",
          details: expect.objectContaining({
            reason: "PAID_NO_AVAILABLE_SLOT",
            recoveryReason: "SLOT_TAKEN",
            structuredReason: "NO_RECOVERY_AVAILABLE",
          }),
        }),
      }),
    );
  });
});
