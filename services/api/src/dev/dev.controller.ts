import { Controller, Get } from "@nestjs/common";
import { DevService } from "./dev.service";

@Controller("/api/v1/dev")
export class DevController {
  constructor(private readonly devService: DevService) {}

  @Get("playwright/admin-scenario")
  async getPlaywrightAdminScenario() {
    return this.devService.createPlaywrightAdminScenario();
  }
}
