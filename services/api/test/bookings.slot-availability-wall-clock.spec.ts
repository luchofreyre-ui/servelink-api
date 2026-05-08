import { ConflictException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import type { PrismaService } from "../src/prisma";
import type { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";
import { SlotHoldsService } from "../src/modules/slot-holds/slot-holds.service";
import { createBookingsServiceTestHarness } from "./helpers/createBookingsServiceTestHarness";

describe("slot availability and holds — wall-clock existing booking overlap", () => {
  const foId = "fo-wall-clock";
  const bookingStart = new Date("2035-06-04T19:00:00.000Z");
  const wallEnd = new Date(bookingStart.getTime() + 139 * 60 * 1000);

  afterEach(() => {
    jest.useRealTimers();
  });

  const existingBooking = {
    id: "booking-existing",
    scheduledStart: bookingStart,
    scheduledEnd: null as Date | null,
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
          scheduledEnd: true,
          estimatedHours: true,
          estimateSnapshot: { select: { outputJson: true } },
        },
      }),
    );
  });

  it("uses persisted scheduledEnd instead of a mismatched snapshot wall-clock when blocking", async () => {
    const phantomSnapshotMinutes = 600;
    const db = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            ...existingBooking,
            scheduledEnd: wallEnd,
            estimateSnapshot: {
              outputJson: JSON.stringify({
                estimatedDurationMinutes: phantomSnapshotMinutes,
              }),
            },
          },
        ]),
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

    expect(windows.some((w) => w.startAt.toISOString() === "2035-06-04T21:30:00.000Z")).toBe(
      true,
    );
  });

  it("filters past candidate windows from availability", async () => {
    const now = new Date("2026-04-28T23:50:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    const db = {
      booking: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      bookingSlotHold: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;
    const service = new SlotAvailabilityService(db);

    const windows = await service.listAvailableWindows({
      foId: "fo-stale-filter",
      rangeStart: new Date("2026-04-27T00:00:00.000Z"),
      rangeEnd: new Date("2026-04-29T03:00:00.000Z"),
      durationMinutes: 60,
      slotIntervalMinutes: 30,
    });

    expect(windows.length).toBeGreaterThan(0);
    expect(windows.every((w) => w.startAt.getTime() > now.getTime())).toBe(true);
    expect(
      windows.some((w) => w.startAt.toISOString().startsWith("2026-04-27")),
    ).toBe(false);
  });

  it("rejects hold creation for a past start before mutations", async () => {
    const now = new Date("2026-04-28T23:50:00.000Z");
    jest.useFakeTimers().setSystemTime(now);
    const tx = {
      booking: {
        findMany: jest.fn(),
      },
      bookingSlotHold: {
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
    };
    const db = {
      $transaction: jest.fn((fn: (txArg: typeof tx) => Promise<unknown>) => fn(tx)),
    } as unknown as PrismaService;
    const fo = {
      getEligibility: jest.fn(),
    } as unknown as FoService;
    const service = new SlotHoldsService(db, fo);

    await expect(
      service.createHold({
        bookingId: "booking-new",
        foId,
        startAt: new Date("2026-04-28T23:50:00.000Z"),
        endAt: new Date("2026-04-29T00:50:00.000Z"),
      }),
    ).rejects.toMatchObject({
      response: expect.objectContaining({
        code: "PUBLIC_BOOKING_SLOT_IN_PAST",
      }),
    });

    expect(fo.getEligibility).not.toHaveBeenCalled();
    expect((db as any).$transaction).not.toHaveBeenCalled();
    expect(tx.bookingSlotHold.create).not.toHaveBeenCalled();
  });

  it("allows a hold adjacent to the existing booking wall-clock end", async () => {
    const tx = {
      booking: {
        findMany: jest.fn().mockResolvedValue([existingBooking]),
        findUnique: jest.fn().mockResolvedValue({ tenantId: null }),
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
        findUnique: jest.fn().mockResolvedValue({ tenantId: null }),
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

  it("allows requested booking adjacency using requested snapshot wall-clock duration instead of labor hours", async () => {
    const requestedStart = new Date("2035-06-04T10:00:00.000Z");
    const adjacentExistingStart = new Date("2035-06-04T12:00:00.000Z");
    const db = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "booking-existing-after-request",
            scheduledStart: adjacentExistingStart,
            scheduledEnd: null,
            estimatedHours: 1,
            estimateSnapshot: {
              outputJson: JSON.stringify({ estimatedDurationMinutes: 60 }),
            },
          },
        ]),
      },
    } as unknown as PrismaService;
    const { service } = createBookingsServiceTestHarness({ db });

    await expect(
      (service as any).assertFoAvailableForWindow({
        bookingId: "booking-requested",
        foId,
        scheduledStart: requestedStart,
        estimatedHours: 5,
        requestedEstimateSnapshotOutputJson: JSON.stringify({
          estimatedDurationMinutes: 120,
        }),
      }),
    ).resolves.toBeUndefined();
  });
});
