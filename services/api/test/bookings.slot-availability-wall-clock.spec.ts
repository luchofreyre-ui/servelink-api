import { ConflictException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import type { PrismaService } from "../src/prisma";
import type { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";
import { SlotHoldsService } from "../src/modules/slot-holds/slot-holds.service";

describe("slot availability and holds — wall-clock existing booking overlap", () => {
  const foId = "fo-wall-clock";
  const bookingStart = new Date("2035-06-04T19:00:00.000Z");
  const wallEnd = new Date(bookingStart.getTime() + 139 * 60 * 1000);

  const existingBooking = {
    id: "booking-existing",
    scheduledStart: bookingStart,
    estimatedHours: 5.17,
    estimateSnapshot: {
      outputJson: JSON.stringify({ estimatedDurationMinutes: 139 }),
    },
  };

  it("lists availability after wall-clock end without a labor-hour phantom block", async () => {
    const db = {
      booking: {
        findMany: jest.fn().mockResolvedValue([existingBooking]),
      },
      bookingSlotHold: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;
    const service = new SlotAvailabilityService(db);

    const windows = await service.listAvailableWindows({
      foId,
      rangeStart: bookingStart,
      rangeEnd: new Date("2035-06-05T00:00:00.000Z"),
      durationMinutes: 60,
      slotIntervalMinutes: 30,
    });

    expect(windows.some((w) => w.startAt.toISOString() === "2035-06-04T21:30:00.000Z")).toBe(true);
    expect((db as any).booking.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          id: true,
          scheduledStart: true,
          estimatedHours: true,
          estimateSnapshot: { select: { outputJson: true } },
        },
      }),
    );
  });

  it("allows a hold adjacent to the existing booking wall-clock end", async () => {
    const tx = {
      booking: {
        findMany: jest.fn().mockResolvedValue([existingBooking]),
      },
      bookingSlotHold: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({
          id: "hold-adjacent",
          bookingId: "booking-new",
          foId,
          startAt: wallEnd,
          endAt: new Date(wallEnd.getTime() + 60 * 60 * 1000),
          expiresAt: new Date("2035-06-04T22:00:00.000Z"),
        }),
      },
    };
    const db = {
      $transaction: jest.fn((fn: (txArg: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;
    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
    } as unknown as FoService;
    const service = new SlotHoldsService(db, fo);

    await expect(
      service.createHold({
        bookingId: "booking-new",
        foId,
        startAt: wallEnd,
        endAt: new Date(wallEnd.getTime() + 60 * 60 * 1000),
      }),
    ).resolves.toMatchObject({ id: "hold-adjacent" });
  });

  it("rejects a hold overlapping the existing booking wall-clock duration", async () => {
    const tx = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            ...existingBooking,
            status: BookingStatus.assigned,
          },
        ]),
      },
      bookingSlotHold: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn(),
      },
    };
    const db = {
      $transaction: jest.fn((fn: (txArg: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;
    const fo = {
      getEligibility: jest.fn().mockResolvedValue({ canAcceptBooking: true }),
    } as unknown as FoService;
    const service = new SlotHoldsService(db, fo);

    await expect(
      service.createHold({
        bookingId: "booking-new",
        foId,
        startAt: new Date(bookingStart.getTime() + 60 * 60 * 1000),
        endAt: new Date(bookingStart.getTime() + 120 * 60 * 1000),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
