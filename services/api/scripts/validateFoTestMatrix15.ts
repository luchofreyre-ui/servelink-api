import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { foTestMatrix15Emails } from "../src/dev/foTestMatrix15Seed";
import { evaluateFoExecutionReadiness } from "../src/modules/fo/fo-execution-readiness";
import { evaluateFoSupplyReadiness } from "../src/modules/fo/fo-supply-readiness";
import { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";

/** Tulsa core job site — aligns with seed cohort “74120 band”. */
const TULSA_CORE_JOB = { lat: 36.1361, lng: -95.9184 };
/** Near TEST FO 04 home (edge cohort) — should pull FO04 in when travel allows. */
const NEAR_FO04_JOB = { lat: 36.212, lng: -95.921 };

const JOB = {
  squareFootage: 2200,
  estimatedLaborMinutes: 320,
  recommendedTeamSize: 2,
  limit: 50,
};

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const foSvc = new FoService(prisma as never);
  const slotAv = new SlotAvailabilityService(prisma as never);

  const emailList = [
    foTestMatrix15Emails.p01,
    foTestMatrix15Emails.p02,
    foTestMatrix15Emails.p03,
    foTestMatrix15Emails.p04,
    foTestMatrix15Emails.p05,
    foTestMatrix15Emails.p06,
    foTestMatrix15Emails.p07,
    foTestMatrix15Emails.p08,
    foTestMatrix15Emails.p09,
    foTestMatrix15Emails.p10,
    foTestMatrix15Emails.p11,
    foTestMatrix15Emails.p12,
    foTestMatrix15Emails.p13,
    foTestMatrix15Emails.p14,
    foTestMatrix15Emails.p15,
  ];

  const rows = await prisma.franchiseOwner.findMany({
    where: { user: { email: { in: emailList } } },
    select: { id: true, user: { select: { email: true } } },
  });
  const byEmail = new Map(rows.map((r) => [r.user!.email, r.id] as const));

  const IDS = {
    p01: byEmail.get(foTestMatrix15Emails.p01),
    p02: byEmail.get(foTestMatrix15Emails.p02),
    p03: byEmail.get(foTestMatrix15Emails.p03),
    p04: byEmail.get(foTestMatrix15Emails.p04),
    p05: byEmail.get(foTestMatrix15Emails.p05),
    p06: byEmail.get(foTestMatrix15Emails.p06),
    p07: byEmail.get(foTestMatrix15Emails.p07),
    p08: byEmail.get(foTestMatrix15Emails.p08),
    p09: byEmail.get(foTestMatrix15Emails.p09),
    p10: byEmail.get(foTestMatrix15Emails.p10),
    p11: byEmail.get(foTestMatrix15Emails.p11),
    p12: byEmail.get(foTestMatrix15Emails.p12),
    p13: byEmail.get(foTestMatrix15Emails.p13),
    p14: byEmail.get(foTestMatrix15Emails.p14),
    p15: byEmail.get(foTestMatrix15Emails.p15),
  };

  const failures: string[] = [];
  const missing = Object.entries(IDS).filter(([, v]) => !v);
  if (missing.length) {
    console.log(
      JSON.stringify({
        error: "MISSING_MATRIX_FOS",
        missing: missing.map(([k]) => k),
        hint: "Run npm run seed:fo-test-matrix-15 first.",
      }),
    );
    await prisma.$disconnect();
    process.exit(2);
  }

  const matrixIdSet = new Set(Object.values(IDS) as string[]);

  const matrixOnly = (ids: string[]) => ids.filter((id) => matrixIdSet.has(id));

  const matchDeep = (lat: number, lng: number) =>
    foSvc
      .matchFOs({
        lat,
        lng,
        ...JOB,
        serviceType: "deep_clean",
      })
      .then((m) => matrixOnly(m.map((x) => x.id)));

  const coreIds = await matchDeep(TULSA_CORE_JOB.lat, TULSA_CORE_JOB.lng);
  const baselineInCore = [IDS.p01!, IDS.p02!, IDS.p03!].filter((id) =>
    coreIds.includes(id),
  );
  if (baselineInCore.length < 3) {
    failures.push(
      `expected ≥3 Tulsa core baselines (p01–p03) in deep_clean match at core; got ${baselineInCore.length}`,
    );
  }

  if (coreIds.includes(IDS.p07!)) {
    failures.push("move-only FO (p07) must not match deep_clean at Tulsa core");
  }
  if (coreIds.includes(IDS.p08!)) {
    failures.push("maintenance-only FO (p08) must not match deep_clean at Tulsa core");
  }
  if (!coreIds.includes(IDS.p09!)) {
    failures.push("mixed-services FO (p09) must match deep_clean at Tulsa core");
  }

  const p10 = await prisma.franchiseOwner.findUnique({
    where: { id: IDS.p10! },
    include: { _count: { select: { foSchedules: true } } },
  });
  if (!p10 || p10._count.foSchedules !== 0) {
    failures.push("p10 must have zero schedule rows");
  } else {
    const s10 = evaluateFoSupplyReadiness({
      homeLat: p10.homeLat,
      homeLng: p10.homeLng,
      maxTravelMinutes: p10.maxTravelMinutes,
      maxDailyLaborMinutes: p10.maxDailyLaborMinutes,
      maxLaborMinutes: p10.maxLaborMinutes,
      maxSquareFootage: p10.maxSquareFootage,
      scheduleRowCount: p10._count.foSchedules,
    });
    if (!s10.reasons.includes("FO_NO_SCHEDULING_SOURCE")) {
      failures.push(
        `p10 supply must include FO_NO_SCHEDULING_SOURCE; got ${JSON.stringify(s10.reasons)}`,
      );
    }
  }

  const p11 = await prisma.franchiseOwner.findUnique({
    where: { id: IDS.p11! },
    include: { _count: { select: { foSchedules: true } } },
  });
  if (p11) {
    const s11 = evaluateFoSupplyReadiness({
      homeLat: p11.homeLat,
      homeLng: p11.homeLng,
      maxTravelMinutes: p11.maxTravelMinutes,
      maxDailyLaborMinutes: p11.maxDailyLaborMinutes,
      maxLaborMinutes: p11.maxLaborMinutes,
      maxSquareFootage: p11.maxSquareFootage,
      scheduleRowCount: p11._count.foSchedules,
    });
    if (!s11.reasons.includes("FO_INVALID_TRAVEL_CONSTRAINT")) {
      failures.push(
        `p11 supply must include FO_INVALID_TRAVEL_CONSTRAINT; got ${JSON.stringify(s11.reasons)}`,
      );
    }
  }

  const p12 = await prisma.franchiseOwner.findUnique({
    where: { id: IDS.p12! },
    include: { provider: { select: { userId: true } } },
  });
  if (p12) {
    const ex = evaluateFoExecutionReadiness({
      franchiseOwnerUserId: p12.userId,
      providerId: p12.providerId,
      providerUserId: p12.provider?.userId,
    });
    if (ex.ok || ex.reasons.length === 0) {
      failures.push(
        `p12 execution must fail (missing/invalid provider); got ${JSON.stringify(ex)}`,
      );
    }
  }

  if (coreIds.includes(IDS.p14!)) {
    failures.push("paused FO (p14) must be excluded from deep_clean match");
  }
  if (coreIds.includes(IDS.p15!)) {
    failures.push("safety-hold FO (p15) must be excluded from deep_clean match");
  }

  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 14);
  const durationMinutes = 240;
  const winsBaseline = await slotAv.listAvailableWindows({
    foId: IDS.p01!,
    rangeStart,
    rangeEnd,
    durationMinutes,
  });
  const winsSlot = await slotAv.listAvailableWindows({
    foId: IDS.p05!,
    rangeStart,
    rangeEnd,
    durationMinutes,
  });
  if (!(winsSlot.length < winsBaseline.length && winsSlot.length > 0)) {
    failures.push(
      `slot-constrained FO (p05) should have fewer ${durationMinutes}m windows than baseline p01 and at least one window (baseline=${winsBaseline.length} slot=${winsSlot.length})`,
    );
  }

  const nearIds = await matchDeep(NEAR_FO04_JOB.lat, NEAR_FO04_JOB.lng);
  if (!nearIds.includes(IDS.p04!)) {
    failures.push("FO04 should match deep_clean near its home (near-FO04 job point)");
  }
  if (!coreIds.includes(IDS.p01!)) {
    failures.push("baseline p01 must still match at Tulsa core");
  }
  if (coreIds.includes(IDS.p04!)) {
    failures.push(
      "FO04 (tight maxTravel, remote home) should not match deep_clean at Tulsa core",
    );
  }

  const out = {
    failures,
    pass: failures.length === 0,
    checks: {
      coreDeepCleanIds: coreIds,
      nearFo04DeepCleanIds: nearIds,
      slotWindowsBaseline: winsBaseline.length,
      slotWindowsConstrained: winsSlot.length,
    },
  };

  console.log(JSON.stringify(out, null, 2));
  await prisma.$disconnect();
  process.exit(failures.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
