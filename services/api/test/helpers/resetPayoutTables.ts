import { PrismaClient } from "@prisma/client";

/**
 * TEST-ONLY reset helper.
 *
 * Ledger is append-only and Prisma client blocks deleteMany/update/delete on JournalEntry/JournalLine
 * via the immutable-ledger extension. For tests we must reset tables using raw SQL TRUNCATE,
 * which bypasses Prisma query extensions.
 *
 * IMPORTANT:
 * - This should never be used in production paths.
 * - Used only by payout tests to reset state deterministically.
 */
export async function resetPayoutTables(prisma: PrismaClient) {
  // TRUNCATE in dependency order; CASCADE handles FK dependencies safely.
  // RESTART IDENTITY keeps sequences consistent if any exist (safe even if none).
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "PayoutLine",
      "PayoutBatch",
      "JournalLine",
      "JournalEntry"
    RESTART IDENTITY
    CASCADE;
  `);
}
