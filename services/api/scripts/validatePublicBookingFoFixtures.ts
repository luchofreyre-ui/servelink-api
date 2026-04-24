import "dotenv/config";

import { BookingStatus, PrismaClient } from "@prisma/client";

import {
  publicBookingFixtureFoEmails,
} from "../src/dev/publicBookingFoFixtures";
import { FoService } from "../src/modules/fo/fo.service";
import { SlotAvailabilityService } from "../src/modules/slot-holds/slot-availability.service";
import { PublicBookingOrchestratorService } from "../src/modules/public-booking-orchestrator/public-booking-orchestrator.service";

const CORE = { lat: 36.1546, lng: -95.9938 };
const EDGE = { lat: 36.199, lng: -95.99277 };
const FAR = { lat: 37.6872, lng: -97.3301 };

const JOB = {
  squareFootage: 1500,
  estimatedLaborMinutes: 220,
  recommendedTeamSize: 2,
  limit: 20,
};

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const foSvc = new FoService(prisma as never);
  const slotAv = new SlotAvailabilityService(prisma as never);

  const emails = Object.values(publicBookingFixtureFoEmails);
  const rows = await prisma.franchiseOwner.findMany({
    where: { user: { email: { in: emails } } },
    select: { id: true, user: { select: { email: true } } },
  });
  const byEmail = new Map(rows.map((r) => [r.user!.email, r.id] as const));
  const IDS = {
    baseline: byEmail.get(publicBookingFixtureFoEmails.baseline),
    limitedTravel: byEmail.get(publicBookingFixtureFoEmails.limitedTravel),
    slotConstrained: byEmail.get(publicBookingFixtureFoEmails.slotConstrained),
    moveOnly: byEmail.get(publicBookingFixtureFoEmails.moveOnly),
  };
  if (!IDS.baseline || !IDS.limitedTravel || !IDS.slotConstrained || !IDS.moveOnly) {
    console.log(
      JSON.stringify({
        error: "MISSING_FIXTURE_FOS",
        hint: "Run npm run seed:public-booking-fo-fixtures first.",
        resolved: IDS,
      }),
    );
    await prisma.$disconnect();
    process.exit(2);
  }

  const fixtureIdList: string[] = [
    IDS.baseline,
    IDS.limitedTravel,
    IDS.slotConstrained,
    IDS.moveOnly,
  ];

  /** Exclude parallel `seed:fo-production-readiness` cohort from this count. */
  const activeOther = await prisma.franchiseOwner.count({
    where: {
      status: "active",
      safetyHold: false,
      id: { notIn: fixtureIdList },
      NOT: {
        user: {
          email: { startsWith: "fo_readiness_" },
        },
      },
    },
  });

  const match = (lat: number, lng: number, serviceType: string) =>
    foSvc
      .matchFOs({ lat, lng, ...JOB, serviceType })
      .then((m) => m.map((x) => x.id));

  /** Controlled-matrix assertions ignore parallel `fo_readiness_*` supply rows. */
  const fixtureOnly = (ids: string[]) => ids.filter((id) => fixtureIdList.includes(id));

  const coreMaintRaw = await match(CORE.lat, CORE.lng, "maintenance");
  const coreMaint = fixtureOnly(coreMaintRaw);
  const coreMoveInRaw = await match(CORE.lat, CORE.lng, "move_in");
  const edgeMaintRaw = await match(EDGE.lat, EDGE.lng, "maintenance");
  const edgeMaint = fixtureOnly(edgeMaintRaw);
  const farMaint = await match(FAR.lat, FAR.lng, "maintenance");

  const rangeStart = new Date();
  rangeStart.setUTCHours(0, 0, 0, 0);
  const rangeEnd = new Date(rangeStart);
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + 14);
  const durationMinutes = 180;
  const winsBaseline = await slotAv.listAvailableWindows({
    foId: IDS.baseline,
    rangeStart,
    rangeEnd,
    durationMinutes,
  });
  const winsSlot = await slotAv.listAvailableWindows({
    foId: IDS.slotConstrained,
    rangeStart,
    rangeEnd,
    durationMinutes,
  });

  const orchestratorPrisma = (
    siteLat: number | null,
    siteLng: number | null,
  ) =>
    ({
      booking: {
        findUnique: async () => ({
          id: "bk_validate_fixture_matrix",
          status: BookingStatus.pending_payment,
          foId: null,
          preferredFoId: null,
          scheduledStart: null,
          estimatedHours: 3,
          siteLat,
          siteLng,
          estimateSnapshot: {
            outputJson: JSON.stringify({
              estimateMinutes: 180,
              recommendedTeamSize: 2,
            }),
            inputJson: JSON.stringify({
              sqft_band: "1200_1599",
              service_type: "maintenance",
            }),
          },
        }),
      },
    }) as never;

  const orchFar = new PublicBookingOrchestratorService(
    orchestratorPrisma(FAR.lat, FAR.lng),
    slotAv,
    {} as never,
    {} as never,
    foSvc,
    { ensurePublicDepositResolvedBeforeConfirm: async () => undefined } as never,
  );
  const resFar = await orchFar.availability({
    bookingId: "bk_validate_fixture_matrix",
  });

  const orchNoSite = new PublicBookingOrchestratorService(
    orchestratorPrisma(null, null),
    slotAv,
    {} as never,
    {} as never,
    foSvc,
    { ensurePublicDepositResolvedBeforeConfirm: async () => undefined } as never,
  );
  const resNoSite = await orchNoSite.availability({
    bookingId: "bk_validate_fixture_matrix",
  });

  const onlyFixtureIds = (ids: string[]) =>
    ids.every((id) => fixtureIdList.includes(id));

  const tests = {
    "1_core_maintenance": {
      pass:
        coreMaint.includes(IDS.baseline) &&
        coreMaint.includes(IDS.limitedTravel) &&
        coreMaint.includes(IDS.slotConstrained) &&
        !coreMaint.includes(IDS.moveOnly) &&
        onlyFixtureIds(coreMaint),
      ids: coreMaint,
    },
    "2_edge_maintenance": {
      pass:
        edgeMaint.includes(IDS.baseline) &&
        !edgeMaint.includes(IDS.limitedTravel) &&
        edgeMaint.includes(IDS.slotConstrained) &&
        !edgeMaint.includes(IDS.moveOnly) &&
        onlyFixtureIds(edgeMaint),
      ids: edgeMaint,
    },
    "3_far_match_empty": { pass: farMaint.length === 0, ids: farMaint },
    "3b_orchestrator_far": {
      pass:
        (resFar as { unavailableReason?: { code?: string } }).unavailableReason
          ?.code === "PUBLIC_BOOKING_NO_FO_CANDIDATES",
      code: (resFar as { unavailableReason?: { code?: string } }).unavailableReason
        ?.code,
    },
    "4_null_site_orchestrator": {
      pass:
        (resNoSite as { unavailableReason?: { code?: string } }).unavailableReason
          ?.code === "PUBLIC_BOOKING_LOCATION_NOT_RESOLVED",
      code: (resNoSite as { unavailableReason?: { code?: string } }).unavailableReason
        ?.code,
    },
    "5_service_type": {
      pass:
        !coreMaint.includes(IDS.moveOnly) &&
        coreMoveInRaw.includes(IDS.moveOnly),
      coreMaint,
      coreMoveIn: coreMoveInRaw,
    },
    "6_slot_scarcity": {
      pass: winsSlot.length < winsBaseline.length && winsSlot.length > 0,
      winsBaseline: winsBaseline.length,
      winsSlot: winsSlot.length,
    },
    "7_no_extra_active_fos": {
      pass: activeOther === 0,
      activeNonFixtureCount: activeOther,
    },
  };

  const passed = Object.entries(tests)
    .filter(([, v]) => (v as { pass: boolean }).pass)
    .map(([k]) => k);
  const failed = Object.entries(tests)
    .filter(([, v]) => !(v as { pass: boolean }).pass)
    .map(([k]) => k);

  console.log(
    JSON.stringify(
      {
        passed,
        failed,
        notRun: ["team_slot_confirm_web_flow"],
        tests,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
