import { ConflictException } from "@nestjs/common";
import { assertConfirmHoldSlotDuration } from "../src/modules/bookings/confirm-hold-slot-duration";
import { MIN_DURATION_MINUTES } from "../src/modules/crew-capacity/assigned-crew-and-duration";

describe("assertConfirmHoldSlotDuration", () => {
  it("A: public crew-adjusted model allows hold shorter than estimatedHours minutes", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: true,
        holdDurationMinutes: 125,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).not.toThrow();
  });

  it("B: rejects non-positive hold duration (public model)", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: true,
        holdDurationMinutes: 0,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).toThrow(ConflictException);
  });

  it("B: rejects hold below minimum slot duration (public model)", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: true,
        holdDurationMinutes: MIN_DURATION_MINUTES - 1,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).toThrow(ConflictException);
  });

  it("B: rejects absurdly long hold window (public model)", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: true,
        holdDurationMinutes: 24 * 60 + 1,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).toThrow(ConflictException);
  });

  it("C: legacy path still requires exact match to estimatedHours minutes", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: false,
        holdDurationMinutes: 125,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).toThrow(ConflictException);
  });

  it("C: legacy path undefined flag same as false", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: undefined,
        holdDurationMinutes: 125,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).toThrow(ConflictException);
  });

  it("D: legacy happy path unchanged when durations match", () => {
    expect(() =>
      assertConfirmHoldSlotDuration({
        useHoldElapsedDurationModel: undefined,
        holdDurationMinutes: 325,
        bookingDurationMinutesFromEstimatedHours: 325,
      }),
    ).not.toThrow();
  });
});
