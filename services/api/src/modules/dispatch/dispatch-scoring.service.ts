import { Injectable } from "@nestjs/common";
import { FoScheduleService } from "../franchise-owner/fo-schedule.service";
import { TrustService } from "../trust/trust.service";

@Injectable()
export class DispatchScoringService {
  constructor(
    private readonly foScheduleService: FoScheduleService,
    private readonly trustService: TrustService,
  ) {}

  async scoreFoForBooking(input: { foId: string; scheduledStart: Date }) {
    const available = await this.foScheduleService.isAvailable(
      input.foId,
      input.scheduledStart,
    );

    if (!available) {
      return {
        foId: input.foId,
        available: false,
        trustScore: 0,
        dispatchScore: 0,
      };
    }

    const trust = await this.trustService.getFoTrustScore(input.foId);

    const dispatchScore = trust.score;

    return {
      foId: input.foId,
      available: true,
      trustScore: trust.score,
      dispatchScore,
    };
  }

  async rankFos(input: { foIds: string[]; scheduledStart: Date }) {
    const scored = await Promise.all(
      input.foIds.map((foId) =>
        this.scoreFoForBooking({
          foId,
          scheduledStart: input.scheduledStart,
        }),
      ),
    );

    return scored.sort((a, b) => b.dispatchScore - a.dispatchScore);
  }
}
