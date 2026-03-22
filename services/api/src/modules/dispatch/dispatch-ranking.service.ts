import { Injectable } from "@nestjs/common";
import {
  DispatchCandidate,
  RankedDispatchCandidate,
} from "./dispatch-candidate.types";
import { DispatchConfigService } from "./dispatch-config.service";

export type RankResult = {
  ranked: RankedDispatchCandidate[];
  scoringVersion: string;
};

@Injectable()
export class DispatchRankingService {
  constructor(private readonly dispatchConfigService: DispatchConfigService) {}

  async rank(candidates: DispatchCandidate[], limit = 10): Promise<RankResult> {
    const cfg = await this.dispatchConfigService.getEngineConfig();

    const responseSpeedPenaltyOrBonus = 0;

    const ranked = candidates
      .filter((c) => c.canReceiveDispatch && !!c.foId)
      .map((c) => {
        const acceptancePenalty = (1 - c.acceptanceRate) * 20;
        const completionPenalty = (1 - c.completionRate) * 20;
        const cancellationPenalty = c.cancellationRate * 25;
        const loadPenalty = c.activeAssignedCount * 5 + c.activeInProgressCount * 8;
        const reliabilityBonus =
          ((c.foReliabilityScore + c.providerReliabilityScore) / 2) * -2;

        const weightedAcceptancePenalty =
          acceptancePenalty * cfg.acceptancePenaltyWeight;
        const weightedCompletionPenalty =
          completionPenalty * cfg.completionPenaltyWeight;
        const weightedCancellationPenalty =
          cancellationPenalty * cfg.cancellationPenaltyWeight;
        const weightedLoadPenalty = loadPenalty * cfg.loadPenaltyWeight;
        const weightedReliabilityBonus = cfg.enableReliabilityWeighting
          ? reliabilityBonus * cfg.reliabilityBonusWeight
          : 0;
        const weightedResponseSpeed = cfg.enableResponseSpeedWeighting
          ? responseSpeedPenaltyOrBonus * cfg.responseSpeedWeight
          : 0;

        const dispatchPenalty =
          weightedLoadPenalty +
          weightedAcceptancePenalty +
          weightedCompletionPenalty +
          weightedCancellationPenalty +
          weightedResponseSpeed -
          weightedReliabilityBonus;

        const effectiveRank = c.baseRank + dispatchPenalty;

        return {
          ...c,
          acceptancePenalty: weightedAcceptancePenalty,
          completionPenalty: weightedCompletionPenalty,
          cancellationPenalty: weightedCancellationPenalty,
          loadPenalty: weightedLoadPenalty,
          reliabilityBonus: weightedReliabilityBonus,
          dispatchPenalty,
          effectiveRank,
        };
      })
      .sort((a, b) => a.effectiveRank - b.effectiveRank);

    return {
      ranked: ranked.slice(0, Math.max(1, Math.floor(limit))),
      scoringVersion: cfg.scoringVersion,
    };
  }
}
