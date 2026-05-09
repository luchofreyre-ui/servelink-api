/**
 * BookingOperationalMetadata backfill CLI — dry-run by default; optional guarded write mode.
 * Never prints raw notes or customer prep text.
 */
import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import {
  OPERATIONAL_METADATA_DRY_RUN_CLI_ID,
  OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT,
  parseOperationalMetadataDryRunArgv,
  runOperationalMetadataBackfillJob,
} from "./backfill-booking-operational-metadata-dry-run.lib";

async function main() {
  const parsed = parseOperationalMetadataDryRunArgv(process.argv.slice(2));
  if (parsed.mode === "help") {
    console.log(OPERATIONAL_METADATA_DRY_RUN_HELP_TEXT.trimEnd());
    return;
  }

  const prisma = new PrismaClient();

  try {
    const report = await runOperationalMetadataBackfillJob(prisma, parsed.options);
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
