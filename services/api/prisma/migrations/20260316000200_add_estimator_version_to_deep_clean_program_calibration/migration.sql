-- AlterTable
ALTER TABLE "BookingDeepCleanProgramCalibration" ADD COLUMN "deepCleanEstimatorConfigId" TEXT,
ADD COLUMN "deepCleanEstimatorConfigVersion" INTEGER,
ADD COLUMN "deepCleanEstimatorConfigLabel" TEXT;

-- CreateIndex
CREATE INDEX "DCP_calibration_estimator_version_idx" ON "BookingDeepCleanProgramCalibration"("deepCleanEstimatorConfigVersion");

-- CreateIndex
CREATE INDEX "DCP_calibration_estimator_version_usable_idx" ON "BookingDeepCleanProgramCalibration"("deepCleanEstimatorConfigVersion", "usableForCalibrationAnalysis");
