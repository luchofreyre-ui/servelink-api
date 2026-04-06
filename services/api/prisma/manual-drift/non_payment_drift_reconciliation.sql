-- AlterTable
ALTER TABLE "SystemTestIncidentAction" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SystemTestIncidentIndex" ALTER COLUMN "lastSeenAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SystemTestIncidentNote" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SystemTestIncidentStepExecution" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "SystemTestRunIntelligence" ALTER COLUMN "analysisStatus" SET DEFAULT 'pending';

-- CreateTable
CREATE TABLE "EncyclopediaReviewRecord" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "surface" TEXT,
    "problem" TEXT,
    "intent" TEXT,
    "sections" JSONB NOT NULL,
    "internalLinks" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EncyclopediaReviewRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EncyclopediaReviewRecord_slug_key" ON "EncyclopediaReviewRecord"("slug");

-- RenameIndex
ALTER INDEX "DispatchExceptionActionEvent_dispatchExceptionActionId_createdA" RENAME TO "DispatchExceptionActionEvent_dispatchExceptionActionId_crea_idx";

-- RenameIndex
ALTER INDEX "DispatchExceptionActionNote_dispatchExceptionActionId_createdAt" RENAME TO "DispatchExceptionActionNote_dispatchExceptionActionId_creat_idx";

-- RenameIndex
ALTER INDEX "SystemTestFailureFamilyMembership_failureGroupId_familyVersion_" RENAME TO "SystemTestFailureFamilyMembership_failureGroupId_familyVers_key";

