import { Injectable } from "@nestjs/common";
import { ReputationTier } from "@prisma/client";

import { PrismaService } from "../../prisma";

type ReputationComputation = {
  reputationScore: number;
  reputationTier: ReputationTier;
  reliabilityScore: number;
  reliabilityLabel: "ELITE" | "STRONG" | "STANDARD" | "RISK";
  acceptanceRate: number;
  completionRate: number;
  cancellationRate: number;
  expirationRate: number;
  averageResponseSeconds: number;
};

@Injectable()
export class ReputationService {
  constructor(private readonly db: PrismaService) {}

  async recomputeForFo(foId: string): Promise<ReputationComputation> {
    const [dispatchStats, reliabilityStats] = await Promise.all([
      this.db.franchiseOwnerDispatchStats.findUnique({
        where: { foId },
      }),
      this.db.franchiseOwnerReliabilityStats.findUnique({
        where: { foId },
      }),
    ]);

    const offersSent = dispatchStats?.offersSent ?? 0;
    const offersAccepted = dispatchStats?.offersAccepted ?? 0;
    const offersExpired = dispatchStats?.offersExpired ?? 0;
    const averageResponseSeconds = dispatchStats?.averageResponseSeconds ?? 0;

    const assignmentsCount = reliabilityStats?.assignmentsCount ?? 0;
    const completionsCount = reliabilityStats?.completionsCount ?? 0;
    const cancellationsCount = reliabilityStats?.cancellationsCount ?? 0;

    const acceptanceRate = this.safeRate(offersAccepted, offersSent, 1);
    const completionRate = this.safeRate(completionsCount, assignmentsCount, 1);
    const cancellationRate = this.safeRate(cancellationsCount, assignmentsCount, 0);
    const expirationRate = this.safeRate(offersExpired, offersSent, 0);

    const rawScore =
      completionRate * 60 +
      acceptanceRate * 25 -
      cancellationRate * 40 -
      expirationRate * 10;

    const reputationScore = this.roundScore(this.clamp(rawScore, 0, 100));
    const reputationTier = this.mapTier(reputationScore);

    const reliabilityRaw =
      completionRate * 55 +
      acceptanceRate * 20 -
      cancellationRate * 35 -
      expirationRate * 10 -
      this.getResponseReliabilityPenalty(averageResponseSeconds);

    const reliabilityScore = this.roundScore(this.clamp(reliabilityRaw, 0, 100));
    const reliabilityLabel = this.mapReliabilityLabel(reliabilityScore);

    await this.db.franchiseOwnerReputation.upsert({
      where: { foId },
      update: {
        reputationScore,
        reputationTier,
        reliabilityScore,
        reliabilityLabel,
        lastCalculatedAt: new Date(),
      },
      create: {
        foId,
        reputationScore,
        reputationTier,
        reliabilityScore,
        reliabilityLabel,
        lastCalculatedAt: new Date(),
      },
    });

    return {
      reputationScore,
      reputationTier,
      reliabilityScore,
      reliabilityLabel,
      acceptanceRate: this.roundScore(acceptanceRate * 100),
      completionRate: this.roundScore(completionRate * 100),
      cancellationRate: this.roundScore(cancellationRate * 100),
      expirationRate: this.roundScore(expirationRate * 100),
      averageResponseSeconds: this.roundScore(averageResponseSeconds),
    };
  }

  async recomputeForFoSafe(foId: string): Promise<void> {
    try {
      await this.recomputeForFo(foId);
    } catch {
      // swallow errors so operational flows never fail on reputation refresh
    }
  }

  async getOrCreateForFo(foId: string) {
    const existing = await this.db.franchiseOwnerReputation.findUnique({
      where: { foId },
    });

    if (existing) {
      return existing;
    }

    await this.recomputeForFo(foId);

    return this.db.franchiseOwnerReputation.findUniqueOrThrow({
      where: { foId },
    });
  }

  private safeRate(numerator: number, denominator: number, fallback: number): number {
    if (denominator <= 0) {
      return fallback;
    }

    return numerator / denominator;
  }

  private mapTier(score: number): ReputationTier {
    if (score >= 85) {
      return ReputationTier.A;
    }

    if (score >= 70) {
      return ReputationTier.B;
    }

    if (score >= 50) {
      return ReputationTier.C;
    }

    return ReputationTier.PROBATION;
  }

  private mapReliabilityLabel(
    score: number,
  ): "ELITE" | "STRONG" | "STANDARD" | "RISK" {
    if (score >= 90) {
      return "ELITE";
    }

    if (score >= 75) {
      return "STRONG";
    }

    if (score >= 55) {
      return "STANDARD";
    }

    return "RISK";
  }

  private getResponseReliabilityPenalty(averageResponseSeconds: number): number {
    if (averageResponseSeconds <= 0) {
      return 0;
    }

    if (averageResponseSeconds <= 30) {
      return 0;
    }

    if (averageResponseSeconds <= 90) {
      return 4;
    }

    if (averageResponseSeconds <= 180) {
      return 8;
    }

    if (averageResponseSeconds <= 300) {
      return 12;
    }

    return 18;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private roundScore(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
