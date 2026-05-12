/** FO screen-summary `queueLabel` values from `booking-screen.service.ts`. */
export type FoQueueSnapshotLabel = "assigned" | "offered";

export function isFoOfferedQueueRow(queueLabel: unknown): queueLabel is "offered" {
  return queueLabel === "offered";
}

export function foQueueRoleLabel(queueLabel: unknown): "Offered" | "Assigned" {
  return isFoOfferedQueueRow(queueLabel) ? "Offered" : "Assigned";
}
