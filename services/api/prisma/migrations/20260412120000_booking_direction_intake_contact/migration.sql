-- Optional contact capture from the public /book funnel (Phase 4).
ALTER TABLE "BookingDirectionIntake" ADD COLUMN "customerName" TEXT;
ALTER TABLE "BookingDirectionIntake" ADD COLUMN "customerEmail" TEXT;
