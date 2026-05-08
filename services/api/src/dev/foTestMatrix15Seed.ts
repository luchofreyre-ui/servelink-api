/**
 * Controlled 15-profile FO cohort for supply / readiness / execution / matching tests.
 * Isolated email prefix `fo_test_matrix15_*@servelink.test` — safe to query and purge.
 *
 * `pauseNonMatrix`: when true, pauses every FranchiseOwner whose user email does NOT start
 * with `fo_test_matrix15_`. Default false (does not touch other cohorts).
 */

import { BookingStatus, type PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

import { ensureProviderForFranchiseOwner } from "../modules/fo/fo-provider-sync";
import { setBookingWindowFromDuration } from "../modules/bookings/booking-window-mutation";

export const FO_TEST_MATRIX15_MARKER = "fo_test_matrix15" as const;
export const FO_TEST_MATRIX15_SLOT_NOTE = "FO_TEST_MATRIX15_SLOT_BLOCK" as const;
export const FO_TEST_MATRIX15_PASSWORD = "Matrix15Test!2026" as const;

/** Stable synthetic emails (p01–p15) + slot-block customer. */
export const foTestMatrix15Emails = {
  p01: `${FO_TEST_MATRIX15_MARKER}_p01@servelink.test`,
  p02: `${FO_TEST_MATRIX15_MARKER}_p02@servelink.test`,
  p03: `${FO_TEST_MATRIX15_MARKER}_p03@servelink.test`,
  p04: `${FO_TEST_MATRIX15_MARKER}_p04@servelink.test`,
  p05: `${FO_TEST_MATRIX15_MARKER}_p05@servelink.test`,
  p06: `${FO_TEST_MATRIX15_MARKER}_p06@servelink.test`,
  p07: `${FO_TEST_MATRIX15_MARKER}_p07@servelink.test`,
  p08: `${FO_TEST_MATRIX15_MARKER}_p08@servelink.test`,
  p09: `${FO_TEST_MATRIX15_MARKER}_p09@servelink.test`,
  p10: `${FO_TEST_MATRIX15_MARKER}_p10@servelink.test`,
  p11: `${FO_TEST_MATRIX15_MARKER}_p11@servelink.test`,
  p12: `${FO_TEST_MATRIX15_MARKER}_p12@servelink.test`,
  p13: `${FO_TEST_MATRIX15_MARKER}_p13@servelink.test`,
  p14: `${FO_TEST_MATRIX15_MARKER}_p14@servelink.test`,
  p15: `${FO_TEST_MATRIX15_MARKER}_p15@servelink.test`,
  slotCustomer: `${FO_TEST_MATRIX15_MARKER}_slot_customer@servelink.test`,
} as const;

/** Tulsa-area coordinates (realistic; ~74120 / midtown–east Tulsa band). */
const TULSA_CORE_A = { lat: 36.1361, lng: -95.9184 } as const;
const TULSA_CORE_B = { lat: 36.1418, lng: -95.9102 } as const;
const TULSA_CORE_C = { lat: 36.1284, lng: -95.9249 } as const;
/** ~11 km NNE of core — used with tight maxTravel for edge behavior. */
const TULSA_EDGE_HOME = { lat: 36.2145, lng: -95.9228 } as const;

export type FoTestMatrix15SeedOptions = {
  /** When true, pauses all FOs whose user email does not start with `fo_test_matrix15_`. Default false. */
  pauseNonMatrix?: boolean;
};

type ScheduleRow = { dayOfWeek: number; startTime: string; endTime: string };

const SCHED_BASELINE_A: ScheduleRow[] = [
  { dayOfWeek: 1, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 2, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 3, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 4, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 5, startTime: "08:00", endTime: "12:00" },
  { dayOfWeek: 6, startTime: "09:00", endTime: "13:00" },
];

const SCHED_BASELINE_B: ScheduleRow[] = [
  { dayOfWeek: 1, startTime: "13:00", endTime: "17:00" },
  { dayOfWeek: 2, startTime: "13:00", endTime: "17:00" },
  { dayOfWeek: 3, startTime: "13:00", endTime: "17:00" },
  { dayOfWeek: 4, startTime: "13:00", endTime: "17:00" },
  { dayOfWeek: 5, startTime: "13:00", endTime: "17:00" },
  { dayOfWeek: 6, startTime: "10:00", endTime: "14:00" },
];

const SCHED_BASELINE_C: ScheduleRow[] = [
  { dayOfWeek: 0, startTime: "10:00", endTime: "14:00" },
  { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
  { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
];

/** Wide rows but FO05 gets heavy synthetic booking blocks elsewhere. */
const SCHED_SLOT_CONSTRAINED: ScheduleRow[] = [
  { dayOfWeek: 0, startTime: "06:00", endTime: "22:00" },
  { dayOfWeek: 1, startTime: "06:00", endTime: "22:00" },
  { dayOfWeek: 2, startTime: "06:00", endTime: "22:00" },
  { dayOfWeek: 3, startTime: "06:00", endTime: "22:00" },
  { dayOfWeek: 4, startTime: "06:00", endTime: "22:00" },
  { dayOfWeek: 5, startTime: "06:00", endTime: "22:00" },
  { dayOfWeek: 6, startTime: "08:00", endTime: "20:00" },
];

const SCHED_EDGE_VALID: ScheduleRow[] = [
  { dayOfWeek: 1, startTime: "10:00", endTime: "14:00" },
  { dayOfWeek: 3, startTime: "10:00", endTime: "14:00" },
  { dayOfWeek: 5, startTime: "10:00", endTime: "14:00" },
];

const SCHED_STANDARD_WEEK: ScheduleRow[] = [
  { dayOfWeek: 0, startTime: "09:00", endTime: "15:00" },
  { dayOfWeek: 1, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 2, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 3, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 4, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 5, startTime: "08:00", endTime: "17:00" },
  { dayOfWeek: 6, startTime: "09:00", endTime: "15:00" },
];

async function upsertFoUser(
  prisma: PrismaClient,
  email: string,
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: "fo" },
    update: {},
  });
}

