/**
 * Read-only dry-run: classify historical bookings for BookingOperationalMetadata backfill readiness.
 * Never writes. Never prints raw notes or customerPrep text.
 */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import {
  buildSafeOperationalMetadataBackfillReport,
  classifyBookingForOperationalMetadataBackfill,
  type OperationalMetadataBackfillClassificationResult,
  type OperationalMetadataBackfillDryRunCursor,
} from "./backfill-booking-operational-metadata-dry-run.lib";

const SCRIPT_ID = "backfill-booking-operational-metadata-dry-run-v1";

function parseArgs(argv: string[]) {
  let limit: number | null = null;
  let batchSize = 100;
  let cursorCreatedAt: string | null = null;
  let cursorId: string | null = null;
  let includeSamples = false;
  let sampleLimit = 10;

  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      if (Number.isFinite(n) && n >= 0) limit = Math.floor(n);
    } else if (arg.startsWith("--batch-size=")) {
      const n = Number(arg.slice("--batch-size=".length));
      if (Number.isFinite(n) && n >= 1) batchSize = Math.floor(n);
    } else if (arg.startsWith("--cursor-created-at=")) {
      cursorCreatedAt = arg.slice("--cursor-created-at=".length).trim() || null;
    } else if (arg.startsWith("--cursor-id=")) {
      cursorId = arg.slice("--cursor-id=".length).trim() || null;
    } else if (arg === "--include-samples") {
      includeSamples = true;
    } else if (arg.startsWith("--sample-limit=")) {
      const n = Number(arg.slice("--sample-limit=".length));
      if (Number.isFinite(n) && n >= 0) sampleLimit = Math.floor(n);
    }
  }

  if (
    (cursorCreatedAt && !cursorId) ||
    (!cursorCreatedAt && cursorId)
  ) {
    throw new Error(
      `${SCRIPT_ID}: --cursor-created-at and --cursor-id must both be set or both omitted.`,
    );
  }

  const cursor: OperationalMetadataBackfillDryRunCursor | null =
    cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : null;

  return { limit, batchSize, cursor, includeSamples, sampleLimit };
}

function parseCursorToOrdering(cursor: OperationalMetadataBackfillDryRunCursor): {
  createdAt: Date;
  id: string;
} {
  const createdAt = new Date(cursor.createdAt);
  if (!Number.isFinite(createdAt.getTime())) {
    throw new Error(`${SCRIPT_ID}: invalid cursor createdAt (expected ISO-8601).`);
  }
  return { createdAt, id: cursor.id };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const prisma = new PrismaClient();
  const classifications: OperationalMetadataBackfillClassificationResult[] = [];
  let scanned = 0;
  let orderingCursor: { createdAt: Date; id: string } | null = args.cursor
    ? parseCursorToOrdering(args.cursor)
    : null;

  try {
    while (true) {
      if (args.limit !== null && scanned >= args.limit) break;

      const take = Math.min(
        args.batchSize,
        args.limit !== null ? args.limit - scanned : args.batchSize,
      );
      if (take <= 0) break;

      const rows = await prisma.booking.findMany({
        where: orderingCursor
          ? {
              OR: [
                { createdAt: { gt: orderingCursor.createdAt } },
                {
                  AND: [
                    { createdAt: orderingCursor.createdAt },
                    { id: { gt: orderingCursor.id } },
                  ],
                },
              ],
            }
          : {},
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take,
        select: { id: true, notes: true, createdAt: true },
      });

      if (rows.length === 0) break;

      const metaHits = await prisma.bookingOperationalMetadata.findMany({
        where: { bookingId: { in: rows.map((r) => r.id) } },
        select: { bookingId: true },
      });
      const metaSet = new Set(metaHits.map((m) => m.bookingId));

      let lastConsumed: { createdAt: Date; id: string } | null = null;
      for (const r of rows) {
        classifications.push(
          classifyBookingForOperationalMetadataBackfill({
            id: r.id,
            notes: r.notes,
            createdAt: r.createdAt,
            hasOperationalMetadataRow: metaSet.has(r.id),
          }),
        );
        scanned++;
        lastConsumed = { createdAt: r.createdAt, id: r.id };
        if (args.limit !== null && scanned >= args.limit) break;
      }

      if (lastConsumed) {
        orderingCursor = lastConsumed;
      }

      if (rows.length < take) break;
      if (args.limit !== null && scanned >= args.limit) break;
    }

    const report = buildSafeOperationalMetadataBackfillReport({
      classifications,
      batchSize: args.batchSize,
      limit: args.limit,
      cursorStart: args.cursor,
      includeSamples: args.includeSamples,
      sampleLimit: args.sampleLimit,
    });

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ error: SCRIPT_ID, message }));
  process.exit(1);
});
