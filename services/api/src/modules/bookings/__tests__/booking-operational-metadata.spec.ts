import {
  analyzeCustomerPrepFieldsInBookingNotes,
  BOOKING_OPERATIONAL_METADATA_SCHEMA_VERSION_V1,
  buildBookingOperationalMetadataPayloadV1,
  extractCustomerPrepFromBookingNotes,
  getCustomerTeamPrepFromBookingOperationalMetadataOrNotes,
  hasCustomerTeamPrep,
  parseBookingOperationalMetadataPayloadV1,
} from "../booking-operational-metadata";

describe("booking-operational-metadata", () => {
  const validProvenance = {
    source: "booking_direction_intake" as const,
    capturedAt: new Date().toISOString(),
    legacyNotesTransport: "recurringInterest.note" as const,
  };

  it("buildBookingOperationalMetadataPayloadV1 trims freeText and omits empty structured hints", () => {
    const p = buildBookingOperationalMetadataPayloadV1({
      customerTeamPrepFreeText: "  Parking curb  ",
      structuredHints: {
        accessInstructions: "   ",
        parkingInstructions: "  curb ok ",
      },
      provenance: validProvenance,
    });
    expect(p.customerTeamPrep?.freeText).toBe("Parking curb");
    expect(p.customerTeamPrep?.structuredHints?.parkingInstructions).toBe("curb ok");
    expect(p.customerTeamPrep?.structuredHints?.accessInstructions).toBeUndefined();
    expect(p.provenance?.legacyNotesTransport).toBe("recurringInterest.note");
  });

  it("parseBookingOperationalMetadataPayloadV1 rejects unknown root keys", () => {
    expect(
      parseBookingOperationalMetadataPayloadV1({
        customerTeamPrep: { freeText: "x" },
        extra: "nope",
      }),
    ).toBeNull();
  });

  it("parseBookingOperationalMetadataPayloadV1 rejects forbidden identity/payment keys", () => {
    expect(
      parseBookingOperationalMetadataPayloadV1({
        customerTeamPrep: { freeText: "x" },
        email: "a@b.com",
      }),
    ).toBeNull();
  });

  it("parseBookingOperationalMetadataPayloadV1 rejects invalid provenance when present", () => {
    expect(
      parseBookingOperationalMetadataPayloadV1({
        customerTeamPrep: { freeText: "ok" },
        provenance: { source: "wrong", capturedAt: validProvenance.capturedAt },
      }),
    ).toBeNull();
  });

  it("parseBookingOperationalMetadataPayloadV1 accepts prep without provenance", () => {
    const p = parseBookingOperationalMetadataPayloadV1({
      customerTeamPrep: { freeText: "Dog friendly" },
    });
    expect(p?.customerTeamPrep?.freeText).toBe("Dog friendly");
    expect(p?.provenance).toBeUndefined();
  });

  it("hasCustomerTeamPrep is false for invalid payloads", () => {
    expect(hasCustomerTeamPrep({ customerTeamPrep: { freeText: "   " } })).toBe(false);
    expect(hasCustomerTeamPrep(null)).toBe(false);
  });

  it("extractCustomerPrepFromBookingNotes mirrors pipe-delimited bridge segments", () => {
    const raw =
      "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Gate code 123";
    expect(extractCustomerPrepFromBookingNotes(raw)).toBe("Gate code 123");
  });

  it("analyzeCustomerPrepFieldsInBookingNotes counts empty customerPrep fields", () => {
    const raw =
      "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=";
    expect(analyzeCustomerPrepFieldsInBookingNotes(raw).customerPrepFieldCount).toBe(1);
    expect(analyzeCustomerPrepFieldsInBookingNotes(raw).nonEmptySegments).toEqual([]);
  });

  it("getCustomerTeamPrepFromBookingOperationalMetadataOrNotes prefers structured metadata", () => {
    const payload = buildBookingOperationalMetadataPayloadV1({
      customerTeamPrepFreeText: "From JSON",
      provenance: validProvenance,
    });
    const notes =
      "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=From notes";
    const r = getCustomerTeamPrepFromBookingOperationalMetadataOrNotes({
      operationalMetadataPayload: payload,
      bookingNotes: notes,
    });
    expect(r?.freeText).toBe("From JSON");
    expect(r).not.toHaveProperty("provenance");
  });

  it("getCustomerTeamPrepFromBookingOperationalMetadataOrNotes falls back to notes", () => {
    const notes =
      "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m | customerPrep=Notes only";
    expect(
      getCustomerTeamPrepFromBookingOperationalMetadataOrNotes({
        operationalMetadataPayload: null,
        bookingNotes: notes,
      })?.freeText,
    ).toBe("Notes only");
  });

  it("buildBookingOperationalMetadataPayloadV1 throws when freeText empty after trim", () => {
    expect(() =>
      buildBookingOperationalMetadataPayloadV1({
        customerTeamPrepFreeText: "   ",
        provenance: validProvenance,
      }),
    ).toThrow();
  });

  it("schema version constant is wired for Prisma rows", () => {
    expect(BOOKING_OPERATIONAL_METADATA_SCHEMA_VERSION_V1).toBe(1);
  });
});
