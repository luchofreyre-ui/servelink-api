import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma";
import { clampCrewSizeForService } from "../crew-capacity/crew-capacity-policy";
import { parseServiceSegmentFromEstimateInputJson } from "../crew-capacity/parse-estimate-job-match-fields";
import { FoService } from "../fo/fo.service";
import { ReputationService } from "./reputation.service";
import { DispatchCandidateService } from "./dispatch-candidate.service";
import { DispatchRankingService } from "./dispatch-ranking.service";
import { ProviderDispatchResolverService } from "./provider-dispatch-resolver.service";
import { DispatchDecisionService } from "../bookings/dispatch-decision.service";
import {
  BookingEventType,
  BookingOfferStatus,
  BookingStatus,
  DispatchCandidateReasonCode,
  DispatchCandidateStatus,
  DispatchDecisionStatus,
  OpsAnomalyStatus,
  OpsAnomalyType,
  Prisma,
} from "@prisma/client";
import type { DispatchDecisionCandidateInput } from "../bookings/types/dispatch-decision.types";
import {
  dispatchRoundsTotal,
  dispatchOffersCreatedTotal,
  dispatchExhaustedTotal,
  dispatchAcceptTotal,
  dispatchAcceptRaceLostTotal,
} from "../../metrics.registry";
import {
  dispatchCandidatesTotal,
  dispatchCandidatesGeoFiltered,
  dispatchCandidatesScored,
  dispatchCandidatesLimited,
  dispatchOffersCreated,
  dispatchOfferAccepted,
  dispatchOfferAcceptSeconds,
  dispatchRadiusMilesObserved,
  dispatchRoundActivated,
  dispatchRoundFallback,
} from "../../metrics/dispatch.metrics";
import { BookingTransitionService } from "../bookings/booking-transition.service";
import { FoScheduleService } from "../franchise-owner/fo-schedule.service";
import { DispatchScoringService } from "./dispatch-scoring.service";
import { DispatchLockService } from "./dispatch-lock.service";
import { DispatchIdempotencyService } from "./dispatch-idempotency.service";
import {
  isAssignedState,
  isInvalidAssignmentState,
} from "../bookings/utils/assignment-state.util";
import { BookingsService } from "../bookings/bookings.service";

@Injectable()
export class DispatchService {
  private static readonly OFFER_WINDOW_SECONDS = 30;
  private static readonly OFFER_STAGGER_SECONDS = 3;
  private static readonly MAX_OFFERS_PER_ROUND = 5;
  private static readonly MAX_SCORED_CANDIDATES = 25;
  private static readonly ROUND_1_RADIUS_MILES = 20;
  private static readonly ROUND_2_RADIUS_MILES = 30;
  private static readonly ROUND_3_RADIUS_MILES = 45;
  private static readonly ROUND_4_RADIUS_MILES = 60;
  private static readonly BATCH_SIZE = 2;

  constructor(
    private readonly db: PrismaService,
    private readonly foService: FoService,
    private readonly reputationService: ReputationService,
    private readonly candidateService: DispatchCandidateService,
    private readonly rankingService: DispatchRankingService,
    private readonly providerResolver: ProviderDispatchResolverService,
    private readonly dispatchDecisionService: DispatchDecisionService,
    private readonly transitionService: BookingTransitionService,
    private readonly foScheduleService: FoScheduleService,
    private readonly dispatchScoringService: DispatchScoringService,
    private readonly dispatchLock: DispatchLockService,
    private readonly dispatchIdempotency: DispatchIdempotencyService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) {}

  private toInputJson(value: unknown): Prisma.InputJsonValue | null {
    if (value === undefined || value === null) {
      return null;
    }
    return value as Prisma.InputJsonValue;
  }

  private toCandidateStatusSelected(
    isSelected: boolean,
  ): DispatchCandidateStatus {
    return isSelected
      ? DispatchCandidateStatus.selected
      : DispatchCandidateStatus.rejected;
  }

  private toRankedReasonCode(
    isSelected: boolean,
  ): DispatchCandidateReasonCode {
    return isSelected
      ? DispatchCandidateReasonCode.selected_best_score
      : DispatchCandidateReasonCode.not_selected_lower_rank;
  }

  private getLoadPenalty(
    stats:
      | {
          activeAssignedCount?: number | null;
          activeInProgressCount?: number | null;
        }
      | null
      | undefined,
  ): number {
    const activeAssignedCount = stats?.activeAssignedCount ?? 0;
    const activeInProgressCount = stats?.activeInProgressCount ?? 0;

    const penalty = activeAssignedCount * 4 + activeInProgressCount * 8;

    return Math.min(penalty, 40);
  }

