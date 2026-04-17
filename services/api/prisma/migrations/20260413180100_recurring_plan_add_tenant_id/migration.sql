-- Add RecurringPlan.tenantId after the table exists (split from tenant foundation migration;
-- see 20260412180000_tenant_foundation_booking_recurring_plan for Booking).

ALTER TABLE "RecurringPlan" ADD COLUMN "tenantId" TEXT NOT NULL DEFAULT 'nustandard';

CREATE INDEX "RecurringPlan_tenantId_idx" ON "RecurringPlan"("tenantId");
