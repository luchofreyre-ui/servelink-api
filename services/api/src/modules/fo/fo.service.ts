import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma";

export enum FoStatus {
  onboarding = "onboarding",
  active = "active",
  paused = "paused",
  suspended = "suspended",
  safety_hold = "safety_hold",
  offboarded = "offboarded",
}

export type FoEligibility = {
  canAcceptBooking: boolean;
  reasons: string[];
};

export type JobMatchInput = {
  lat: number;
  lng: number;
  squareFootage: number;
  estimatedLaborMinutes: number;
  recommendedTeamSize: number;
  limit?: number;
};

@Injectable()
export class FoService {
  constructor(private readonly db: PrismaService) {}

  async getFo(id: string) {
    const fo = await this.db.franchiseOwner.findUnique({ where: { id } });
    if (!fo) throw new NotFoundException("FO_NOT_FOUND");
    return fo;
  }

  async getEligibility(foId: string): Promise<FoEligibility> {
    const fo: any = await this.getFo(foId);

    const reasons: string[] = [];

    const status = String(fo.status ?? "").toLowerCase();
    if (status !== FoStatus.active) reasons.push("FO_NOT_ACTIVE");

    const safetyHold = Boolean(fo.safetyHold ?? false);
    if (safetyHold || status === FoStatus.safety_hold) {
      reasons.push("FO_SAFETY_HOLD");
    }

    if (fo.isDeleted === true) reasons.push("FO_DELETED");
    if (fo.isBanned === true) reasons.push("FO_BANNED");

    return {
      canAcceptBooking: reasons.length === 0,
      reasons,
    };
  }

  async canAcceptBooking(foId: string) {
    const eligibility = await this.getEligibility(foId);
    return eligibility.canAcceptBooking;
  }

  async getEligibleFOs() {
    return this.db.franchiseOwner.findMany({
      where: {
        status: "active",
        safetyHold: false,
      },
    });
  }

  private distanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private travelMinutes(distanceKm: number) {
    const avgSpeedKmh = 40;
    return (distanceKm / avgSpeedKmh) * 60;
  }

  async matchFOs(input: JobMatchInput) {
    const fos = await this.getEligibleFOs();

    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const scored: any[] = [];

    for (const fo of fos) {
      if (fo.homeLat == null || fo.homeLng == null) continue;

      const dist = this.distanceKm(
        input.lat,
        input.lng,
        fo.homeLat,
        fo.homeLng,
      );

      const travelMinutes = this.travelMinutes(dist);

      if (fo.maxTravelMinutes && travelMinutes > fo.maxTravelMinutes) continue;

      if (fo.maxSquareFootage && input.squareFootage > fo.maxSquareFootage) {
        continue;
      }

      if (
        fo.maxLaborMinutes &&
        input.estimatedLaborMinutes > fo.maxLaborMinutes
      ) {
        continue;
      }

      if (fo.teamSize && fo.teamSize < input.recommendedTeamSize) {
        continue;
      }

      if (fo.maxDailyLaborMinutes) {
        const todaysBookings = await this.db.booking.findMany({
          where: {
            foId: fo.id,
            scheduledStart: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          select: {
            estimatedHours: true,
          },
        });

        const alreadyCommittedMinutes = todaysBookings.reduce(
          (sum, b) => sum + Math.round((b.estimatedHours ?? 0) * 60),
          0,
        );

        if (
          alreadyCommittedMinutes + input.estimatedLaborMinutes >
          fo.maxDailyLaborMinutes
        ) {
          continue;
        }
      }

      const reliabilityScore = fo.reliabilityScore ?? 0;
      const score = reliabilityScore * 2 - travelMinutes;

      scored.push({
        fo,
        score,
        travelMinutes,
      });
    }

    scored.sort((a, b) => b.score - a.score);

    const limit =
      typeof input.limit === "number" &&
      Number.isFinite(input.limit) &&
      input.limit > 0
        ? Math.floor(input.limit)
        : 2;

    return scored.slice(0, limit).map((s) => ({
      id: s.fo.id,
      displayName: s.fo.displayName,
      photoUrl: s.fo.photoUrl,
      bio: s.fo.bio,
      yearsExperience: s.fo.yearsExperience,
      completedJobsCount: s.fo.completedJobsCount,
      teamSize: s.fo.teamSize,
      reliabilityScore: s.fo.reliabilityScore,
      travelMinutes: Math.round(s.travelMinutes),
    }));
  }
}
