import { SYSTEM_TEST_INTELLIGENCE_VERSION } from "@servelink/system-test-intelligence";

import type { PrismaService } from "../../prisma";
import type { SystemTestsPipelineService } from "../system-tests-pipeline/system-tests-pipeline.service";

export type ReanalyzeStaleSummary = {
  scanned: number;
  enqueued: number;
  deduped: number;
  inline: number;
  failed: number;
};

/**
 * Enqueue canonical analysis for rows on an old logic version or in failed state.
 */
export async function reanalyzeStaleIntelligenceRows(
  prisma: PrismaService,
  pipeline: SystemTestsPipelineService,
  batchSize = 200,
): Promise<ReanalyzeStaleSummary> {
  const summary: ReanalyzeStaleSummary = {
    scanned: 0,
    enqueued: 0,
    deduped: 0,
    inline: 0,
    failed: 0,
  };

  const stale = await prisma.systemTestRunIntelligence.findMany({
    where: {
      OR: [
        { ingestionVersion: { not: SYSTEM_TEST_INTELLIGENCE_VERSION } },
        { analysisStatus: "failed" },
      ],
    },
    select: { runId: true },
    take: batchSize,
  });

  for (const row of stale) {
    summary.scanned += 1;
    try {
      const r = await pipeline.enqueueAnalysis(row.runId, {
        force: true,
        triggerSource: "reanalysis",
        skipChildAutomation: true,
      });
      if (r.mode === "deduped") summary.deduped += 1;
      else if (r.mode === "inline") summary.inline += 1;
      else summary.enqueued += 1;
    } catch {
      summary.failed += 1;
    }
  }

  return summary;
}
