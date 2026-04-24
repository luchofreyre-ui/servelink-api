import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import {
  DISPATCH_TEST_FO_PROFILES,
  parseDispatchTestFoZipsFromBio,
} from "../src/dev/dispatchTestFoProfiles";
import {
  activationEvaluationFromFranchiseOwnerRow,
  loadFranchiseOwnerForActivationCheck,
} from "../src/modules/fo/fo-activation-guard";
import { FoService } from "../src/modules/fo/fo.service";

const JOB = {
  squareFootage: 2000,
  estimatedLaborMinutes: 240,
  recommendedTeamSize: 2,
  serviceType: "deep_clean",
  limit: 25,
} as const;

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  await prisma.$connect();
  const foService = new FoService(prisma as never);

  try {
    const emails = DISPATCH_TEST_FO_PROFILES.map((p) => p.email);
    const rows = await prisma.franchiseOwner.findMany({
      where: { user: { email: { in: emails } } },
      include: {
        user: { select: { email: true, phone: true } },
        provider: { select: { id: true, userId: true } },
        _count: { select: { foSchedules: true } },
      },
    });

    if (rows.length !== DISPATCH_TEST_FO_PROFILES.length) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            error: "DISPATCH_TEST_FO_COUNT_MISMATCH",
            expected: DISPATCH_TEST_FO_PROFILES.length,
            found: rows.length,
            hint: "Run npm run seed:fo:test",
          },
          null,
          2,
        ),
      );
      process.exit(2);
    }

    const byEmail = new Map(rows.map((r) => [r.user!.email, r] as const));

    for (const profile of DISPATCH_TEST_FO_PROFILES) {
      const fo = byEmail.get(profile.email);
      if (!fo) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "MISSING_PROFILE",
            email: profile.email,
            hint: "Run npm run seed:fo:test",
          }),
          null,
          2,
        );
        process.exit(2);
      }

      if (fo.status !== "active" || fo.safetyHold) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "FO_NOT_ACTIVE",
            foId: fo.id,
            status: fo.status,
            safetyHold: fo.safetyHold,
          }),
          null,
          2,
        );
        process.exit(2);
      }

      if (fo._count.foSchedules < 1) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "FO_NO_SCHEDULE",
            foId: fo.id,
          }),
          null,
          2,
        );
        process.exit(2);
      }

      if (!fo.providerId || fo.provider?.userId !== fo.userId) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "FO_PROVIDER_INVALID",
            foId: fo.id,
          }),
          null,
          2,
        );
        process.exit(2);
      }

      const zips = parseDispatchTestFoZipsFromBio(fo.bio);
      const want = [...profile.serviceZips].sort().join(",");
      const got = [...zips].sort().join(",");
      if (want !== got) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "FO_ZIP_TAG_MISMATCH",
            foId: fo.id,
            want,
            got,
          }),
          null,
          2,
        );
        process.exit(2);
      }

      const activationRow = await loadFranchiseOwnerForActivationCheck(
        prisma,
        { id: fo.id },
      );
      if (!activationRow) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "FO_ACTIVATION_LOAD_FAILED",
            foId: fo.id,
          }),
          null,
          2,
        );
        process.exit(2);
      }
      const activation = activationEvaluationFromFranchiseOwnerRow(
        activationRow,
      );
      if (!activation.ok) {
        console.log(
          JSON.stringify({
            ok: false,
            error: "FO_ACTIVATION_BLOCKED",
            foId: fo.id,
            email: profile.email,
            reasons: activation.reasons,
          }),
          null,
          2,
        );
        process.exit(2);
      }
    }

    const tulsaCentral = byEmail.get("test.fo.tulsa.central@example.com")!;
    const tulsaSouth = byEmail.get("test.fo.tulsa.south@example.com")!;
    const brokenArrow = byEmail.get("test.fo.brokenarrow@example.com")!;

    const at74103 = await foService.matchFOs({
      lat: 36.1549,
      lng: -95.9928,
      ...JOB,
    });
    if (!at74103.some((m) => m.id === tulsaCentral.id)) {
      console.log(
        JSON.stringify({
          ok: false,
          error: "MATCHFOS_MISSING_TULSA_CENTRAL_AT_74103",
          matchedIds: at74103.map((m) => m.id),
        }),
        null,
        2,
      );
      process.exit(2);
    }

    const at74133 = await foService.matchFOs({
      lat: 36.0971,
      lng: -95.8872,
      ...JOB,
    });
    if (!at74133.some((m) => m.id === tulsaSouth.id)) {
      console.log(
        JSON.stringify({
          ok: false,
          error: "MATCHFOS_MISSING_TULSA_SOUTH_AT_74133",
          matchedIds: at74133.map((m) => m.id),
        }),
        null,
        2,
      );
      process.exit(2);
    }

    const at74012 = await foService.matchFOs({
      lat: 36.052,
      lng: -95.797,
      ...JOB,
    });
    if (!at74012.some((m) => m.id === brokenArrow.id)) {
      console.log(
        JSON.stringify({
          ok: false,
          error: "MATCHFOS_MISSING_BROKEN_ARROW_AT_74012",
          matchedIds: at74012.map((m) => m.id),
        }),
        null,
        2,
      );
      process.exit(2);
    }

    console.log(
      JSON.stringify(
        {
          ok: true,
          count: rows.length,
          franchiseOwners: DISPATCH_TEST_FO_PROFILES.map((p) => {
            const fo = byEmail.get(p.email)!;
            return {
              key: p.key,
              id: fo.id,
              email: p.email,
              displayName: fo.displayName,
              serviceZips: p.serviceZips,
              scheduleRowCount: fo._count.foSchedules,
            };
          }),
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
