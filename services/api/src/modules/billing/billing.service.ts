import { Injectable, NotFoundException } from "@nestjs/common";
import { BillingSession, BookingEventType } from "@prisma/client";

import { PrismaService } from "../../prisma";
import { isInsideGeofence } from "../../utils/geo";

type PricingPolicy = {
  hourlyRateCents: number; // e.g. 6500
  billingIncrementMinutes: number; // e.g. 15
  graceSeconds: number; // locked: 15 minutes
};

@Injectable()
export class BillingService {
  constructor(private readonly db: PrismaService) {}

  /**
   * Reads current pricing policy. For now we hardcode from PricingController.
   * Later: replace with Config/pricing table.
   */
  getPricingPolicy(): PricingPolicy {
    return {
      hourlyRateCents: 6500,
      billingIncrementMinutes: 15,
      graceSeconds: 15 * 60, // ✅ LOCKED: 15 minutes
    };
  }

  /**
   * Emit immutable NOTE events to BookingEvent ledger.
   * Uses deterministic idempotencyKey to prevent duplicates.
   */
  private async emitNoteEvent(args: {
    bookingId: string;
    idempotencyKey: string;
    note: string;
  }): Promise<void> {
    try {
      await this.db.bookingEvent.create({
        data: {
          bookingId: args.bookingId,
          type: BookingEventType.NOTE,
          note: args.note,
          idempotencyKey: args.idempotencyKey,
        },
      });
    } catch (err: any) {
      // Prisma unique violation => already emitted; ignore
      if (err?.code === "P2002") return;
      throw err;
    }
  }

  /**
   * Compute billable minutes/cents deterministically from duration seconds.
   * Integer math only.
   */
  computeBillable(args: {
    durationSec: number;
    hourlyRateCents: number;
    billingIncrementMinutes: number;
  }): { billableMin: number; billableCents: number } {
    const durationMin = Math.max(0, Math.ceil(args.durationSec / 60));
    const inc = Math.max(1, Math.floor(args.billingIncrementMinutes));

    // round up to nearest increment
    const billableMin = Math.ceil(durationMin / inc) * inc;

    // cents per minute = hourlyRateCents / 60
    // keep integer math; round half-up by adding 30 before division
    const centsPerMinuteTimes60 = args.hourlyRateCents; // cents per 60 minutes
    const billableCents = Math.floor((billableMin * centsPerMinuteTimes60 + 30) / 60);

    return { billableMin, billableCents };
  }

  /**
   * Returns the open BillingSession for booking, if present.
   * Invariant: at most one open session per booking.
   */
  async getOpenSession(args: { bookingId: string }): Promise<BillingSession | null> {
    return this.db.billingSession.findFirst({
      where: { bookingId: args.bookingId, endedAt: null },
      orderBy: { startedAt: "desc" },
    });
  }

  async startSession(args: { bookingId: string; foId: string; startedAt: Date }) {
    const existing = await this.getOpenSession({ bookingId: args.bookingId });
    if (existing) return existing;

    return this.db.billingSession.create({
      data: {
        bookingId: args.bookingId,
        foId: args.foId,
        startedAt: args.startedAt,

        // Grace fields
        firstExitAt: null,
        graceExpiresAt: null,
        graceNotifiedAt: null,
        outsideSinceAt: null,

        // Legacy field (keep null)
        pendingExitAt: null,
      } as any,
    });
  }

  /**
   * Close a BillingSession and freeze derived billing fields.
   */
  async endSession(args: { sessionId: string; endedAt: Date }) {
    const policy = this.getPricingPolicy();

    const session = await this.db.billingSession.findUnique({
      where: { id: args.sessionId },
    });
    if (!session) throw new NotFoundException("BILLING_SESSION_NOT_FOUND");
    if (session.endedAt) return session;

    const durationSec = Math.max(
      0,
      Math.floor((args.endedAt.getTime() - session.startedAt.getTime()) / 1000),
    );

    const { billableMin, billableCents } = this.computeBillable({
      durationSec,
      hourlyRateCents: policy.hourlyRateCents,
      billingIncrementMinutes: policy.billingIncrementMinutes,
    });

    return this.db.billingSession.update({
      where: { id: session.id },
      data: {
        endedAt: args.endedAt,
        durationSec,
        billableMin,
        billableCents,

        // Clear grace fields
        firstExitAt: null,
        graceExpiresAt: null,
        graceNotifiedAt: null,
        outsideSinceAt: null,

        // Clear legacy field too
        pendingExitAt: null,
      } as any,
    });
  }

