import {
  BOOKING_MUTATION_PAYLOAD_SCHEMA_VERSION,
  OUTBOX_EVENT_FAMILY_BOOKING_MUTATION,
  validateBookingMutationOutboxPayload,
} from "../src/modules/operational-outbox/operational-outbox.contract";

describe("validateBookingMutationOutboxPayload", () => {
  const validCore = {
    bookingId: "bk_1",
    occurredAt: new Date().toISOString(),
    bookingStatus: "scheduled",
    paymentStatus: "paid",
  };

  it("accepts v1 payload with explicit family", () => {
    const r = validateBookingMutationOutboxPayload({
      schemaVersion: BOOKING_MUTATION_PAYLOAD_SCHEMA_VERSION,
      eventFamily: OUTBOX_EVENT_FAMILY_BOOKING_MUTATION,
      ...validCore,
    });
    expect(r).toEqual({
      ok: true,
      schemaVersion: BOOKING_MUTATION_PAYLOAD_SCHEMA_VERSION,
    });
  });

  it("accepts legacy-shaped payload without schemaVersion/family", () => {
    const r = validateBookingMutationOutboxPayload(validCore);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.schemaVersion).toBe(BOOKING_MUTATION_PAYLOAD_SCHEMA_VERSION);
    }
  });

  it("rejects wrong schema version", () => {
    const r = validateBookingMutationOutboxPayload({
      ...validCore,
      schemaVersion: 99,
      eventFamily: OUTBOX_EVENT_FAMILY_BOOKING_MUTATION,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain("unsupported_schema_version");
    }
  });

  it("rejects wrong event family when present", () => {
    const r = validateBookingMutationOutboxPayload({
      ...validCore,
      schemaVersion: BOOKING_MUTATION_PAYLOAD_SCHEMA_VERSION,
      eventFamily: "other_family",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toContain("unexpected_event_family");
    }
  });

  it("rejects missing bookingId", () => {
    const r = validateBookingMutationOutboxPayload({
      occurredAt: validCore.occurredAt,
    });
    expect(r).toEqual({ ok: false, reason: "missing_booking_id" });
  });
});
