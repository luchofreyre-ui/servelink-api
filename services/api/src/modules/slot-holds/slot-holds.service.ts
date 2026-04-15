import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { FoService } from "../fo/fo.service";
import { SlotAvailabilityCache } from "./slot-availability.cache";
import { SlotHoldMetrics } from "./slot-holds.metrics";

type CreateHoldArgs = {
  bookingId: string;
  foId: string;
  startAt: string | Date;
  endAt: string | Date;
  /** When present and role is `customer`, booking must belong to this user id. */
  actorUserId?: string;
  actorRole?: string;
};

type ValidateHoldArgs = {
  holdId: string;
};

type ReleaseHoldArgs = {
  holdId: string;
};

@Injectable()
export class SlotHoldsService {
  static readonly HOLD_SECONDS = 60;

  constructor(
    private readonly db: PrismaService,
    private readonly fo: FoService,
  ) {}

  private toDate(value: Date | string, code: string): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (!Number.isFinite(date.getTime())) {
      throw new BadRequestException(code);
    }

    return date;
  }

  private assertWindow(startAt: Date, endAt: Date) {
    if (!(endAt.getTime() > startAt.getTime())) {
      throw new BadRequestException("BOOKING_SLOT_WINDOW_INVALID");
    }
  }

  private windowsOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return aStart < bEnd && bStart < aEnd;
  }

  private async assertNoBookingConflict(
    tx: Prisma.TransactionClient,
    args: {
      foId: string;
      startAt: Date;
      endAt: Date;
    },
  ) {
    const existingBookings = await tx.booking.findMany({
      where: {
        foId: args.foId,
        scheduledStart: { not: null },
        status: {
          in: [
            BookingStatus.pending_dispatch,
            BookingStatus.offered,
            BookingStatus.assigned,
            BookingStatus.in_progress,
          ],
        },
      },
      select: {
        id: true,
        scheduledStart: true,
        estimatedHours: true,
      },
    });

    const conflictingBooking = existingBookings.find((booking) => {
      if (!booking.scheduledStart) return false;

      const bookingStart = new Date(booking.scheduledStart);
      const estimatedHours = Number(booking.estimatedHours ?? 0);

      if (!Number.isFinite(bookingStart.getTime())) return false;
      if (!(estimatedHours > 0)) return false;

      const bookingEnd = new Date(
        bookingStart.getTime() + estimatedHours * 60 * 60 * 1000,
      );

      return this.windowsOverlap(
        args.startAt,
        args.endAt,
        bookingStart,
        bookingEnd,
      );
    });

    if (conflictingBooking) {
      throw new ConflictException("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");
    }
  }

  private isHoldOverlapError(err: any): boolean {
    const message = String(err?.message ?? "");
    const metaTarget = Array.isArray(err?.meta?.target)
      ? err.meta.target.join(",")
      : String(err?.meta?.target ?? "");
    const code = String(err?.code ?? "");
    const causeCode = String(err?.cause?.code ?? "");
    const constraint = String(
      err?.meta?.constraint ??
        err?.cause?.constraint ??
        err?.constraint ??
        "",
    );

    return (
      code === "23P01" ||
      causeCode === "23P01" ||
      constraint.includes("BookingSlotHold_no_overlap_per_fo") ||
      metaTarget.includes("BookingSlotHold_no_overlap_per_fo") ||
      message.includes("BookingSlotHold_no_overlap_per_fo") ||
      message.includes("violates exclusion constraint")
    );
  }

  async createHold(args: CreateHoldArgs) {
    const booking = await this.db.booking.findUnique({
      where: { id: args.bookingId },
      select: {
        id: true,
        customerId: true,
        status: true,
        estimatedHours: true,
      },
    });
    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }
    if (booking.status !== BookingStatus.pending_payment) {
      throw new ConflictException("BOOKING_SLOT_HOLD_BOOKING_STATE_INVALID");
    }
    const hours = Number(booking.estimatedHours ?? 0);
    if (!(hours > 0)) {
      throw new ConflictException("BOOKING_ESTIMATED_HOURS_REQUIRED_FOR_HOLD");
    }
    const actorRole = String(args.actorRole ?? "").trim().toLowerCase();
    const actorUserId = String(args.actorUserId ?? "").trim();
    if (actorRole === "customer" && actorUserId && booking.customerId !== actorUserId) {
      throw new ForbiddenException("BOOKING_CUSTOMER_MISMATCH");
    }

    const startAt = this.toDate(args.startAt, "BOOKING_SLOT_START_INVALID");
    const endAt = this.toDate(args.endAt, "BOOKING_SLOT_END_INVALID");

    this.assertWindow(startAt, endAt);

    const eligibility = await this.fo.getEligibility(args.foId);

    if (!eligibility.canAcceptBooking) {
      throw new ConflictException("FO_NOT_ELIGIBLE");
    }

    const expiresAt = new Date(
      Date.now() + SlotHoldsService.HOLD_SECONDS * 1000,
    );

    try {
      return await this.db.$transaction(async (tx) => {
        await tx.bookingSlotHold.deleteMany({
          where: {
            expiresAt: { lte: new Date() },
          },
        });

        await this.assertNoBookingConflict(tx, {
          foId: args.foId,
          startAt,
          endAt,
        });

        const hold = await tx.bookingSlotHold.create({
          data: {
            bookingId: args.bookingId,
            foId: args.foId,
            startAt,
            endAt,
            expiresAt,
          },
        });

        SlotHoldMetrics.created++;
        return hold;
      });
    } catch (err: any) {
      if (err instanceof ConflictException) {
        throw err;
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError ||
        err instanceof Prisma.PrismaClientUnknownRequestError ||
        typeof err?.code === "string" ||
        this.isHoldOverlapError(err)
      ) {
        if (this.isHoldOverlapError(err)) {
          SlotHoldMetrics.conflicts++;
          throw new ConflictException("FO_SLOT_ALREADY_HELD");
        }
      }

      throw err;
    }
  }

  async validateHold(args: ValidateHoldArgs) {
    const hold = await this.db.bookingSlotHold.findUnique({
      where: { id: args.holdId },
    });

    if (!hold) {
      throw new NotFoundException("BOOKING_SLOT_HOLD_NOT_FOUND");
    }

    if (hold.expiresAt.getTime() <= Date.now()) {
      throw new ConflictException("BOOKING_SLOT_HOLD_EXPIRED");
    }

    return hold;
  }

  async releaseHold(args: ReleaseHoldArgs) {
    const hold = await this.db.bookingSlotHold.findUnique({
      where: { id: args.holdId },
      select: { id: true, foId: true },
    });

    if (!hold) {
      return { deleted: false };
    }

    await this.db.bookingSlotHold.delete({
      where: { id: args.holdId },
    });

    SlotAvailabilityCache.invalidateByFo(hold.foId);
    return { deleted: true };
  }

  async cleanupExpired() {
    const result = await this.db.bookingSlotHold.deleteMany({
      where: {
        expiresAt: { lte: new Date() },
      },
    });

    return {
      deletedCount: result.count,
    };
  }
}
