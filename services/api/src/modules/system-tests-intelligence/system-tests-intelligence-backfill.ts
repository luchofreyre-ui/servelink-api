import type { PrismaService } from "../../prisma";
import { SystemTestsIntelligenceIngestionService } from "./system-tests-intelligence-ingestion.service";

export type SystemTestIntelligenceBackfillSummary = {
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};

/**
 * Cursor-based scan over all runs (no offset pagination).
 *
 * - orderBy `{ id: "asc" }`: `SystemTestRun.id` is the primary key (cuid), unique and stable.
 * - Prisma cursor: `take: N`, then next page uses `cursor: { id: lastId }, skip: 1` so the
 *   cursor row is not repeated and there are no gaps within this ordering.
 * - Rows inserted mid-scan with an `id` lexicographically after the current cursor are picked
 *   up on later pages in the same run; ids before the cursor were already passed (re-run
 *   backfill to catch those).
 */
export async function runSystemTestIntelligenceBackfill(
  prisma: PrismaService,
  batchSize = 200,
): Promise<SystemTestIntelligenceBackfillSummary> {
  const ingestion = new SystemTestsIntelligenceIngestionService(prisma);
  const summary: SystemTestIntelligenceBackfillSummary = {
    scanned: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };

  const take = Math.max(1, Math.floor(batchSize));
  let cursorId: string | null = null;

  for (;;) {
    const batch: { id: string }[] = await prisma.systemTestRun.findMany({
      take,
      orderBy: { id: "asc" },
      ...(cursorId ?
        {
          skip: 1,
          cursor: { id: cursorId },
        }
      : {}),
      select: { id: true },
    });

    if (batch.length === 0) {
      break;
    }

    for (const row of batch) {
      summary.scanned += 1;
      const outcome = await ingestion.ingestRunSafe(row.id);
      if (outcome === "created") summary.created += 1;
      else if (outcome === "updated") summary.updated += 1;
      else if (outcome === "skipped") summary.skipped += 1;
      else summary.failed += 1;
    }

    cursorId = batch[batch.length - 1]!.id;

    if (batch.length < take) {
      break;
    }
  }

  return summary;
}
