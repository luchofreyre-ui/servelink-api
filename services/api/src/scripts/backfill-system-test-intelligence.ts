import "dotenv/config";

import { runSystemTestIntelligenceBackfill } from "../modules/system-tests-intelligence/system-tests-intelligence-backfill";
import { PrismaService } from "../prisma";

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    const batchRaw = process.env.SYSTEM_TEST_INTELLIGENCE_BACKFILL_BATCH;
    const batchSize =
      batchRaw && Number.isFinite(Number(batchRaw))
        ? Math.max(1, Math.floor(Number(batchRaw)))
        : 200;

    const summary = await runSystemTestIntelligenceBackfill(prisma, batchSize);

    console.log(
      `scanned: ${summary.scanned}\n` +
        `created: ${summary.created}\n` +
        `updated: ${summary.updated}\n` +
        `skipped: ${summary.skipped}\n` +
        `failed: ${summary.failed}`,
    );

    if (summary.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.onModuleDestroy();
  }
}

main().catch((err) => {
  console.error("SYSTEM_TEST_INTELLIGENCE_BACKFILL_FAILED");
  console.error(err);
  process.exit(1);
});
