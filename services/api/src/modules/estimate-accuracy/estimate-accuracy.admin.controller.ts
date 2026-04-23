import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { AdminGuard } from "../../guards/admin.guard";
import { AdminPermissions } from "../../common/admin/admin-permissions.decorator";
import { AdminPermissionsGuard } from "../../common/admin/admin-permissions.guard";
import { EstimateAccuracyService } from "./estimate-accuracy.service";

type AuthedRequest = {
  user?: { userId?: string; role?: string; email?: string };
};

@Controller("api/v1/admin/estimate-accuracy")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class EstimateAccuracyAdminController {
  constructor(private readonly accuracy: EstimateAccuracyService) {}

  @Get("summary")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async summary(
    @Req() req: AuthedRequest,
    @Query("foId") foId?: string,
  ) {
    if (!req.user?.userId) {
      throw new UnauthorizedException();
    }
    const data = await this.accuracy.getAggregateMetrics(
      foId?.trim() ? { foId: foId.trim() } : undefined,
    );
    return { kind: "estimate_accuracy_summary" as const, ...data };
  }

  @Get("audits")
  @AdminPermissions("exceptions.read")
  async listAudits(@Query("take") takeRaw?: string) {
    const take = Number.parseInt(String(takeRaw ?? "50"), 10);
    const items = await this.accuracy.listAudits(
      Number.isFinite(take) ? take : 50,
    );
    return { kind: "estimate_accuracy_audit_list" as const, items };
  }
}
