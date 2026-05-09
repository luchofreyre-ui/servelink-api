import {
  classifyBookingForOperationalMetadataBackfillBucket,
  OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT,
  parseOperationalMetadataDryRunArgv,
} from "../backfill-booking-operational-metadata-dry-run.lib";

describe("parseOperationalMetadataDryRunArgv", () => {
  it("parses --limit=25", () => {
    const r = parseOperationalMetadataDryRunArgv(["--limit=25"]);
    expect(r.mode).toBe("run");
    if (r.mode === "run") expect(r.options.limit).toBe(25);
  });

  it("parses --limit 25", () => {
    const r = parseOperationalMetadataDryRunArgv(["--limit", "25"]);
    expect(r.mode).toBe("run");
    if (r.mode === "run") expect(r.options.limit).toBe(25);
  });

  it("parses --batch-size=50 and --batch-size 50", () => {
    const r1 = parseOperationalMetadataDryRunArgv(["--batch-size=50"]);
    expect(r1.mode).toBe("run");
    if (r1.mode === "run") expect(r1.options.batchSize).toBe(50);
    const r2 = parseOperationalMetadataDryRunArgv(["--batch-size", "10"]);
    expect(r2.mode).toBe("run");
    if (r2.mode === "run") expect(r2.options.batchSize).toBe(10);
  });

  it("parses --sample-limit=3 and --sample-limit 3", () => {
    const a = parseOperationalMetadataDryRunArgv(["--sample-limit=3"]);
    expect(a.mode).toBe("run");
    if (a.mode === "run") expect(a.options.sampleLimit).toBe(3);
    const b = parseOperationalMetadataDryRunArgv(["--sample-limit", "7"]);
    expect(b.mode).toBe("run");
    if (b.mode === "run") expect(b.options.sampleLimit).toBe(7);
  });

  it("parses cursor pair in both forms", () => {
    const r = parseOperationalMetadataDryRunArgv([
      "--cursor-created-at=2024-01-01T00:00:00.000Z",
      "--cursor-id=bk_1",
    ]);
    expect(r.mode).toBe("run");
    if (r.mode === "run") {
      expect(r.options.cursor).toEqual({
        createdAt: "2024-01-01T00:00:00.000Z",
        id: "bk_1",
      });
    }
    const r2 = parseOperationalMetadataDryRunArgv([
      "--cursor-created-at",
      "2024-06-01T12:00:00.000Z",
      "--cursor-id",
      "bk_2",
    ]);
    expect(r2.mode).toBe("run");
    if (r2.mode === "run") {
      expect(r2.options.cursor).toEqual({
        createdAt: "2024-06-01T12:00:00.000Z",
        id: "bk_2",
      });
    }
  });

  it("returns help mode for --help and -h", () => {
    expect(parseOperationalMetadataDryRunArgv(["--help"]).mode).toBe("help");
    expect(parseOperationalMetadataDryRunArgv(["-h"]).mode).toBe("help");
  });

  it("rejects invalid numeric flags", () => {
    expect(() => parseOperationalMetadataDryRunArgv(["--limit=foo"])).toThrow(/limit/);
    expect(() => parseOperationalMetadataDryRunArgv(["--limit=-1"])).toThrow(/limit/);
    expect(() => parseOperationalMetadataDryRunArgv(["--limit=3.5"])).toThrow(/limit/);
    expect(() => parseOperationalMetadataDryRunArgv(["--batch-size=0"])).toThrow(/batch-size/);
  });

  it("rejects missing option values", () => {
    expect(() => parseOperationalMetadataDryRunArgv(["--limit"])).toThrow(/requires a value/);
    expect(() => parseOperationalMetadataDryRunArgv(["--cursor-created-at"])).toThrow(
      /requires a value/,
    );
  });

  it("rejects unknown flags", () => {
    expect(() => parseOperationalMetadataDryRunArgv(["--write"])).toThrow(/unknown option/);
  });

  it("rejects cursor mismatch", () => {
    expect(() =>
      parseOperationalMetadataDryRunArgv(["--cursor-id=only"]),
    ).toThrow(/cursor-created-at/);
  });
});

describe("OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT", () => {
  it("does not contain literal note bridge examples or customerPrep= assignments", () => {
    expect(OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT).not.toContain("Booking direction intake");
    expect(OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT).not.toContain("customerPrep=");
    expect(OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT).toContain("READ-ONLY");
    expect(OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT).toContain("--silent");
  });
});

describe("classification unchanged (spot-check)", () => {
  const bridgeBase =
    "Booking direction intake in_x | serviceId=s | frequency=w | preferredTime=m";

  it("still classifies single customerPrep as B", () => {
    expect(
      classifyBookingForOperationalMetadataBackfillBucket({
        id: "b",
        notes: `${bridgeBase} | customerPrep=Side gate`,
        createdAt: "2024-01-02T00:00:00.000Z",
        hasOperationalMetadataRow: false,
      }),
    ).toBe("B_would_create_from_notes");
  });
});
