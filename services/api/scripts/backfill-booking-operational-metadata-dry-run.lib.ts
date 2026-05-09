import {
  type BookingOperationalMetadataProvenance,
  analyzeCustomerPrepFieldsInBookingNotes,
  buildBookingOperationalMetadataPayloadV1,
  extractCustomerPrepFromBookingNotes,
  hasCustomerTeamPrep,
} from "../src/modules/bookings/booking-operational-metadata";

/** Matches intake-bridge rows like `Booking direction intake … | serviceId=…` (see API bridge / web `bookingDisplay`). */
export function isBookingDirectionIntakeBridgeLine(line: string): boolean {
  const t = line.trim();
  return (
    /Booking direction intake\s+/i.test(t) &&
    t.includes("serviceId=") &&
    t.includes("|")
  );
}

export function hasMalformedBookingDirectionBridgeHint(notes: string): boolean {
  for (const line of notes.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    if (/booking direction intake/i.test(t) && !isBookingDirectionIntakeBridgeLine(t)) {
      return true;
    }
  }
  return false;
}

export function hasAnyBookingDirectionIntakeBridgeLine(notes: string): boolean {
  for (const line of notes.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    if (isBookingDirectionIntakeBridgeLine(t)) return true;
  }
  return false;
}

/** Non-bridge lines with substantive text (ops / free-form customer notes). */
export function hasNonBridgeSubstantiveLines(notes: string): boolean {
  for (const line of notes.split(/\n+/)) {
    const t = line.trim();
    if (!t) continue;
    if (!isBookingDirectionIntakeBridgeLine(t)) return true;
  }
  return false;
}

/** Fixed ISO provenance used only to exercise `buildBookingOperationalMetadataPayloadV1` in dry-run validation. */
const DRY_RUN_PAYLOAD_VALIDATION_PROVENANCE: BookingOperationalMetadataProvenance = {
  source: "booking_direction_intake",
  capturedAt: "1970-01-01T00:00:00.000Z",
  legacyNotesTransport: "recurringInterest.note",
};

export const OPERATIONAL_METADATA_BACKFILL_BUCKETS = [
  "A_structured_present",
  "B_would_create_from_notes",
  "C_no_prep",
  "D_ambiguous_notes",
  "E_bridge_only_no_prep",
  "F_free_form_notes_no_prep",
  "G_invalid_or_empty_prep",
] as const;

export type OperationalMetadataBackfillBucket =
  (typeof OPERATIONAL_METADATA_BACKFILL_BUCKETS)[number];

export type OperationalMetadataBackfillClassificationInput = {
  id: string;
  notes: string | null | undefined;
  createdAt: Date | string;
  hasOperationalMetadataRow: boolean;
};

export type OperationalMetadataBackfillClassificationResult = {
  bookingId: string;
  bucket: OperationalMetadataBackfillBucket;
  createdAt: Date | string;
};

function notesAppearsEmpty(raw: string | null | undefined): boolean {
  return raw === null || raw === undefined || !String(raw).trim();
}

export function classifyBookingForOperationalMetadataBackfill(
  row: OperationalMetadataBackfillClassificationInput,
): OperationalMetadataBackfillClassificationResult {
  const bucket = classifyBookingForOperationalMetadataBackfillBucket(row);
  return { bookingId: row.id, bucket, createdAt: row.createdAt };
}

export function classifyBookingForOperationalMetadataBackfillBucket(
  row: OperationalMetadataBackfillClassificationInput,
): OperationalMetadataBackfillBucket {
  if (row.hasOperationalMetadataRow) {
    return "A_structured_present";
  }

  if (notesAppearsEmpty(row.notes)) {
    return "C_no_prep";
  }

  const notes = String(row.notes);

  if (hasMalformedBookingDirectionBridgeHint(notes)) {
    return "D_ambiguous_notes";
  }

  const { nonEmptySegments, customerPrepFieldCount } =
    analyzeCustomerPrepFieldsInBookingNotes(notes);

  if (customerPrepFieldCount > 1) {
    return "D_ambiguous_notes";
  }

  if (customerPrepFieldCount === 1 && nonEmptySegments.length === 0) {
    return "G_invalid_or_empty_prep";
  }

  if (customerPrepFieldCount === 1 && nonEmptySegments.length === 1) {
    const prepJoined = extractCustomerPrepFromBookingNotes(notes);
    if (!prepJoined?.trim()) {
      return "G_invalid_or_empty_prep";
    }
    try {
      const payload = buildBookingOperationalMetadataPayloadV1({
        customerTeamPrepFreeText: prepJoined,
        provenance: DRY_RUN_PAYLOAD_VALIDATION_PROVENANCE,
      });
      if (!hasCustomerTeamPrep(payload)) {
        return "G_invalid_or_empty_prep";
      }
      return "B_would_create_from_notes";
    } catch {
      return "G_invalid_or_empty_prep";
    }
  }

  /* customerPrepFieldCount === 0 */
  if (hasAnyBookingDirectionIntakeBridgeLine(notes) && !hasNonBridgeSubstantiveLines(notes)) {
    return "E_bridge_only_no_prep";
  }

  if (hasNonBridgeSubstantiveLines(notes)) {
    return "F_free_form_notes_no_prep";
  }

  return "C_no_prep";
}

