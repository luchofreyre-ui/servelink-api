import { Injectable } from "@nestjs/common";
import { ReliabilityMetricsService } from "./reliability-metrics.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly metrics: ReliabilityMetricsService,
  ) {}

  getHealth() {
    return {
      status: "ok",
      ts: new Date().toISOString(),
      uptime: process.uptime(),
      reliability: this.metrics.snapshot(),
    };
  }
}
