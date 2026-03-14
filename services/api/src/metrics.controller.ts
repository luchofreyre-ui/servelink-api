import { Controller, Get, Header } from "@nestjs/common";

import {
  dispatchAcceptTotal,
  dispatchAcceptRaceLostTotal,
  register,
} from "./metrics.registry";

@Controller("/api/v1")
export class MetricsController {
  @Get("metrics")
  @Header("Content-Type", register.contentType)
  async metrics() {
    return register.metrics();
  }

  @Get("summary")
  async getSummary() {
    const dispatchAccept = await dispatchAcceptTotal.get();
    const dispatchAcceptRaceLost = await dispatchAcceptRaceLostTotal.get();

    return {
      dispatchAcceptTotal: dispatchAccept.values[0]?.value ?? 0,
      dispatchAcceptRaceLostTotal:
        dispatchAcceptRaceLost.values[0]?.value ?? 0,
    };
  }
}
