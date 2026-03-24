import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import type { EstimateInput } from "./estimator.service";
import { EstimatorService } from "./estimator.service";

@Controller("/api/v1/estimation")
export class EstimatePreviewController {
  constructor(private readonly estimator: EstimatorService) {}

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
      return {
        kind: "estimate_preview" as const,
        estimatedPriceCents: result.estimatedPriceCents,
        estimatedDurationMinutes: result.estimatedDurationMinutes,
        confidence: result.confidence,
        recommendedTeamSize: result.recommendedTeamSize,
      };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Estimate preview failed";
      throw new BadRequestException(message);
    }
  }
}
