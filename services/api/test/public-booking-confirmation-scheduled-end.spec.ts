import {
  computePublicBookingConfirmationScheduledEndIso,
  computePublicHoldConfirmScheduledEndIso,
} from "../src/modules/bookings/public-booking-confirmation-scheduled-end";

describe("public booking scheduled end (wall-clock vs labor hours)", () => {
  const start = new Date("2030-06-01T00:30:00.000Z");

  it("computePublicBookingConfirmationScheduledEndIso uses snapshot wall minutes, not labor estimatedHours", () => {
    const end = computePublicBookingConfirmationScheduledEndIso(start, {
      wallClockDurationMinutes: 184,
      estimatedHours: 12.07,
    });
    expect(end).toBe(new Date(start.getTime() + 184 * 60 * 1000).toISOString());
  });

  it("computePublicBookingConfirmationScheduledEndIso falls back to estimatedHours when no wall minutes", () => {
    const end = computePublicBookingConfirmationScheduledEndIso(start, {
      wallClockDurationMinutes: 0,
      estimatedHours: 2,
    });
    expect(end).toBe(new Date(start.getTime() + 2 * 60 * 60 * 1000).toISOString());
  });

  it("computePublicHoldConfirmScheduledEndIso prefers hold.endAt over labor estimatedHours", () => {
    const holdStart = new Date("2030-06-01T00:30:00.000Z");
    const holdEnd = new Date(holdStart.getTime() + 181 * 60 * 1000);
    const end = computePublicHoldConfirmScheduledEndIso({
      scheduledStart: holdStart,
      holdEndAt: holdEnd,
      holdStartAt: holdStart,
      estimatedHours: 12.07,
    });
    expect(end).toBe(holdEnd.toISOString());
  });

  it("computePublicHoldConfirmScheduledEndIso falls back to estimatedHours when hold end is invalid", () => {
    const holdStart = new Date("2030-06-01T00:30:00.000Z");
    const badEnd = new Date(holdStart.getTime() - 1000);
    const end = computePublicHoldConfirmScheduledEndIso({
      scheduledStart: holdStart,
      holdEndAt: badEnd,
      holdStartAt: holdStart,
      estimatedHours: 1,
    });
    expect(end).toBe(new Date(holdStart.getTime() + 60 * 60 * 1000).toISOString());
  });
});
