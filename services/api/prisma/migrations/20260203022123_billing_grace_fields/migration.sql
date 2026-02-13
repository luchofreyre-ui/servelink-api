/*
  Warnings:

  - You are about to drop the column `lastInsideAt` on the `BillingSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BillingSession" DROP COLUMN "lastInsideAt",
ADD COLUMN     "firstExitAt" TIMESTAMP(3),
ADD COLUMN     "graceExpiresAt" TIMESTAMP(3),
ADD COLUMN     "graceNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "pendingExitAt" TIMESTAMP(3);
