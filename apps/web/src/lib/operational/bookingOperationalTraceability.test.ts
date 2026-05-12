import type { BookingRecord } from "@/lib/bookings/bookingApiTypes";
import { describe, expect, it } from "vitest";
import { buildOperationalTraceTimeline } from "./bookingOperationalTraceability";

describe("bookingOperationalTraceability", () => {
  it("builds timeline rows from booking events", () => {
    const booking = {
      id: "bk",
      customerId: "c1",
      status: "assigned",
      hourlyRateCents: 100,
      estimatedHours: 1,
      currency: "usd",
      createdAt: "",
      updatedAt: "",
      events: [
        {
          id: "e1",
          bookingId: "bk",
          type: "BOOKING_ASSIGNED",
          fromStatus: null,
          toStatus: null,
          note: null,
          createdAt: "2026-01-02T00:00:00.000Z",
        },
      ],
    } as BookingRecord;
    const rows = buildOperationalTraceTimeline(booking);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe("assignment");
    expect(rows[0]?.headline).toContain("Assignment");
  });
});
