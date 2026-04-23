import { BookingStatus } from "@prisma/client";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../src/prisma";
import { BookingsService } from "../src/modules/bookings/bookings.service";
import { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";
import { SlotHoldsService } from "../src/modules/slot-holds/slot-holds.service";
import { PublicBookingOrchestratorService } from "../src/modules/public-booking-orchestrator/public-booking-orchestrator.service";

const START = "2030-06-01T14:00:00.000Z";
const END = "2030-06-01T15:00:00.000Z";

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
      startAt: START,
      endAt: END,
    });
    expect(bookingUpdate).toHaveBeenCalledWith({
      where: { id: "bk_hold" },
      data: { preferredFoId: "fo_a" },
    });
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

  it("confirmHold: happy path delegates to BookingsService.confirmBookingFromHold", async () => {
    const scheduled = new Date("2030-06-01T14:00:00.000Z");
    const confirmBookingFromHold = jest.fn().mockResolvedValue({
      id: "bk_hold",
      scheduledStart: scheduled,
      estimatedHours: 2,
      status: BookingStatus.assigned,
      alreadyApplied: false,
    });

    const prisma = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(schedulableHoldBooking()),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          id: "hold_1",
          bookingId: "bk_hold",
        }),
      },
    } as unknown as PrismaService;

    const svc = new PublicBookingOrchestratorService(
      prisma,
      {} as SlotAvailabilityService,
      {} as SlotHoldsService,
      { confirmBookingFromHold } as unknown as BookingsService,
      {} as FoService,
    );

    const res = await svc.confirmHold(
      { bookingId: "bk_hold", holdId: "hold_1" },
      "idem-key-1",
    );

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
    );

    await expect(
      svc.confirmHold({ bookingId: "bk_hold", holdId: "hold_1" }, null),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(confirmBookingFromHold).not.toHaveBeenCalled();
  });
});
