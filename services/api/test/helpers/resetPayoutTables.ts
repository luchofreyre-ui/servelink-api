import { PrismaClient } from "@prisma/client";

/**
 * Deletes payout-related tables in FK-safe order so payout tests get a clean ledger and batches.
 * Call before each test to avoid journal entries from other tests inflating totals / foIds.
 */
export async function resetPayoutTables(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction([
    prisma.journalLine.deleteMany(),
    prisma.journalEntry.deleteMany(),
    prisma.payoutLine.deleteMany(),
    prisma.payoutBatch.deleteMany(),
  ]);
}
