import { BadRequestException } from "@nestjs/common";
import {
  assertValidPersistedBookingWindow,
  clearBookingWindow,
  computeScheduleWritePatch,
  resolveScheduledEndAfterStartChange,
  setBookingWindowFromDuration,
  setBookingWindowFromHold,
  setCanonicalBookingWindow,
} from "../src/modules/bookings/booking-window-mutation";

describe("booking-window-mutation", () => {
  const t0 = new Date("2030-06-01T12:00:00.000Z");
  const t1 = new Date("2030-06-01T14:00:00.000Z");

  it("setCanonicalBookingWindow rejects end <= start", () => {
    expect(() =>
      setCanonicalBookingWindow({ scheduledStart: t1, scheduledEnd: t0 }),
    ).toThrow(BadRequestException);
  });

  it("setBookingWindowFromHold accepts valid hold", () => {
    const w = setBookingWindowFromHold({ startAt: t0, endAt: t1 });
    expect(w.scheduledStart?.getTime()).toBe(t0.getTime());
    expect(w.scheduledEnd?.getTime()).toBe(t1.getTime());
  });

  it("setBookingWindowFromDuration derives end from estimatedHours", () => {
    const w = setBookingWindowFromDuration({
      scheduledStart: t0,
      estimatedHours: 2,
      estimateSnapshotOutputJson: null,
    });
    expect(w.scheduledEnd!.getTime()).toBe(t0.getTime() + 2 * 60 * 60 * 1000);
  });

  it("clearBookingWindow nulls both", () => {
    expect(clearBookingWindow()).toEqual({
      scheduledStart: null,
      scheduledEnd: null,
    });
  });

  it("resolveScheduledEndAfterStartChange keeps prior end when still valid", () => {
    const priorEnd = new Date(t0.getTime() + 3 * 3600 * 1000);
    const r = resolveScheduledEndAfterStartChange({
      newStart: t0,
      priorEnd,
      estimatedHours: 1,
      estimateSnapshotOutputJson: null,
    });
    expect(r.resolution).toBe("kept_valid_prior");
    expect(r.scheduledEnd?.getTime()).toBe(priorEnd.getTime());
  });

  it("resolveScheduledEndAfterStartChange recomputes when prior end before new start", () => {
    const priorEnd = new Date(t0.getTime() - 3600 * 1000);
    const r = resolveScheduledEndAfterStartChange({
      newStart: t0,
      priorEnd,
      estimatedHours: 2,
      estimateSnapshotOutputJson: null,
    });
    expect(r.resolution).toBe("recomputed");
    expect(r.scheduledEnd!.getTime()).toBe(t0.getTime() + 2 * 3600 * 1000);
  });

  it("computeScheduleWritePatch clears both when next start null", () => {
    const p = computeScheduleWritePatch({
      nextScheduledStart: null,
      currentScheduledStart: t0,
      currentScheduledEnd: t1,
      estimatedHours: 2,
      estimateSnapshotOutputJson: null,
    });
    expect(p.scheduledStart).toBeNull();
    expect(p.scheduledEnd).toBeNull();
  });

  it("assertValidPersistedBookingWindow rejects end without start", () => {
    expect(() => assertValidPersistedBookingWindow(null, t1)).toThrow(
      BadRequestException,
    );
  });
});
