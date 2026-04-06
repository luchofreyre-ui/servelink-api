import { Controller, Get } from "@nestjs/common";
import {
  SkipIdempotency,
  SkipRateLimit,
  SkipRetry,
} from "./reliability.decorators";
import { HealthService } from "./health.service";

@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @SkipRateLimit()
  @SkipRetry()
  @SkipIdempotency()
  @Get()
  getHealth() {
    return this.health.getHealth();
  }
}
