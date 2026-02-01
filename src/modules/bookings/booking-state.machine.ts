import { BookingStatus } from '@prisma/client';

export type Transition =
  | 'schedule'
  | 'start'
  | 'complete'
  | 'cancel';

export function getTransition(
  transition: Transition,
  current: BookingStatus,
): { to: BookingStatus } {
  switch (transition) {
    case 'schedule':
      if (current !== BookingStatus.pending_payment) break;
      return { to: BookingStatus.pending_dispatch };

    case 'start':
      if (current !== BookingStatus.assigned) break;
      return { to: BookingStatus.in_progress };

    case 'complete':
      if (current !== BookingStatus.in_progress) break;
      return { to: BookingStatus.completed };

    case 'cancel':
      if (current === BookingStatus.completed || current === BookingStatus.canceled) break;
      return { to: BookingStatus.canceled };
  }

  throw new Error(`INVALID_TRANSITION:${transition}:${current}`);
}
