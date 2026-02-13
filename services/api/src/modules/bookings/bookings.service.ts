import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
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

@Injectable()
export class BookingsService {
  constructor(
    private readonly db: PrismaService,
    private readonly events: BookingEventsService,
    private readonly fo: FoService,
    private readonly estimator: EstimatorService,
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
    const booking = await this.getBooking(args.id);

    if (args.idempotencyKey) {
      const exists = await this.events.findByIdempotencyKey(
        args.id,
        args.idempotencyKey,
      );
      if (exists) return booking;
    }

    let to: BookingStatus;
    try {
      to = getTransition(args.transition, booking.status).to;
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.startsWith("INVALID_TRANSITION:")
      ) {
        throw new ConflictException("INVALID_BOOKING_TRANSITION");
      }
      throw e;
    }

    return this.db.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: to },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.STATUS_CHANGED,
          fromStatus: booking.status,
          toStatus: to,
          note: args.note ?? null,
          idempotencyKey: args.idempotencyKey ?? null,
        },
      });

      return updated;
    });
  }

  async assignBooking(args: {
    id: string;
    foId: string;
    note?: string;
    idempotencyKey?: string | null;
  }) {
    const booking = await this.getBooking(args.id);

    if (args.idempotencyKey) {
      const exists = await this.events.findByIdempotencyKey(
        args.id,
        args.idempotencyKey,
      );
      if (exists) return booking;
    }

    // Only allow assigning when dispatch-ready
    let to: BookingStatus;
    try {
      to = getTransition("assign", booking.status).to;
    } catch (e: any) {
      if (
        typeof e?.message === "string" &&
        e.message.startsWith("INVALID_TRANSITION:")
      ) {
        throw new ConflictException("INVALID_BOOKING_TRANSITION");
      }
      throw e;
    }

    // Eligibility gate (active + no safety hold)
    const ok = await this.fo.getEligibility(args.foId);
    if (!(ok as any).canAcceptBooking) throw new ConflictException("FO_NOT_ELIGIBLE");

    return this.db.$transaction(async (tx: any) => {
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: { status: to, foId: args.foId },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.STATUS_CHANGED,
          fromStatus: booking.status,
          toStatus: to,
          note: args.note ?? null,
          idempotencyKey: args.idempotencyKey ?? null,
        },
      });

      return updated;
    });
  }
}
