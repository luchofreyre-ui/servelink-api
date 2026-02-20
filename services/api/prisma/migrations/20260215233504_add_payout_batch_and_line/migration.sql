-- CreateEnum
CREATE TYPE "PayoutBatchStatus" AS ENUM ('draft', 'executed', 'void');

-- CreateTable
CREATE TABLE "PayoutBatch" (
    "id" TEXT NOT NULL,
    "status" "PayoutBatchStatus" NOT NULL DEFAULT 'draft',
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "asOf" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "executedByAdminId" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayoutLine" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "foId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutBatch_idempotencyKey_key" ON "PayoutBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "PayoutLine_batchId_idx" ON "PayoutLine"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "PayoutLine_batchId_foId_key" ON "PayoutLine"("batchId", "foId");

-- AddForeignKey
ALTER TABLE "PayoutLine" ADD CONSTRAINT "PayoutLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "PayoutBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
