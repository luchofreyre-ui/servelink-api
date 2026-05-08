import { Logger } from "@nestjs/common";
import {
  findBookingsWithSuspectScheduledWindows,
  reconcileBookingScheduledWindowIfNeeded,
} from "../src/modules/bookings/booking-window-reconciliation";

describe("booking-window-reconciliation", () => {
  it("reconcileBookingScheduledWindowIfNeeded sets end when missing", async () => {
    const updates: unknown[] = [];
    const db = {
      booking: {
        findUnique: jest.fn().mockResolvedValue({
          id: "b1",
          scheduledStart: new Date("2030-01-01T10:00:00.000Z"),
          scheduledEnd: null,
          estimatedHours: 2,
        }),
        update: jest.fn(async (args: { data: { scheduledEnd: Date } }) => {
          updates.push(args);
        }),
      },
      bookingEstimateSnapshot: {
        findUnique: jest.fn().mockResolvedValue({ outputJson: null }),
      },
    } as any;

    const log = { warn: jest.fn() } as unknown as Logger;
    const r = await reconcileBookingScheduledWindowIfNeeded(db, "b1", log);
    expect(r.status).toBe("repaired");
    if (r.status === "repaired") expect(r.action).toBe("set_end");
    expect(db.booking.update).toHaveBeenCalled();
    expect(log.warn).toHaveBeenCalled();
  });

  it("findBookingsWithSuspectScheduledWindows returns rows missing end", async () => {
    const db = {
      booking: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: "a",
            scheduledStart: new Date(),
            scheduledEnd: null,
          },
          {
            id: "b",
            scheduledStart: new Date("2030-01-01T10:00:00.000Z"),
            scheduledEnd: new Date("2030-01-01T09:00:00.000Z"),
          },
          {
            id: "c",
            scheduledStart: new Date(),
            scheduledEnd: new Date("2030-01-02T10:00:00.000Z"),
          },
        ]),
      },
    } as any;

    const ids = await findBookingsWithSuspectScheduledWindows(db, { limit: 10 });
    expect(ids.sort()).toEqual(["a", "b"].sort());
  });
});
