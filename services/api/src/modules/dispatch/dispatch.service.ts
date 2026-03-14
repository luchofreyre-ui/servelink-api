import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { FoService } from "../fo/fo.service";
import {
  BookingEventType,
  BookingOfferStatus,
  BookingStatus,
} from "@prisma/client";
import {
  dispatchRoundsTotal,
  dispatchOffersCreatedTotal,
  dispatchExhaustedTotal,
  dispatchAcceptTotal,
  dispatchAcceptRaceLostTotal,
} from "../../metrics.registry";

@Injectable()
export class DispatchService {
  constructor(
    private readonly db: PrismaService,
    private readonly foService: FoService,
  ) {}

  /**
   * Start a dispatch round for a booking.
   * Uses the immutable estimate snapshot as the source of truth for dispatch candidates.
   * If a booking is not dispatch-ready yet, fail soft and return [].
   */
  async startDispatch(bookingId: string) {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const estimateSnapshot = await this.db.bookingEstimateSnapshot.findUnique({
      where: { bookingId },
    });

    if (!estimateSnapshot) {
      return [];
    }

    const estimate = JSON.parse(String(estimateSnapshot.outputJson ?? "{}"));
    const matches = Array.isArray(estimate?.dispatchCandidatePool)
      ? estimate.dispatchCandidatePool
      : Array.isArray(estimate?.matchedCleaners)
        ? estimate.matchedCleaners
        : [];

    if (!matches.length) {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.DISPATCH_EXHAUSTED,
        },
      });

      return [];
    }

    const existingOpenOffers = await this.db.bookingOffer.findMany({
      where: {
        bookingId,
        status: BookingOfferStatus.offered,
      },
      orderBy: { rank: "asc" },
    });

    if (existingOpenOffers.length > 0) {
      return existingOpenOffers;
    }

    const previouslyOffered = await this.db.bookingOffer.findMany({
      where: { bookingId },
      select: { foId: true },
    });

    const previouslyOfferedFoIds = new Set(
      previouslyOffered.map((o) => String(o.foId)),
    );

    const remainingMatches = matches.filter(
      (fo: any) => !previouslyOfferedFoIds.has(String(fo.id)),
    );

    if (!remainingMatches.length) {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.DISPATCH_EXHAUSTED,
          note: "All ranked dispatch candidates have already been offered",
        },
      });

      dispatchExhaustedTotal.inc();
      return [];
    }

    const lastOffer = await this.db.bookingOffer.findFirst({
      where: { bookingId },
      orderBy: [{ dispatchRound: "desc" }, { rank: "desc" }],
    });

    const round = lastOffer ? lastOffer.dispatchRound + 1 : 1;
    dispatchRoundsTotal.labels("started").inc();
    const batchSize = 2;
    const batch = remainingMatches.slice(0, batchSize);

    const offers = [];

    for (let i = 0; i < batch.length; i++) {
      const fo = batch[i];

      const foLoad = await this.db.booking.count({
        where: {
          foId: fo.id,
          status: {
            in: [BookingStatus.assigned, BookingStatus.in_progress],
          },
        },
      });

      const stats = await this.db.franchiseOwnerDispatchStats.findUnique({
        where: { foId: fo.id },
      });

      const offersSent = stats?.offersSent ?? 0;
      const offersAccepted = stats?.offersAccepted ?? 0;

      let acceptancePenalty = 0;

      if (offersSent >= 5) {
        const acceptRate = offersAccepted / offersSent;

        if (acceptRate < 0.3) {
          acceptancePenalty = 3;
        } else if (acceptRate < 0.5) {
          acceptancePenalty = 1;
        }
      }

      const rank = i + 1;
      const effectiveRank = rank + foLoad + acceptancePenalty;

      const offer = await this.db.bookingOffer.create({
        data: {
          bookingId,
          foId: fo.id,
          rank: effectiveRank,
          dispatchRound: round,
          expiresAt: new Date(Date.now() + 90 * 1000),
        },
      });

      await this.db.franchiseOwnerDispatchStats.upsert({
        where: { foId: fo.id },
        create: {
          foId: fo.id,
          offersSent: 1,
        },
        update: {
          offersSent: { increment: 1 },
        },
      });

      offers.push(offer);

      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.OFFER_CREATED,
          note: `Offer sent to FO ${fo.id}`,
        },
      });
    }

    dispatchOffersCreatedTotal.labels(String(offers.length)).inc();

    await this.db.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.offered },
    });

    await this.db.bookingEvent.create({
      data: {
        bookingId,
        type: BookingEventType.DISPATCH_STARTED,
        note: `Dispatch round ${round} started`,
      },
    });

    return offers;
  }

  async acceptOfferForBooking(args: { bookingId: string; offerId: string }) {
    const offer = await this.db.bookingOffer.findUnique({
      where: { id: args.offerId },
      include: { booking: true },
    });

    if (!offer) {
      throw new NotFoundException("OFFER_NOT_FOUND");
    }

    if (offer.bookingId !== args.bookingId) {
      throw new ConflictException("OFFER_BOOKING_MISMATCH");
    }

    if (offer.booking.status !== BookingStatus.offered) {
      throw new ConflictException("BOOKING_NOT_OFFERED");
    }

    if (offer.status !== BookingOfferStatus.offered) {
      throw new ConflictException("OFFER_NOT_ACTIVE");
    }

    const now = new Date();

    if (offer.expiresAt < now) {
      await this.db.bookingOffer.update({
        where: { id: args.offerId },
        data: { status: BookingOfferStatus.expired },
      });

      throw new ConflictException("OFFER_EXPIRED");
    }

    const eligibility = await this.foService.getEligibility(offer.foId);
    if (!(eligibility as any).canAcceptBooking) {
      throw new ConflictException("FO_NOT_ELIGIBLE");
    }

    await this.db.$transaction(async (tx) => {
      const currentOffer = await tx.bookingOffer.findUnique({
        where: { id: args.offerId },
      });

      if (!currentOffer) {
        throw new NotFoundException("OFFER_NOT_FOUND");
      }

      if (currentOffer.status !== BookingOfferStatus.offered) {
        throw new ConflictException("OFFER_NOT_ACTIVE");
      }

      const claimedBooking = await tx.booking.updateMany({
        where: {
          id: currentOffer.bookingId,
          status: BookingStatus.offered,
          foId: null,
        },
        data: {
          status: BookingStatus.assigned,
          foId: currentOffer.foId,
        },
      });

      if (claimedBooking.count !== 1) {
        dispatchAcceptRaceLostTotal.inc();
        throw new ConflictException("BOOKING_NOT_OFFERED");
      }

      const accepted = await tx.bookingOffer.updateMany({
        where: {
          id: args.offerId,
          bookingId: currentOffer.bookingId,
          status: BookingOfferStatus.offered,
        },
        data: {
          status: BookingOfferStatus.accepted,
          respondedAt: now,
        },
      });

      if (accepted.count !== 1) {
        throw new ConflictException("OFFER_NOT_ACTIVE");
      }

      await tx.bookingOffer.updateMany({
        where: {
          bookingId: currentOffer.bookingId,
          id: { not: args.offerId },
          status: BookingOfferStatus.offered,
        },
        data: {
          status: BookingOfferStatus.canceled,
          respondedAt: now,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: currentOffer.bookingId,
          type: BookingEventType.OFFER_ACCEPTED,
          note: `Offer accepted by FO ${currentOffer.foId}`,
        },
      });
    });

    await this.db.franchiseOwnerDispatchStats.upsert({
      where: { foId: offer.foId },
      create: {
        foId: offer.foId,
        offersAccepted: 1,
      },
      update: {
        offersAccepted: { increment: 1 },
      },
    });

    dispatchAcceptTotal.inc();
    return { ok: true };
  }
}
