import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
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
import { DeepCleanAnalyticsService } from "./deep-clean-analytics.service";
import { DeepCleanCalibrationReviewService } from "./deep-clean-calibration-review.service";
import { DeepCleanInsightsService } from "./deep-clean-insights.service";
import { DeepCleanEstimatorImpactService } from "./deep-clean-estimator-impact.service";
import { DeepCleanAnalyticsQueryDto } from "./dto/deep-clean-analytics.dto";
import { DeepCleanInsightsQueryDto } from "./dto/deep-clean-insights.dto";
import { DeepCleanEstimatorImpactQueryDto } from "./dto/deep-clean-estimator-impact.dto";
import { UpdateDeepCleanCalibrationReviewRequestDto } from "./dto/deep-clean-calibration-review.dto";

type AuthedRequest = {
  user?: { userId?: string; role?: string; email?: string };
};

@Controller("api/v1/admin/deep-clean")
@UseGuards(JwtAuthGuard, AdminGuard, AdminPermissionsGuard)
export class DeepCleanAnalyticsAdminController {
  constructor(
    private readonly analytics: DeepCleanAnalyticsService,
    private readonly calibrationReview: DeepCleanCalibrationReviewService,
    private readonly insights: DeepCleanInsightsService,
    private readonly estimatorImpact: DeepCleanEstimatorImpactService,
  ) {}

  @Get("analytics")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getAnalytics(@Query() query: DeepCleanAnalyticsQueryDto) {
    const data = await this.analytics.getDeepCleanAnalytics(query);
    return { kind: "deep_clean_analytics" as const, ...data };
  }

  @Get("insights")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  )
  async getInsights(@Query() query: DeepCleanInsightsQueryDto) {
    const data = await this.insights.getDeepCleanInsights(query);
    return { kind: "deep_clean_insights" as const, ...data };
  }

  @Get("estimator-impact")
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      // Do not use enableImplicitConversion here: Boolean("false") === true breaks reviewedOnly/usableOnly.
    }),
  )
  async getEstimatorImpact(@Query() query: DeepCleanEstimatorImpactQueryDto) {
    const data = await this.estimatorImpact.getEstimatorVersionImpact(query);
    return { kind: "deep_clean_estimator_impact" as const, ...data };
  }

  @Post("analytics/:bookingId/review")
  @HttpCode(HttpStatus.OK)
  @AdminPermissions("exceptions.read")
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  async updateCalibrationReview(
    @Param("bookingId") bookingId: string,
    @Body() body: UpdateDeepCleanCalibrationReviewRequestDto,
    @Req() req: AuthedRequest,
  ) {
    const userId = req.user?.userId;
    if (!userId) {
      throw new UnauthorizedException("Missing authenticated user");
    }
    const row = await this.calibrationReview.updateCalibrationReview({
      bookingId,
      actorUserId: userId,
      dto: body,
    });
    return {
      kind: "deep_clean_calibration_review_updated" as const,
      row,
    };
  }
}
