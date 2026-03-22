import {
  PrismaClient,
  ServiceProviderStatus,
  ServiceProviderType,
} from "@prisma/client";

/**
 * NOTE:
 * If your ServiceProviderType enum uses a different literal than franchise_owner,
 * change ONLY this constant.
 */
const FRANCHISE_OWNER_PROVIDER_TYPE =
  "franchise_owner" as ServiceProviderType;

function mapFoStatusToProviderStatus(
  foStatus: string | null | undefined,
): ServiceProviderStatus {
  const normalized = String(foStatus ?? "").toLowerCase();

  switch (normalized) {
    case "active":
      return "active" as ServiceProviderStatus;

    case "paused":
      return "suspended" as ServiceProviderStatus;

    case "safety_hold":
    case "suspended":
      return "suspended" as ServiceProviderStatus;

    case "offboarded":
      return "deactivated" as ServiceProviderStatus;

    case "onboarding":
    default:
      return "onboarding" as ServiceProviderStatus;
  }
}

/**
 * Guarantees exactly one backing ServiceProvider for a FranchiseOwner.
 *
 * Idempotent:
 * - if FO already has providerId, it verifies the provider exists
 * - if FO has null providerId, it creates/reuses provider by userId and links it
 * - safe to rerun
 * - race-safe through unique constraints + updateMany guard
 */
export async function ensureProviderForFranchiseOwner(
  db: PrismaClient,
  foId: string,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const fo = await tx.franchiseOwner.findUnique({
      where: { id: foId },
      select: {
        id: true,
        userId: true,
        providerId: true,
        status: true,
        displayName: true,
        reliabilityScore: true,
      },
    });

    if (!fo) return;

    if (fo.providerId) {
      const existingLinked = await tx.serviceProvider.findUnique({
        where: { id: fo.providerId },
        select: { id: true },
      });

      if (existingLinked) return;
    }

    const provider = await tx.serviceProvider.upsert({
      where: { userId: fo.userId },
      create: {
        userId: fo.userId,
        type: FRANCHISE_OWNER_PROVIDER_TYPE,
        status: mapFoStatusToProviderStatus(fo.status),
        displayName: fo.displayName ?? undefined,
        reliabilityScore: fo.reliabilityScore ?? 0,
      },
      update: {
        status: mapFoStatusToProviderStatus(fo.status),
        displayName: fo.displayName ?? undefined,
        reliabilityScore: fo.reliabilityScore ?? 0,
      },
      select: { id: true },
    });

    await tx.franchiseOwner.updateMany({
      where: {
        id: fo.id,
        OR: [{ providerId: null }, { providerId: fo.providerId ?? undefined }],
      },
      data: {
        providerId: provider.id,
      },
    });
  });
}

export type FranchiseOwnerProviderBackfillSummary = {
  scanned: number;
  repaired: number;
  skipped: number;
  errors: number;
};

export async function backfillFranchiseOwnerProviders(
  db: PrismaClient,
  batchSize = 100,
): Promise<FranchiseOwnerProviderBackfillSummary> {
  const summary: FranchiseOwnerProviderBackfillSummary = {
    scanned: 0,
    repaired: 0,
    skipped: 0,
    errors: 0,
  };

  for (;;) {
    const batch = await db.franchiseOwner.findMany({
      where: { providerId: null },
      orderBy: { createdAt: "asc" },
      take: batchSize,
      select: { id: true },
    });

    if (batch.length === 0) break;

    for (const row of batch) {
      summary.scanned += 1;

      try {
        const before = await db.franchiseOwner.findUnique({
          where: { id: row.id },
          select: { providerId: true },
        });

        if (before?.providerId) {
          summary.skipped += 1;
          continue;
        }

        await ensureProviderForFranchiseOwner(db, row.id);

        const after = await db.franchiseOwner.findUnique({
          where: { id: row.id },
          select: { providerId: true },
        });

        if (after?.providerId) {
          summary.repaired += 1;
        } else {
          summary.errors += 1;
        }
      } catch {
        summary.errors += 1;
      }
    }

    if (batch.length < batchSize) break;
  }

  return summary;
}
