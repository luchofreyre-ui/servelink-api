import { type PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

import { ensureProviderForFranchiseOwner } from "../modules/fo/fo-provider-sync";
import {
  PUBLIC_BOOKING_FIXTURE_HUB,
  publicBookingFixtureCustomerEmail,
  publicBookingFixtureFoEmails,
} from "./publicBookingFoFixtures";

const READINESS_EMAIL_PREFIX = "fo_readiness_";

export const foProductionReadinessEmails = {
  valid: `${READINESS_EMAIL_PREFIX}valid@servelink.test`,
  missingSchedule: `${READINESS_EMAIL_PREFIX}no_schedule@servelink.test`,
  badGeography: `${READINESS_EMAIL_PREFIX}bad_travel@servelink.test`,
  wrongServiceTypes: `${READINESS_EMAIL_PREFIX}move_only@servelink.test`,
  inactive: `${READINESS_EMAIL_PREFIX}paused@servelink.test`,
  edgeValid: `${READINESS_EMAIL_PREFIX}edge_valid@servelink.test`,
} as const;

export type FoProductionReadinessSeedResult = {
  franchiseOwnerIds: {
    valid: string;
    missingSchedule: string;
    badGeography: string;
    wrongServiceTypes: string;
    inactive: string;
    edgeValid: string;
  };
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

async function deleteReadinessCohort(prisma: PrismaClient) {
  const rows = await prisma.franchiseOwner.findMany({
    where: { user: { email: { startsWith: READINESS_EMAIL_PREFIX } } },
    select: { id: true, userId: true },
  });
  if (rows.length === 0) return;
  const ids = rows.map((r) => r.id);
  const userIds = rows.map((r) => r.userId);
  await prisma.bookingSlotHold.deleteMany({ where: { foId: { in: ids } } });
  await prisma.booking.deleteMany({ where: { foId: { in: ids } } });
  await prisma.foSchedule.deleteMany({ where: { franchiseOwnerId: { in: ids } } });
  await prisma.franchiseOwner.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

/**
 * Isolated dev seed: imperfect FO profiles for supply-readiness validation.
 * Does not modify `seedPublicBookingFoFixtures` data.
 */
export async function seedFoProductionReadiness(
  prisma: PrismaClient,
  opts?: { pauseOtherFranchiseOwners?: boolean },
): Promise<FoProductionReadinessSeedResult> {
  const pauseOtherFranchiseOwners = opts?.pauseOtherFranchiseOwners ?? true;
  const passwordHash = await bcrypt.hash("FoReadinessSeed!2026", 10);

  await deleteReadinessCohort(prisma);

  const hub = PUBLIC_BOOKING_FIXTURE_HUB;

  async function createFo(
    email: string,
    data: {
      displayName: string;
      status?: "active" | "paused";
      maxTravelMinutes?: number | null;
      matchableServiceTypes?: string[];
      skipSchedule?: boolean;
      maxDailyLaborMinutes?: number | null;
      teamSize?: number | null;
      maxLaborMinutes?: number | null;
    },
  ) {
    const u = await upsertFoUser(prisma, email, passwordHash);
    const fo = await prisma.franchiseOwner.create({
      data: {
        userId: u.id,
        status: data.status ?? "active",
        safetyHold: false,
        teamSize: data.teamSize ?? 3,
        maxSquareFootage: 5000,
        maxLaborMinutes: data.maxLaborMinutes ?? 960,
        maxDailyLaborMinutes: data.maxDailyLaborMinutes ?? 960,
        homeLat: hub.lat,
        homeLng: hub.lng,
        maxTravelMinutes: data.maxTravelMinutes ?? 60,
        reliabilityScore: 80,
        displayName: data.displayName,
        bio: "Readiness matrix synthetic FO",
        yearsExperience: 3,
        completedJobsCount: 10,
        matchableServiceTypes: data.matchableServiceTypes ?? [],
      },
    });
    if (!data.skipSchedule) {
      await replaceWeeklySchedule(prisma, fo.id);
    }
    await ensureProviderForFranchiseOwner(prisma, fo.id);
    return fo.id;
  }

  const valid = await createFo(foProductionReadinessEmails.valid, {
    displayName: "Readiness — Valid",
  });

  const missingSchedule = await createFo(foProductionReadinessEmails.missingSchedule, {
    displayName: "Readiness — No schedule",
    skipSchedule: true,
  });

  const badGeography = await createFo(foProductionReadinessEmails.badGeography, {
    displayName: "Readiness — Bad travel",
    maxTravelMinutes: 0,
  });

  const wrongServiceTypes = await createFo(foProductionReadinessEmails.wrongServiceTypes, {
    displayName: "Readiness — Move only",
    matchableServiceTypes: ["move_in"],
  });

  const inactive = await createFo(foProductionReadinessEmails.inactive, {
    displayName: "Readiness — Paused",
    status: "paused",
  });

  const edgeValid = await createFo(foProductionReadinessEmails.edgeValid, {
    displayName: "Readiness — Edge valid",
    teamSize: 1,
    maxLaborMinutes: 180,
    maxDailyLaborMinutes: null,
  });

  let otherFranchiseOwnersPaused = 0;
  if (pauseOtherFranchiseOwners) {
    const protect = new Set<string>([
      ...Object.values(publicBookingFixtureFoEmails),
      publicBookingFixtureCustomerEmail,
      ...Object.values(foProductionReadinessEmails),
    ]);
    const res = await prisma.franchiseOwner.updateMany({
      where: {
        user: { email: { notIn: [...protect] } },
        status: "active",
      },
      data: { status: "paused" },
    });
    otherFranchiseOwnersPaused = res.count;
  }

  return {
    franchiseOwnerIds: {
      valid,
      missingSchedule,
      badGeography,
      wrongServiceTypes,
      inactive,
      edgeValid,
    },
    otherFranchiseOwnersPaused,
  };
}