async function replaceSchedule(
  prisma: PrismaClient,
  franchiseOwnerId: string,
  rows: ScheduleRow[],
): Promise<void> {
  await prisma.foSchedule.deleteMany({ where: { franchiseOwnerId } });
  if (rows.length === 0) return;
  await prisma.foSchedule.createMany({
    data: rows.map((r) => ({ franchiseOwnerId, ...r })),
  });
}

type MatrixFoPatch = {
  homeLat?: number | null;
  homeLng?: number | null;
  maxTravelMinutes?: number | null;
  maxSquareFootage?: number | null;
  maxLaborMinutes?: number | null;
  maxDailyLaborMinutes?: number | null;
  teamSize?: number;
  matchableServiceTypes?: string[];
};

async function upsertOnboardingFo(
  prisma: PrismaClient,
  userId: string,
  displayName: string,
  patch: MatrixFoPatch,
): Promise<{ id: string }> {
  const teamSize = patch.teamSize !== undefined ? patch.teamSize : 3;
  const maxSquareFootage =
    patch.maxSquareFootage !== undefined ? patch.maxSquareFootage : 5000;
  const maxLaborMinutes =
    patch.maxLaborMinutes !== undefined ? patch.maxLaborMinutes : 960;
  const maxDailyLaborMinutes =
    patch.maxDailyLaborMinutes !== undefined ? patch.maxDailyLaborMinutes : 960;
  const maxTravelMinutes =
    patch.maxTravelMinutes !== undefined ? patch.maxTravelMinutes : 60;
  const matchableServiceTypes =
    patch.matchableServiceTypes !== undefined
      ? patch.matchableServiceTypes
      : ["deep_clean"];

  return prisma.franchiseOwner.upsert({
    where: { userId },
    create: {
      userId,
      status: "onboarding",
      displayName,
      safetyHold: false,
      teamSize,
      maxSquareFootage,
      maxLaborMinutes,
      maxDailyLaborMinutes,
      homeLat: patch.homeLat ?? null,
      homeLng: patch.homeLng ?? null,
      maxTravelMinutes,
      matchableServiceTypes,
    },
    update: {
      displayName,
      safetyHold: false,
      teamSize,
      maxSquareFootage,
      maxLaborMinutes,
      maxDailyLaborMinutes,
      homeLat: patch.homeLat ?? null,
      homeLng: patch.homeLng ?? null,
      maxTravelMinutes,
      matchableServiceTypes,
      status: "onboarding",
    },
  });
}

async function activateAfterSupplyPrep(
  prisma: PrismaClient,
  foId: string,
): Promise<void> {
  await ensureProviderForFranchiseOwner(prisma, foId);
  await prisma.franchiseOwner.update({
    where: { id: foId },
    data: { status: "active" },
  });
}

