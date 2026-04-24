import { resolveBookingCalendarEndMs } from "../src/modules/bookings/booking-scheduling-calendar-end";

describe("resolveBookingCalendarEndMs", () => {
  const start = new Date("2035-06-04T19:00:00.000Z");

  it("uses snapshot estimatedDurationMinutes when preferWallClockFromSnapshot is true", () => {
    const ms = resolveBookingCalendarEndMs({
      scheduledStart: start,
      estimatedHours: 12.07,
      estimateSnapshotOutputJson: JSON.stringify({
        estimatedDurationMinutes: 184,
      }),
      preferWallClockFromSnapshot: true,
    });
    expect(ms).toBe(start.getTime() + 184 * 60 * 1000);
  });

  it("falls back to estimatedHours clock when snapshot missing wall minutes", () => {
    const ms = resolveBookingCalendarEndMs({
      scheduledStart: start,
      estimatedHours: 2,
      estimateSnapshotOutputJson: JSON.stringify({ estimatedPriceCents: 100 }),
      preferWallClockFromSnapshot: true,
    });
    expect(ms).toBe(start.getTime() + 2 * 60 * 60 * 1000);
  });

  it("ignores snapshot wall when preferWallClockFromSnapshot is false (legacy overlap)", () => {
    const ms = resolveBookingCalendarEndMs({
      scheduledStart: start,
      estimatedHours: 2,
      estimateSnapshotOutputJson: JSON.stringify({ estimatedDurationMinutes: 30 }),
      preferWallClockFromSnapshot: false,
    });
    expect(ms).toBe(start.getTime() + 2 * 60 * 60 * 1000);
  });
});