  /**
   * Consume one GPS ping and reconcile billing sessions.
   *
   * Locked rules:
   * - Billing continues up to 15 minutes after leaving geofence.
   * - If still outside after grace expires: session ends at grace expiry and FO must request admin time adjustment.
   * - If FO returns inside before grace expiry: grace clears and billing continues uninterrupted.
   *
   * We end at graceExpiresAt (not capturedAt) to prevent billing inflation when ping cadence is sparse.
   */
  async reconcileFromPing(args: {
    bookingId: string;
    foId: string;
    pingLat: number;
    pingLng: number;
    accuracyM?: number | null;
    capturedAt: Date;
  }): Promise<{
    inside: boolean;
    action:
      | "noop"
      | "started"
      | "grace_started"
      | "grace_cleared"
      | "grace_expired_ended";
    grace: {
      active: boolean;
      firstExitAt: string | null;
      graceExpiresAt: string | null;
    };
    actionRequired: null | {
      type: "FO_REQUEST_ADMIN_TIME_ADJUSTMENT";
      bookingId: string;
      sessionId: string;
      endedAt: string;
    };
  }> {
    const booking = await this.db.booking.findUnique({ where: { id: args.bookingId } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const noGrace = { active: false, firstExitAt: null, graceExpiresAt: null };

    // FO mismatch: do nothing (TelemetryController should already prevent this)
    if (booking.foId !== args.foId) {
      return { inside: false, action: "noop", grace: noGrace, actionRequired: null };
    }

    const siteLat = (booking as any).siteLat as number | null;
    const siteLng = (booking as any).siteLng as number | null;
    const radius = (booking as any).geofenceRadiusMeters as number | null;

    if (
      typeof siteLat !== "number" ||
      typeof siteLng !== "number" ||
      typeof radius !== "number" ||
      !Number.isFinite(siteLat) ||
      !Number.isFinite(siteLng) ||
      !Number.isFinite(radius)
    ) {
      return { inside: false, action: "noop", grace: noGrace, actionRequired: null };
    }

    const geo = isInsideGeofence({
      pingLat: args.pingLat,
      pingLng: args.pingLng,
      siteLat,
      siteLng,
      radiusMeters: radius,
      accuracyMeters: typeof args.accuracyM === "number" ? args.accuracyM : undefined,
    });

    const policy = this.getPricingPolicy();
    const graceMs = Math.max(0, Math.floor(policy.graceSeconds * 1000));

    const open = await this.getOpenSession({ bookingId: booking.id });

    const graceStateFromSession = (s: any) => {
      const firstExitAt = (s?.firstExitAt as Date | null) ?? null;
      const graceExpiresAt = (s?.graceExpiresAt as Date | null) ?? null;
      return {
        active: !!graceExpiresAt && !s?.endedAt,
        firstExitAt: firstExitAt ? firstExitAt.toISOString() : null,
        graceExpiresAt: graceExpiresAt ? graceExpiresAt.toISOString() : null,
      };
    };

    if (geo.inside) {
      if (!open) {
        await this.startSession({
          bookingId: booking.id,
          foId: args.foId,
          startedAt: args.capturedAt,
        });
        return { inside: true, action: "started", grace: noGrace, actionRequired: null };
      }

      // If we were in grace, clear it (billing continues uninterrupted)
      if ((open as any).graceExpiresAt) {
        const sessionId = open.id;

        await this.db.billingSession.update({
          where: { id: sessionId },
          data: {
            firstExitAt: null,
            graceExpiresAt: null,
            graceNotifiedAt: null,
            outsideSinceAt: null,
            pendingExitAt: null, // legacy
          } as any,
        });

        await this.emitNoteEvent({
          bookingId: booking.id,
          idempotencyKey: `billing:grace_cleared:${sessionId}`,
          note: "billing_grace_cleared",
        });

        return { inside: true, action: "grace_cleared", grace: noGrace, actionRequired: null };
      }

      return { inside: true, action: "noop", grace: noGrace, actionRequired: null };
    }

    // Outside geofence
    if (!open) {
      // No open session; do not start billing while outside
      return { inside: false, action: "noop", grace: noGrace, actionRequired: null };
    }

    const sessionId = open.id;
    const firstExitAt = ((open as any).firstExitAt as Date | null) ?? null;
    const graceExpiresAt = ((open as any).graceExpiresAt as Date | null) ?? null;

    // Start grace if not already started
    if (!graceExpiresAt) {
      const computedFirstExitAt = firstExitAt ?? args.capturedAt;
      const computedGraceExpiresAt = new Date(computedFirstExitAt.getTime() + graceMs);

      await this.db.billingSession.update({
        where: { id: sessionId },
        data: {
          firstExitAt: computedFirstExitAt,
          outsideSinceAt: computedFirstExitAt,
          graceExpiresAt: computedGraceExpiresAt,
          graceNotifiedAt: args.capturedAt,
          pendingExitAt: null, // legacy stays null
        } as any,
      });

      await this.emitNoteEvent({
        bookingId: booking.id,
        idempotencyKey: `billing:grace_started:${sessionId}:${computedFirstExitAt.toISOString()}`,
        note: "billing_grace_started",
      });

      return {
        inside: false,
        action: "grace_started",
        grace: {
          active: true,
          firstExitAt: computedFirstExitAt.toISOString(),
          graceExpiresAt: computedGraceExpiresAt.toISOString(),
        },
        actionRequired: null,
      };
    }

    // Grace already active — if expired, end session at grace expiry
    if (args.capturedAt.getTime() >= graceExpiresAt.getTime()) {
      await this.endSession({ sessionId, endedAt: graceExpiresAt });

      await this.emitNoteEvent({
        bookingId: booking.id,
        idempotencyKey: `billing:grace_expired_ended:${sessionId}:${graceExpiresAt.toISOString()}`,
        note: "billing_grace_expired_ended",
      });

      return {
        inside: false,
        action: "grace_expired_ended",
        grace: {
          active: false,
          firstExitAt: firstExitAt ? firstExitAt.toISOString() : null,
          graceExpiresAt: graceExpiresAt.toISOString(),
        },
        actionRequired: {
          type: "FO_REQUEST_ADMIN_TIME_ADJUSTMENT",
          bookingId: booking.id,
          sessionId,
          endedAt: graceExpiresAt.toISOString(),
        },
      };
    }

    // Grace still active, no state change
    return {
      inside: false,
      action: "noop",
      grace: graceStateFromSession(open),
      actionRequired: null,
    };
  }

  /**
   * Finalize billing for a booking.
   * Backward-compatible with existing controllers (admin + stripe + bookings).
   *
   * Behavior:
   * - End any open billing session at `endedAt` if provided, else "now".
   * - Emit NOTE event (idempotent).
   * - Return summarizeBooking plus legacy fields used by older callers.
   */
  async finalizeBookingBilling(args: {
    bookingId: string;
    endedAt?: Date;
    reason?: string;
    actorId?: string;
    idempotencyKey?: string; // legacy callers pass this
  }): Promise<{
    bookingId: string;
    sessions: Array<{
      id: string;
      foId: string;
      startedAt: string;
      endedAt: string | null;
      durationSec: number | null;
      billableMin: number | null;
      billableCents: number | null;
      grace: {
        active: boolean;
        firstExitAt: string | null;
        graceExpiresAt: string | null;
      };
    }>;
    totals: {
      totalBillableMin: number;
      totalBillableCents: number;
    };

    // legacy/compat fields
    finalBillableMin: number;
    finalBillableCents: number;
    finalization?: {
      finalBillableMin: number;
      finalBillableCents: number;
    };
  }> {
    const booking = await this.db.booking.findUnique({ where: { id: args.bookingId } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const open = await this.getOpenSession({ bookingId: booking.id });
    const endedAt = args.endedAt ?? new Date();

    if (open) {
      await this.endSession({ sessionId: open.id, endedAt });

      await this.emitNoteEvent({
        bookingId: booking.id,
        // prefer explicit idempotencyKey from caller; otherwise deterministic
        idempotencyKey:
          args.idempotencyKey && args.idempotencyKey.length > 0
            ? `billing:finalized:${booking.id}:${args.idempotencyKey}`
            : `billing:finalized:${booking.id}:${endedAt.toISOString()}`,
        note: `billing_finalized${args.reason ? `:${args.reason}` : ""}${
          args.actorId ? `:actor=${args.actorId}` : ""
        }`,
      });
    } else {
      // Still emit a note so there's an audit trail even if there was no open session.
      await this.emitNoteEvent({
        bookingId: booking.id,
        idempotencyKey:
          args.idempotencyKey && args.idempotencyKey.length > 0
            ? `billing:finalized:no_open_session:${booking.id}:${args.idempotencyKey}`
            : `billing:finalized:no_open_session:${booking.id}`,
        note: `billing_finalized_no_open_session${args.reason ? `:${args.reason}` : ""}${
          args.actorId ? `:actor=${args.actorId}` : ""
        }`,
      });
    }

    const summary = await this.summarizeBooking({ bookingId: booking.id });
    const finalBillableMin = summary.totals.totalBillableMin;
    const finalBillableCents = summary.totals.totalBillableCents;

    return {
      ...summary,
      finalBillableMin,
      finalBillableCents,
      finalization: { finalBillableMin, finalBillableCents },
    };
  }

  /**
   * Summarize billing for a booking.
   * Customer-facing pricing can display totals; hourly can be derived.
   */
  async summarizeBooking(args: { bookingId: string }): Promise<{
    bookingId: string;
    sessions: Array<{
      id: string;
      foId: string;
      startedAt: string;
      endedAt: string | null;
      durationSec: number | null;
      billableMin: number | null;
      billableCents: number | null;
      grace: {
        active: boolean;
        firstExitAt: string | null;
        graceExpiresAt: string | null;
      };
    }>;
    totals: {
      totalBillableMin: number;
      totalBillableCents: number;
    };
  }> {
    const booking = await this.db.booking.findUnique({ where: { id: args.bookingId } });
    if (!booking) throw new NotFoundException("BOOKING_NOT_FOUND");

    const sessions = await this.db.billingSession.findMany({
      where: { bookingId: booking.id },
      orderBy: { startedAt: "asc" },
    });

    const mapped = sessions.map((s: any) => {
      const firstExitAt = (s.firstExitAt as Date | null) ?? null;
      const graceExpiresAt = (s.graceExpiresAt as Date | null) ?? null;

      return {
        id: s.id,
        foId: s.foId,
        startedAt: (s.startedAt as Date).toISOString(),
        endedAt: s.endedAt ? (s.endedAt as Date).toISOString() : null,
        durationSec: (s.durationSec as number | null) ?? null,
        billableMin: (s.billableMin as number | null) ?? null,
        billableCents: (s.billableCents as number | null) ?? null,
        grace: {
          active: !!graceExpiresAt && !s.endedAt,
          firstExitAt: firstExitAt ? firstExitAt.toISOString() : null,
          graceExpiresAt: graceExpiresAt ? graceExpiresAt.toISOString() : null,
        },
      };
    });

    const totals = mapped.reduce(
      (acc, s) => {
        acc.totalBillableMin += s.billableMin ?? 0;
        acc.totalBillableCents += s.billableCents ?? 0;
        return acc;
      },
      { totalBillableMin: 0, totalBillableCents: 0 },
    );

    return {
      bookingId: booking.id,
      sessions: mapped,
      totals,
    };
  }
}