export function summarizeOperationalMetadataBackfillClassifications(
  rows: Array<{ bucket: OperationalMetadataBackfillBucket }>,
): Record<OperationalMetadataBackfillBucket, number> {
  const counts = Object.fromEntries(
    OPERATIONAL_METADATA_BACKFILL_BUCKETS.map((b) => [b, 0]),
  ) as Record<OperationalMetadataBackfillBucket, number>;
  for (const r of rows) {
    counts[r.bucket]++;
  }
  return counts;
}

export type OperationalMetadataBackfillDryRunCursor = {
  createdAt: string;
  id: string;
};

export type SafeOperationalMetadataBackfillReport = {
  summary: {
    totalScanned: number;
    batchSize: number;
    limit: number | null;
    cursorStart: { createdAt: string | null; id: string | null };
    cursorEnd: { createdAt: string | null; id: string | null };
    percentagesByBucket: Record<OperationalMetadataBackfillBucket, number>;
  };
  buckets: Record<OperationalMetadataBackfillBucket, number>;
  samples?: Partial<Record<OperationalMetadataBackfillBucket, string[]>>;
  nextCursor: OperationalMetadataBackfillDryRunCursor | null;
};

function iso(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  const parsed = Date.parse(String(d));
  if (!Number.isFinite(parsed)) return String(d);
  return new Date(parsed).toISOString();
}

export function computeNextCursorFromLastRow(row: {
  createdAt: Date | string;
  bookingId: string;
}): OperationalMetadataBackfillDryRunCursor {
  return { createdAt: iso(row.createdAt), id: row.bookingId };
}

export function buildSafeOperationalMetadataBackfillReport(args: {
  classifications: OperationalMetadataBackfillClassificationResult[];
  batchSize: number;
  limit: number | null;
  cursorStart: OperationalMetadataBackfillDryRunCursor | null;
  includeSamples: boolean;
  sampleLimit: number;
}): SafeOperationalMetadataBackfillReport {
  const { classifications, batchSize, limit, cursorStart, includeSamples, sampleLimit } =
    args;

  const totalScanned = classifications.length;
  const bucketCounts = summarizeOperationalMetadataBackfillClassifications(classifications);

  const percentagesByBucket = Object.fromEntries(
    OPERATIONAL_METADATA_BACKFILL_BUCKETS.map((b) => {
      const pct = totalScanned === 0 ? 0 : (bucketCounts[b] / totalScanned) * 100;
      return [b, Math.round(pct * 100) / 100];
    }),
  ) as Record<OperationalMetadataBackfillBucket, number>;

  const last = classifications[classifications.length - 1];

  const samples: Partial<Record<OperationalMetadataBackfillBucket, string[]>> | undefined =
    includeSamples
      ? (() => {
          const acc = OPERATIONAL_METADATA_BACKFILL_BUCKETS.reduce(
            (o, b) => {
              o[b] = [];
              return o;
            },
            {} as Record<OperationalMetadataBackfillBucket, string[]>,
          );
          for (const c of classifications) {
            const arr = acc[c.bucket];
            if (arr.length < sampleLimit) {
              arr.push(c.bookingId);
            }
          }
          return acc;
        })()
      : undefined;

  return {
    summary: {
      totalScanned,
      batchSize,
      limit,
      cursorStart: cursorStart
        ? { createdAt: cursorStart.createdAt, id: cursorStart.id }
        : { createdAt: null, id: null },
      cursorEnd: last
        ? { createdAt: iso(last.createdAt), id: last.bookingId }
        : { createdAt: null, id: null },
      percentagesByBucket,
    },
    buckets: bucketCounts,
    ...(samples ? { samples } : {}),
    nextCursor: last ? computeNextCursorFromLastRow(last) : null,
  };
}

export const OPERATIONAL_METADATA_DRY_RUN_CLI_ID =
  "backfill-booking-operational-metadata-dry-run-v1";

export type OperationalMetadataDryRunCliOptions = {
  limit: number | null;
  batchSize: number;
  cursor: OperationalMetadataBackfillDryRunCursor | null;
  includeSamples: boolean;
  sampleLimit: number;
};

export type ParsedOperationalMetadataDryRunCli =
  | { mode: "help" }
  | { mode: "run"; options: OperationalMetadataDryRunCliOptions };

function flagMatches(arg: string, name: string): boolean {
  return arg === `--${name}` || arg.startsWith(`--${name}=`);
}

function readFlagValue(argv: string[], i: number, name: string): { raw: string; extraSlots: number } {
  const arg = argv[i];
  const prefix = `--${name}=`;
  if (arg.startsWith(prefix)) {
    return { raw: arg.slice(prefix.length), extraSlots: 0 };
  }
  if (arg === `--${name}`) {
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("-")) {
      throw new Error(
        `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: --${name} requires a value (use --${name}=… or --${name} <value>)`,
      );
    }
    return { raw: next, extraSlots: 1 };
  }
  throw new Error(`${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: internal parser error (${name})`);
}

