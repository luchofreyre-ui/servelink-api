-- CreateTable
CREATE TABLE "DispatchConfigPublishAudit" (
    "id" TEXT NOT NULL,
    "dispatchConfigId" TEXT NOT NULL,
    "fromVersion" INTEGER,
    "toVersion" INTEGER NOT NULL,
    "publishedByAdminUserId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diffSnapshot" JSONB NOT NULL,
    "warningsSnapshot" JSONB NOT NULL,
    "highlightsSnapshot" JSONB NOT NULL,
    "publishSummary" TEXT NOT NULL,

    CONSTRAINT "DispatchConfigPublishAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DispatchConfigPublishAudit_dispatchConfigId_idx" ON "DispatchConfigPublishAudit"("dispatchConfigId");

-- CreateIndex
CREATE INDEX "DispatchConfigPublishAudit_publishedAt_toVersion_idx" ON "DispatchConfigPublishAudit"("publishedAt", "toVersion");

-- AddForeignKey
ALTER TABLE "DispatchConfigPublishAudit" ADD CONSTRAINT "DispatchConfigPublishAudit_dispatchConfigId_fkey" FOREIGN KEY ("dispatchConfigId") REFERENCES "DispatchConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
