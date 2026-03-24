import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { PrismaService } from "../../prisma";
import { BookingScreenService } from "./booking-screen.service";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/fo")
export class FoScreenController {
  constructor(
    private readonly screens: BookingScreenService,
    private readonly db: PrismaService,
  ) {}

  @Get("screen-summary")
  async screenSummary(@Req() req: { user: { userId: string; role: string } }) {
    const role = String(req.user?.role ?? "");
    if (role !== "fo") {
      throw new ForbiddenException("FO_ONLY");
    }

    const fo = await this.db.franchiseOwner.findUnique({
      where: { userId: String(req.user.userId) },
      select: { id: true },
    });

    const summary = fo
      ? await this.screens.getFoScreenSummary(fo.id)
      : {
          counts: {
            paymentActionRequired: 0,
            completionReady: 0,
            total: 0,
          },
          queue: { rows: [] as Array<Record<string, unknown>> },
        };

    return {
      kind: "fo_screen_summary" as const,
      summary,
    };
  }
}
