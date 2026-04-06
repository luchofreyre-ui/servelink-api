import { BookingStatus } from "@prisma/client";
import { getTransition, type Transition } from "./booking-state.machine";

export function canTransitionBookingStatus(
  current: BookingStatus,
  next: BookingStatus,
): boolean {
  return resolveTransitionName(current, next) !== null;
}

export function resolveTransitionName(
  current: BookingStatus,
  next: BookingStatus,
): Transition | null {
  const names: Transition[] = [
    "schedule",
    "assign",
    "start",
    "complete",
    "cancel",
    "reopen",
  ];
  for (const t of names) {
    try {
      if (getTransition(t, current).to === next) {
        return t;
      }
    } catch {
      /* invalid transition name for current */
    }
  }
  return null;
}
