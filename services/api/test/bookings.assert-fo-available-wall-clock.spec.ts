import { ConflictException } from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import type { PrismaService } from "../src/prisma";
import { createBookingsServiceTestHarness } from "./helpers/createBookingsServiceTestHarness";

describe("BookingsService.assertFoAvailableForWindow — wall-clock existing booking overlap", () => {
  const bookingId = "booking-new";
  const foId = "fo-1";
  const scheduledStart = new Date("2035-06-04T19:00:00.000Z");

  function makeService(existingBookings: unknown[]) {
    const db = {
      booking: {
        findMany: jest.fn().mockResolvedValue(existingBookings),
      },
    } as unknown as PrismaService;

    const { service } = createBookingsServiceTestHarness({ db });
    return {
      service,
      findMany: (db as any).booking.findMany as jest.Mock,
    };
  }

  async function assertAvailable(
    service: unknown,
    args: {
      scheduledStart: Date;
      estimatedHours: number;
    },
  ) {
    await (service as any).assertFoAvailableForWindow({
      bookingId,
      foId,
      scheduledStart: args.scheduledStart,
      estimatedHours: args.estimatedHours,
    });
  }

  it("allows an adjacent booking when the existing booking ends at snapshot wall-clock duration", async () => {
    const existingBooking = {
      id: "booking-existing",
      scheduledStart,
      estimatedHours: 12.07,
      estimateSnapshot: {
        outputJson: JSON.stringify({ estimatedDurationMinutes: 184 }),
      },
    };
    const adjacentStart = new Date(scheduledStart.getTime() + 184 * 60 * 1000);
    const { service, findMany } = makeService([existingBooking]);

    await expect(
      assertAvailable(service, {
        scheduledStart: adjacentStart,
        estimatedHours: 1,
      }),
    ).resolves.toBeUndefined();

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: bookingId },
          foId,
          scheduledStart: { not: null },
          status: {
            in: [
              BookingStatus.pending_dispatch,
              BookingStatus.offered,
              BookingStatus.assigned,
              BookingStatus.in_progress,
            ],
          },
        }),
        select: {
          id: true,
          scheduledStart: true,
          estimatedHours: true,
          estimateSnapshot: { select: { outputJson: true } },
        },
      }),
    );
  });

  it("rejects a new booking that overlaps inside the existing snapshot wall-clock duration", async () => {
    const existingBooking = {
      id: "booking-existing",
      scheduledStart,
      estimatedHours: 12.07,
      estimateSnapshot: {
        outputJson: JSON.stringify({ estimatedDurationMinutes: 184 }),
      },
    };
    const overlappingStart = new Date(
      scheduledStart.getTime() + 183 * 60 * 1000,
    );
    const { service } = makeService([existingBooking]);

    await expect(
      assertAvailable(service, {
        scheduledStart: overlappingStart,
        estimatedHours: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("falls back to estimatedHours when snapshot wall-clock duration is missing", async () => {
    const existingBooking = {
      id: "booking-existing",
      scheduledStart,
      estimatedHours: 2,
      estimateSnapshot: {
        outputJson: JSON.stringify({ estimatedPriceCents: 10000 }),
      },
    };
    const overlappingStart = new Date(scheduledStart.getTime() + 60 * 60 * 1000);
    const { service } = makeService([existingBooking]);

    await expect(
      assertAvailable(service, {
        scheduledStart: overlappingStart,
        estimatedHours: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
