import type { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

import { ensureProviderForFranchiseOwner } from "../modules/fo/fo-provider-sync";

import {
  DISPATCH_TEST_FO_PASSWORD,
  DISPATCH_TEST_FO_PROFILES,
  buildDispatchTestFoBio,
  type DispatchTestFoProfile,
} from "./dispatchTestFoProfiles";

async function upsertFoUser(
  prisma: PrismaClient,
  email: string,
  phone: string,
  passwordHash: string,
) {
  return prisma.user.upsert({
    where: { email },
    create: { email, phone, passwordHash, role: "fo" },
    update: { phone },
  });
}

async function replaceSchedule(
  prisma: PrismaClient,
  franchiseOwnerId: string,
  rows: DispatchTestFoProfile["schedule"],
): Promise<void> {
  await prisma.foSchedule.deleteMany({ where: { franchiseOwnerId } });
  if (rows.length === 0) return;
  await prisma.foSchedule.createMany({
    data: rows.map((r) => ({
      franchiseOwnerId,
      dayOfWeek: r.dayOfWeek,
      startTime: r.startTime,
      endTime: r.endTime,
    })),
  });
}

function foSchedulesNestedCreateMany(
  rows: DispatchTestFoProfile["schedule"],
): {
  createMany: {
    data: { dayOfWeek: number; startTime: string; endTime: string }[];
  };
} {
  return {
    createMany: {
      data: rows.map((r) => ({
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
    },
  };
}

function franchiseOwnerUpsertData(profile: DispatchTestFoProfile) {
  return {
    status: "active" as const,
    safetyHold: false,
    displayName: profile.displayName,
    bio: buildDispatchTestFoBio(profile),
    teamSize: profile.teamSize,
    maxSquareFootage: profile.maxSquareFootage,
    maxLaborMinutes: profile.maxLaborMinutes,
    maxDailyLaborMinutes: profile.maxDailyLaborMinutes,
    homeLat: profile.homeLat,
    homeLng: profile.homeLng,
    maxTravelMinutes: profile.maxTravelMinutes,
    reliabilityScore: 88,
    yearsExperience: 5,
    completedJobsCount: 50,
    matchableServiceTypes: [] as string[],
  };
}

export type DispatchTestFoSeedResult = {
  franchiseOwnerIds: Record<DispatchTestFoProfile["key"], string>;
  emails: Record<DispatchTestFoProfile["key"], string>;
};

/**
 * Idempotent: upserts five `@example.com` FO users + franchise rows, weekly
 * schedules, and provider links. Safe to rerun; only touches rows keyed by the
 * deterministic emails in `DISPATCH_TEST_FO_PROFILES`.
 */
export async function seedDispatchTestFranchiseOwners(
  prisma: PrismaClient,
): Promise<DispatchTestFoSeedResult> {
  const passwordHash = await bcrypt.hash(DISPATCH_TEST_FO_PASSWORD, 10);
  const franchiseOwnerIds = {} as Record<DispatchTestFoProfile["key"], string>;
  const emails = {} as Record<DispatchTestFoProfile["key"], string>;

  for (const profile of DISPATCH_TEST_FO_PROFILES) {
    const user = await upsertFoUser(
      prisma,
      profile.email,
      profile.phone,
      passwordHash,
    );

    const fo = await prisma.franchiseOwner.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...franchiseOwnerUpsertData(profile),
        foSchedules: foSchedulesNestedCreateMany(profile.schedule),
      },
      update: franchiseOwnerUpsertData(profile),
    });

    await replaceSchedule(prisma, fo.id, profile.schedule);
    await ensureProviderForFranchiseOwner(prisma, fo.id);

    franchiseOwnerIds[profile.key] = fo.id;
    emails[profile.key] = profile.email;
  }

  return { franchiseOwnerIds, emails };
}
