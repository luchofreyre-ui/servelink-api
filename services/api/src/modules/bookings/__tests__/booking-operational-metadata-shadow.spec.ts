import {
  compareBookingOperationalMetadataShadow,
  isStructuredBookingMetadataShadowEnabled,
  normalizeBookingOperationalMetadataComparableText,
} from "../booking-operational-metadata-shadow";
import { buildBookingOperationalMetadataPayloadV1 } from "../booking-operational-metadata";

describe("booking-operational-metadata-shadow", () => {
  const provenance = {
    source: "booking_direction_intake" as const,
    capturedAt: new Date().toISOString(),
    legacyNotesTransport: "recurringInterest.note" as const,
  };

  describe("compareBookingOperationalMetadataShadow", () => {
    it("returns match for equivalent normalized values", () => {
      const payload = buildBookingOperationalMetadataPayloadV1({
        customerTeamPrepFreeText: "Parking curb",
        provenance,
      });
      const notes =
        "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Parking  curb";
      const r = compareBookingOperationalMetadataShadow({
        bookingId: "b1",
        structuredPayload: payload,
        bookingNotes: notes,
      });
      expect(r.status).toBe("match");
      expect(r.safeReason).toBe("prep_normalized_equal");
      expect(r.normalizedStructuredFreeText).toBe("Parking curb");
      expect(r.normalizedNotesFreeText).toBe("Parking curb");
    });

    it("returns structured_only", () => {
      const payload = buildBookingOperationalMetadataPayloadV1({
        customerTeamPrepFreeText: "Side gate",
        provenance,
      });
      const r = compareBookingOperationalMetadataShadow({
        bookingId: "b2",
        structuredPayload: payload,
        bookingNotes: null,
      });
      expect(r.status).toBe("structured_only");
      expect(r.hasStructuredPrep).toBe(true);
      expect(r.hasNotesPrep).toBe(false);
    });

    it("returns notes_only when no structured row payload", () => {
      const notes =
        "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Notes prep";
      const r = compareBookingOperationalMetadataShadow({
        bookingId: "b3",
        structuredPayload: null,
        bookingNotes: notes,
      });
      expect(r.status).toBe("notes_only");
      expect(r.normalizedNotesFreeText).toBe("Notes prep");
    });

    it("returns mismatch without requiring callers to log raw text", () => {
      const payload = buildBookingOperationalMetadataPayloadV1({
        customerTeamPrepFreeText: "Structured version",
        provenance,
      });
      const notes =
        "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Notes version";
      const r = compareBookingOperationalMetadataShadow({
        bookingId: "b4",
        structuredPayload: payload,
        bookingNotes: notes,
      });
      expect(r.status).toBe("mismatch");
      expect(r.safeReason).toBe("prep_normalized_differ");
    });

    it("returns invalid_structured when blob fails validation", () => {
      const r = compareBookingOperationalMetadataShadow({
        bookingId: "b5",
        structuredPayload: { customerTeamPrep: { freeText: "x" }, email: "leak@x.com" },
        bookingNotes: null,
      });
      expect(r.status).toBe("invalid_structured");
      expect(r.safeReason).toBe("payload_parse_failed");
    });

    it("returns no_data when neither side has prep", () => {
      const r = compareBookingOperationalMetadataShadow({
        bookingId: "b6",
        structuredPayload: null,
        bookingNotes: null,
      });
      expect(r.status).toBe("no_data");
    });
  });

  describe("normalizeBookingOperationalMetadataComparableText", () => {
    it("trims and collapses whitespace", () => {
      expect(normalizeBookingOperationalMetadataComparableText("  a \n b  ")).toBe(
        "a b",
      );
    });
  });

  describe("isStructuredBookingMetadataShadowEnabled", () => {
    const key = "ENABLE_STRUCTURED_BOOKING_METADATA_SHADOW";
    const prev = process.env[key];

    afterEach(() => {
      if (prev === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = prev;
      }
    });

    it("is false when unset", () => {
      delete process.env[key];
      expect(isStructuredBookingMetadataShadowEnabled()).toBe(false);
    });

    it("is false for malformed values", () => {
      process.env[key] = "yes";
      expect(isStructuredBookingMetadataShadowEnabled()).toBe(false);
      process.env[key] = "";
      expect(isStructuredBookingMetadataShadowEnabled()).toBe(false);
    });

    it("is true for true or 1", () => {
      process.env[key] = "true";
      expect(isStructuredBookingMetadataShadowEnabled()).toBe(true);
      process.env[key] = "1";
      expect(isStructuredBookingMetadataShadowEnabled()).toBe(true);
      process.env[key] = "TRUE";
      expect(isStructuredBookingMetadataShadowEnabled()).toBe(true);
    });
  });
});
