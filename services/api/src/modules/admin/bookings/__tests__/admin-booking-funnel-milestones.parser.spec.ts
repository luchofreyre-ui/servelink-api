import {
  parseBookingEventToFunnelRow,
  parseIntakeFunnelMilestoneRows,
  sortFunnelMilestoneRows,
} from "../admin-booking-funnel-milestones.parser";

describe("admin-booking-funnel-milestones.parser", () => {
  const bookingId = "bk_test_1";

  it("parses review viewed from note fallback", () => {
    const row = parseBookingEventToFunnelRow({
      id: "ev1",
      createdAt: new Date("2026-05-01T12:00:00.000Z"),
      note: "Public booking review viewed",
      payload: {},
      idempotencyKey: null,
      bookingId,
    });
    expect(row?.milestone).toBe("REVIEW_VIEWED");
    expect(row?.source).toBe("booking_event");
  });

  it("parses deposit UI from idempotency key", () => {
    const row = parseBookingEventToFunnelRow({
      id: "ev2",
      createdAt: new Date("2026-05-01T12:05:00.000Z"),
      note: null,
      payload: {},
      idempotencyKey: `pb-funnel:deposit_ui:${bookingId}`,
      bookingId,
    });
    expect(row?.milestone).toBe("DEPOSIT_UI_REACHED");
  });

  it("surfaces schedule transition diagnostics from payload", () => {
    const row = parseBookingEventToFunnelRow({
      id: "ev3",
      createdAt: new Date("2026-05-01T12:10:00.000Z"),
      note: "Public booking confirmation failed",
      payload: {
        funnelMilestone: "CONFIRM_FAILED",
        teamId: "fo_north",
        slotId: "slot_123",
        holdId: "hold_123",
        phase: "payment_required",
        reasonCode: "PAYMENT_REQUIRED",
      },
      idempotencyKey: null,
      bookingId,
    });

    expect(row).toEqual(
      expect.objectContaining({
        milestone: "CONFIRM_FAILED",
        teamId: "fo_north",
        slotId: "slot_123",
        holdId: "hold_123",
        phase: "payment_required",
        reasonCode: "PAYMENT_REQUIRED",
        source: "booking_event",
      }),
    );
  });

  it("parses intake rows and drops unknown keys", () => {
    const rows = parseIntakeFunnelMilestoneRows([
      { at: "not-a-date", k: "REVIEW_VIEWED", p: {} },
      {
        at: "2026-05-01T11:00:00.000Z",
        k: "TEAM_SELECTED",
        p: { teamId: "fo_a" },
      },
      { k: "UNKNOWN_THING", p: {} },
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[1]?.occurredAt).toContain("2026-05-01");
    expect(rows[1]?.teamId).toBe("fo_a");
    expect(rows[0]?.occurredAt).toBeNull();
  });

  it("sorts by occurredAt with intake tie-breaker", () => {
    const sorted = sortFunnelMilestoneRows([
      {
        milestone: "BOOKING_REENTRY",
        occurredAt: "2026-05-01T12:00:00.000Z",
        source: "booking_event",
        bookingEventId: "a",
      },
      {
        milestone: "REVIEW_VIEWED",
        occurredAt: "2026-05-01T12:00:00.000Z",
        source: "intake",
      },
    ]);
    expect(sorted[0]?.source).toBe("intake");
  });
});
