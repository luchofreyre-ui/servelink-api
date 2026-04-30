import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { EstimateEngineV2Service } from "./estimate-engine-v2.service";
import type { EstimateInput } from "./estimator.service";
import { EstimatorService } from "./estimator.service";

@Controller("/api/v1/estimation")
export class EstimatePreviewController {
  constructor(
    private readonly estimator: EstimatorService,
    private readonly estimateEngineV2: EstimateEngineV2Service,
  ) {}

  /**
   * Stateless estimate preview — does not persist bookings or snapshots.
   */
  @Post("preview")
  @HttpCode(HttpStatus.OK)
  async preview(@Body() body: unknown) {
    if (!body || typeof body !== "object") {
      throw new BadRequestException("Body must be a JSON object");
    }

    try {
      const result = await this.estimator.estimate(body as EstimateInput);
      const estimateV2 = this.estimateEngineV2.estimateV2(body as EstimateInput);
      const reconciliation = this.estimateEngineV2.calculateReconciliation({
        v1Minutes: result.estimatedDurationMinutes,
        v1PriceCents: result.estimatedPriceCents,
        v2ExpectedMinutes: estimateV2.expectedMinutes,
        v2PricedMinutes: estimateV2.pricedMinutes,
        v2PriceCents: estimateV2.customerVisible.estimatedPrice ?? 0,
      });
      return {
        kind: "estimate_preview" as const,
        estimateVersion: estimateV2.snapshotVersion,
        estimateV2,
        reconciliation,
        estimatedPriceCents: result.estimatedPriceCents,
        estimatedDurationMinutes: result.estimatedDurationMinutes,
        confidence: result.confidence,
        recommendedTeamSize: result.recommendedTeamSize,
        crewCapacityMeta: result.crewCapacityMeta,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Estimate preview failed";
      throw new BadRequestException(message);
    }
  }
}