  private async calculateDispatchPenalty(foId: string) {
    const [dispatchStats, reliabilityStats, fo] = await Promise.all([
      this.db.franchiseOwnerDispatchStats.findUnique({
        where: { foId },
      }),
      this.db.franchiseOwnerReliabilityStats.findUnique({
        where: { foId },
      }),
      this.db.franchiseOwner.findUnique({
        where: { id: foId },
        select: { reliabilityScore: true },
      }),
    ]);

    const loadPenalty = this.getLoadPenalty(reliabilityStats);

    const offersSent = dispatchStats?.offersSent ?? 0;
    const offersAccepted = dispatchStats?.offersAccepted ?? 0;
    const assignments = reliabilityStats?.assignmentsCount ?? 0;
    const completions = reliabilityStats?.completionsCount ?? 0;
    const cancellations = reliabilityStats?.cancellationsCount ?? 0;
    const reliabilityScore = Number(fo?.reliabilityScore ?? 0);

    let acceptancePenalty = 0;
    if (offersSent >= 5) {
      const acceptRate = offersAccepted / offersSent;
      if (acceptRate < 0.3) {
        acceptancePenalty = 3;
      } else if (acceptRate < 0.5) {
        acceptancePenalty = 1;
      }
    }

    let completionPenalty = 0;
    let cancellationPenalty = 0;

    if (assignments >= 5) {
      const completionRate = completions / assignments;
      const cancellationRate = cancellations / assignments;

      if (completionRate < 0.7) {
        completionPenalty += 3;
      } else if (completionRate < 0.85) {
        completionPenalty += 1;
      }

      if (cancellationRate > 0.3) {
        cancellationPenalty += 4;
      } else if (cancellationRate > 0.15) {
        cancellationPenalty += 2;
      }
    }

    const reliabilityBonus =
      reliabilityScore >= 4 ? -1 : reliabilityScore <= -2 ? 2 : 0;

    return (
      loadPenalty +
      acceptancePenalty +
      completionPenalty +
      cancellationPenalty +
      reliabilityBonus
    );
  }

  private getReputationRankAdjustment(tier: string): number {
    switch (tier) {
      case "A":
        return -15;
      case "B":
        return -5;
      case "C":
        return 5;
      case "PROBATION":
        return 20;
      default:
        return 0;
    }
  }

  private getDefaultReputationRankAdjustment(): number {
    return -5; // default new FO behavior = Tier B equivalent
  }

  private getDispatchRoundForTier(tier: string): number {
    switch (tier) {
      case "A":
        return 1;
      case "B":
        return 2;
      case "C":
        return 3;
      case "PROBATION":
        return 4;
      default:
        return 2;
    }
  }

  private getDispatchRadiusForRound(round: number): number {
    switch (round) {
      case 1:
        return DispatchService.ROUND_1_RADIUS_MILES;
      case 2:
        return DispatchService.ROUND_2_RADIUS_MILES;
      case 3:
        return DispatchService.ROUND_3_RADIUS_MILES;
      case 4:
      default:
        return DispatchService.ROUND_4_RADIUS_MILES;
    }
  }

  private filterCandidatesByRadius<T extends { distanceMiles?: number | null }>(
    candidates: T[],
    radiusMiles: number,
  ): T[] {
    return candidates.filter((candidate) => {
      const distanceMiles = candidate.distanceMiles;

      if (distanceMiles == null) {
        return false;
      }

      return distanceMiles <= radiusMiles;
    });
  }

  private getDistancePenalty(distanceMiles: number | null | undefined): number {
    if (distanceMiles == null) {
      return 25;
    }

    if (distanceMiles <= 5) {
      return 0;
    }

    if (distanceMiles <= 10) {
      return 5;
    }

    if (distanceMiles <= 20) {
      return 12;
    }

    if (distanceMiles <= 30) {
      return 20;
    }

    return 35;
  }

  private getResponseSpeedPenalty(
    averageResponseSeconds: number | null | undefined,
    responseCount: number | null | undefined,
  ): number {
    if (!responseCount || responseCount <= 0 || averageResponseSeconds == null) {
      return 10;
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
      return 15;
    }

    return 25;
  }

  private getJobTypeExperienceAdjustment(
    stats: { assignmentsCount: number } | null | undefined,
  ): number {
    if (!stats) {
      return 6;
    }

    const assignments = stats.assignmentsCount ?? 0;

    if (assignments >= 20) {
      return -6;
    }

    if (assignments >= 10) {
      return -4;
    }

    if (assignments >= 5) {
      return -2;
    }

    if (assignments >= 1) {
      return -1;
    }

    return 6;
  }

  private getReliabilityLabelAdjustment(
    label: string | null | undefined,
  ): number {
    switch (label) {
      case "ELITE":
        return -4;
      case "STRONG":
        return -2;
      case "STANDARD":
        return 0;
      case "RISK":
        return 6;
      default:
        return 0;
    }
  }

