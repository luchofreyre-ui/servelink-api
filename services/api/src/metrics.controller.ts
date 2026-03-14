import { Controller, Get, Header } from "@nestjs/common";

import { register } from "./metrics.registry";

@Controller("/api/v1")
export class MetricsController {
  @Get("metrics")
  @Header("Content-Type", register.contentType)
  async metrics() {
    return register.metrics();
  }
}
