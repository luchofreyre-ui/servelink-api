-- AlterTable
ALTER TABLE "DeepCleanEstimatorMonitoringAlert" ADD COLUMN "reopenCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "DeepCleanEstimatorMonitoringAlert" ADD COLUMN "impactScore" DOUBLE PRECISION;
