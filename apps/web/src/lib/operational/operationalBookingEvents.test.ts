import { describe, expect, it } from "vitest";
import {
  categorizeOperationalBookingEventType,
  countOperationalBookingEventsByCategory,
  formatOperationalBookingEventHeadline,
  labelOperationalBookingEventType,
} from "./operationalBookingEvents";

describe("operationalBookingEvents", () => {
  it("labels known Prisma event types", () => {
    expect(labelOperationalBookingEventType("STATUS_CHANGED")).toBe("Status changed");
    expect(labelOperationalBookingEventType("UNKNOWN_FUTURE")).toContain("unknown");
  });

  it("categorizes into orchestration buckets", () => {
    expect(categorizeOperationalBookingEventType("PAYMENT_STATUS_CHANGED")).toBe(
      "payment",
    );
    expect(categorizeOperationalBookingEventType("BOOKING_ASSIGNED")).toBe(
      "assignment",
    );
  });

  it("formats headline with transition pair when present", () => {
    expect(
      formatOperationalBookingEventHeadline({
        id: "e1",
        bookingId: "b1",
        type: "STATUS_CHANGED",
        fromStatus: "assigned",
        toStatus: "in_progress",
        note: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe("Status changed (assigned → in_progress)");
  });

  it("counts events by operational category", () => {
    const counts = countOperationalBookingEventsByCategory([
      {
        id: "a",
        bookingId: "b",
        type: "STATUS_CHANGED",
        fromStatus: null,
        toStatus: null,
        note: null,
        createdAt: "",
      },
      {
        id: "c",
        bookingId: "b",
        type: "PAYMENT_STATUS_CHANGED",
        fromStatus: null,
        toStatus: null,
        note: null,
        createdAt: "",
      },
    ]);
    expect(counts.lifecycle).toBe(1);
    expect(counts.payment).toBe(1);
  });
});
