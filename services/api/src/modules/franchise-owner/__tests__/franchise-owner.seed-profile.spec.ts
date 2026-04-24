import { PrismaClient } from "@prisma/client";

import {
  DISPATCH_TEST_FO_PROFILES,
  dispatchTestFoZipsTag,
  parseDispatchTestFoZipsFromBio,
} from "../../../dev/dispatchTestFoProfiles";
import { seedDispatchTestFranchiseOwners } from "../../../dev/seedDispatchTestFranchiseOwners";
import { FoService } from "../../fo/fo.service";

describe("dispatchTestFoProfiles (bio zip tag)", () => {
  it("round-trips ZIP codes in bio tag", () => {
    const tag = dispatchTestFoZipsTag(["74103", "74104"]);
    const bio = `Intro line\n\n${tag}`;
    expect(parseDispatchTestFoZipsFromBio(bio).sort().join(",")).toBe(
      "74103,74104",
    );
  });

  it("defines five cohort profiles with distinct emails", () => {
    expect(DISPATCH_TEST_FO_PROFILES.length).toBe(5);
    const emails = new Set(DISPATCH_TEST_FO_PROFILES.map((p) => p.email));
    expect(emails.size).toBe(5);
  });
});

const dbUrl = process.env.DATABASE_URL?.trim();

(dbUrl ? describe : describe.skip)(
  "seedDispatchTestFranchiseOwners (integration)",
  () => {
    let prisma: PrismaClient;

    beforeAll(async () => {
      prisma = new PrismaClient();
      await prisma.$connect();
    });

    afterAll(async () => {
      await prisma.$disconnect();
    });

    it("is idempotent: two runs keep stable franchiseOwner ids per email", async () => {
      const a = await seedDispatchTestFranchiseOwners(prisma);
      const b = await seedDispatchTestFranchiseOwners(prisma);
      for (const profile of DISPATCH_TEST_FO_PROFILES) {
        expect(a.franchiseOwnerIds[profile.key]).toBe(
          b.franchiseOwnerIds[profile.key],
        );
      }
    });

    it("creates five active FOs with schedules, providers, and zip tags", async () => {
      await seedDispatchTestFranchiseOwners(prisma);
      const emails = DISPATCH_TEST_FO_PROFILES.map((p) => p.email);
      const rows = await prisma.franchiseOwner.findMany({
        where: { user: { email: { in: emails } } },
        include: {
          user: { select: { email: true } },
          provider: { select: { userId: true } },
          _count: { select: { foSchedules: true } },
        },
      });
      expect(rows).toHaveLength(5);
      for (const fo of rows) {
        expect(fo.status).toBe("active");
        expect(fo.safetyHold).toBe(false);
        expect(fo._count.foSchedules).toBeGreaterThan(0);
        expect(fo.provider?.userId).toBe(fo.userId);
      }
    });

    it("covers required ZIPs via geo matchFOs smoke", async () => {
      await seedDispatchTestFranchiseOwners(prisma);
      const foService = new FoService(prisma as never);
      const job = {
        squareFootage: 2000,
        estimatedLaborMinutes: 240,
        recommendedTeamSize: 2,
        serviceType: "deep_clean",
        limit: 25,
      } as const;

      const byEmail = Object.fromEntries(
        (
          await prisma.franchiseOwner.findMany({
            where: {
              user: {
                email: {
                  in: DISPATCH_TEST_FO_PROFILES.map((p) => p.email),
                },
              },
            },
            select: { id: true, user: { select: { email: true } } },
          })
        ).map((r) => [r.user!.email, r.id]),
      );

      const tulsaCentral = byEmail["test.fo.tulsa.central@example.com"];
      const tulsaSouth = byEmail["test.fo.tulsa.south@example.com"];
      const brokenArrow = byEmail["test.fo.brokenarrow@example.com"];

      const m74103 = await foService.matchFOs({
        lat: 36.1549,
        lng: -95.9928,
        ...job,
      });
      expect(m74103.some((m) => m.id === tulsaCentral)).toBe(true);

      const m74133 = await foService.matchFOs({
        lat: 36.0971,
        lng: -95.8872,
        ...job,
      });
      expect(m74133.some((m) => m.id === tulsaSouth)).toBe(true);

      const m74012 = await foService.matchFOs({
        lat: 36.052,
        lng: -95.797,
        ...job,
      });
      expect(m74012.some((m) => m.id === brokenArrow)).toBe(true);
    });

    it("stores expected service ZIP lists in bio markers", async () => {
      await seedDispatchTestFranchiseOwners(prisma);
      for (const profile of DISPATCH_TEST_FO_PROFILES) {
        const fo = await prisma.franchiseOwner.findFirstOrThrow({
          where: { user: { email: profile.email } },
          select: { bio: true },
        });
        const zips = parseDispatchTestFoZipsFromBio(fo.bio);
        expect(zips.sort().join(",")).toBe(
          [...profile.serviceZips].sort().join(","),
        );
      }
    });
  },
);
