import { BookingStatus, type PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

import { ensureProviderForFranchiseOwner } from "../modules/fo/fo-provider-sync";
import { setBookingWindowFromDuration } from "../modules/bookings/booking-window-mutation";

/**
 * Synthetic bookings that reserve FO3 calendar space for public slot scarcity tests.
 * The seed script deletes rows whose notes contain this substring before re-inserting.
 */
export const PUBLIC_BOOKING_FIXTURE_BLOCK_MARKER = "PUBLIC_BOOKING_FIXTURE_BLOCK";

/** Downtown Tulsa hub — consistent with several API booking tests. */
export const PUBLIC_BOOKING_FIXTURE_HUB = {
  lat: 36.15398,
  lng: -95.99277,
} as const;

/** ~4.5 km N of hub — still inside normal `maxTravelMinutes` for metro routing checks. */
export const PUBLIC_BOOKING_FIXTURE_MOVE_ONLY_HOME = {
  lat: 36.19398,
  lng: -95.99277,
} as const;

export const publicBookingFixtureCustomerEmail =
  "public_booking_fixture_customer@servelink.test";

export const publicBookingFixtureFoEmails = {
  baseline: "fo_fixture_public_baseline@servelink.test",
  limitedTravel: "fo_fixture_public_limited_travel@servelink.test",
  slotConstrained: "fo_fixture_public_slot_constrained@servelink.test",
  moveOnly: "fo_fixture_public_move_only@servelink.test",
} as const;

/**
 * Geocode targets (human addresses) aligned to the Tulsa hub for manual / Nominatim checks.
 * Approximate map positions — tune with your geocoder if needed.
 */
export const publicBookingFixtureAddressHints = {
  coreCovered:
    "Near 36.1546, -95.9938 (downtown Tulsa) — expect Baseline + Limited-travel + Slot-constrained for typical maintenance estimates when all fixtures are seeded.",
  edgeLimitedTravelDrops:
    "Near 36.195, -95.992 (~4.6 km N of hub) — Limited-travel fixture (maxTravel 4) should fall out; others may still match.",
  outsideMarket:
    "Wichita-area lat/lng (~37.7, -97.3) — expect no FO candidates for Tulsa-hub fixtures.",
} as const;

export type PublicBookingFoFixtureSeedResult = {
  franchiseOwnerIds: {
    baseline: string;
    limitedTravel: string;
    slotConstrained: string;
    moveOnly: string;
  };
  fixtureCustomerUserId: string;
  slotBlockBookingsCreated: number;
  /** Non-fixture FOs set to `paused` so local `matchFOs` reflects only this matrix. */
  otherFranchiseOwnersPaused: number;
};

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

async function replaceWeeklySchedule(prisma: PrismaClient, franchiseOwnerId: string) {
  await prisma.foSchedule.deleteMany({ where: { franchiseOwnerId } });
  const data = [];
  for (let dayOfWeek = 0; dayOfWeek <= 6; dayOfWeek += 1) {
    data.push({
      franchiseOwnerId,
      dayOfWeek,
      startTime: "06:00",
      endTime: "22:00",
    });
  }
  await prisma.foSchedule.createMany({ data });
}

/**
 * Idempotent: upserts four FO users + franchise rows, weekly schedules, and FO3 calendar blocks.
 */
export async function seedPublicBookingFoFixtures(
  prisma: PrismaClient,
): Promise<PublicBookingFoFixtureSeedResult> {
  const passwordHash = await bcrypt.hash("PublicBookingFixture!2026", 10);

  const customer = await prisma.user.upsert({
    where: { email: publicBookingFixtureCustomerEmail },
    create: {
      email: publicBookingFixtureCustomerEmail,
      passwordHash,
      role: "customer",
    },
    update: {},
  });

  const priorBlocks = await prisma.booking.findMany({
    where: { notes: { contains: PUBLIC_BOOKING_FIXTURE_BLOCK_MARKER } },
    select: { id: true },
  });
  const priorIds = priorBlocks.map((b) => b.id);
  if (priorIds.length > 0) {
    await prisma.bookingSlotHold.deleteMany({
      where: { bookingId: { in: priorIds } },
    });
    await prisma.booking.deleteMany({ where: { id: { in: priorIds } } });
  }

  const hub = PUBLIC_BOOKING_FIXTURE_HUB;

  const uBaseline = await upsertFoUser(
    prisma,
    publicBookingFixtureFoEmails.baseline,
    passwordHash,
  );
  const foBaseline = await prisma.franchiseOwner.upsert({
    where: { userId: uBaseline.id },
    create: {
      userId: uBaseline.id,
      status: "active",
      safetyHold: false,
      teamSize: 3,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
      homeLat: hub.lat,
      homeLng: hub.lng,
      maxTravelMinutes: 60,
      reliabilityScore: 95,
      displayName: "Fixture FO — Baseline Core",
      bio: "Dev fixture: broad travel + capacity; supports all public estimator service types.",
      yearsExperience: 6,
      completedJobsCount: 200,
      matchableServiceTypes: [],
    },
    update: {
      status: "active",
      safetyHold: false,
      teamSize: 3,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
      homeLat: hub.lat,
      homeLng: hub.lng,
      maxTravelMinutes: 60,
      reliabilityScore: 95,
      displayName: "Fixture FO — Baseline Core",
      matchableServiceTypes: [],
    },
  });
  await replaceWeeklySchedule(prisma, foBaseline.id);

  const uLimited = await upsertFoUser(
    prisma,
    publicBookingFixtureFoEmails.limitedTravel,
    passwordHash,
  );
  const foLimited = await prisma.franchiseOwner.upsert({
    where: { userId: uLimited.id },
    create: {
      userId: uLimited.id,
      status: "active",
      safetyHold: false,
      teamSize: 3,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
      homeLat: hub.lat,
      homeLng: hub.lng,
      maxTravelMinutes: 4,
      reliabilityScore: 90,
      displayName: "Fixture FO — Limited Travel",
      bio: "Dev fixture: same hub as baseline but very low maxTravelMinutes (~few km).",
      yearsExperience: 5,
      completedJobsCount: 150,
      matchableServiceTypes: [],
    },
    update: {
      status: "active",
      safetyHold: false,
      homeLat: hub.lat,
      homeLng: hub.lng,
      maxTravelMinutes: 4,
      reliabilityScore: 90,
      displayName: "Fixture FO — Limited Travel",
      matchableServiceTypes: [],
    },
  });
  await replaceWeeklySchedule(prisma, foLimited.id);

  const uSlot = await upsertFoUser(
    prisma,
    publicBookingFixtureFoEmails.slotConstrained,
    passwordHash,
  );
  const foSlot = await prisma.franchiseOwner.upsert({
    where: { userId: uSlot.id },
    create: {
      userId: uSlot.id,
      status: "active",
      safetyHold: false,
      teamSize: 3,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      /** Deliberately null: synthetic same-day `pending_dispatch` blocks must not exclude FO3 at match time; scarcity is slot-based only. */
      maxDailyLaborMinutes: null,
      homeLat: hub.lat,
      homeLng: hub.lng,
      maxTravelMinutes: 60,
      reliabilityScore: 82,
      displayName: "Fixture FO — Slot Constrained",
      bio: "Dev fixture: broad match profile; calendar pre-filled with long synthetic blocks.",
      yearsExperience: 4,
      completedJobsCount: 90,
      matchableServiceTypes: [],
    },
    update: {
      status: "active",
      safetyHold: false,
      homeLat: hub.lat,
      homeLng: hub.lng,
      maxTravelMinutes: 60,
      reliabilityScore: 82,
      displayName: "Fixture FO — Slot Constrained",
      maxDailyLaborMinutes: null,
      matchableServiceTypes: [],
    },
  });
  await replaceWeeklySchedule(prisma, foSlot.id);

  const uMove = await upsertFoUser(
    prisma,
    publicBookingFixtureFoEmails.moveOnly,
    passwordHash,
  );
  const foMove = await prisma.franchiseOwner.upsert({
    where: { userId: uMove.id },
    create: {
      userId: uMove.id,
      status: "active",
      safetyHold: false,
      teamSize: 3,
      maxSquareFootage: 5000,
      maxLaborMinutes: 960,
      maxDailyLaborMinutes: 960,
      homeLat: PUBLIC_BOOKING_FIXTURE_MOVE_ONLY_HOME.lat,
      homeLng: PUBLIC_BOOKING_FIXTURE_MOVE_ONLY_HOME.lng,
      maxTravelMinutes: 60,
      reliabilityScore: 88,
      displayName: "Fixture FO — Move-In/Move-Out Only",
      bio: "Dev fixture: matchableServiceTypes limited to move_in + move_out.",
      yearsExperience: 7,
      completedJobsCount: 110,
      matchableServiceTypes: ["move_in", "move_out"],
    },
    update: {
      status: "active",
      safetyHold: false,
      homeLat: PUBLIC_BOOKING_FIXTURE_MOVE_ONLY_HOME.lat,
      homeLng: PUBLIC_BOOKING_FIXTURE_MOVE_ONLY_HOME.lng,
      maxTravelMinutes: 60,
      reliabilityScore: 88,
      displayName: "Fixture FO — Move-In/Move-Out Only",
      matchableServiceTypes: ["move_in", "move_out"],
    },
  });
  await replaceWeeklySchedule(prisma, foMove.id);

  const anchor = new Date();
  anchor.setUTCHours(0, 0, 0, 0);

  let slotBlockBookingsCreated = 0;
  for (let d = 0; d < 14; d += 1) {
    const day = new Date(anchor);
    day.setUTCDate(anchor.getUTCDate() + d);
    const scheduledStart = new Date(day);
    scheduledStart.setUTCHours(8, 0, 0, 0);

    const window = setBookingWindowFromDuration({
      scheduledStart,
      estimatedHours: 13,
      estimateSnapshotOutputJson: null,
    });

    await prisma.booking.create({
      data: {
        customerId: customer.id,
        foId: foSlot.id,
        status: BookingStatus.pending_dispatch,
        hourlyRateCents: 7500,
        estimatedHours: 13,
        scheduledStart: window.scheduledStart,
        scheduledEnd: window.scheduledEnd,
        notes: `${PUBLIC_BOOKING_FIXTURE_BLOCK_MARKER} fo_slot_fixture day_index=${d}`,
      },
    });
    slotBlockBookingsCreated += 1;
  }

  const fixtureIds = [
    foBaseline.id,
    foLimited.id,
    foSlot.id,
    foMove.id,
  ];
  for (const foId of fixtureIds) {
    await ensureProviderForFranchiseOwner(prisma, foId);
  }
  const pauseOthers = await prisma.franchiseOwner.updateMany({
    where: { id: { notIn: fixtureIds } },
    data: { status: "paused" },
  });

  return {
    franchiseOwnerIds: {
      baseline: foBaseline.id,
      limitedTravel: foLimited.id,
      slotConstrained: foSlot.id,
      moveOnly: foMove.id,
    },
    fixtureCustomerUserId: customer.id,
    slotBlockBookingsCreated,
    otherFranchiseOwnersPaused: pauseOthers.count,
  };
}
