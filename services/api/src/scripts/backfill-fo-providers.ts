import "dotenv/config";
import { PrismaService } from "../prisma";
import { FoService } from "../modules/fo/fo.service";

async function main() {
  const db = new PrismaService();
  await db.onModuleInit();

  try {
    const batchSizeRaw = process.env.FO_PROVIDER_BACKFILL_BATCH_SIZE;
    const batchSize =
      batchSizeRaw && Number.isFinite(Number(batchSizeRaw))
        ? Math.max(1, Math.floor(Number(batchSizeRaw)))
        : 100;

    const foService = new FoService(db);
    const summary = await foService.backfillMissingProviders(batchSize);

    console.log("FO_PROVIDER_BACKFILL_SUMMARY");
    console.log(JSON.stringify(summary, null, 2));

    if (summary.errors > 0) {
      process.exitCode = 1;
    }
  } finally {
    await db.onModuleDestroy();
  }
}

main().catch((err) => {
  console.error("FO_PROVIDER_BACKFILL_FAILED");
  console.error(err);
  process.exit(1);
});
