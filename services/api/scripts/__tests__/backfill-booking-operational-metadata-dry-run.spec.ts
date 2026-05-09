import {
  buildSafeOperationalMetadataBackfillReport,
  classifyBookingForOperationalMetadataBackfill,
  classifyBookingForOperationalMetadataBackfillBucket,
  computeNextCursorFromLastRow,
} from "../backfill-booking-operational-metadata-dry-run.lib";

describe("backfill-booking-operational-metadata-dry-run.lib", () => {
  const bridgeBase =
    "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m";

  it("classifies structured row as A", () => {
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b1",
        notes: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        hasOperationalMetadataRow: true,
      }),
    ).toBe("A_structured_present");
  });

  it("classifies single valid customerPrep as B", () => {
    const notes = `${bridgeBase} | customerPrep=Side gate`;
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b2",
        notes,
        createdAt: "2024-01-02T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("B_would_create_from_notes");
  });

  it("classifies empty notes as C", () => {
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b3",
        notes: null,
        createdAt: "2024-01-03T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("C_no_prep");
  });

  it("classifies bridge line without customerPrep as E", () => {
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b4",
        notes: bridgeBase,
        createdAt: "2024-01-04T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("E_bridge_only_no_prep");
  });

  it("classifies free-form note without bridge as F", () => {
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b5",
        notes: "Called customer to confirm arrival window.",
        createdAt: "2024-01-05T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("F_free_form_notes_no_prep");
  });

  it("classifies multiple customerPrep tokens as D", () => {
    const notes = `${bridgeBase} | customerPrep=A | customerPrep=B`;
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b6",
        notes,
        createdAt: "2024-01-06T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("D_ambiguous_notes");
  });

  it("classifies empty customerPrep field as G", () => {
    const notes = `${bridgeBase} | customerPrep=`;
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b7",
        notes,
        createdAt: "2024-01-07T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("G_invalid_or_empty_prep");
  });

  it("report JSON contains no raw note or prep text from classified bookings", () => {
    const secret = "SECRET_PREP_MARKER_qwerty_unique";
    const rows = [
      classifyBookingForOperationalMetadataBackfill({
        id: "x1",
        notes: `${bridgeBase} | customerPrep=${secret}`,
        createdAt: "2024-01-08T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ];
    const report = buildSafeOperationalMetadataBackfillReport({
      classifications: rows,
      batchSize: 50,
      limit: null,
      cursorStart: null,
      includeSamples: true,
      sampleLimit: 5,
    });
    const serialized = JSON.stringify(report);
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("customerPrep=");
    expect(serialized).not.toContain("Booking direction intake");
  });

  it("samples contain booking IDs only as strings", () => {
    const rows = [
      classifyBookingForOperationalMetadataBackfill({
        id: "id-a",
        notes: `${bridgeBase} | customerPrep=z`,
        createdAt: "2024-01-09T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ];
    const report = buildSafeOperationalMetadataBackfillReport({
      classifications: rows,
      batchSize: 10,
      limit: null,
      cursorStart: null,
      includeSamples: true,
      sampleLimit: 3,
    });
    expect(report.samples?.B_would_create_from_notes?.every((id) => typeof id === "string")).toBe(
      true,
    );
    expect(report.samples?.B_would_create_from_notes?.[0]).toBe("id-a");
  });

  it("summary bucket counts match classifications", () => {
    const rows = [
      classifyBookingForOperationalMetadataBackfill({
        id: "a",
        notes: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        hasOperationalMetadataRow: true,
      }),
      classifyBookingForOperationalMetadataBackfill({
        id: "b",
        notes: `${bridgeBase} | customerPrep=k`,
        createdAt: "2024-01-02T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
      classifyBookingForOperationalMetadataBackfill({
        id: "c",
        notes: null,
        createdAt: "2024-01-03T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ];
    const report = buildSafeOperationalMetadataBackfillReport({
      classifications: rows,
      batchSize: 100,
      limit: null,
      cursorStart: null,
      includeSamples: false,
      sampleLimit: 0,
    });
    expect(report.summary.totalScanned).toBe(3);
    expect(report.buckets.A_structured_present).toBe(1);
    expect(report.buckets.B_would_create_from_notes).toBe(1);
    expect(report.buckets.C_no_prep).toBe(1);
  });

  it("nextCursor reflects last scanned row", () => {
    const lastCreated = "2024-06-15T12:30:00.000Z";
    const rows = [
      classifyBookingForOperationalMetadataBackfill({
        id: "early",
        notes: null,
        createdAt: "2024-01-01T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
      classifyBookingForOperationalMetadataBackfill({
        id: "late",
        notes: "ops",
        createdAt: lastCreated,
        hasOperationalMetadataRow: false,
      }),
    ];
    const report = buildSafeOperationalMetadataBackfillReport({
      classifications: rows,
      batchSize: 50,
      limit: null,
      cursorStart: null,
      includeSamples: false,
      sampleLimit: 0,
    });
    expect(report.nextCursor).toEqual(computeNextCursorFromLastRow(rows[rows.length - 1]!));
    expect(report.nextCursor?.id).toBe("late");
  });
});
