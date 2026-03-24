import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { BookingScreenService } from "./booking-screen.service";

@UseGuards(JwtAuthGuard)
@Controller("/api/v1/customer")
export class CustomerScreenController {
  constructor(private readonly screens: BookingScreenService) {}

  @Get("screen-summary")
  async screenSummary(@Req() req: { user: { userId: string; role: string } }) {
    const role = String(req.user?.role ?? "");
    if (role !== "customer") {
      throw new ForbiddenException("CUSTOMER_ONLY");
    }
    const summary = await this.screens.getCustomerScreenSummary(
      String(req.user.userId),
    );
    return {
      kind: "customer_screen_summary" as const,
      summary,
    };
  }
}
