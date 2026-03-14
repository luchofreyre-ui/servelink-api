CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "BookingSlotHold"
ADD CONSTRAINT "BookingSlotHold_no_overlap_per_fo"
EXCLUDE USING GIST (
  "foId" WITH =,
  tsrange("startAt", "endAt", '[)') WITH &&
);
