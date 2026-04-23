-- Optional whitelist of estimator `service_type` values this FO accepts for geo matching.
-- Empty array = no restriction (legacy behavior).
ALTER TABLE "FranchiseOwner"
ADD COLUMN "matchableServiceTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