async function seedSlotBlocks(
  prisma: PrismaClient,
  foId: string,
  customerId: string,
): Promise<number> {
  const prior = await prisma.booking.findMany({
    where: { notes: { contains: FO_TEST_MATRIX15_SLOT_NOTE } },
    select: { id: true },
  });
  const priorIds = prior.map((b) => b.id);
  if (priorIds.length > 0) {
    await prisma.bookingSlotHold.deleteMany({
      where: { bookingId: { in: priorIds } },
    });
    await prisma.booking.deleteMany({ where: { id: { in: priorIds } } });
  }

  const anchor = new Date();
  anchor.setUTCHours(0, 0, 0, 0);
  let n = 0;
  for (let d = 0; d < 14; d += 1) {
    const day = new Date(anchor);
    day.setUTCDate(anchor.getUTCDate() + d);
    const scheduledStart = new Date(day);
    scheduledStart.setUTCHours(8, 0, 0, 0);
    const window = setBookingWindowFromDuration({
      scheduledStart,
      estimatedHours: 12,
      estimateSnapshotOutputJson: null,
    });
    await prisma.booking.create({
      data: {
        customerId,
        foId,
        status: BookingStatus.pending_dispatch,
        hourlyRateCents: 7500,
        estimatedHours: 12,
        scheduledStart: window.scheduledStart,
        scheduledEnd: window.scheduledEnd,
        notes: `${FO_TEST_MATRIX15_SLOT_NOTE} day_index=${d}`,
      },
    });
    n += 1;
  }
  return n;
}

/**
 * Deletes the matrix cohort (bookings with slot marker, franchise owners, users).
 * Does not touch other `fo_*` cohorts.
 */
export async function purgeFoTestMatrix15(prisma: PrismaClient): Promise<void> {
  const fos = await prisma.franchiseOwner.findMany({
    where: { user: { email: { startsWith: `${FO_TEST_MATRIX15_MARKER}_` } } },
    select: { id: true },
  });
  const foIds = fos.map((f) => f.id);
  if (foIds.length > 0) {
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { notes: { contains: FO_TEST_MATRIX15_SLOT_NOTE } },
          { foId: { in: foIds } },
        ],
      },
    });
  } else {
    await prisma.booking.deleteMany({
      where: { notes: { contains: FO_TEST_MATRIX15_SLOT_NOTE } },
    });
  }
  await prisma.franchiseOwner.deleteMany({
    where: { user: { email: { startsWith: `${FO_TEST_MATRIX15_MARKER}_` } } },
  });
  await prisma.user.deleteMany({
    where: { email: { startsWith: `${FO_TEST_MATRIX15_MARKER}_` } },
  });
}

export type FoTestMatrix15SeedResult = {
  franchiseOwnerIds: Record<
    | "p01"
    | "p02"
    | "p03"
    | "p04"
    | "p05"
    | "p06"
    | "p07"
    | "p08"
    | "p09"
    | "p10"
    | "p11"
    | "p12"
    | "p13"
    | "p14"
    | "p15",
    string
  >;
  slotBlockBookingsCreated: number;
  pauseNonMatrixApplied: number;
};

