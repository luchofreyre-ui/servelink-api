-- CreateEnum
CREATE TYPE "DeepCleanCalibrationReviewStatus" AS ENUM ('unreviewed', 'reviewed');

-- AlterTable
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD COLUMN "reviewStatus" "DeepCleanCalibrationReviewStatus" NOT NULL DEFAULT 'unreviewed';
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD COLUMN "reviewedAt" TIMESTAMP(3);
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD COLUMN "reviewedByUserId" TEXT;
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD COLUMN "reviewReasonTagsJson" JSONB;

CREATE INDEX "BookingDeepCleanProgramCalibration_reviewStatus_idx" ON "BookingDeepCleanProgramCalibration"("reviewStatus");
