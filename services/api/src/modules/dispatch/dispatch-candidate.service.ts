import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { resolveFranchiseOwnerCrewRange } from "../crew-capacity/franchise-owner-crew-range";
import { getWorkloadMinCrew } from "../crew-capacity/workload-min-crew";
import { DispatchCandidate, DispatchCandidateInput } from "./dispatch-candidate.types";

@Injectable()
export class DispatchCandidateService {
  constructor(private readonly db: PrismaService) {}

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
    return (distanceKm / 40) * 60;
  }

  private ratio(num?: number | null, den?: number | null) {
    if (!den || den <= 0) return 1;
    return (num ?? 0) / den;
  }

  async getCandidates(input: DispatchCandidateInput): Promise<DispatchCandidate[]> {
    const today = new Date();
    const dayStart = new Date(today);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(today);
    dayEnd.setHours(23, 59, 59, 999);

    const rows = await this.db.franchiseOwner.findMany({
      where: {
        providerId: { not: null },
        status: "active",
        safetyHold: false,
      },
      include: { provider: true, dispatchStats: true, reliabilityStats: true },
    });

    const candidates: DispatchCandidate[] = [];

    for (const fo of rows) {
      const reasons: string[] = [];
      if (!fo.providerId) reasons.push("PROVIDER_ID_MISSING");
      if (!fo.provider) reasons.push("PROVIDER_NOT_FOUND");
      if (fo.provider && fo.provider.userId !== fo.userId) reasons.push("PROVIDER_USER_MISMATCH");
      if (fo.homeLat == null || fo.homeLng == null) reasons.push("HOME_LOCATION_MISSING");

      let travelMinutes = Number.POSITIVE_INFINITY;
      if (fo.homeLat != null && fo.homeLng != null) {
        const dist = this.distanceKm(input.lat, input.lng, fo.homeLat, fo.homeLng);
        travelMinutes = this.travelMinutes(dist);
        if (fo.maxTravelMinutes && travelMinutes > fo.maxTravelMinutes) reasons.push("TRAVEL_LIMIT_EXCEEDED");
      }
      if (fo.maxSquareFootage && input.squareFootage > fo.maxSquareFootage) reasons.push("MAX_SQUARE_FOOTAGE_EXCEEDED");
      if (fo.maxLaborMinutes && input.estimatedLaborMinutes > fo.maxLaborMinutes) reasons.push("MAX_LABOR_EXCEEDED");

      const crewRange = resolveFranchiseOwnerCrewRange({
        teamSize: fo.teamSize,
        minCrewSize: fo.minCrewSize ?? null,
        preferredCrewSize: fo.preferredCrewSize ?? null,
        maxCrewSize: fo.maxCrewSize ?? null,
      });
      const workloadMinCrew = getWorkloadMinCrew({
        estimatedLaborMinutes: input.estimatedLaborMinutes,
        squareFootage: input.squareFootage,
        serviceType: String(input.serviceType ?? "maintenance"),
      });
      if (crewRange.maxCrewSize < workloadMinCrew) {
        reasons.push("WORKLOAD_MIN_CREW_NOT_MET");
      }

      if (fo.maxDailyLaborMinutes) {
        const todaysBookings = await this.db.booking.findMany({
          where: {
            foId: fo.id,
            scheduledStart: { gte: dayStart, lte: dayEnd },
          },
          select: { estimatedHours: true },
        });
        const alreadyCommittedMinutes = todaysBookings.reduce(
          (sum, b) => sum + Math.round((b.estimatedHours ?? 0) * 60),
          0,
        );
        if (alreadyCommittedMinutes + input.estimatedLaborMinutes > fo.maxDailyLaborMinutes) {
          reasons.push("DAILY_CAPACITY_EXCEEDED");
        }
      }

      const ds = fo.dispatchStats;
      const rs = fo.reliabilityStats;
      const offersSent = ds?.offersSent ?? 0;
      const offersAccepted = ds?.offersAccepted ?? 0;
      const completions = rs?.completionsCount ?? 0;
      const cancellations = rs?.cancellationsCount ?? 0;
      const assignments = rs?.assignmentsCount ?? 0;
      const acceptanceRate = this.ratio(offersAccepted, offersSent);
      const completionRate = this.ratio(completions, assignments);
      const cancellationRate = assignments > 0 ? cancellations / assignments : 0;

      candidates.push({
        providerId: fo.providerId ?? "",
        providerType: String(fo.provider?.type ?? "unknown"),
        providerStatus: String(fo.provider?.status ?? "unknown"),
        providerUserId: fo.provider?.userId ?? "",
        foId: fo.id,
        foStatus: String(fo.status),
        displayName: fo.displayName ?? fo.provider?.displayName ?? null,
        photoUrl: fo.photoUrl ?? null,
        bio: fo.bio ?? null,
        yearsExperience: fo.yearsExperience ?? null,
        completedJobsCount: fo.completedJobsCount ?? null,
        teamSize: fo.teamSize ?? null,
        providerReliabilityScore: fo.provider?.reliabilityScore ?? 0,
        foReliabilityScore: fo.reliabilityScore ?? 0,
        travelMinutes: Number.isFinite(travelMinutes) ? Math.round(travelMinutes) : 999999,
        baseRank: (fo.reliabilityScore ?? 0) * 2 - (Number.isFinite(travelMinutes) ? travelMinutes : 999999),
        acceptanceRate,
        completionRate,
        cancellationRate,
        activeAssignedCount: rs?.activeAssignedCount ?? 0,
        activeInProgressCount: rs?.activeInProgressCount ?? 0,
        canReceiveDispatch: reasons.length === 0,
        ineligibilityReasons: reasons,
      });
    }
    return candidates;
  }
}
