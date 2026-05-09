/**
 * Read-only dry-run: classify historical bookings for BookingOperationalMetadata backfill readiness.
 * Never writes. Never prints raw notes or customerPrep text.
 */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import {
  buildSafeOperationalMetadataBackfillReport,
  classifyBookingForOperationalMetadataBackfill,
  OPERATIONAL_METADATA_DRY_RUN_CLI_ID,
  OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT,
  parseOperationalMetadataDryRunArgv,
  type OperationalMetadataBackfillClassificationResult,
  type OperationalMetadataBackfillDryRunCursor,
} from "./backfill-booking-operational-metadata-dry-run.lib";

function parseCursorToOrdering(cursor: OperationalMetadataBackfillDryRunCursor): {
  createdAt: Date;
  id: string;
} {
  const createdAt = new Date(cursor.createdAt);
  if (!Number.isFinite(createdAt.getTime())) {
    throw new Error(
      `${OPERATIONAL_METADATA_DRY_RUN_CLI_ID}: invalid cursor createdAt (expected ISO-8601).`,
    );
  }
  return { createdAt, id: cursor.id };
}

async function main() {
  const parsed = parseOperationalMetadataDryRunArgv(process.argv.slice(2));
  if (parsed.mode === "help") {
    console.log(OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT.trimEnd());
    return;
  }

  const args = parsed.options;

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
  console.error(JSON.stringify({ error: OPERATIONAL_METADATA_DRY_RUN_CLI_ID, message }));
  process.exit(1);
});
