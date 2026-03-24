import { Controller, Get } from "@nestjs/common";
import { CLEANING_PRICING_POLICY_V1 } from "../modules/pricing/pricing-policy";

@Controller("/api/v1/pricing")
export class PricingController {
  @Get("/cleaning")
  getCleaningPricing() {
    const p = CLEANING_PRICING_POLICY_V1;
    return {
      hourly_rate_cents: p.hourlyRateCents,
      billing_increment_minutes: p.billingIncrementMinutes,
      late_grace_minutes: p.lateGraceMinutes,
      exclusions: [...p.exclusions],
    };
  }
}
