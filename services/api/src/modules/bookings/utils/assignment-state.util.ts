import { BookingStatus } from "@prisma/client";

export function isAssignedState(booking: {
  foId: string | null;
  status: BookingStatus;
}) {
  return booking.foId != null && booking.status === BookingStatus.assigned;
}

export function isUnassignedState(booking: {
  foId: string | null;
  status: BookingStatus;
}) {
  return booking.foId == null && booking.status !== BookingStatus.assigned;
}

export function isInvalidAssignmentState(booking: {
  foId: string | null;
  status: BookingStatus;
}) {
  return booking.foId != null && booking.status !== BookingStatus.assigned;
}
