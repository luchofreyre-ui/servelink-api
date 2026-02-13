/*
  Warnings:

  - Added the required column `priceCents` to the `BookingAddon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BookingAddon" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'usd',
ADD COLUMN     "priceCents" INTEGER NOT NULL,
ADD COLUMN     "stripePaymentIntentId" TEXT;
