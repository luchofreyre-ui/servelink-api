import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PrismaService } from "../../prisma";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/fo")
export class DispatchFoController {
  constructor(private readonly db: PrismaService) {}

  @Get("offers")
  async getMyOffers(@Req() req: any) {
    const foId = String(req.user.userId);

    const offers = await this.db.bookingOffer.findMany({
      where: {
        foId,
        status: "offered",
        offeredAt: { lte: new Date() },
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        booking: true,
      },
    });

    const now = Date.now();

    return offers.map((offer) => ({
      ...offer,
      expiresInSeconds: Math.max(
        0,
        Math.floor((new Date(offer.expiresAt).getTime() - now) / 1000),
      ),
    }));
  }
}
