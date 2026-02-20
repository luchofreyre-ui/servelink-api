import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { BookingEventType, BookingStatus } from "@prisma/client";
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

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: PrismaService,
    private readonly events: BookingEventsService,
    private readonly fo: FoService,
    private readonly estimator: EstimatorService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Create a booking shell (pending_payment).
   *
   * NOTE: Estimation is required infrastructure. We ALWAYS compute and store an immutable
   * BookingEstimateSnapshot at create-time when estimateInput is provided.
   *
   * Ops visibility flags do NOT block booking or estimation. They only affect post-booking review.
   */
  async createBooking(input: {
    customerId: string;
    note?: string;
    idempotencyKey?: string | null;

    // When provided, we compute and store estimator snapshot immutably.
    estimateInput?: EstimateInput;
  }): Promise<{
    booking: any;
    estimate?: EstimateResult;
  }> {
    return this.db.$transaction(async (tx: any) => {
      // Create shell booking first (id needed for snapshot linkage)
      const booking = await tx.booking.create({
        data: {
          status: BookingStatus.pending_payment,
          hourlyRateCents: 0,
          estimatedHours: 0,
          currency: "usd",
          customer: { connect: { id: input.customerId } },
          notes: input.note ?? null,
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

      let estimate: EstimateResult | undefined;

      if (input.estimateInput) {
        // Always compute estimate in real-time (non-blocking).
        estimate = this.estimator.estimate(input.estimateInput);

        // Store immutable snapshot (input + output) for auditability and consistency over time.
        await tx.bookingEstimateSnapshot.create({
          data: {
            bookingId: booking.id,
            estimatorVersion: estimate.estimatorVersion,
            mode: estimate.mode,
            confidence: estimate.confidence,

            riskPercentUncapped: estimate.riskPercentUncapped,
            riskPercentCappedForRange: estimate.riskPercentCappedForRange,
            riskCapped: estimate.riskCapped,

            inputJson: JSON.stringify(input.estimateInput),
            outputJson: JSON.stringify(estimate),
          },
        });

        // Optionally, set booking.estimatedHours if you want a convenient aggregate for downstream billing UI.
        // We keep it aligned to the single-point estimate (not upper bound, not uncapped scope).
        const estimatedHours = Math.round((estimate.estimateMinutes / 60) * 100) / 100;

        await tx.booking.update({
          where: { id: booking.id },
          data: {
            estimatedHours,
          },
        });
      }

      return { booking, estimate };
    });
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

  /**
   * Admin: set job site location (GPS billing foundation).
   */
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

  async transitionBooking(args: {
    id: string;
    transition: Transition;
    note?: string;
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

    try {
      const { result, prevStatus } = await this.db.$transaction(async (tx: any) => {
        const prevStatus = booking.status;
        const { count } = await tx.booking.updateMany({
          where: { id: booking.id, status: expectedCurrentStatus },
          data: { status: to },
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
        } else if (prevStatus === BookingStatus.completed && result.status !== BookingStatus.completed) {
          await this.ledger.reverseRevenueRecognitionForBooking({
            bookingId: result.id,
            currency: result.currency,
            idempotencyKey: idem,
          });
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

    // Eligibility gate (active + no safety hold)
    const ok = await this.fo.getEligibility(foId);
    if (!(ok as any).canAcceptBooking) throw new ConflictException("FO_NOT_ELIGIBLE");

    try {
      return await this.db.$transaction(async (tx: any) => {
        const { count } = await tx.booking.updateMany({
          where: { id: booking.id, status: expectedCurrentStatus },
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

          const updated = await tx.booking.findUnique({
            where: { id: booking.id },
          });
          return updated;
        }

        const refetched = await tx.booking.findUnique({
          where: { id: booking.id },
        });
        if (!refetched) throw new NotFoundException("BOOKING_NOT_FOUND");

        if (refetched.status === to) {
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
        if (refetched) return { ...refetched, alreadyApplied: true };
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
