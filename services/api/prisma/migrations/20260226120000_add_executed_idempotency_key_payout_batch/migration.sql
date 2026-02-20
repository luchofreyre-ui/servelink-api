-- AlterTable
ALTER TABLE "PayoutBatch" ADD COLUMN "executedIdempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PayoutBatch_executedIdempotencyKey_key" ON "PayoutBatch"("executedIdempotencyKey");
