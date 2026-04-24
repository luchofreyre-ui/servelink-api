CREATE TYPE "BookingRecoveryStatus" AS ENUM ('none', 'auto_adjusted', 'failed');

ALTER TABLE "Booking" ADD COLUMN "recoveryStatus" "BookingRecoveryStatus" NOT NULL DEFAULT 'none';
ALTER TABLE "Booking" ADD COLUMN "originalRequestedTime" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "recoveryAttemptedAt" TIMESTAMP(3);
