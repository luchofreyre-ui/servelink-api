import { Injectable } from "@nestjs/common";
import { DispatchDecisionService } from "../modules/bookings/dispatch-decision.service";
import { DispatchConfigService } from "../modules/dispatch/dispatch-config.service";
import { PrismaService } from "../prisma";
import {
  PlaywrightAdminScenarioPayload,
  runPlaywrightAdminScenario,
} from "./playwrightAdminScenario";

export type { PlaywrightAdminScenarioPayload } from "./playwrightAdminScenario";

@Injectable()
export class DevService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchDecisionService: DispatchDecisionService,
    private readonly dispatchConfigService: DispatchConfigService,
  ) {}

  async createPlaywrightAdminScenario(): Promise<PlaywrightAdminScenarioPayload> {
    return runPlaywrightAdminScenario({
      prisma: this.prisma,
      dispatchDecisionService: this.dispatchDecisionService,
      dispatchConfigService: this.dispatchConfigService,
    });
  }
}
