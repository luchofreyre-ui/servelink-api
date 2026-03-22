import { Test } from "@nestjs/testing";
import { DispatchCandidateService } from "../src/modules/dispatch/dispatch-candidate.service";
import { DispatchRankingService } from "../src/modules/dispatch/dispatch-ranking.service";
import { PrismaService } from "../src/prisma";

const mockDispatchConfigService = {
  getEngineConfig: jest.fn().mockResolvedValue({
    scoringVersion: "dispatch-config-vtest",
    acceptancePenaltyWeight: 1,
    completionPenaltyWeight: 1,
    cancellationPenaltyWeight: 1,
    loadPenaltyWeight: 1,
    reliabilityBonusWeight: 1,
    responseSpeedWeight: 1,
    offerExpiryMinutes: 5,
    assignedStartGraceMinutes: 15,
    multiPassPenaltyStep: 10,
    enableResponseSpeedWeighting: true,
    enableReliabilityWeighting: true,
    allowReofferAfterExpiry: true,
  }),
};

describe("Provider-aware dispatch services", () => {
  describe("DispatchRankingService", () => {
    it("ranks eligible provider-backed FO candidates by effectiveRank", async () => {
      const svc = new DispatchRankingService(mockDispatchConfigService as any);

      const result = await svc.rank(
        [
          {
            providerId: "p1",
            providerType: "franchise_owner",
            providerStatus: "active",
            providerUserId: "u1",
            foId: "fo1",
            foStatus: "active",
            displayName: "A",
            photoUrl: null,
            bio: null,
            yearsExperience: null,
            completedJobsCount: null,
            teamSize: 2,
            providerReliabilityScore: 0.8,
            foReliabilityScore: 0.9,
            travelMinutes: 10,
            baseRank: 5,
            acceptanceRate: 0.95,
            completionRate: 0.98,
            cancellationRate: 0.01,
            activeAssignedCount: 0,
            activeInProgressCount: 0,
            canReceiveDispatch: true,
            ineligibilityReasons: [],
          },
          {
            providerId: "p2",
            providerType: "franchise_owner",
            providerStatus: "active",
            providerUserId: "u2",
            foId: "fo2",
            foStatus: "active",
            displayName: "B",
            photoUrl: null,
            bio: null,
            yearsExperience: null,
            completedJobsCount: null,
            teamSize: 2,
            providerReliabilityScore: 0.2,
            foReliabilityScore: 0.2,
            travelMinutes: 30,
            baseRank: 30,
            acceptanceRate: 0.5,
            completionRate: 0.6,
            cancellationRate: 0.2,
            activeAssignedCount: 2,
            activeInProgressCount: 1,
            canReceiveDispatch: true,
            ineligibilityReasons: [],
          },
        ],
        10,
      );

      const ranked = result.ranked;
      expect(ranked).toHaveLength(2);
      expect(ranked[0].providerId).toBe("p1");
      expect(ranked[0].foId).toBe("fo1");
      expect(ranked[0].effectiveRank).toBeLessThan(ranked[1].effectiveRank);
    });

    it("filters out ineligible candidates", async () => {
      const svc = new DispatchRankingService(mockDispatchConfigService as any);

      const result = await svc.rank(
        [
          {
            providerId: "p1",
            providerType: "franchise_owner",
            providerStatus: "active",
            providerUserId: "u1",
            foId: "fo1",
            foStatus: "active",
            displayName: "A",
            photoUrl: null,
            bio: null,
            yearsExperience: null,
            completedJobsCount: null,
            teamSize: 2,
            providerReliabilityScore: 0.8,
            foReliabilityScore: 0.9,
            travelMinutes: 10,
            baseRank: 5,
            acceptanceRate: 0.95,
            completionRate: 0.98,
            cancellationRate: 0.01,
            activeAssignedCount: 0,
            activeInProgressCount: 0,
            canReceiveDispatch: false,
            ineligibilityReasons: ["PROVIDER_NOT_FOUND"],
          },
        ],
        10,
      );

      const ranked = result.ranked;
      expect(ranked).toHaveLength(0);
    });
  });

  describe("DispatchCandidateService", () => {
    it("exists", async () => {
      const mod = await Test.createTestingModule({
        providers: [
          DispatchCandidateService,
          { provide: PrismaService, useValue: {} },
        ],
      }).compile();

      const svc = mod.get(DispatchCandidateService);
      expect(svc).toBeTruthy();
    });
  });
});
