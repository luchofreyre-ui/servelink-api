import { Controller, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PrismaService } from "../../prisma";
import { BookingOfferStatus } from "@prisma/client";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/fo/offers")
export class DispatchFoOfferResponseController {
  constructor(private readonly db: PrismaService) {}

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

    return { ok: true };
  }
}
