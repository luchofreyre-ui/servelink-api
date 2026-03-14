import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { BookingEventType, BookingOfferStatus, BookingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma";
import { DispatchService } from "./dispatch.service";

@Injectable()
export class DispatchWorker {
  constructor(
    private readonly db: PrismaService,
    private readonly dispatch: DispatchService,
  ) {}

  @Cron("*/1 * * * *")
  async runOfferExpirySweep() {
    if (process.env.ENABLE_DISPATCH_CRON !== "true") return;

    try {
      await this.expireOffersAndRedispatch();
    } catch {
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
}
