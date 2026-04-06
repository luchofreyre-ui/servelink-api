import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { BookingDispatchControlService } from "./booking-dispatch-control.service";
import { BookingReviewControlService } from "./booking-review-control.service";
import {
  isAssignedState,
  isInvalidAssignmentState,
} from "./utils/assignment-state.util";

const NON_ASSIGNABLE_STATUSES: BookingStatus[] = [
  "in_progress",
  "completed",
  "canceled",
];

function bookingSnapshotFromBooking(booking: {
  id: string;
  status: BookingStatus;
  scheduledStart: Date | null;
  estimatedHours: number | null;
  siteLat: number | null;
  siteLng: number | null;
  foId: string | null;
}) {
  return {
    bookingId: booking.id,
    status: booking.status,
    scheduledStart: booking.scheduledStart?.toISOString() ?? null,
    siteLat: booking.siteLat ?? null,
    siteLng: booking.siteLng ?? null,
    estimatedDurationMin:
      booking.estimatedHours != null
        ? Math.round(booking.estimatedHours * 60)
        : null,
    foId: booking.foId ?? null,
  };
}

@Injectable()
export class DispatchOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingDispatchControlService: BookingDispatchControlService,
    private readonly bookingReviewControlService: BookingReviewControlService,
  ) {}

  private async assertDispatchAllowed(bookingId: string): Promise<void> {
    await this.bookingDispatchControlService.assertNotHeld(bookingId);
    await this.bookingReviewControlService.assertReviewNotRequired(bookingId);
  }

  private async assertBookingStillAssignableInWritePath(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        foId: true,
        dispatchLockedAt: true,
      },
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    if (booking.dispatchLockedAt) {
      throw new BadRequestException("Booking is currently dispatch locked");
    }

    if (booking.foId || booking.status === BookingStatus.assigned) {
      throw new BadRequestException("Booking is already assigned");
    }

    if (NON_ASSIGNABLE_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        `Booking cannot be assigned when status is ${booking.status}`,
      );
    }

    return booking;
  }

  private async getNextDispatchSequence(bookingId: string): Promise<{
    dispatchSequence: number;
    redispatchSequence: number;
  }> {
    const latest = await (this.prisma as any).dispatchDecision.findFirst({
      where: { bookingId },
      orderBy: { dispatchSequence: "desc" },
    });
    return {
      dispatchSequence: latest ? latest.dispatchSequence + 1 : 1,
      redispatchSequence: latest?.redispatchSequence ?? 0,
    };
  }

  async manualRedispatch(bookingId: string, adminId: string) {
    await this.assertDispatchAllowed(bookingId);

    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    const { dispatchSequence, redispatchSequence } =
      await this.getNextDispatchSequence(bookingId);

    const bookingSnapshot = bookingSnapshotFromBooking(booking);

    return (this.prisma as any).dispatchDecision.create({
      data: {
        bookingId,
        trigger: "redispatch_manual",
        dispatchSequence,
        redispatchSequence: redispatchSequence + 1,
        decisionStatus: "deferred",
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot,
        decisionMeta: {
          adminId,
          reason: "manual redispatch",
          bookingStatusAtTime: booking.status,
          foIdAtTime: booking.foId ?? null,
          scheduledStartAtTime: booking.scheduledStart?.toISOString() ?? null,
        },
      },
    });
  }

  async manualAssign(
    bookingId: string,
    franchiseOwnerId: string,
    adminId: string,
  ) {
    await this.assertDispatchAllowed(bookingId);

    await this.assertBookingStillAssignableInWritePath(bookingId);

    if (!franchiseOwnerId || franchiseOwnerId.trim() === "") {
      throw new BadRequestException("franchiseOwnerId is required");
    }

    const fo = await this.prisma.franchiseOwner.findUnique({
      where: { id: franchiseOwnerId },
    });

    if (!fo) throw new NotFoundException("Franchise owner not found");

    const { dispatchSequence, redispatchSequence } =
      await this.getNextDispatchSequence(bookingId);

    return this.prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          status: true,
          foId: true,
          scheduledStart: true,
          estimatedHours: true,
          siteLat: true,
          siteLng: true,
        },
      });

      if (!current) throw new NotFoundException("Booking not found");
      if (isInvalidAssignmentState(current)) {
        throw new BadRequestException("BOOKING_INVALID_STATE");
      }
      if (isAssignedState(current)) {
        throw new BadRequestException("Booking is already assigned");
      }
      if (NON_ASSIGNABLE_STATUSES.includes(current.status)) {
        throw new BadRequestException(
          `Booking cannot be assigned when status is ${current.status}`,
        );
      }

      const bookingSnapshot = bookingSnapshotFromBooking(current);

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          foId: franchiseOwnerId,
          status: BookingStatus.assigned,
        },
      });

      return (tx as any).dispatchDecision.create({
        data: {
          bookingId,
          trigger: "manual_assign",
          dispatchSequence,
          redispatchSequence,
          decisionStatus: "manual_assigned",
          selectedFranchiseOwnerId: franchiseOwnerId,
          selectedRank: 1,
          scoringVersion: "provider-aware-dispatch-v1",
          bookingStatusAtDecision: current.status,
          scheduledStart: current.scheduledStart,
          estimatedDurationMin:
            current.estimatedHours != null
              ? Math.round(current.estimatedHours * 60)
              : null,
          bookingSnapshot,
          decisionMeta: {
            adminId,
            reason: "manual assignment",
            writePath: "dispatch_ops_manual_assign_transaction",
          },
        },
      });
    });
  }

  async excludeProvider(
    bookingId: string,
    franchiseOwnerId: string,
    adminId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    const { dispatchSequence, redispatchSequence } =
      await this.getNextDispatchSequence(bookingId);

    const bookingSnapshot = bookingSnapshotFromBooking(booking);

    const decision = await (this.prisma as any).dispatchDecision.create({
      data: {
        bookingId,
        trigger: "manual_exclusion",
        dispatchSequence,
        redispatchSequence,
        decisionStatus: "deferred",
        scoringVersion: "provider-aware-dispatch-v1",
        bookingSnapshot,
        decisionMeta: {
          adminId,
          reason: "manual provider exclusion",
        },
      },
    });

    await (this.prisma as any).dispatchDecisionCandidate.create({
      data: {
        dispatchDecisionId: decision.id,
        franchiseOwnerId,
        candidateStatus: "excluded",
        reasonCode: "excluded_manual_block",
        eligibilitySnapshot: {},
      },
    });

    return decision;
  }

  async clearExclusions(bookingId: string, _adminId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw new NotFoundException("Booking not found");

    return { ok: true };
  }
}
