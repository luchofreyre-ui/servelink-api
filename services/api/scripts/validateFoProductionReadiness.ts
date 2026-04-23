import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { foProductionReadinessEmails } from "../src/dev/foProductionReadinessSeed";
import { PUBLIC_BOOKING_FIXTURE_HUB } from "../src/dev/publicBookingFoFixtures";
import { FoService } from "../src/modules/fo/fo.service";
import { evaluateFoSupplyReadiness } from "../src/modules/fo/fo-supply-readiness";

type DiagnosticRow = {
  profile: string;
  email: string;
  foId: string;
  supplyOk: boolean;
  supplyReasons: string[];
  eligibility: { canAcceptBooking: boolean; reasons: string[] };
};

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const foSvc = new FoService(prisma as never);
  await prisma.$connect();

  const diagnostics: DiagnosticRow[] = [];
  const resolved: Record<string, string> = {};
  const profiles: { key: string; email: string }[] = [
    { key: "valid", email: foProductionReadinessEmails.valid },
    { key: "missingSchedule", email: foProductionReadinessEmails.missingSchedule },
    { key: "badGeography", email: foProductionReadinessEmails.badGeography },
    { key: "wrongServiceTypes", email: foProductionReadinessEmails.wrongServiceTypes },
    { key: "inactive", email: foProductionReadinessEmails.inactive },
    { key: "edgeValid", email: foProductionReadinessEmails.edgeValid },
  ];

  try {
    for (const { key, email } of profiles) {
      const row = await prisma.franchiseOwner.findFirst({
        where: { user: { email } },
        include: { _count: { select: { foSchedules: true } } },
      });
      if (!row) {
        console.error(
          JSON.stringify({
            error: "MISSING_READINESS_FO",
            profile: key,
            email,
            hint: "Run npm run seed:fo-production-readiness first.",
          }),
        );
        process.exit(2);
      }

      resolved[key] = row.id;

      const supply = evaluateFoSupplyReadiness({
        homeLat: row.homeLat,
        homeLng: row.homeLng,
        maxTravelMinutes: row.maxTravelMinutes,
        maxDailyLaborMinutes: row.maxDailyLaborMinutes,
        maxLaborMinutes: row.maxLaborMinutes,
        maxSquareFootage: row.maxSquareFootage,
        scheduleRowCount: row._count.foSchedules,
      });

      const eligibility = await foSvc.getEligibility(row.id);

      diagnostics.push({
        profile: key,
        email,
        foId: row.id,
        supplyOk: supply.ok,
        supplyReasons: supply.reasons,
        eligibility,
      });
    }

    const hub = PUBLIC_BOOKING_FIXTURE_HUB;
    const job = {
      lat: hub.lat,
      lng: hub.lng,
      squareFootage: 1500,
      estimatedLaborMinutes: 200,
      recommendedTeamSize: 2,
      limit: 20,
    };

    const maint = await foSvc.matchFOs({ ...job, serviceType: "maintenance" });
    const moveIn = await foSvc.matchFOs({ ...job, serviceType: "move_in" });

    const failures: string[] = [];

    if (!diagnostics.find((d) => d.profile === "valid")?.supplyOk) {
      failures.push("valid FO should pass supply readiness");
    }
    if (
      !diagnostics
        .find((d) => d.profile === "missingSchedule")
        ?.supplyReasons.includes("FO_NO_SCHEDULING_SOURCE")
    ) {
      failures.push("missingSchedule should report FO_NO_SCHEDULING_SOURCE");
    }
    if (
      !diagnostics
        .find((d) => d.profile === "badGeography")
        ?.supplyReasons.includes("FO_INVALID_TRAVEL_CONSTRAINT")
    ) {
      failures.push("badGeography should report FO_INVALID_TRAVEL_CONSTRAINT");
    }
    if (
      !diagnostics
        .find((d) => d.profile === "inactive")
        ?.eligibility.reasons.includes("FO_NOT_ACTIVE")
    ) {
      failures.push("inactive FO eligibility should include FO_NOT_ACTIVE");
    }

    if (!maint.some((m) => m.id === resolved.valid)) {
      failures.push("maintenance match should include readiness valid FO");
    }
    if (maint.some((m) => m.id === resolved.missingSchedule)) {
      failures.push("maintenance match must exclude schedule-less FO");
    }
    if (maint.some((m) => m.id === resolved.badGeography)) {
      failures.push("maintenance match must exclude bad-travel FO");
    }
    if (maint.some((m) => m.id === resolved.wrongServiceTypes)) {
      failures.push("maintenance match must exclude move-only whitelist FO");
    }
    if (maint.some((m) => m.id === resolved.inactive)) {
      failures.push("maintenance match must exclude paused FO");
    }

    if (!moveIn.some((m) => m.id === resolved.wrongServiceTypes)) {
      failures.push("move_in match should include move-only whitelist FO");
    }

    const out = {
      diagnostics,
      matchMaintenanceIds: maint.map((m) => m.id),
      matchMoveInIds: moveIn.map((m) => m.id),
      failures,
      pass: failures.length === 0,
    };

    console.log(JSON.stringify(out, null, 2));
    process.exit(failures.length ? 1 : 0);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
