import {
  resolveCanonicalBookingScheduledEnd,
  resolveCanonicalBookingScheduledEndMs,
  resolveCanonicalBookingWindow,
} from "../src/modules/bookings/booking-scheduled-window";

describe("canonical booking scheduled window", () => {
  const start = new Date("2030-01-01T12:00:00.000Z");
  const endWall = new Date(start.getTime() + 90 * 60 * 1000);

  it("prefers persisted scheduledEnd over snapshot wall-clock and labor hours", () => {
    const d = resolveCanonicalBookingScheduledEnd({
      scheduledStart: start,
      scheduledEnd: endWall,
      estimatedHours: 12,
      estimateSnapshotOutputJson: JSON.stringify({
        estimatedDurationMinutes: 30,
      }),
      preferWallClockFromSnapshot: true,
      hold: null,
    });
    expect(d?.toISOString()).toBe(endWall.toISOString());
  });

  it("uses hold.endAt when scheduledEnd is absent", () => {
    const holdEnd = new Date(start.getTime() + 45 * 60 * 1000);
    const ms = resolveCanonicalBookingScheduledEndMs({
      scheduledStart: start,
      scheduledEnd: null,
      estimatedHours: 12,
      estimateSnapshotOutputJson: JSON.stringify({
        estimatedDurationMinutes: 30,
      }),
      preferWallClockFromSnapshot: true,
      hold: { startAt: start, endAt: holdEnd },
    });
    expect(ms).toBe(holdEnd.getTime());
  });

  it("uses snapshot estimatedDurationMinutes when no persisted end or hold", () => {
    const ms = resolveCanonicalBookingScheduledEndMs({
      scheduledStart: start,
      scheduledEnd: null,
      estimatedHours: 5,
      estimateSnapshotOutputJson: JSON.stringify({
        estimatedDurationMinutes: 90,
      }),
      preferWallClockFromSnapshot: true,
      hold: null,
    });
    expect(ms).toBe(endWall.getTime());
  });

  it("falls back to estimatedHours when wall minutes unavailable", () => {
    const ms = resolveCanonicalBookingScheduledEndMs({
      scheduledStart: start,
      scheduledEnd: null,
      estimatedHours: 2,
      estimateSnapshotOutputJson: "{}",
      preferWallClockFromSnapshot: true,
      hold: null,
    });
    expect(ms).toBe(start.getTime() + 2 * 60 * 60 * 1000);
  });

  it("resolveCanonicalBookingWindow uses hold start when scheduledStart is null", () => {
    const holdEnd = endWall;
    const w = resolveCanonicalBookingWindow({
      scheduledStart: null,
      scheduledEnd: null,
      estimatedHours: 1,
      estimateSnapshotOutputJson: null,
      preferWallClockFromSnapshot: true,
      hold: { startAt: start, endAt: holdEnd },
    });
    expect(w?.start.toISOString()).toBe(start.toISOString());
    expect(w?.end.toISOString()).toBe(holdEnd.toISOString());
  });
});
