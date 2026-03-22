-- AlterEnum (one value per statement for broad Postgres compatibility)
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'hold';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'review';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'accepted';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'en_route';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'exception';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FoSchedule" (
    "id" TEXT NOT NULL,
    "franchiseOwnerId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FoBlockout" (
    "id" TEXT NOT NULL,
    "franchiseOwnerId" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoBlockout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FoSchedule_franchiseOwnerId_idx" ON "FoSchedule"("franchiseOwnerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FoBlockout_franchiseOwnerId_start_end_idx" ON "FoBlockout"("franchiseOwnerId", "start", "end");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FoSchedule_franchiseOwnerId_fkey'
  ) THEN
    ALTER TABLE "FoSchedule" ADD CONSTRAINT "FoSchedule_franchiseOwnerId_fkey"
      FOREIGN KEY ("franchiseOwnerId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FoBlockout_franchiseOwnerId_fkey'
  ) THEN
    ALTER TABLE "FoBlockout" ADD CONSTRAINT "FoBlockout_franchiseOwnerId_fkey"
      FOREIGN KEY ("franchiseOwnerId") REFERENCES "FranchiseOwner"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
