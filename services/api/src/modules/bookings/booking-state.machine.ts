import { BookingStatus } from "@prisma/client";

export type Transition = "schedule" | "assign" | "start" | "complete" | "cancel" | "reopen";

export function getTransition(
  transition: Transition,
  current: BookingStatus,
): { to: BookingStatus } {
  switch (transition) {
    case "schedule":
      if (
        current === BookingStatus.pending_dispatch ||
        current === BookingStatus.assigned
      ) {
        return { to: current };
      }
      if (current !== BookingStatus.pending_payment) break;
      return { to: BookingStatus.pending_dispatch };

    case "assign":
      if (current === BookingStatus.assigned) return { to: current };
      if (current !== BookingStatus.pending_dispatch && current !== BookingStatus.offered) break;
      return { to: BookingStatus.assigned };

    case "start":
      if (current === BookingStatus.in_progress) return { to: current };
      if (current !== BookingStatus.assigned) break;
      return { to: BookingStatus.in_progress };

    case "complete":
      if (current === BookingStatus.completed) return { to: current };
      if (current !== BookingStatus.in_progress) break;
      return { to: BookingStatus.completed };

    case "reopen":
      if (current === BookingStatus.in_progress) return { to: current };
      if (current !== BookingStatus.completed) break;
      return { to: BookingStatus.in_progress };

    case "cancel":
      if (current === BookingStatus.canceled) return { to: current };
      if (current === BookingStatus.completed) break;
      return { to: BookingStatus.canceled };
  }

  throw new Error(`INVALID_TRANSITION:${transition}:${current}`);
}
