-- CreateEnum
CREATE TYPE "DisputeOutcome" AS ENUM ('created', 'won', 'lost', 'closed');

-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN "disputeOutcome" "DisputeOutcome";
