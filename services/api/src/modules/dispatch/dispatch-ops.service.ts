import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import {
  evaluateBookingOpsEligibility,
  evaluateExceptionOpsEligibility,
} from "./dispatch-ops-eligibility";
import { DispatchExceptionActionsService } from "./dispatch-exception-actions.service";
import { parseBookingIdFromDispatchExceptionKey } from "./dispatch-exception-key";

function actorUserId(actor: unknown): string {
  if (actor && typeof actor === "object") {
    const a = actor as { userId?: string; id?: string };
    if (a.userId) {
      return String(a.userId);
    }
    if (a.id) {
      return String(a.id);
    }
  }
  return "unknown";
}

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
    private readonly exceptionActions: DispatchExceptionActionsService,
  ) {}

  private async getNextDispatchSequenceTx(
    tx: any,
    bookingId: string,
  ): Promise<{
    dispatchSequence: number;
    redispatchSequence: number;
  }> {
    const latest = await (tx as any).dispatchDecision.findFirst({
      where: { bookingId },
      orderBy: { dispatchSequence: "desc" },
    });
    return {
      dispatchSequence: latest ? latest.dispatchSequence + 1 : 1,
      redispatchSequence: latest?.redispatchSequence ?? 0,
    };
  }

  async releaseDispatchLock(bookingId: string, actor: unknown) {
    const adminId = actorUserId(actor);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        throw new BadRequestException("Booking not found");
      }

      const control = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
      });
      const be = evaluateBookingOpsEligibility(booking, control);
      if (!be.canReleaseDispatchLock) {
        throw new ConflictException(
          be.releaseDispatchLockDisabledReason ?? "dispatch_not_locked",
        );
      }

      const previousLock = booking.dispatchLockedAt!;

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          dispatchLockedAt: null,
        },
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminId,
          actorRole: "admin",
          type: "OPERATOR_RELEASE_DISPATCH_LOCK",
          summary: `Dispatch lock released for booking ${bookingId}.`,
          metadata: {
            previousLock: previousLock.toISOString(),
          },
        },
      });

      return {
        ok: true,
        action: "release_dispatch_lock",
        bookingId,
        status: "released",
        message: "Dispatch lock released",
      };
    });
  }

  async clearReviewRequired(bookingId: string, actor: unknown) {
    const adminId = actorUserId(actor);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({ where: { id: bookingId } });

      if (!booking) {
        throw new BadRequestException("Booking not found");
      }

      const control = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
      });

      const be = evaluateBookingOpsEligibility(booking, control);
      if (!be.canClearReviewRequired) {
        throw new ConflictException(
          be.clearReviewRequiredDisabledReason ??
            "clear_review_required_blocked",
        );
      }

      await tx.bookingDispatchControl.update({
        where: { bookingId },
        data: {
          reviewRequired: false,
          reviewCompletedAt: new Date(),
        },
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminId,
          actorRole: "admin",
          type: "OPERATOR_CLEAR_REVIEW_REQUIRED",
          summary: `Review requirement cleared for booking ${bookingId}.`,
          metadata: {},
        },
      });

      return {
        ok: true,
        action: "clear_review_required",
        bookingId,
        status: "cleared",
        message: "Review requirement cleared",
      };
    });
  }

  async triggerRedispatch(bookingId: string, actor: unknown) {
    const adminId = actorUserId(actor);

    return this.prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        throw new BadRequestException("Booking not found");
      }

      const control = await tx.bookingDispatchControl.findUnique({
        where: { bookingId },
      });
      const be = evaluateBookingOpsEligibility(booking, control);
      if (!be.canTriggerRedispatch) {
        throw new ConflictException(
          be.triggerRedispatchDisabledReason ?? "trigger_redispatch_blocked",
        );
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          dispatchLockedAt: null,
        },
      });

      const { dispatchSequence, redispatchSequence } =
        await this.getNextDispatchSequenceTx(tx, bookingId);

      const bookingSnapshot = bookingSnapshotFromBooking(booking);

      await (tx as any).dispatchDecision.create({
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
            reason: "operator trigger redispatch (system ops)",
            bookingStatusAtTime: booking.status,
            foIdAtTime: booking.foId ?? null,
            scheduledStartAtTime: booking.scheduledStart?.toISOString() ?? null,
            source: "OPERATOR_TRIGGER_REDISPATCH",
          },
        },
      });

      await tx.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: adminId,
          actorRole: "admin",
          type: "OPERATOR_TRIGGER_REDISPATCH",
          summary: `Manual redispatch queued for booking ${bookingId}.`,
          metadata: {
            dispatchSequence,
          },
        },
      });

      return {
        ok: true,
        action: "trigger_redispatch",
        bookingId,
        status: "queued",
        message: "Redispatch triggered",
      };
    });
  }

  async assignExceptionToMe(dispatchExceptionKey: string, actor: unknown) {
    const userId = actorUserId(actor);
    if (!userId || userId === "unknown") {
      throw new UnauthorizedException("AUTH_USER_REQUIRED");
    }

    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey },
      select: { status: true },
    });
    const ex = evaluateExceptionOpsEligibility(action);
    if (!ex.canAssignExceptionToMe) {
      throw new NotFoundException(
        ex.assignExceptionToMeDisabledReason ?? "exception_action_not_found",
      );
    }

    await this.exceptionActions.assignToMe({
      dispatchExceptionKey,
      actorUserId: userId,
    });

    const bookingId =
      parseBookingIdFromDispatchExceptionKey(dispatchExceptionKey) ?? "";
    if (bookingId) {
      await this.prisma.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: userId,
          actorRole: "admin",
          type: "OPERATOR_EXCEPTION_ASSIGN_TO_ME",
          summary: `Dispatch exception assigned from System Ops (${dispatchExceptionKey}).`,
          metadata: { dispatchExceptionKey, source: "system_ops" },
        },
      });
    }

    return {
      ok: true,
      action: "exception_assign_to_me",
      dispatchExceptionKey,
      bookingId: bookingId || undefined,
      status: "assigned",
      message: "Exception assigned to you",
    };
  }

  async resolveException(dispatchExceptionKey: string, actor: unknown) {
    const userId = actorUserId(actor);
    if (!userId || userId === "unknown") {
      throw new UnauthorizedException("AUTH_USER_REQUIRED");
    }

    const action = await this.prisma.dispatchExceptionAction.findUnique({
      where: { dispatchExceptionKey },
      select: { status: true },
    });
    const ex = evaluateExceptionOpsEligibility(action);
    if (!ex.canResolveException) {
      throw new BadRequestException(
        ex.resolveExceptionDisabledReason ?? "exception_resolve_blocked",
      );
    }

    await this.exceptionActions.updateStatus({
      dispatchExceptionKey,
      status: "resolved",
      actorUserId: userId,
    });

    const bookingId =
      parseBookingIdFromDispatchExceptionKey(dispatchExceptionKey) ?? "";
    if (bookingId) {
      await this.prisma.adminCommandCenterActivity.create({
        data: {
          bookingId,
          actorUserId: userId,
          actorRole: "admin",
          type: "OPERATOR_EXCEPTION_RESOLVED",
          summary: `Dispatch exception marked resolved from System Ops (${dispatchExceptionKey}).`,
          metadata: { dispatchExceptionKey, source: "system_ops" },
        },
      });
    }

    return {
      ok: true,
      action: "exception_resolve",
      dispatchExceptionKey,
      bookingId: bookingId || undefined,
      status: "resolved",
      message: "Exception marked resolved",
    };
  }
}
