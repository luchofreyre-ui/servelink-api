import { ConflictException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import type { PrismaService } from "../src/prisma";
import type { FoService } from "../src/modules/fo/fo.service";
import { createBookingsServiceTestHarness } from "./helpers/createBookingsServiceTestHarness";

function makeService(tx: Record<string, unknown>) {
  const db = {
    $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx as any)),
  } as unknown as PrismaService;

  const { service } = createBookingsServiceTestHarness({
    db,
    fo: { getEligibility: jest.fn() } as unknown as FoService,
  });
  return service;
}

describe("BookingsService.confirmBookingFromHold", () => {
  const baseBooking = {
    id: "bk1",
    status: BookingStatus.pending_payment,
    foId: null,
    estimatedHours: 5.42,
    scheduledStart: null,
    tenantId: "nustandard",
    estimateSnapshot: null as { outputJson: string } | null,
  };

  const crewAdjustedHold = {
    id: "h1",
    bookingId: "bk1",
    foId: "fo1",
    startAt: new Date("2030-06-01T12:00:00.000Z"),
    endAt: new Date("2030-06-01T14:05:00.000Z"),
    expiresAt: new Date("2030-06-02T00:00:00.000Z"),
  };

  afterEach(() => {
    jest.useRealTimers();
  });

  it("rejects expired hold with BOOKING_SLOT_HOLD_EXPIRED (public elapsed model)", async () => {
    const hold = {
      ...crewAdjustedHold,
      expiresAt: new Date("2000-01-01T00:00:00.000Z"),
    };
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(baseBooking),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(hold),
      },
    };
    const svc = makeService(tx);

    try {
      await svc.confirmBookingFromHold({
        bookingId: "bk1",
        holdId: "h1",
        idempotencyKey: null,
        useHoldElapsedDurationModel: true,
      });
      throw new Error("expected ConflictException");
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      const body = (e as ConflictException).getResponse() as {
        message?: string;
      };
      expect(body?.message).toBe("BOOKING_SLOT_HOLD_EXPIRED");
    }
  });

  it("legacy path still throws BOOKING_SLOT_HOLD_DURATION_MISMATCH when hold ≠ estimatedHours minutes", async () => {
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(baseBooking),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(crewAdjustedHold),
      },
    };
    const svc = makeService(tx);

    try {
      await svc.confirmBookingFromHold({
        bookingId: "bk1",
        holdId: "h1",
        idempotencyKey: null,
      });
    } catch (e) {
      expect(e).toBeInstanceOf(ConflictException);
      const body = (e as ConflictException).getResponse() as {
        message?: string;
      };
      expect(body?.message).toBe("BOOKING_SLOT_HOLD_DURATION_MISMATCH");
    }
  });

  it("rejects past hold start before assignment writes", async () => {
    const now = new Date("2030-06-01T12:00:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(baseBooking),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      bookingEvent: {
        create: jest.fn(),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue({
          ...crewAdjustedHold,
          startAt: now,
          endAt: new Date(now.getTime() + 60 * 60 * 1000),
          expiresAt: new Date("2030-06-01T13:00:00.000Z"),
        }),
        delete: jest.fn(),
      },
    };
    const svc = makeService(tx);

    await expect(
      svc.confirmBookingFromHold({
        bookingId: "bk1",
        holdId: "h1",
        idempotencyKey: null,
        useHoldElapsedDurationModel: true,
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_SLOT_IN_PAST",
      }),
    });

    expect(tx.booking.updateMany).not.toHaveBeenCalled();
    expect(tx.bookingEvent.create).not.toHaveBeenCalled();
    expect(tx.bookingSlotHold.delete).not.toHaveBeenCalled();
  });

  it("public elapsed model does not throw duration mismatch for 125m hold vs 325m from estimatedHours", async () => {
    const tx = {
      booking: {
        findUnique: jest.fn().mockResolvedValue(baseBooking),
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      bookingEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
      bookingSlotHold: {
        findUnique: jest.fn().mockResolvedValue(crewAdjustedHold),
        delete: jest.fn().mockResolvedValue({}),
      },
    };
    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
    } as unknown as FoService;

    const db = {
      $transaction: jest.fn((fn: (t: typeof tx) => Promise<unknown>) => fn(tx as any)),
    } as unknown as PrismaService;

    const { service: svc } = createBookingsServiceTestHarness({
      db,
      fo,
    });

    tx.booking.findUnique = jest
      .fn()
      .mockResolvedValueOnce(baseBooking)
      .mockResolvedValueOnce({
        ...baseBooking,
        status: BookingStatus.assigned,
        foId: "fo1",
        scheduledStart: crewAdjustedHold.startAt,
        scheduledEnd: crewAdjustedHold.endAt,
      });

    await expect(
      svc.confirmBookingFromHold({
        bookingId: "bk1",
        holdId: "h1",
        idempotencyKey: null,
        useHoldElapsedDurationModel: true,
      }),
    ).resolves.toMatchObject({ id: "bk1", status: BookingStatus.assigned });

    expect(fo.getEligibility).toHaveBeenCalledWith("fo1");
    expect(tx.booking.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          scheduledStart: crewAdjustedHold.startAt,
          scheduledEnd: crewAdjustedHold.endAt,
        }),
      }),
    );
  });
});
