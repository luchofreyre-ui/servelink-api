import { Body, Controller, ForbiddenException, Post, Req, UseGuards } from "@nestjs/common";
import { ok } from "../../utils/http";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { RefundReconcileService } from "./refunds.reconcile.service";

type AuthedRequest = {
  user?: { userId: string; role: "customer" | "fo" | "admin" };
};

@Controller("/api/v1/admin/refunds")
@UseGuards(JwtAuthGuard, AdminGuard)
export class RefundReconcileController {
  constructor(private readonly svc: RefundReconcileService) {}

  @Post("reconcile")
  async run(@Req() req: AuthedRequest, @Body() body: { limit?: number }) {
    const role = req.user?.role;
    if (role !== "admin") throw new ForbiddenException("FORBIDDEN");
    const limit = typeof body?.limit === "number" ? body.limit : 25;
    return ok(await this.svc.runOnce({ limit }));
  }
}
