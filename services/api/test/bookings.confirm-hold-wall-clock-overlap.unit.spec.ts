import { ConflictException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import type { PrismaService } from "../src/prisma";
import type { FoService } from "../src/modules/fo/fo.service";
import { createBookingsServiceTestHarness } from "./helpers/createBookingsServiceTestHarness";

function makeHarness(tx: Record<string, unknown>, fo: FoService) {
  const db = {
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx as any)),
  } as unknown as PrismaService;

  return createBookingsServiceTestHarness({ db, fo });
}

describe("BookingsService.confirmBookingFromHold — wall-clock overlap (useHoldElapsedDurationModel)", () => {
  const foId = "fo1";
  const t0 = new Date("2030-06-01T19:00:00.000Z");

  const existingA = {
    id: "bkA",
    scheduledStart: t0,
    estimatedHours: 12.07,
    estimateSnapshot: {
      outputJson: JSON.stringify({ estimatedDurationMinutes: 184 }),
    },
  };

  it("allows adjacent hold: next window starts when prior wall slot ends", async () => {
    const tHoldStart = new Date(t0.getTime() + 184 * 60 * 1000);
    const tHoldEnd = new Date(tHoldStart.getTime() + 90 * 60 * 1000);

    const hold = {
      id: "hB",
      bookingId: "bkB",
      foId,
      startAt: tHoldStart,
      endAt: tHoldEnd,
      expiresAt: new Date("2030-06-02T00:00:00.000Z"),
    };

    const currentB = {
      id: "bkB",
      status: BookingStatus.pending_payment,
      foId: null,
      estimatedHours: 5,
      scheduledStart: null,
    };

    let findUniqueCount = 0;
    const tx = {
      booking: {
        findUnique: jest.fn().mockImplementation(() => {
          findUniqueCount += 1;
          if (findUniqueCount === 1) return Promise.resolve(currentB);
          return Promise.resolve({
            ...currentB,
            status: BookingStatus.assigned,
            foId,
            scheduledStart: hold.startAt,
          });
        }),
        findMany: jest.fn().mockResolvedValue([existingA]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bookingEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(hold),
        delete: jest.fn().mockResolvedValue({}),
      },
    };

    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
    } as unknown as FoService;

    const { service } = makeHarness(tx, fo);

    await expect(
      service.confirmBookingFromHold({
        bookingId: "bkB",
        holdId: "hB",
        idempotencyKey: null,
        useHoldElapsedDurationModel: true,
      }),
    ).resolves.toMatchObject({
      id: "bkB",
      status: BookingStatus.assigned,
      foId,
    });

    expect(tx.booking.findMany).toHaveBeenCalled();
  });

  it("rejects overlapping hold against wall slot (not 12h labor phantom)", async () => {
    const tHoldStart = new Date(t0.getTime() + 60 * 60 * 1000);
    const tHoldEnd = new Date(tHoldStart.getTime() + 120 * 60 * 1000);

    const hold = {
      id: "hB",
      bookingId: "bkB",
      foId,
      startAt: tHoldStart,
      endAt: tHoldEnd,
      expiresAt: new Date("2030-06-02T00:00:00.000Z"),
    };

    const currentB = {
      id: "bkB",
      status: BookingStatus.pending_payment,
      foId: null,
      estimatedHours: 5,
      scheduledStart: null,
    };

    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(currentB),
        findMany: jest.fn().mockResolvedValue([existingA]),
        updateMany: jest.fn(),
      },
      bookingEvent: {
        create: jest.fn(),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(hold),
        delete: jest.fn(),
      },
    };

    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
    } as unknown as FoService;

    const { service } = makeHarness(tx, fo);

    await expect(
      service.confirmBookingFromHold({
        bookingId: "bkB",
        holdId: "hB",
        idempotencyKey: null,
        useHoldElapsedDurationModel: true,
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(tx.booking.updateMany).not.toHaveBeenCalled();
  });
});