export async function seedFoTestMatrix15(
  prisma: PrismaClient,
  options?: FoTestMatrix15SeedOptions,
): Promise<FoTestMatrix15SeedResult> {
  const pauseNonMatrix = Boolean(options?.pauseNonMatrix);
  const passwordHash = await bcrypt.hash(FO_TEST_MATRIX15_PASSWORD, 10);

  const ids: FoTestMatrix15SeedResult["franchiseOwnerIds"] = {} as FoTestMatrix15SeedResult["franchiseOwnerIds"];
  let slotBlockBookingsCreated = 0;

  const u01 = await upsertFoUser(prisma, foTestMatrix15Emails.p01, passwordHash);
  const fo01 = await upsertOnboardingFo(prisma, u01.id, "TEST FO 01 — Tulsa Core Baseline A", {
    homeLat: TULSA_CORE_A.lat,
    homeLng: TULSA_CORE_A.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo01.id, SCHED_BASELINE_A);
  await activateAfterSupplyPrep(prisma, fo01.id);
  ids.p01 = fo01.id;

  const u02 = await upsertFoUser(prisma, foTestMatrix15Emails.p02, passwordHash);
  const fo02 = await upsertOnboardingFo(prisma, u02.id, "TEST FO 02 — Tulsa Core Baseline B", {
    homeLat: TULSA_CORE_B.lat,
    homeLng: TULSA_CORE_B.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo02.id, SCHED_BASELINE_B);
  await activateAfterSupplyPrep(prisma, fo02.id);
  ids.p02 = fo02.id;

  const u03 = await upsertFoUser(prisma, foTestMatrix15Emails.p03, passwordHash);
  const fo03 = await upsertOnboardingFo(prisma, u03.id, "TEST FO 03 — Tulsa Core Baseline C", {
    homeLat: TULSA_CORE_C.lat,
    homeLng: TULSA_CORE_C.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo03.id, SCHED_BASELINE_C);
  await activateAfterSupplyPrep(prisma, fo03.id);
  ids.p03 = fo03.id;

  const u04 = await upsertFoUser(prisma, foTestMatrix15Emails.p04, passwordHash);
  const fo04 = await upsertOnboardingFo(prisma, u04.id, "TEST FO 04 — Tulsa Edge Travel", {
    homeLat: TULSA_EDGE_HOME.lat,
    homeLng: TULSA_EDGE_HOME.lng,
    maxTravelMinutes: 11,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo04.id, SCHED_STANDARD_WEEK);
  await activateAfterSupplyPrep(prisma, fo04.id);
  ids.p04 = fo04.id;

  const u05 = await upsertFoUser(prisma, foTestMatrix15Emails.p05, passwordHash);
  const fo05 = await upsertOnboardingFo(prisma, u05.id, "TEST FO 05 — Slot Constrained Deep Clean", {
    homeLat: TULSA_CORE_A.lat,
    homeLng: TULSA_CORE_A.lng,
    maxTravelMinutes: 60,
    maxDailyLaborMinutes: null,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo05.id, SCHED_SLOT_CONSTRAINED);
  await activateAfterSupplyPrep(prisma, fo05.id);
  const slotCust = await prisma.user.upsert({
    where: { email: foTestMatrix15Emails.slotCustomer },
    create: {
      email: foTestMatrix15Emails.slotCustomer,
      passwordHash,
      role: "customer",
    },
    update: {},
  });
  slotBlockBookingsCreated = await seedSlotBlocks(prisma, fo05.id, slotCust.id);
  ids.p05 = fo05.id;

  const u06 = await upsertFoUser(prisma, foTestMatrix15Emails.p06, passwordHash);
  const fo06 = await upsertOnboardingFo(prisma, u06.id, "TEST FO 06 — Edge Valid Capacity", {
    homeLat: TULSA_CORE_B.lat,
    homeLng: TULSA_CORE_B.lng,
    maxTravelMinutes: 60,
    maxSquareFootage: 2000,
    maxLaborMinutes: 1,
    maxDailyLaborMinutes: 1,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo06.id, SCHED_EDGE_VALID);
  await activateAfterSupplyPrep(prisma, fo06.id);
  ids.p06 = fo06.id;

  const u07 = await upsertFoUser(prisma, foTestMatrix15Emails.p07, passwordHash);
  const fo07 = await upsertOnboardingFo(prisma, u07.id, "TEST FO 07 — Move Only", {
    homeLat: TULSA_CORE_A.lat,
    homeLng: TULSA_CORE_A.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["move_in", "move_out"],
  });
  await replaceSchedule(prisma, fo07.id, SCHED_STANDARD_WEEK);
  await activateAfterSupplyPrep(prisma, fo07.id);
  ids.p07 = fo07.id;

  const u08 = await upsertFoUser(prisma, foTestMatrix15Emails.p08, passwordHash);
  const fo08 = await upsertOnboardingFo(
    prisma,
    u08.id,
    "TEST FO 08 — Maintenance-only (non–deep-clean restriction)",
    {
      homeLat: TULSA_CORE_C.lat,
      homeLng: TULSA_CORE_C.lng,
      maxTravelMinutes: 60,
      matchableServiceTypes: ["maintenance"],
    },
  );
  await replaceSchedule(prisma, fo08.id, SCHED_STANDARD_WEEK);
  await activateAfterSupplyPrep(prisma, fo08.id);
  ids.p08 = fo08.id;

  const u09 = await upsertFoUser(prisma, foTestMatrix15Emails.p09, passwordHash);
  const fo09 = await upsertOnboardingFo(prisma, u09.id, "TEST FO 09 — Mixed Services", {
    homeLat: TULSA_CORE_A.lat,
    homeLng: TULSA_CORE_A.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean", "maintenance"],
  });
  await replaceSchedule(prisma, fo09.id, SCHED_BASELINE_A);
  await activateAfterSupplyPrep(prisma, fo09.id);
  ids.p09 = fo09.id;

  const u10 = await upsertFoUser(prisma, foTestMatrix15Emails.p10, passwordHash);
  const fo10 = await upsertOnboardingFo(prisma, u10.id, "TEST FO 10 — No Schedule", {
    homeLat: TULSA_CORE_B.lat,
    homeLng: TULSA_CORE_B.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo10.id, []);
  await ensureProviderForFranchiseOwner(prisma, fo10.id);
  await prisma.$executeRawUnsafe(
    `UPDATE "FranchiseOwner" SET status = 'active' WHERE id = $1`,
    fo10.id,
  );
  ids.p10 = fo10.id;

  const u11 = await upsertFoUser(prisma, foTestMatrix15Emails.p11, passwordHash);
  const fo11 = await upsertOnboardingFo(prisma, u11.id, "TEST FO 11 — Bad Travel", {
    homeLat: TULSA_CORE_C.lat,
    homeLng: TULSA_CORE_C.lng,
    maxTravelMinutes: 0,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo11.id, SCHED_STANDARD_WEEK);
  await ensureProviderForFranchiseOwner(prisma, fo11.id);
  await prisma.$executeRawUnsafe(
    `UPDATE "FranchiseOwner" SET status = 'active', "maxTravelMinutes" = 0 WHERE id = $1`,
    fo11.id,
  );
  ids.p11 = fo11.id;

  const u12 = await upsertFoUser(prisma, foTestMatrix15Emails.p12, passwordHash);
  const fo12 = await upsertOnboardingFo(prisma, u12.id, "TEST FO 12 — Missing Provider Link", {
    homeLat: TULSA_CORE_A.lat,
    homeLng: TULSA_CORE_A.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo12.id, SCHED_STANDARD_WEEK);
  await prisma.$executeRawUnsafe(
    `UPDATE "FranchiseOwner" SET status = 'active', "providerId" = NULL WHERE id = $1`,
    fo12.id,
  );
  ids.p12 = fo12.id;

  const u13 = await upsertFoUser(prisma, foTestMatrix15Emails.p13, passwordHash);
  const fo13 = await upsertOnboardingFo(prisma, u13.id, "TEST FO 13 — Missing Coordinates", {
    homeLat: TULSA_CORE_B.lat,
    homeLng: TULSA_CORE_B.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo13.id, SCHED_STANDARD_WEEK);
  await ensureProviderForFranchiseOwner(prisma, fo13.id);
  await prisma.$executeRawUnsafe(
    `UPDATE "FranchiseOwner" SET status = 'active', "homeLat" = NULL, "homeLng" = NULL WHERE id = $1`,
    fo13.id,
  );
  ids.p13 = fo13.id;

  const u14 = await upsertFoUser(prisma, foTestMatrix15Emails.p14, passwordHash);
  const fo14 = await upsertOnboardingFo(prisma, u14.id, "TEST FO 14 — Paused Valid", {
    homeLat: TULSA_CORE_C.lat,
    homeLng: TULSA_CORE_C.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo14.id, SCHED_STANDARD_WEEK);
  await ensureProviderForFranchiseOwner(prisma, fo14.id);
  await prisma.franchiseOwner.update({
    where: { id: fo14.id },
    data: { status: "paused" },
  });
  ids.p14 = fo14.id;

  const u15 = await upsertFoUser(prisma, foTestMatrix15Emails.p15, passwordHash);
  const fo15 = await upsertOnboardingFo(prisma, u15.id, "TEST FO 15 — Safety Hold Valid", {
    homeLat: TULSA_CORE_A.lat,
    homeLng: TULSA_CORE_A.lng,
    maxTravelMinutes: 60,
    matchableServiceTypes: ["deep_clean"],
  });
  await replaceSchedule(prisma, fo15.id, SCHED_STANDARD_WEEK);
  await activateAfterSupplyPrep(prisma, fo15.id);
  await prisma.franchiseOwner.update({
    where: { id: fo15.id },
    data: { safetyHold: true },
  });
  ids.p15 = fo15.id;

  let pauseNonMatrixApplied = 0;
  if (pauseNonMatrix) {
    const matrixIds = Object.values(ids);
    const r = await prisma.franchiseOwner.updateMany({
      where: {
        id: { notIn: matrixIds },
        NOT: { user: { email: { startsWith: `${FO_TEST_MATRIX15_MARKER}_` } } },
      },
      data: { status: "paused" },
    });
    pauseNonMatrixApplied = r.count;
  }

  return {
    franchiseOwnerIds: ids,
    slotBlockBookingsCreated,
    pauseNonMatrixApplied,
  };
}
