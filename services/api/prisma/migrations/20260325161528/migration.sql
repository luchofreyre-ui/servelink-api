/*
  Warnings:

  - You are about to drop the column `completionReadyAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedChargeCents` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `geoExitTriggeredAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `geoStartTriggeredAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isCompletionReady` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `lastGeoEventAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentAuthorizedCents` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentCapturedCents` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentShortfallCents` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `paymentStatusUpdatedAt` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `requiredTeamSize` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `requiresBodyCam` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `workStatus` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the `BookingDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingGeoState` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingOpsException` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingOpsNotification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingOpsNotificationDelivery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingPaymentOverageRequest` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BookingPaymentResolution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversionAlertHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversionIncident` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversionIncidentEvent` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversionMonitoringConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConversionScheduledRunHistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FranchiseOwnerAvailabilityBlackout` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FranchiseOwnerAvailabilityOverride` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FranchiseOwnerBodyCamAssignment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FranchiseOwnerSchedulingSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FranchiseOwnerWeeklyAvailability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserNotificationPreference` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BookingDocument" DROP CONSTRAINT "BookingDocument_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingGeoState" DROP CONSTRAINT "BookingGeoState_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingGeoState" DROP CONSTRAINT "BookingGeoState_foId_fkey";

-- DropForeignKey
ALTER TABLE "BookingOpsException" DROP CONSTRAINT "BookingOpsException_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingOpsNotification" DROP CONSTRAINT "BookingOpsNotification_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingOpsNotificationDelivery" DROP CONSTRAINT "BookingOpsNotificationDelivery_bookingOpsNotificationId_fkey";

-- DropForeignKey
ALTER TABLE "BookingPaymentOverageRequest" DROP CONSTRAINT "BookingPaymentOverageRequest_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "BookingPaymentOverageRequest" DROP CONSTRAINT "BookingPaymentOverageRequest_requestedByFoId_fkey";

-- DropForeignKey
ALTER TABLE "BookingPaymentResolution" DROP CONSTRAINT "BookingPaymentResolution_bookingId_fkey";

-- DropForeignKey
ALTER TABLE "ConversionIncidentEvent" DROP CONSTRAINT "ConversionIncidentEvent_incidentId_fkey";

-- DropForeignKey
ALTER TABLE "FranchiseOwnerAvailabilityBlackout" DROP CONSTRAINT "FranchiseOwnerAvailabilityBlackout_foId_fkey";

-- DropForeignKey
ALTER TABLE "FranchiseOwnerAvailabilityOverride" DROP CONSTRAINT "FranchiseOwnerAvailabilityOverride_foId_fkey";

-- DropForeignKey
ALTER TABLE "FranchiseOwnerBodyCamAssignment" DROP CONSTRAINT "FranchiseOwnerBodyCamAssignment_foId_fkey";

-- DropForeignKey
ALTER TABLE "FranchiseOwnerSchedulingSettings" DROP CONSTRAINT "FranchiseOwnerSchedulingSettings_foId_fkey";

-- DropForeignKey
ALTER TABLE "FranchiseOwnerWeeklyAvailability" DROP CONSTRAINT "FranchiseOwnerWeeklyAvailability_foId_fkey";

-- DropForeignKey
ALTER TABLE "UserNotificationPreference" DROP CONSTRAINT "UserNotificationPreference_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "completionReadyAt",
DROP COLUMN "estimatedChargeCents",
DROP COLUMN "geoExitTriggeredAt",
DROP COLUMN "geoStartTriggeredAt",
DROP COLUMN "isCompletionReady",
DROP COLUMN "lastGeoEventAt",
DROP COLUMN "paymentAuthorizedCents",
DROP COLUMN "paymentCapturedCents",
DROP COLUMN "paymentShortfallCents",
DROP COLUMN "paymentStatusUpdatedAt",
DROP COLUMN "requiredTeamSize",
DROP COLUMN "requiresBodyCam",
DROP COLUMN "workStatus";

-- AlterTable
ALTER TABLE "BookingDispatchControl" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "OpsAnomaly" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- DropTable
DROP TABLE "BookingDocument";

-- DropTable
DROP TABLE "BookingGeoState";

-- DropTable
DROP TABLE "BookingOpsException";

-- DropTable
DROP TABLE "BookingOpsNotification";

-- DropTable
DROP TABLE "BookingOpsNotificationDelivery";

-- DropTable
DROP TABLE "BookingPaymentOverageRequest";

-- DropTable
DROP TABLE "BookingPaymentResolution";

-- DropTable
DROP TABLE "ConversionAlertHistory";

-- DropTable
DROP TABLE "ConversionIncident";

-- DropTable
DROP TABLE "ConversionIncidentEvent";

-- DropTable
DROP TABLE "ConversionMonitoringConfig";

-- DropTable
DROP TABLE "ConversionScheduledRunHistory";

-- DropTable
DROP TABLE "FranchiseOwnerAvailabilityBlackout";

-- DropTable
DROP TABLE "FranchiseOwnerAvailabilityOverride";

-- DropTable
DROP TABLE "FranchiseOwnerBodyCamAssignment";

-- DropTable
DROP TABLE "FranchiseOwnerSchedulingSettings";

-- DropTable
DROP TABLE "FranchiseOwnerWeeklyAvailability";

-- DropTable
DROP TABLE "UserNotificationPreference";

-- DropEnum
DROP TYPE "BookingDocumentStatus";

-- DropEnum
DROP TYPE "BookingDocumentType";

-- DropEnum
DROP TYPE "BookingOpsDeliveryChannelPreference";

-- DropEnum
DROP TYPE "BookingOpsEmailProvider";

-- DropEnum
DROP TYPE "BookingOpsExceptionKind";

-- DropEnum
DROP TYPE "BookingOpsExceptionStatus";

-- DropEnum
DROP TYPE "BookingOpsNotificationChannel";

-- DropEnum
DROP TYPE "BookingOpsNotificationDeliveryChannelStatus";

-- DropEnum
DROP TYPE "BookingOpsNotificationKind";

-- DropEnum
DROP TYPE "BookingOpsNotificationRecipientType";

-- DropEnum
DROP TYPE "BookingOpsNotificationStatus";

-- DropEnum
DROP TYPE "BookingPaymentOverageStatus";

-- DropEnum
DROP TYPE "BookingPaymentResolutionSource";

-- DropEnum
DROP TYPE "ConversionAlertChannel";

-- DropEnum
DROP TYPE "ConversionAlertDispatchStatus";

-- DropEnum
DROP TYPE "ConversionAlertKind";

-- DropEnum
DROP TYPE "ConversionAlertSeverity";

-- DropEnum
DROP TYPE "ConversionIncidentEventKind";

-- DropEnum
DROP TYPE "ConversionIncidentSeverity";

-- DropEnum
DROP TYPE "ConversionIncidentStatus";

-- DropEnum
DROP TYPE "ConversionScheduledRunKind";

-- DropEnum
DROP TYPE "ConversionScheduledRunStatus";

-- DropEnum
DROP TYPE "FranchiseOwnerBodyCamRequirementMode";

-- DropEnum
DROP TYPE "FranchiseOwnerScheduleOverrideMode";

-- RenameForeignKey
ALTER TABLE "DeepCleanEstimatorMonitoringAlertOrchestrationAudit" RENAME CONSTRAINT "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_alertId_fke" TO "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_alertI_fkey";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringAlertExecution_alertId_createdAt_id" RENAME TO "DeepCleanEstimatorMonitoringAlertExecution_alertId_createdA_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_action_crea" RENAME TO "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_action__idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_alertId_cre" RENAME TO "DeepCleanEstimatorMonitoringAlertOrchestrationAudit_alertId_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringAlertOrchestrationPolicy_isEnabled_" RENAME TO "DeepCleanEstimatorMonitoringAlertOrchestrationPolicy_isEnab_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringNotificationDigestCursor_digestKey_" RENAME TO "DeepCleanEstimatorMonitoringNotificationDigestCursor_digest_key";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringNotificationRoute_isEnabled_severit" RENAME TO "DeepCleanEstimatorMonitoringNotificationRoute_isEnabled_sev_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringNotificationSend_alertId_createdAt_" RENAME TO "DeepCleanEstimatorMonitoringNotificationSend_alertId_create_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorMonitoringNotificationSend_status_createdAt_i" RENAME TO "DeepCleanEstimatorMonitoringNotificationSend_status_created_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorPolicyHealth_policyId_evaluationWindowStart_i" RENAME TO "DeepCleanEstimatorPolicyHealth_policyId_evaluationWindowSta_idx";

-- RenameIndex
ALTER INDEX "DeepCleanEstimatorRollbackOutcome_incidentId_alertId_rollbackVe" RENAME TO "DeepCleanEstimatorRollbackOutcome_incidentId_alertId_rollba_key";