function parseUintDecimal(raw: string, flagLabel: string, min: number): number {
  const t = raw.trim();
  if (t === "") {
    throw new Error(
      `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: --${flagLabel} value must not be empty`,
    );
  }
  if (!/^\d+$/.test(t)) {
    throw new Error(
      `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: --${flagLabel} must be a base-10 integer (${JSON.stringify(t)})`,
    );
  }
  const n = Number(t);
  if (n < min) {
    throw new Error(
      `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: --${flagLabel} must be >= ${min} (got ${n})`,
    );
  }
  return n;
}

function parseCursorToken(raw: string, flagLabel: string): string {
  const t = raw.trim();
  if (!t) {
    throw new Error(
      `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: --${flagLabel} value must not be empty`,
    );
  }
  return t;
}

/** Safe usage text — no booking note contents, no customer data examples. */
export const OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT = `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}

READ-ONLY: Classifies bookings for BookingOperationalMetadata backfill readiness.
No writes. No database mutations. No write flags exist.

OPTIONS
  --help, -h              Show this message (stdout only).
  --limit=<n> | --limit <n>
                          Scan at most n bookings (non-negative integer). Omit for full scan.
  --batch-size=<n> | --batch-size <n>
                          Prisma page size (integer >= 1). Default 100.
  --cursor-created-at=<iso> | --cursor-created-at <iso>
                          Resume after (createdAt, id); must pair with --cursor-id.
  --cursor-id=<id> | --cursor-id <id>
                          Resume cursor booking id; must pair with --cursor-created-at.
  --include-samples       Emit bookingId-only samples per bucket in JSON.
  --sample-limit=<n> | --sample-limit <n>
                          Cap samples per bucket (non-negative integer). Default 10.

MACHINE-READABLE STDOUT
  npm echoes lifecycle lines unless suppressed. For piping JSON (e.g. jq), prefer:

    npm run --silent backfill:booking-operational-metadata:dry-run -- --limit 25 --include-samples

  Direct invocation (no npm lifecycle noise on stdout):

    npx ts-node -P scripts/tsconfig.json scripts/backfill-booking-operational-metadata-dry-run.ts -- --limit 25

OUTPUT SAFETY
  JSON contains aggregates and optional bookingId strings only — never raw Booking.notes,
  embedded intake prep strings, names, emails, phones, addresses, or payment fields.

EXAMPLES
  npm run --silent backfill:booking-operational-metadata:dry-run -- --limit 5
  npm run --silent backfill:booking-operational-metadata:dry-run -- --limit=5 --include-samples
`;

export function parseOperationalMetadataDryRunArgv(
  argv: string[],
): ParsedOperationalMetadataDryRunCli {
  let limit: number | null = null;
  let batchSize = 100;
  let cursorCreatedAt: string | null = null;
  let cursorId: string | null = null;
  let includeSamples = false;
  let sampleLimit = 10;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      return { mode: "help" };
    }
    if (arg === "--include-samples") {
      includeSamples = true;
      continue;
    }

    if (flagMatches(arg, "limit")) {
      const { raw, extraSlots } = readFlagValue(argv, i, "limit");
      limit = parseUintDecimal(raw, "limit", 0);
      i += extraSlots;
      continue;
    }

    if (flagMatches(arg, "batch-size")) {
      const { raw, extraSlots } = readFlagValue(argv, i, "batch-size");
      batchSize = parseUintDecimal(raw, "batch-size", 1);
      i += extraSlots;
      continue;
    }

    if (flagMatches(arg, "sample-limit")) {
      const { raw, extraSlots } = readFlagValue(argv, i, "sample-limit");
      sampleLimit = parseUintDecimal(raw, "sample-limit", 0);
      i += extraSlots;
      continue;
    }

    if (flagMatches(arg, "cursor-created-at")) {
      const { raw, extraSlots } = readFlagValue(argv, i, "cursor-created-at");
      cursorCreatedAt = parseCursorToken(raw, "cursor-created-at");
      i += extraSlots;
      continue;
    }

    if (flagMatches(arg, "cursor-id")) {
      const { raw, extraSlots } = readFlagValue(argv, i, "cursor-id");
      cursorId = parseCursorToken(raw, "cursor-id");
      i += extraSlots;
      continue;
    }

    if (arg.startsWith("--")) {
      throw new Error(`${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: unknown option: ${arg}`);
    }

    throw new Error(`${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: unexpected argument: ${arg}`);
  }

  if (
    (cursorCreatedAt !== null && cursorId === null) ||
    (cursorCreatedAt === null && cursorId !== null)
  ) {
    throw new Error(
      `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: --cursor-created-at and --cursor-id must both be set or both omitted.`,
    );
  }

  const cursor: OperationalMetadataBackfillDryRunCursor | null =
    cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : null;

  return {
    mode: "run",
    options: { limit, batchSize, cursor, includeSamples, sampleLimit },
  };
}