  private async executeDispatchCore(bookingId: string, _trigger: string) {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    const serviceType = (booking as any).serviceType ?? "standard";
    let jobSizeBand = "medium";
    const estimatedMinutes = (booking as any).estimatedMinutes ?? null;
    if (estimatedMinutes != null) {
      if (estimatedMinutes <= 90) jobSizeBand = "small";
      else if (estimatedMinutes <= 240) jobSizeBand = "medium";
      else jobSizeBand = "large";
    }

    const estimateSnapshot = await this.db.bookingEstimateSnapshot.findUnique({
      where: { bookingId },
    });

    if (!estimateSnapshot) {
      return [];
    }

    const estimate = JSON.parse(String(estimateSnapshot.outputJson ?? "{}"));
    const matches = Array.isArray(estimate?.dispatchCandidatePool)
      ? estimate.dispatchCandidatePool
      : Array.isArray(estimate?.matchedCleaners)
        ? estimate.matchedCleaners
        : [];

    if (!matches.length) {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.DISPATCH_EXHAUSTED,
        },
      });

      return [];
    }

    const existingOpenOffers = await this.db.bookingOffer.findMany({
      where: {
        bookingId,
        status: BookingOfferStatus.offered,
      },
      orderBy: { rank: "asc" },
    });

    if (existingOpenOffers.length > 0) {
      return existingOpenOffers;
    }

    const previouslyOffered = await this.db.bookingOffer.findMany({
      where: { bookingId },
      select: { foId: true },
    });

    const previouslyOfferedFoIds = new Set(
      previouslyOffered.map((o) => String(o.foId)),
    );

    // Provider-aware dispatch: use candidate + ranking services when site coords available.
    const inputJson = (() => {
      try {
        return JSON.parse(String(estimateSnapshot.inputJson ?? "{}"));
      } catch {
        return {};
      }
    })();
    const lat =
      typeof (booking as any).siteLat === "number" && Number.isFinite((booking as any).siteLat)
        ? (booking as any).siteLat
        : typeof inputJson.siteLat === "number" && Number.isFinite(inputJson.siteLat)
          ? inputJson.siteLat
          : null;
    const lng =
      typeof (booking as any).siteLng === "number" && Number.isFinite((booking as any).siteLng)
        ? (booking as any).siteLng
        : typeof inputJson.siteLng === "number" && Number.isFinite(inputJson.siteLng)
          ? inputJson.siteLng
          : null;
    const sqftBandToFeet: Record<string, number> = {
      "0_799": 700,
      "800_1199": 1000,
      "1200_1599": 1400,
      "1600_1999": 1800,
      "2000_2499": 2250,
      "2500_2999": 2750,
      "3000_3499": 3250,
      "3500_plus": 3750,
    };
    const squareFootage =
      typeof inputJson.sqft_band === "string"
        ? sqftBandToFeet[inputJson.sqft_band] ?? 1400
        : 1400;
    const estimatedLaborMinutes =
      typeof estimate?.adjustedLaborMinutes === "number" && Number.isFinite(estimate.adjustedLaborMinutes)
        ? estimate.adjustedLaborMinutes
        : 60;
    const recommendedTeamSizeRaw =
      typeof estimate?.recommendedTeamSize === "number" && Number.isInteger(estimate.recommendedTeamSize)
        ? estimate.recommendedTeamSize
        : 2;
    const serviceTypeRaw =
      typeof inputJson.service_type === "string" ? inputJson.service_type : "maintenance";
    const serviceSegment = parseServiceSegmentFromEstimateInputJson(
      String(estimateSnapshot.inputJson ?? "{}"),
    );
    const recommendedTeamSize = clampCrewSizeForService(
      serviceTypeRaw,
      serviceSegment,
      recommendedTeamSizeRaw,
    );

    if (lat != null && lng != null) {
      const candidates = await this.candidateService.getCandidates({
        lat,
        lng,
        squareFootage,
        estimatedLaborMinutes,
        recommendedTeamSize,
        serviceType: serviceTypeRaw,
        serviceSegment,
        limit: 10,
      });
      const { ranked, scoringVersion } = await this.rankingService.rank(candidates, 10);
      const remainingRanked = ranked.filter(
        (c) => c.foId != null && !previouslyOfferedFoIds.has(c.foId),
      );
      dispatchCandidatesTotal.inc(remainingRanked.length);

      const excludedCandidates = candidates.filter((c) => !c.canReceiveDispatch && c.foId != null);

      let decisionStatus: DispatchDecisionStatus;
      if (candidates.length === 0) {
        decisionStatus = DispatchDecisionStatus.no_candidates;
      } else if (remainingRanked.length === 0) {
        decisionStatus = DispatchDecisionStatus.all_excluded;
      } else {
        decisionStatus = DispatchDecisionStatus.selected;
      }

      const selectedForOffer = remainingRanked.length > 0 ? remainingRanked[0] : null;

      const bookingSnapshot: Prisma.InputJsonValue = {
        bookingId: booking.id,
        status: booking.status,
        scheduledStart: booking.scheduledStart
          ? booking.scheduledStart.toISOString()
          : null,
        siteLat: booking.siteLat ?? null,
        siteLng: booking.siteLng ?? null,
        estimatedDurationMin:
          booking.estimatedHours != null ? Math.round(booking.estimatedHours * 60) : null,
        foId: booking.foId ?? null,
      } as Prisma.InputJsonValue;

      const decisionMeta: Prisma.InputJsonValue = {
        candidateCountTotal: candidates.length,
        candidateCountExcluded: excludedCandidates.length,
        candidateCountRanked: remainingRanked.length,
        selectedFranchiseOwnerId: selectedForOffer?.foId ?? null,
        scoringVersion,
        triggerContext: {
          source: "dispatch.service",
        },
      } as Prisma.InputJsonValue;

      const excludedDecisionCandidates: DispatchDecisionCandidateInput[] =
        excludedCandidates.map((c): DispatchDecisionCandidateInput => ({
          franchiseOwnerId: c.foId!,
          candidateStatus: DispatchCandidateStatus.excluded,
          baseRank: c.baseRank ?? null,
          finalRank: null,
          baseScore: c.baseRank ?? null,
          finalScore: null,
          distanceMiles: c.travelMinutes != null ? c.travelMinutes / 60 : null,
          foLoad: (c.activeAssignedCount ?? 0) + (c.activeInProgressCount ?? 0),
          acceptanceRate: c.acceptanceRate ?? null,
          completionRate: c.completionRate ?? null,
          cancellationRate: c.cancellationRate ?? null,
          acceptancePenalty: null,
          completionPenalty: null,
          cancellationPenalty: null,
          loadPenalty: null,
          reliabilityBonus: null,
          finalPenalty: null,
          reasonCode: DispatchCandidateReasonCode.excluded_unknown,
          reasonDetail: c.ineligibilityReasons?.[0] ?? null,
          eligibilitySnapshot: this.toInputJson({ ineligibilityReasons: c.ineligibilityReasons }),
          scoreBreakdown: null,
        }));

      const rankedDecisionCandidates: DispatchDecisionCandidateInput[] =
        remainingRanked.map((c, index): DispatchDecisionCandidateInput => {
          const isSelected =
            !!selectedForOffer &&
            c.foId === selectedForOffer.foId;

          return {
            franchiseOwnerId: c.foId!,
            candidateStatus: this.toCandidateStatusSelected(isSelected),
            baseRank: c.baseRank ?? null,
            finalRank: index + 1,
            baseScore: c.baseRank ?? null,
            finalScore: c.effectiveRank ?? null,
            distanceMiles: c.travelMinutes != null ? c.travelMinutes / 60 : null,
            foLoad: (c.activeAssignedCount ?? 0) + (c.activeInProgressCount ?? 0),
            acceptanceRate: c.acceptanceRate ?? null,
            completionRate: c.completionRate ?? null,
            cancellationRate: c.cancellationRate ?? null,
            acceptancePenalty: c.acceptancePenalty ?? null,
            completionPenalty: c.completionPenalty ?? null,
            cancellationPenalty: c.cancellationPenalty ?? null,
            loadPenalty: c.loadPenalty ?? null,
            reliabilityBonus: c.reliabilityBonus ?? null,
            finalPenalty: c.dispatchPenalty ?? null,
            reasonCode: this.toRankedReasonCode(isSelected),
            reasonDetail: null,
            eligibilitySnapshot: null,
            scoreBreakdown: this.toInputJson({
              effectiveRank: c.effectiveRank,
              dispatchPenalty: c.dispatchPenalty,
            }),
          };
        });

      const decisionCandidates: DispatchDecisionCandidateInput[] = [
        ...excludedDecisionCandidates,
        ...rankedDecisionCandidates,
      ];

      await this.dispatchDecisionService.recordDecision({
        bookingId,
        bookingEventId: null,
        trigger: "initial_dispatch",
        triggerDetail: null,
        redispatchSequence: 0,
        decisionStatus,
        selectedFranchiseOwnerId: selectedForOffer?.foId ?? null,
        selectedRank: selectedForOffer ? 1 : null,
        selectedScore: selectedForOffer ? selectedForOffer.effectiveRank ?? null : null,
        scoringVersion,
        idempotencyKey: null,
        correlationKey: null,
        bookingStatusAtDecision: booking.status,
        scheduledStart: booking.scheduledStart ?? null,
        estimatedDurationMin: booking.estimatedHours != null ? Math.round(booking.estimatedHours * 60) : null,
        bookingSnapshot,
        decisionMeta,
        candidates: decisionCandidates,
      });

      if (remainingRanked.length > 0) {
        dispatchRoundsTotal.labels("started").inc();
        dispatchRoundActivated.inc();
        const offers: Awaited<ReturnType<typeof this.db.bookingOffer.create>>[] = [];
        const now = new Date();
        const initialRound = 1;
        const selected = remainingRanked
          .filter((candidate) => !!candidate.foId)
          .slice(0, DispatchService.MAX_OFFERS_PER_ROUND);
        dispatchCandidatesScored.inc(selected.length);
        dispatchCandidatesLimited.inc(selected.length);

        for (let i = 0; i < selected.length; i += 1) {
          const candidate = selected[i];
          const ordinalRank = i + 1;

          const activateAt = new Date(
            now.getTime() + i * DispatchService.OFFER_STAGGER_SECONDS * 1000,
          );
          const expiresAt = new Date(
            activateAt.getTime() + DispatchService.OFFER_WINDOW_SECONDS * 1000,
          );
          const offer = await this.db.bookingOffer.create({
            data: {
              bookingId,
              foId: candidate.foId!,
              rank: ordinalRank,
              dispatchRound: initialRound,
              activateAt,
              offeredAt: activateAt,
              expiresAt,
            },
          });
          dispatchOffersCreated.inc();
          await this.db.franchiseOwnerDispatchStats.upsert({
            where: { foId: candidate.foId! },
            create: { foId: candidate.foId!, offersSent: 1 },
            update: { offersSent: { increment: 1 } },
          });
          offers.push(offer);
          await this.db.bookingEvent.create({
            data: {
              bookingId,
              type: BookingEventType.OFFER_CREATED,
              note: JSON.stringify({
                providerId: candidate.providerId,
                providerType: candidate.providerType,
                foId: candidate.foId,
                effectiveRank: candidate.effectiveRank,
                dispatchPenalty: candidate.dispatchPenalty,
                offerRank: ordinalRank,
                bookingOfferId: offer.id,
              }),
            },
          });
        }
        dispatchOffersCreatedTotal.labels(String(offers.length)).inc();
        await this.db.booking.update({
          where: { id: bookingId },
          data: { status: BookingStatus.offered },
        });
        await this.db.bookingEvent.create({
          data: {
            bookingId,
            type: BookingEventType.DISPATCH_STARTED,
            note: `Provider-aware dispatch started; ${offers.length} offer(s) created`,
          },
        });
        return offers;
      }
      return [];
    }

    const remainingMatches = matches.filter(
      (fo: any) => !previouslyOfferedFoIds.has(String(fo.id)),
    );

    dispatchCandidatesTotal.inc(remainingMatches.length);

    if (!remainingMatches.length) {
      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.DISPATCH_EXHAUSTED,
          note: "All ranked dispatch candidates have already been offered",
        },
      });

      dispatchExhaustedTotal.inc();
      return [];
    }

    const lastOffer = await this.db.bookingOffer.findFirst({
      where: { bookingId },
      orderBy: [{ dispatchRound: "desc" }, { rank: "desc" }],
    });

    const round = lastOffer ? lastOffer.dispatchRound + 1 : 1;
    dispatchRoundsTotal.labels("started").inc();

    const dispatchRadiusMiles = this.getDispatchRadiusForRound(round);
    dispatchRadiusMilesObserved.observe(dispatchRadiusMiles);

    const geographicallyEligibleCandidates = this.filterCandidatesByRadius(
      remainingMatches as Array<{ distanceMiles?: number | null }>,
      dispatchRadiusMiles,
    );

    dispatchCandidatesGeoFiltered.inc(
      remainingMatches.length - geographicallyEligibleCandidates.length,
    );

    const batch =
      geographicallyEligibleCandidates.length > 0
        ? geographicallyEligibleCandidates
        : remainingMatches;

    if (geographicallyEligibleCandidates.length === 0) {
      dispatchRoundFallback.inc();
    }

    const scoredCandidates: Array<{
      fo: (typeof batch)[number];
      rank: number;
      dispatchPenalty: number;
      effectiveRank: number;
      dispatchRound: number;
    }> = [];

    for (let i = 0; i < batch.length; i++) {
      const fo = batch[i];

      const dispatchStats = await this.db.franchiseOwnerDispatchStats.findUnique({
        where: { foId: fo.id },
      });

      const jobTypeStats = await this.db.franchiseOwnerJobTypeStats.findUnique({
        where: {
          foId_serviceType_jobSizeBand: {
            foId: fo.id,
            serviceType,
            jobSizeBand,
          },
        },
      });

      const dispatchPenalty = await this.calculateDispatchPenalty(fo.id);

      const distancePenalty = this.getDistancePenalty(
        (fo as any).distanceMiles ?? null,
      );

      const responseSpeedPenalty = this.getResponseSpeedPenalty(
        dispatchStats?.averageResponseSeconds ?? null,
        dispatchStats?.responseCount ?? null,
      );

      const experienceAdjustment =
        this.getJobTypeExperienceAdjustment(jobTypeStats);

      let reputationRankAdjustment = this.getDefaultReputationRankAdjustment();
      let reliabilityLabelAdjustment = 0;
      let dispatchRound = 2;
      try {
        const reputation = await this.reputationService.getOrCreateForFo(fo.id);
        reputationRankAdjustment = this.getReputationRankAdjustment(
          reputation.reputationTier,
        );
        reliabilityLabelAdjustment = this.getReliabilityLabelAdjustment(
          reputation.reliabilityLabel,
        );
        dispatchRound = this.getDispatchRoundForTier(reputation.reputationTier);
      } catch {
        // swallow reputation lookup failures so dispatch never breaks
      }

      const rank = i + 1;
      const effectiveRank =
        rank +
        dispatchPenalty +
        reputationRankAdjustment +
        distancePenalty +
        responseSpeedPenalty +
        experienceAdjustment +
        reliabilityLabelAdjustment;

      scoredCandidates.push({ fo, rank, dispatchPenalty, effectiveRank, dispatchRound });
    }

    scoredCandidates.sort((a, b) => a.effectiveRank - b.effectiveRank);
    dispatchCandidatesScored.inc(scoredCandidates.length);

    const limitedCandidates = scoredCandidates.slice(
      0,
      DispatchService.MAX_SCORED_CANDIDATES,
    );
    dispatchCandidatesLimited.inc(limitedCandidates.length);

    const initialActiveDispatchRound =
      limitedCandidates.length > 0
        ? Math.min(...limitedCandidates.map((c) => c.dispatchRound))
        : round;

    dispatchRoundActivated.inc();

    const offers = [];
    const now = new Date();
    const roundActivationCounts = new Map<number, number>();

    for (const candidate of limitedCandidates) {
      const { fo, rank, effectiveRank, dispatchRound } = candidate;

      const isActiveRound = dispatchRound === initialActiveDispatchRound;

      const currentRoundCount = roundActivationCounts.get(dispatchRound) ?? 0;
      const isWithinRoundCap =
        currentRoundCount < DispatchService.MAX_OFFERS_PER_ROUND;

      let activateAt: Date | null = null;
      let offeredAt: Date | null = null;
      let expiresAt: Date | null = null;

      if (isActiveRound && isWithinRoundCap) {
        activateAt = new Date(
          now.getTime() +
            currentRoundCount * DispatchService.OFFER_STAGGER_SECONDS * 1000,
        );

        offeredAt = activateAt;
        expiresAt = new Date(
          activateAt.getTime() + DispatchService.OFFER_WINDOW_SECONDS * 1000,
        );

        roundActivationCounts.set(dispatchRound, currentRoundCount + 1);
      }

      const offer = await this.db.bookingOffer.create({
        data: {
          bookingId,
          foId: fo.id,
          rank: effectiveRank,
          dispatchRound,
          activateAt,
          offeredAt,
          expiresAt,
        },
      });

      dispatchOffersCreated.inc();

      await this.db.franchiseOwnerDispatchStats.upsert({
        where: { foId: fo.id },
        create: {
          foId: fo.id,
          offersSent: 1,
        },
        update: {
          offersSent: { increment: 1 },
        },
      });

      offers.push(offer);

      await this.db.bookingEvent.create({
        data: {
          bookingId,
          type: BookingEventType.OFFER_CREATED,
          note: JSON.stringify({
            providerId: (fo as any).providerId ?? null,
            providerType: (fo as any).providerType ?? null,
            foId: fo.id,
            effectiveRank: null,
            dispatchPenalty: null,
          }),
        },
      });
    }

    dispatchOffersCreatedTotal.labels(String(offers.length)).inc();

    await this.db.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.offered },
    });

    await this.db.bookingEvent.create({
      data: {
        bookingId,
        type: BookingEventType.DISPATCH_STARTED,
        note: `Dispatch round ${initialActiveDispatchRound} started at radius ${dispatchRadiusMiles} miles`,
      },
    });

    return offers;
  }

  async dispatchWithSafety(bookingId: string, trigger: string) {
    const key = `${bookingId}:${trigger}`;

    const cached = this.dispatchIdempotency.get(key);
    if (cached) {
      return cached;
    }

    const lockAcquired = await this.dispatchLock.acquireLock(bookingId);
    if (!lockAcquired) {
      return { ok: false, reason: "DISPATCH_LOCKED" };
    }

    try {
      const result = await this.executeDispatchCore(bookingId, trigger);

      this.dispatchIdempotency.set(key, result);

      return result;
    } finally {
      await this.dispatchLock.releaseLock(bookingId);
    }
  }

  /**
   * Start a dispatch round for a booking.
   * Uses the immutable estimate snapshot as the source of truth for dispatch candidates.
   * If a booking is not dispatch-ready yet, fail soft and return [].
   */
  async startDispatch(bookingId: string) {
    return this.dispatchWithSafety(bookingId, "start_dispatch");
  }

  async acceptOfferForBooking(args: { bookingId: string; offerId: string }) {
    const offer = await this.db.bookingOffer.findUnique({
      where: { id: args.offerId },
      include: { booking: true },
    });

    if (!offer) {
      throw new NotFoundException("OFFER_NOT_FOUND");
    }

    if (offer.bookingId !== args.bookingId) {
      throw new ConflictException("OFFER_BOOKING_MISMATCH");
    }

    const bookingAssignment = await this.db.booking.findUnique({
      where: { id: args.bookingId },
      select: { status: true, foId: true, dispatchLockedAt: true },
    });

    if (!bookingAssignment) {
      throw new NotFoundException("BOOKING_NOT_FOUND");
    }

    if (bookingAssignment.dispatchLockedAt) {
      return {
        ok: false,
        reason: "DISPATCH_LOCKED",
      };
    }

    if (isInvalidAssignmentState(bookingAssignment)) {
      return {
        ok: false,
        reason: "INVALID_STATE",
      };
    }

    if (isAssignedState(bookingAssignment)) {
      return {
        ok: false,
        reason: "ALREADY_ASSIGNED",
      };
    }

    if (offer.booking.status !== BookingStatus.offered) {
      throw new ConflictException("BOOKING_NOT_OFFERED");
    }

    if (offer.status !== BookingOfferStatus.offered) {
      throw new ConflictException("OFFER_NOT_ACTIVE");
    }

    const now = new Date();

    if (!offer.offeredAt || !offer.expiresAt) {
      throw new ConflictException("Offer is not active");
    }

    if (offer.offeredAt > now) {
      throw new ConflictException("Offer is not active yet");
    }

    if (offer.expiresAt < now) {
      await this.db.bookingOffer.update({
        where: { id: args.offerId },
        data: { status: BookingOfferStatus.expired },
      });

      throw new ConflictException("Offer has expired");
    }

    const eligibility = await this.foService.getEligibility(offer.foId);
    if (!(eligibility as any).canAcceptBooking) {
      throw new ConflictException("FO_NOT_ELIGIBLE");
    }

    let responseSeconds: number | null = null;
    if (offer.activateAt) {
      responseSeconds = Math.max(
        0,
        Math.floor((Date.now() - offer.activateAt.getTime()) / 1000),
      );
    }

    const booking = offer.booking;
    const serviceType = (booking as any).serviceType ?? "standard";
    let jobSizeBand = "medium";
    const estimatedMinutes = (booking as any).estimatedMinutes ?? null;
    if (estimatedMinutes != null) {
      if (estimatedMinutes <= 90) jobSizeBand = "small";
      else if (estimatedMinutes <= 240) jobSizeBand = "medium";
      else jobSizeBand = "large";
    }

    const txResult = await this.db.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id: args.bookingId },
        select: {
          id: true,
          status: true,
          foId: true,
          dispatchLockedAt: true,
        },
      });

      if (!current) {
        return { ok: false as const, reason: "BOOKING_NOT_FOUND" as const };
      }

      if (current.dispatchLockedAt) {
        return { ok: false as const, reason: "DISPATCH_LOCKED" as const };
      }

      if (isInvalidAssignmentState(current)) {
        return { ok: false as const, reason: "INVALID_STATE" as const };
      }

      if (isAssignedState(current)) {
        return { ok: false as const, reason: "ALREADY_ASSIGNED" as const };
      }

      if (current.status !== BookingStatus.offered) {
        return { ok: false as const, reason: "BOOKING_NOT_OFFERED" as const };
      }

      const currentOffer = await tx.bookingOffer.findUnique({
        where: { id: args.offerId },
      });

      if (!currentOffer) {
        throw new NotFoundException("OFFER_NOT_FOUND");
      }

      if (currentOffer.status !== BookingOfferStatus.offered) {
        throw new ConflictException("OFFER_NOT_ACTIVE");
      }

      const assignResult = await this.bookingsService.applyAssignmentTransitionInTx(
        tx,
        {
          bookingId: args.bookingId,
          toStatus: BookingStatus.assigned,
          foId: currentOffer.foId,
          idempotencyKey: `accept-offer:${args.offerId}`,
          metadata: {
            source: "acceptOfferForBooking",
            offerId: args.offerId,
          },
          updateWhere: {
            status: BookingStatus.offered,
            foId: null,
          },
          optimisticFailure: "booking_not_offered",
          onOptimisticWriteMiss: () => dispatchAcceptRaceLostTotal.inc(),
        },
      );

      if (!assignResult.bookingRowUpdated) {
        const o = await tx.bookingOffer.findUnique({
          where: { id: args.offerId },
        });
        if (
          o?.status === BookingOfferStatus.accepted &&
          assignResult.booking.status === BookingStatus.assigned &&
          assignResult.booking.foId === currentOffer.foId
        ) {
          return { ok: true as const, skippedSideEffects: true as const };
        }
      }

      const accepted = await tx.bookingOffer.updateMany({
        where: {
          id: args.offerId,
          bookingId: currentOffer.bookingId,
          status: BookingOfferStatus.offered,
        },
        data: {
          status: BookingOfferStatus.accepted,
          respondedAt: now,
        },
      });

      if (accepted.count !== 1) {
        throw new ConflictException("OFFER_NOT_ACTIVE");
      }

      await tx.bookingOffer.updateMany({
        where: {
          bookingId: currentOffer.bookingId,
          id: { not: args.offerId },
          status: BookingOfferStatus.offered,
        },
        data: {
          status: BookingOfferStatus.canceled,
          respondedAt: now,
        },
      });

      await tx.bookingEvent.create({
        data: {
          bookingId: currentOffer.bookingId,
          type: BookingEventType.OFFER_ACCEPTED,
          note: `Offer accepted by FO ${currentOffer.foId}`,
        },
      });

      await tx.franchiseOwnerJobTypeStats.upsert({
        where: {
          foId_serviceType_jobSizeBand: {
            foId: currentOffer.foId,
            serviceType,
            jobSizeBand,
          },
        },
        create: {
          foId: currentOffer.foId,
          serviceType,
          jobSizeBand,
          assignmentsCount: 1,
        },
        update: {
          assignmentsCount: { increment: 1 },
        },
      });

      await tx.franchiseOwnerReliabilityStats.upsert({
        where: { foId: currentOffer.foId },
        create: {
          foId: currentOffer.foId,
          assignmentsCount: 1,
          activeAssignedCount: 1,
        },
        update: {
          assignmentsCount: { increment: 1 },
          activeAssignedCount: { increment: 1 },
        },
      });

      return { ok: true as const, skippedSideEffects: false as const };
    });

    if (
      txResult &&
      typeof txResult === "object" &&
      "ok" in txResult &&
      txResult.ok === false
    ) {
      return txResult;
    }

    if (
      txResult &&
      typeof txResult === "object" &&
      "skippedSideEffects" in txResult &&
      (txResult as { skippedSideEffects?: boolean }).skippedSideEffects
    ) {
      return { ok: true };
    }

    void this.reputationService.recomputeForFoSafe(offer.foId);

    await this.db.franchiseOwnerDispatchStats.upsert({
      where: { foId: offer.foId },
      create: {
        foId: offer.foId,
        offersAccepted: 1,
        responseCount: responseSeconds !== null ? 1 : 0,
        averageResponseSeconds: responseSeconds ?? 0,
      },
      update: {
        offersAccepted: { increment: 1 },
        responseCount: { increment: responseSeconds !== null ? 1 : 0 },
      },
    });

    if (responseSeconds !== null) {
      dispatchOfferAcceptSeconds.observe(responseSeconds);
      const stats = await this.db.franchiseOwnerDispatchStats.findUnique({
        where: { foId: offer.foId },
      });

      if (stats && stats.responseCount > 0) {
        const newAvg =
          (stats.averageResponseSeconds * (stats.responseCount - 1) +
            responseSeconds) /
          stats.responseCount;

        await this.db.franchiseOwnerDispatchStats.update({
          where: { foId: offer.foId },
          data: { averageResponseSeconds: newAvg },
        });
      }
    }

    dispatchOfferAccepted.inc();
    dispatchAcceptTotal.inc();
    return { ok: true };
  }

  async acceptOffer(bookingId: string, foId: string) {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        foId: true,
        scheduledStart: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (!booking.scheduledStart) {
      throw new Error("Booking missing scheduledStart");
    }

    const available = await this.foScheduleService.isAvailable(
      foId,
      booking.scheduledStart,
    );

    if (!available) {
      await this.db.opsAnomaly.create({
        data: {
          bookingId,
          foId,
          type: OpsAnomalyType.fo_unavailable_accept,
          title: "FO accepted while unavailable",
          detail:
            "Acceptance was attempted while the FO was outside schedule or blocked out.",
          status: OpsAnomalyStatus.open,
        },
      });

      throw new Error("FO not available at scheduled time");
    }

    if (booking.foId && booking.foId !== foId) {
      throw new Error("Booking already linked to a different FO");
    }

    this.transitionService.validateTransition(
      booking.status as any,
      "accepted" as any,
    );

    return this.db.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.accepted,
        foId,
        acceptedAt: new Date(),
      },
    });
  }

  async rankCandidateFos(bookingId: string, foIds: string[]) {
    const booking = await this.db.booking.findUnique({
      where: { id: bookingId },
      select: { id: true, scheduledStart: true },
    });

    if (!booking || !booking.scheduledStart) {
      throw new Error("Booking missing scheduledStart");
    }

    return this.dispatchScoringService.rankFos({
      foIds,
      scheduledStart: booking.scheduledStart,
    });
  }
}
