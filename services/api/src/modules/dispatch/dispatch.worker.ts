import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { BookingEventType, BookingOfferStatus, BookingStatus } from "@prisma/client";
import { CronRunLedgerService } from "../../common/reliability/cron-run-ledger.service";
import { PrismaService } from "../../prisma";
import { dispatchOffersExpired } from "../../metrics/dispatch.metrics";
import { DispatchService } from "./dispatch.service";
import { ReputationService } from "./reputation.service";

@Injectable()
export class DispatchWorker {
  private static readonly ASSIGNED_START_GRACE_MINUTES = 15;
  private static readonly OFFER_WINDOW_SECONDS = 30;

  constructor(
    private readonly db: PrismaService,
    private readonly dispatch: DispatchService,
    private readonly reputationService: ReputationService,
    private readonly cronRunLedger?: CronRunLedgerService,
  ) {}

  @Cron("*/1 * * * *")
  async runOfferExpirySweep() {
    const jobName = "dispatch_offer_expiry_sweep";
    if (process.env.ENABLE_DISPATCH_CRON !== "true") {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_DISPATCH_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "*/1 * * * *",
      envFlag: "ENABLE_DISPATCH_CRON",
    });
    try {
      const result = await this.expireOffersAndRedispatch();
      await this.cronRunLedger?.recordSucceeded(ledgerId, result);
    } catch (error) {
      await this.cronRunLedger?.recordFailed(ledgerId, error);
      // swallow: cron is a safety net and must never crash the process
    }
  }

  @Cron("*/1 * * * *")
  async runAssignedStartSlaSweep() {
    const jobName = "dispatch_assigned_start_sla_sweep";
    if (process.env.ENABLE_DISPATCH_CRON !== "true") {
      await this.cronRunLedger?.recordSkipped(jobName, "disabled_by_env", {
        envFlag: "ENABLE_DISPATCH_CRON",
      });
      return;
    }

    const ledgerId = await this.cronRunLedger?.recordStarted(jobName, {
      schedule: "*/1 * * * *",
      envFlag: "ENABLE_DISPATCH_CRON",
    });
    try {
      const result = await this.requeueAssignedBookingsMissingStart();
      await this.cronRunLedger?.recordSucceeded(ledgerId, result);
    } catch (error) {
      await this.cronRunLedger?.recordFailed(ledgerId, error);
      // swallow: cron is a safety net and must never crash the process
    }
  }

  /**
   * Expire stale offers and re-dispatch bookings that no longer have any open offers.
   */
  async expireOffersAndRedispatch() {
    const now = new Date();

    const expiredOffers = await this.db.bookingOffer.findMany({
      where: {
        status: BookingOfferStatus.offered,
        expiresAt: { lt: now },
      },
      orderBy: { expiresAt: "asc" },
      take: 100,
    });

    if (!expiredOffers.length) {
      return { expiredCount: 0, redispatchedCount: 0 };
    }

    const bookingIdsToRetry = new Set<string>();

    for (const offer of expiredOffers) {
      const updated = await this.db.bookingOffer.updateMany({
        where: {
          id: offer.id,
          status: BookingOfferStatus.offered,
        },
        data: {
          status: BookingOfferStatus.expired,
          respondedAt: now,
        },
      });

      if (updated.count !== 1) {
        continue;
      }

      dispatchOffersExpired.inc();

      bookingIdsToRetry.add(offer.bookingId);

      await this.db.bookingEvent.create({
        data: {
          bookingId: offer.bookingId,
          type: BookingEventType.OFFER_EXPIRED,
          note: `Offer expired for FO ${offer.foId}`,
        },
      });

      await this.db.franchiseOwnerDispatchStats.upsert({
        where: { foId: offer.foId },
        create: {
          foId: offer.foId,
          offersExpired: 1,
        },
        update: {
          offersExpired: { increment: 1 },
        },
      });

      void this.reputationService.recomputeForFoSafe(offer.foId);

      await this.activateNextDormantRoundForBooking(offer.bookingId);
    }

    let redispatchedCount = 0;

    for (const bookingId of bookingIdsToRetry) {
      const booking = await this.db.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        continue;
      }

      if (booking.status !== BookingStatus.offered) {
        continue;
      }

      const openOffers = await this.db.bookingOffer.count({
        where: {
          bookingId,
          status: BookingOfferStatus.offered,
          expiresAt: { gt: now },
        },
      });

      if (openOffers > 0) {
        continue;
      }

      await this.db.booking.updateMany({
        where: {
          id: bookingId,
          status: BookingStatus.offered,
        },
        data: {
          status: BookingStatus.pending_dispatch,
        },
      });

      await this.dispatch.startDispatch(bookingId);
      redispatchedCount += 1;
    }

    return {
      expiredCount: expiredOffers.length,
      redispatchedCount,
    };
  }

  private async activateNextDormantRoundForBooking(bookingId: string): Promise<void> {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
      },
    });

    if (!booking || booking.status !== BookingStatus.pending_dispatch) {
      return;
    }

    const offers = await this.db.bookingOffer.findMany({
      where: { bookingId },
      orderBy: [
        { dispatchRound: "asc" },
        { rank: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        foId: true,
        dispatchRound: true,
        offeredAt: true,
        expiresAt: true,
        status: true,
      },
    });

    if (!offers.length) {
      return;
    }

    const hasActiveOffer = offers.some((offer) => {
      return (
        offer.status === BookingOfferStatus.offered &&
        offer.offeredAt !== null &&
        offer.expiresAt !== null &&
        offer.expiresAt.getTime() > Date.now()
      );
    });

    if (hasActiveOffer) {
      return;
    }

    const dormantRounds = [...new Set(
      offers
        .filter((o) => o.offeredAt === null && o.expiresAt === null)
        .map((o) => o.dispatchRound),
    )].sort((a, b) => a - b);
    const nextRound = dormantRounds[0];

    if (nextRound === undefined) {
      return;
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + DispatchWorker.OFFER_WINDOW_SECONDS * 1000,
    );

    await this.db.bookingOffer.updateMany({
      where: {
        bookingId,
        dispatchRound: nextRound,
        offeredAt: null,
        expiresAt: null,
        status: BookingOfferStatus.offered,
      },
      data: {
        offeredAt: now,
        expiresAt,
      },
    });

    await this.db.bookingEvent.create({
      data: {
        bookingId,
        type: BookingEventType.DISPATCH_STARTED,
        note: `Dispatch round ${nextRound} activated at ${now.toISOString()}`,
      },
    });
  }

  async requeueAssignedBookingsMissingStart() {
    const now = new Date();
    const threshold = new Date(
      now.getTime() - DispatchWorker.ASSIGNED_START_GRACE_MINUTES * 60 * 1000,
    );

    const staleAssigned = await this.db.booking.findMany({
      where: {
        status: BookingStatus.assigned,
        foId: { not: null },
        scheduledStart: { not: null, lte: threshold },
      },
      orderBy: { scheduledStart: "asc" },
      take: 100,
    });

    if (!staleAssigned.length) {
      return { requeuedCount: 0 };
    }

    let requeuedCount = 0;

    for (const booking of staleAssigned) {
      const updated = await this.db.booking.updateMany({
        where: {
          id: booking.id,
          status: BookingStatus.assigned,
          foId: booking.foId,
        },
        data: {
          status: BookingStatus.pending_dispatch,
          foId: null,
        },
      });

      if (updated.count !== 1) {
        continue;
      }

      if (booking.foId) {
        await this.db.franchiseOwnerReliabilityStats.upsert({
          where: { foId: booking.foId },
          create: {
            foId: booking.foId,
            activeAssignedCount: 0,
          },
          update: {
            activeAssignedCount: { decrement: 1 },
          },
        });
      }

      await this.db.bookingEvent.create({
        data: {
          bookingId: booking.id,
          type: BookingEventType.STATUS_CHANGED,
          fromStatus: BookingStatus.assigned,
          toStatus: BookingStatus.pending_dispatch,
          note: "Assigned start SLA breached; booking returned to dispatch",
        },
      });

      await this.dispatch.startDispatch(booking.id);
      requeuedCount += 1;
    }

    return { requeuedCount };
  }
}
