import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  BookingEventType,
  BookingPaymentStatus,
  BookingStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../prisma";
import { BookingEventsService } from "./booking-events.service";
import { getTransition, Transition } from "./booking-state.machine";
import { FoService } from "../fo/fo.service";
import {
  EstimatorService,
  EstimateInput,
  EstimateResult,
} from "../estimate/estimator.service";
import { LedgerService } from "../ledger/ledger.service";
import { DispatchService } from "../dispatch/dispatch.service";
import { ReputationService } from "../dispatch/reputation.service";
import { SlotHoldMetrics } from "../slot-holds/slot-holds.metrics";
import { PricingService } from "../pricing/pricing.service";

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: PrismaService,
    private readonly events: BookingEventsService,
    private readonly fo: FoService,
    private readonly estimator: EstimatorService,
    private readonly ledger: LedgerService,
    private readonly dispatch: DispatchService,
    private readonly reputationService: ReputationService,
    private readonly pricingService: PricingService,
  ) {}

  async createBooking(input: {
    customerId: string;
    note?: string;
    idempotencyKey?: string | null;
    estimateInput?: EstimateInput;
  }): Promise<{
    booking: any;
    estimate?: EstimateResult;
  }> {
    const { bookingId, estimate } = await this.db.$transaction(async (tx: any) => {
      const siteLat =
        typeof input.estimateInput?.siteLat === "number" &&
        Number.isFinite(input.estimateInput.siteLat)
          ? input.estimateInput.siteLat
          : null;

      const siteLng =
        typeof input.estimateInput?.siteLng === "number" &&
        Number.isFinite(input.estimateInput.siteLng)
          ? input.estimateInput.siteLng
          : null;

      const booking = await tx.booking.create({
        data: {
          status: BookingStatus.pending_payment,
          hourlyRateCents: 0,
          estimatedHours: 0,
          currency: "usd",
          customer: { connect: { id: input.customerId } },
          notes: input.note ?? null,
          siteLat,
          siteLng,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.CREATED,
          fromStatus: null,
          toStatus: booking.status,
          note: input.note ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
        },
      });

      let est: EstimateResult | undefined;

      if (input.estimateInput) {
        est = await this.estimator.estimate(input.estimateInput);

        await tx.bookingEstimateSnapshot.create({
          data: {
            bookingId: booking.id,
            estimatorVersion: est.estimatorVersion,
            mode: est.mode,
            confidence: est.confidence,
            riskPercentUncapped: est.riskPercentUncapped,
            riskPercentCappedForRange: est.riskPercentCappedForRange,
            riskCapped: est.riskCapped,
            inputJson: JSON.stringify(input.estimateInput),
            outputJson: JSON.stringify(est),
          },
        });

        const estimatedHours =
          Math.round((est.estimateMinutes / 60) * 100) / 100;

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            estimatedHours,
          },
        });
      }

      return { bookingId: booking.id, estimate: est };
    });

    if (input.estimateInput && estimate) {
      const quote = this.pricingService.calculateQuote({
        basePrice: 100,
        estimatedDurationMinutes: estimate.estimateMinutes,
      });
      await this.db.booking.update({
        where: { id: bookingId },
        data: {
          priceSubtotal: quote.subtotal,
          priceTotal: quote.total,
          margin: quote.margin,
          paymentStatus: BookingPaymentStatus.quote_ready,
          quotedSubtotal: new Prisma.Decimal(quote.subtotal.toFixed(2)),
          quotedMargin: new Prisma.Decimal(quote.margin.toFixed(2)),
          quotedTotal: new Prisma.Decimal(quote.total.toFixed(2)),
        },
      });
    }

    const refreshed = await this.db.booking.findUnique({
      where: { id: bookingId },
    });

    return { booking: refreshed, estimate };
  }

  async getBooking(id: string) {
    const booking = await this.db.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");
    return booking;
  }

  async getEvents(id: string) {
    await this.getBooking(id);
    return this.db.bookingEvent.findMany({
      where: { bookingId: id },
      orderBy: { createdAt: "asc" },
    });
  }

  async setSiteLocation(args: {
    id: string;
    siteLat: number;
    siteLng: number;
    geofenceRadiusMeters?: number;
  }) {
    const booking = await this.getBooking(args.id);

    const radius =
      typeof args.geofenceRadiusMeters === "number" &&
      Number.isFinite(args.geofenceRadiusMeters) &&
      args.geofenceRadiusMeters > 0
        ? Math.floor(args.geofenceRadiusMeters)
        : (booking as any).geofenceRadiusMeters ?? 100;

    return this.db.booking.update({
      where: { id: booking.id },
      data: {
        siteLat: args.siteLat,
        siteLng: args.siteLng,
        geofenceRadiusMeters: radius,
      } as any,
    });
  }

  private async assertFoAvailableForWindow(args: {
    bookingId: string;
    foId: string;
    scheduledStart: Date | string;
    estimatedHours: number | null | undefined;
  }) {
    const requestedStart = new Date(args.scheduledStart);
    const requestedEstimatedHours = Number(args.estimatedHours ?? 0);

    if (!Number.isFinite(requestedStart.getTime())) {
      throw new BadRequestException("BOOKING_SCHEDULED_START_INVALID");
    }

    if (!(requestedEstimatedHours > 0)) {
      throw new ConflictException(
        "BOOKING_ESTIMATED_HOURS_REQUIRED_FOR_AVAILABILITY_CHECK",
      );
    }

    const requestedEnd = new Date(
      requestedStart.getTime() + requestedEstimatedHours * 60 * 60 * 1000,
    );

    const existingBookings = await this.db.booking.findMany({
      where: {
        id: { not: args.bookingId },
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

    const conflicting = existingBookings.find((existing) => {
      if (!existing.scheduledStart) return false;

      const existingStart = new Date(existing.scheduledStart);
      const existingEstimatedHours = Number(existing.estimatedHours ?? 0);

      if (!Number.isFinite(existingStart.getTime())) return false;
      if (!(existingEstimatedHours > 0)) return false;

      const existingEnd = new Date(
        existingStart.getTime() + existingEstimatedHours * 60 * 60 * 1000,
      );

      return requestedStart < existingEnd && existingStart < requestedEnd;
    });

    if (conflicting) {
      throw new ConflictException("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");
    }
  }

  async confirmBookingFromHold(args: {
    bookingId: string;
    holdId: string;
    note?: string;
    idempotencyKey?: string | null;
  }) {
    try {
      return await this.db.$transaction(async (tx: any) => {
        const current = await tx.booking.findUnique({
          where: { id: args.bookingId },
        });

        if (!current) {
          throw new NotFoundException("BOOKING_NOT_FOUND");
        }

        const idem = args.idempotencyKey ?? null;

        if (idem) {
          const existingEvent = await tx.bookingEvent.findFirst({
            where: {
              bookingId: current.id,
              idempotencyKey: idem,
              type: BookingEventType.STATUS_CHANGED,
              fromStatus: BookingStatus.pending_payment,
              toStatus: BookingStatus.assigned,
            },
            select: { id: true },
          });

          if (existingEvent) {
            return { ...current, alreadyApplied: true };
          }
        }

        const hold = await tx.bookingSlotHold.findUnique({
          where: { id: args.holdId },
        });

        if (!hold) {
          throw new NotFoundException("BOOKING_SLOT_HOLD_NOT_FOUND");
        }

        if (hold.expiresAt.getTime() <= Date.now()) {
          throw new ConflictException("BOOKING_SLOT_HOLD_EXPIRED");
        }

        const estimatedHours = Number(current.estimatedHours ?? 0);
        if (!(estimatedHours > 0)) {
          throw new ConflictException(
            "BOOKING_ESTIMATED_HOURS_REQUIRED_FOR_CONFIRMATION",
          );
        }

        if (current.status !== BookingStatus.pending_payment) {
          if (
            current.status === BookingStatus.assigned &&
            current.foId === hold.foId &&
            current.scheduledStart &&
            new Date(current.scheduledStart).getTime() === hold.startAt.getTime()
          ) {
            return { ...current, alreadyApplied: true };
          }

          throw new ConflictException("BOOKING_CONFIRMATION_STATE_INVALID");
        }

        const holdDurationMinutes = Math.round(
          (hold.endAt.getTime() - hold.startAt.getTime()) / (60 * 1000),
        );
        const bookingDurationMinutes = Math.round(estimatedHours * 60);

        if (holdDurationMinutes !== bookingDurationMinutes) {
          throw new ConflictException("BOOKING_SLOT_HOLD_DURATION_MISMATCH");
        }

        const foEligibility = await this.fo.getEligibility(hold.foId);
        if (!foEligibility.canAcceptBooking) {
          throw new ConflictException("FO_NOT_ELIGIBLE");
        }

        const requestedStart = new Date(hold.startAt);
        const requestedEnd = new Date(hold.endAt);

        const existingBookings = await tx.booking.findMany({
          where: {
            id: { not: current.id },
            foId: hold.foId,
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

        const conflicting = existingBookings.find((existing: any) => {
          if (!existing.scheduledStart) return false;

          const existingStart = new Date(existing.scheduledStart);
          const existingEstimatedHours = Number(existing.estimatedHours ?? 0);

          if (!Number.isFinite(existingStart.getTime())) return false;
          if (!(existingEstimatedHours > 0)) return false;

          const existingEnd = new Date(
            existingStart.getTime() + existingEstimatedHours * 60 * 60 * 1000,
          );

          return requestedStart < existingEnd && existingStart < requestedEnd;
        });

        if (conflicting) {
          throw new ConflictException("FO_NOT_AVAILABLE_AT_SCHEDULED_TIME");
        }

        const otherBookings = await tx.booking.findMany({
          where: {
            id: { not: current.id },
            foId: hold.foId,
            status: {
              in: [BookingStatus.assigned, BookingStatus.in_progress],
            },
            scheduledStart: {
              not: null,
              lt: hold.endAt,
            },
          },
          select: {
            id: true,
            scheduledStart: true,
            estimatedHours: true,
          },
        });

        const conflict = otherBookings.find((b: { scheduledStart: Date | null; estimatedHours: number | null }) => {
          if (b.scheduledStart == null || b.estimatedHours == null) return false;
          const end = new Date(
            new Date(b.scheduledStart).getTime() +
              Number(b.estimatedHours) * 60 * 60 * 1000,
          );
          return end > hold.startAt;
        });

        if (conflict) {
          throw new ConflictException("FO_SLOT_ALREADY_BOOKED");
        }

        const { count } = await tx.booking.updateMany({
          where: {
            id: current.id,
            status: BookingStatus.pending_payment,
          },
          data: {
            status: BookingStatus.assigned,
            foId: hold.foId,
            scheduledStart: hold.startAt,
          },
        });

        if (count !== 1) {
          const refetched = await tx.booking.findUnique({
            where: { id: current.id },
          });

          if (
            refetched &&
            refetched.status === BookingStatus.assigned &&
            refetched.foId === hold.foId &&
            refetched.scheduledStart &&
            new Date(refetched.scheduledStart).getTime() === hold.startAt.getTime()
          ) {
            return { ...refetched, alreadyApplied: true };
          }

          throw new ConflictException({
            code: "CONFLICT",
            message: "Booking was modified by another request",
          });
        }

        try {
          await tx.bookingEvent.create({
            data: {
              bookingId: current.id,
              type: BookingEventType.STATUS_CHANGED,
              fromStatus: BookingStatus.pending_payment,
              toStatus: BookingStatus.assigned,
              note: args.note ?? null,
              idempotencyKey: idem,
            },
          });
        } catch (e: any) {
          if (e?.code === "P2002") {
            throw new IdempotencyReplayError(current.id);
          }
          throw e;
        }

        await tx.bookingSlotHold.delete({
          where: { id: hold.id },
        });

        const updated = await tx.booking.findUnique({
          where: { id: current.id },
        });

        SlotHoldMetrics.confirmed++;
        return updated;
      });
    } catch (e: any) {
      if (e instanceof IdempotencyReplayError) {
        const refetched = await this.db.booking.findUnique({
          where: { id: e.bookingId },
        });
        if (refetched) {
          SlotHoldMetrics.confirmed++;
          return { ...refetched, alreadyApplied: true };
        }
      }
      throw e;
    }
  }

  async transitionBooking(args: {
    id: string;
    transition: Transition;
    note?: string;
    scheduledStart?: string;
    idempotencyKey?: string | null;
  }) {
    const revRecEnabled = process.env.LEDGER_REVREC_ENABLED !== "0";

    const booking = await this.getBooking(args.id);

    const expectedCurrentStatus = booking.status;
    let to: BookingStatus;
    try {
      to = getTransition(args.transition, expectedCurrentStatus).to;
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.startsWith("INVALID_TRANSITION:")
      ) {
        throw new ConflictException({
          code: "INVALID_TRANSITION",
          message: "Invalid booking transition for current status",
        });
      }
      throw e;
    }

    if (booking.foId && args.scheduledStart) {
      await this.assertFoAvailableForWindow({
        bookingId: booking.id,
        foId: booking.foId,
        scheduledStart: args.scheduledStart,
        estimatedHours: booking.estimatedHours,
      });
    }

    try {
      const { result, prevStatus } = await this.db.$transaction(async (tx: any) => {
        const prevStatus = booking.status;
        const { count } = await tx.booking.updateMany({
          where: { id: booking.id, status: expectedCurrentStatus },
          data: {
            status: to,
            ...(args.scheduledStart
              ? { scheduledStart: new Date(args.scheduledStart) }
              : {}),
          },
        });

        if (count === 1) {
          try {
            await tx.bookingEvent.create({
              data: {
                bookingId: booking.id,
                type: BookingEventType.STATUS_CHANGED,
                fromStatus: expectedCurrentStatus,
                toStatus: to,
                note: args.note ?? null,
                idempotencyKey: args.idempotencyKey ?? null,
              },
            });
          } catch (e: any) {
            if (e?.code === "P2002") {
              throw new IdempotencyReplayError(booking.id);
            }
            throw e;
          }

          const updated = await tx.booking.findUnique({
            where: { id: booking.id },
          });
          return { result: updated, prevStatus };
        }

        const refetched = await tx.booking.findUnique({
          where: { id: booking.id },
        });
        if (!refetched) throw new NotFoundException("BOOKING_NOT_FOUND");

        if (refetched.status === to) {
          return { result: { ...refetched, alreadyApplied: true }, prevStatus };
        }

        throw new ConflictException({
          code: "CONFLICT",
          message: "Booking was modified by another request",
        });
      });

      if (!result.currency) {
        throw new Error(`Booking currency missing for bookingId=${result.id}`);
      }
      if (revRecEnabled) {
        const idem = args.idempotencyKey ?? null;

        if (
          result.status === BookingStatus.completed &&
          prevStatus !== BookingStatus.completed
        ) {
          await this.ledger.recognizeRevenueForBooking({
            bookingId: result.id,
            currency: result.currency,
            idempotencyKey: idem,
          });
        } else if (
          prevStatus === BookingStatus.completed &&
          result.status !== BookingStatus.completed
        ) {
          await this.ledger.reverseRevenueRecognitionForBooking({
            bookingId: result.id,
            currency: result.currency,
            idempotencyKey: idem,
          });
        }
      }

      if (
        result.status === BookingStatus.pending_dispatch &&
        prevStatus !== BookingStatus.pending_dispatch
      ) {
        try {
          await this.dispatch.startDispatch(result.id);
        } catch (err) {
          console.error("DISPATCH_START_FAILED", {
            bookingId: result.id,
            error: err,
          });
        }
      }

      if (
        result.status === BookingStatus.in_progress &&
        prevStatus !== BookingStatus.in_progress &&
        result.foId
      ) {
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: result.foId },
          create: {
            foId: result.foId,
            inProgressCount: 1,
            activeAssignedCount: 0,
            activeInProgressCount: 1,
          },
          update: {
            inProgressCount: { increment: 1 },
            activeAssignedCount: { decrement: 1 },
            activeInProgressCount: { increment: 1 },
          },
        });
      }

      if (
        result.status === BookingStatus.completed &&
        prevStatus !== BookingStatus.completed &&
        result.foId
      ) {
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: result.foId },
          create: {
            foId: result.foId,
            completionsCount: 1,
            activeInProgressCount: 0,
          },
          update: {
            completionsCount: { increment: 1 },
            activeInProgressCount: { decrement: 1 },
          },
        });
        await this.db.franchiseOwner.update({
          where: { id: result.foId },
          data: {
            completedJobsCount: { increment: 1 },
          },
        });
        if (result.foId) {
          void this.reputationService.recomputeForFoSafe(result.foId);
        }
      }

      if (
        result.status === BookingStatus.canceled &&
        prevStatus !== BookingStatus.canceled &&
        result.foId
      ) {
        const cancelFromAssigned = prevStatus === BookingStatus.assigned;
        const cancelFromInProgress = prevStatus === BookingStatus.in_progress;
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: result.foId },
          create: {
            foId: result.foId,
            cancellationsCount: 1,
          },
          update: {
            cancellationsCount: { increment: 1 },
            ...(cancelFromAssigned && { activeAssignedCount: { decrement: 1 } }),
            ...(cancelFromInProgress && { activeInProgressCount: { decrement: 1 } }),
          },
        });
        if (result.foId) {
          void this.reputationService.recomputeForFoSafe(result.foId);
        }
      }

      return result;
    } catch (e: any) {
      if (e instanceof IdempotencyReplayError) {
        const refetched = await this.db.booking.findUnique({
          where: { id: e.bookingId },
        });
        if (refetched) return { ...refetched, alreadyApplied: true };
      }
      throw e;
    }
  }

  async assignBooking(params: {
    bookingId: string;
    foId: string;
    note?: string;
    idempotencyKey?: string | null;
  }) {
    const foId = params.foId != null ? String(params.foId).trim() : "";
    if (!foId) {
      throw new BadRequestException("foId is required");
    }

    const booking = await this.getBooking(params.bookingId);

    const expectedCurrentStatus = booking.status;
    let to: BookingStatus;
    try {
      to = getTransition("assign", expectedCurrentStatus).to;
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.startsWith("INVALID_TRANSITION:")
      ) {
        throw new ConflictException({
          code: "INVALID_TRANSITION",
          message: "Invalid booking transition for current status",
        });
      }
      throw e;
    }

    const isAssigned = booking.status === BookingStatus.assigned;
    const currentFoId = booking.foId ?? null;

    if (isAssigned && currentFoId === foId) {
      return { ...booking, alreadyApplied: true };
    }

    const ok = await this.fo.getEligibility(foId);
    if (!(ok as any).canAcceptBooking) {
      throw new ConflictException("FO_NOT_ELIGIBLE");
    }

    if (booking.scheduledStart) {
      await this.assertFoAvailableForWindow({
        bookingId: booking.id,
        foId,
        scheduledStart: booking.scheduledStart,
        estimatedHours: booking.estimatedHours,
      });
    }

    try {
      return await this.db.$transaction(async (tx: any) => {
        const where: any = {
          id: booking.id,
          status: expectedCurrentStatus,
        };

        if (expectedCurrentStatus === BookingStatus.assigned) {
          where.foId = currentFoId;
        }

        const { count } = await tx.booking.updateMany({
          where,
          data: { status: to, foId },
        });

        if (count === 1) {
          try {
            await tx.bookingEvent.create({
              data: {
                bookingId: booking.id,
                type: BookingEventType.STATUS_CHANGED,
                fromStatus: expectedCurrentStatus,
                toStatus: to,
                note: params.note ?? null,
                idempotencyKey: params.idempotencyKey ?? null,
              },
            });
          } catch (e: any) {
            if (e?.code === "P2002") {
              throw new IdempotencyReplayError(booking.id);
            }
            throw e;
          }

          if (
            expectedCurrentStatus === BookingStatus.assigned &&
            currentFoId != null &&
            currentFoId !== foId
          ) {
            await tx.franchiseOwnerReliabilityStats.upsert({
              where: { foId: currentFoId },
              create: {
                foId: currentFoId,
                activeAssignedCount: 0,
              },
              update: {
                activeAssignedCount: { decrement: 1 },
              },
            });
            await tx.franchiseOwnerReliabilityStats.upsert({
              where: { foId },
              create: {
                foId,
                assignmentsCount: 1,
                activeAssignedCount: 1,
              },
              update: {
                assignmentsCount: { increment: 1 },
                activeAssignedCount: { increment: 1 },
              },
            });
          }

          const updated = await tx.booking.findUnique({
            where: { id: booking.id },
          });
          return updated;
        }

        const refetched = await tx.booking.findUnique({
          where: { id: booking.id },
        });
        if (!refetched) {
          throw new NotFoundException("BOOKING_NOT_FOUND");
        }

        if (refetched.status === to && refetched.foId === foId) {
          return { ...refetched, alreadyApplied: true };
        }

        throw new ConflictException({
          code: "CONFLICT",
          message: "Booking was modified by another request",
        });
      });
    } catch (e: any) {
      if (e instanceof IdempotencyReplayError) {
        const refetched = await this.db.booking.findUnique({
          where: { id: e.bookingId },
        });
        if (refetched) {
          return { ...refetched, alreadyApplied: true };
        }
      }
      throw e;
    }
  }
}

class IdempotencyReplayError extends Error {
  constructor(public readonly bookingId: string) {
    super("IDEMPOTENCY_REPLAY");
    this.name = "IdempotencyReplayError";
  }
}
