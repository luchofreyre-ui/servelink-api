import { Injectable, BadRequestException } from "@nestjs/common";
import { BookingStatus } from "./booking-status.enum";

const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING_DISPATCH]: [
    BookingStatus.OFFERED,
    BookingStatus.HOLD,
    BookingStatus.REVIEW,
    BookingStatus.EXCEPTION,
  ],

  [BookingStatus.OFFERED]: [
    BookingStatus.ACCEPTED,
    BookingStatus.HOLD,
    BookingStatus.EXCEPTION,
  ],

  [BookingStatus.ACCEPTED]: [
    BookingStatus.ASSIGNED,
    BookingStatus.EXCEPTION,
  ],

  [BookingStatus.ASSIGNED]: [
    BookingStatus.EN_ROUTE,
    BookingStatus.EXCEPTION,
  ],

  [BookingStatus.EN_ROUTE]: [
    BookingStatus.ACTIVE,
    BookingStatus.EXCEPTION,
  ],

  [BookingStatus.ACTIVE]: [
    BookingStatus.COMPLETED,
    BookingStatus.EXCEPTION,
  ],

  [BookingStatus.HOLD]: [
    BookingStatus.PENDING_DISPATCH,
    BookingStatus.CANCELLED,
  ],

  [BookingStatus.REVIEW]: [
    BookingStatus.PENDING_DISPATCH,
    BookingStatus.CANCELLED,
  ],

  [BookingStatus.EXCEPTION]: [
    BookingStatus.REVIEW,
    BookingStatus.CANCELLED,
  ],

  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingTransitionService {
  validateTransition(current: BookingStatus, next: BookingStatus) {
    const allowed = allowedTransitions[current] || [];

    if (!allowed.includes(next)) {
      throw new BadRequestException(
        `Invalid transition from ${current} to ${next}`,
      );
    }
  }
}
