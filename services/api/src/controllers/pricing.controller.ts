import { Controller, Get } from "@nestjs/common";

@Controller("/api/v1/pricing")
export class PricingController {
  @Get("/cleaning")
  getCleaningPricing() {
    return {
      hourly_rate_cents: 6500,
      billing_increment_minutes: 15,
      late_grace_minutes: 120,
      exclusions: [
        "biohazards",
        "mold",
        "construction_debris",
        "hoarding",
        "exterior_windows",
        "heavy_furniture"
      ]
    };
  }
}
