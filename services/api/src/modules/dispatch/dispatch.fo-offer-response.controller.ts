import { Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PrismaService } from "../../prisma";
import { BookingOfferStatus, BookingStatus } from "@prisma/client";
import { DispatchService } from "./dispatch.service";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/fo/offers")
export class DispatchFoOfferResponseController {
  constructor(
    private readonly db: PrismaService,
    private readonly dispatch: DispatchService,
  ) {}

  @Post(":offerId/decline")
  async decline(@Param("offerId") offerId: string, @Req() req: any) {
    const foUserId = String(req.user.userId);

    const offer = await this.db.bookingOffer.findUnique({
      where: { id: offerId },
      include: { fo: true },
    });

    if (!offer) {
      throw new Error("OFFER_NOT_FOUND");
    }

    if (offer.fo.userId !== foUserId) {
      throw new Error("NOT_YOUR_OFFER");
    }

    if (offer.status !== BookingOfferStatus.offered) {
      throw new Error("OFFER_NOT_ACTIVE");
    }

    await this.db.bookingOffer.update({
      where: { id: offerId },
      data: {
        status: BookingOfferStatus.rejected,
        respondedAt: new Date(),
      },
    });

    const remainingOffers = await this.db.bookingOffer.count({
      where: {
        bookingId: offer.bookingId,
        status: BookingOfferStatus.offered,
      },
    });

    if (remainingOffers === 0) {
      await this.db.booking.updateMany({
        where: {
          id: offer.bookingId,
          status: BookingStatus.offered,
        },
        data: {
          status: BookingStatus.pending_dispatch,
        },
      });
    }

    await this.dispatch.startDispatch(offer.bookingId);

    return { ok: true };
  }
}
