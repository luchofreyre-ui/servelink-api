-- CreateEnum
CREATE TYPE "JournalEntryType" AS ENUM ('CHARGE', 'REFUND', 'PAYOUT', 'ADJUSTMENT', 'FEE');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('AR_CUSTOMER', 'CASH_STRIPE', 'REV_PLATFORM', 'LIAB_FO_PAYABLE');

-- CreateEnum
CREATE TYPE "LineDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT,
    "foId" TEXT,
    "type" "JournalEntryType" NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "idempotencyKey" TEXT,
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalLine" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "direction" "LineDirection" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_idempotencyKey_key" ON "JournalEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "JournalEntry_bookingId_createdAt_idx" ON "JournalEntry"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_foId_createdAt_idx" ON "JournalEntry"("foId", "createdAt");

-- CreateIndex
CREATE INDEX "JournalEntry_type_createdAt_idx" ON "JournalEntry"("type", "createdAt");

-- CreateIndex
CREATE INDEX "JournalLine_entryId_idx" ON "JournalLine"("entryId");

-- CreateIndex
CREATE INDEX "JournalLine_account_createdAt_idx" ON "JournalLine"("account", "createdAt");

-- AddForeignKey
ALTER TABLE "JournalLine" ADD CONSTRAINT "JournalLine_entryId_fkey" FOREIGN KEY ("entryId") REFERENCES "JournalEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
