import { Prisma, type PrismaClient } from "@prisma/client";
import { foActivationGuardAls } from "./fo-activation-context";
import {
  activationEvaluationFromFranchiseOwnerRow,
  isFranchiseOwnerInActiveBookingPool,
  loadFranchiseOwnerForActivationCheck,
  mergeFranchiseOwnerUpdateData,
  throwIfFoActivationBlocked,
} from "./fo-activation-guard";

function scheduleCountFromFranchiseOwnerCreateData(
  data: Record<string, unknown>,
): number {
  const fs = data.foSchedules as Record<string, unknown> | undefined;
  if (!fs) return 0;
  let n = 0;
  const cm = fs.createMany as { data?: unknown[] } | undefined;
  if (Array.isArray(cm?.data)) n += cm.data.length;
  const c = fs.create;
  if (Array.isArray(c)) n += c.length;
  else if (c && typeof c === "object") n += 1;
  return n;
}

function franchiseOwnerWhereToLookup(
  where: unknown,
): { id: string } | { userId: string } | null {
  if (!where || typeof where !== "object") return null;
  const w = where as Record<string, unknown>;
  if (typeof w.id === "string" && w.id.trim()) return { id: w.id };
  if (typeof w.userId === "string" && w.userId.trim())
    return { userId: w.userId };
  return null;
}

function rowToMergeBase(row: {
  status: string;
  safetyHold: boolean | null;
  homeLat: number | null;
  homeLng: number | null;
  maxTravelMinutes: number | null;
  maxDailyLaborMinutes: number | null;
  maxLaborMinutes: number | null;
  maxSquareFootage: number | null;
}) {
  return {
    status: row.status,
    safetyHold: row.safetyHold,
    homeLat: row.homeLat,
    homeLng: row.homeLng,
    maxTravelMinutes: row.maxTravelMinutes,
    maxDailyLaborMinutes: row.maxDailyLaborMinutes,
    maxLaborMinutes: row.maxLaborMinutes,
    maxSquareFootage: row.maxSquareFootage,
    isDeleted: (row as { isDeleted?: boolean | null }).isDeleted,
    isBanned: (row as { isBanned?: boolean | null }).isBanned,
  };
}

export const franchiseOwnerFoActivationGuardExtension = Prisma.defineExtension(
  (client) => {
    const prisma = client as PrismaClient;

    return client.$extends({
      name: "franchise-owner-activation-guard",
      query: {
        franchiseOwner: {
          async create({ args, query }) {
            const data = ((args as { data?: Record<string, unknown> }).data ??
              {}) as Record<string, unknown>;
            /** Count nested `foSchedules.create` / `createMany` only; post-create `foSchedule.create` is too late for this guard. */
            const scheduleRowCount =
              scheduleCountFromFranchiseOwnerCreateData(data);
            const merged = {
              status: String(data.status ?? "onboarding"),
              safetyHold: Boolean(data.safetyHold ?? false),
              isDeleted: data.isDeleted as boolean | null | undefined,
              isBanned: data.isBanned as boolean | null | undefined,
              homeLat: (data.homeLat as number | null) ?? null,
              homeLng: (data.homeLng as number | null) ?? null,
              maxTravelMinutes:
                (data.maxTravelMinutes as number | null) ?? null,
              maxDailyLaborMinutes:
                (data.maxDailyLaborMinutes as number | null) ?? null,
              maxLaborMinutes: (data.maxLaborMinutes as number | null) ?? null,
              maxSquareFootage: (data.maxSquareFootage as number | null) ?? null,
              _count: { foSchedules: scheduleRowCount },
            };
            throwIfFoActivationBlocked(
              activationEvaluationFromFranchiseOwnerRow(merged),
            );
            return query(args);
          },

          async update({ args, query }) {
            const typed = args as {
              where: unknown;
              data: Record<string, unknown>;
            };
            const lookup = franchiseOwnerWhereToLookup(typed.where);
            if (!lookup) {
              return query(args);
            }
            const existing = await loadFranchiseOwnerForActivationCheck(
              prisma,
              lookup,
            );
            if (!existing) {
              return query(args);
            }
            const mergedFields = mergeFranchiseOwnerUpdateData(
              rowToMergeBase(existing),
              typed.data ?? {},
            );
            const merged = {
              ...existing,
              ...mergedFields,
              _count: existing._count,
            };
            throwIfFoActivationBlocked(
              activationEvaluationFromFranchiseOwnerRow(merged),
            );
            return query(args);
          },

          async upsert({ args, query }) {
            const typed = args as {
              where: unknown;
              create: Record<string, unknown>;
              update: Record<string, unknown>;
            };
            const lookup = franchiseOwnerWhereToLookup(typed.where);
            const existing = lookup
              ? await loadFranchiseOwnerForActivationCheck(prisma, lookup)
              : null;

            if (existing) {
              const mergedFields = mergeFranchiseOwnerUpdateData(
                rowToMergeBase(existing),
                typed.update ?? {},
              );
              const merged = {
                ...existing,
                ...mergedFields,
                _count: existing._count,
              };
              throwIfFoActivationBlocked(
                activationEvaluationFromFranchiseOwnerRow(merged),
              );
            } else {
              const data = typed.create ?? {};
              const scheduleRowCount =
                scheduleCountFromFranchiseOwnerCreateData(data);
              const merged = {
                status: String(data.status ?? "onboarding"),
                safetyHold: Boolean(data.safetyHold ?? false),
                isDeleted: data.isDeleted as boolean | null | undefined,
                isBanned: data.isBanned as boolean | null | undefined,
                homeLat: (data.homeLat as number | null) ?? null,
                homeLng: (data.homeLng as number | null) ?? null,
                maxTravelMinutes:
                  (data.maxTravelMinutes as number | null) ?? null,
                maxDailyLaborMinutes:
                  (data.maxDailyLaborMinutes as number | null) ?? null,
                maxLaborMinutes:
                  (data.maxLaborMinutes as number | null) ?? null,
                maxSquareFootage:
                  (data.maxSquareFootage as number | null) ?? null,
                _count: { foSchedules: scheduleRowCount },
              };
              throwIfFoActivationBlocked(
                activationEvaluationFromFranchiseOwnerRow(merged),
              );
            }
            return query(args);
          },

          async updateMany({ args, query }) {
            const typed = args as {
              where: Record<string, unknown>;
              data: Record<string, unknown>;
            };
            const d = typed.data ?? {};
            const keys = Object.keys(d);
            /** `ensureProviderForFranchiseOwner` links `providerId` on active rows; skip guard so linking is not blocked by execution checks. */
            if (
              keys.length === 1 &&
              keys[0] === "providerId" &&
              d.providerId != null
            ) {
              return query(args);
            }
            const rows = await prisma.franchiseOwner.findMany({
              where: typed.where,
              include: {
                _count: { select: { foSchedules: true } },
                provider: { select: { userId: true } },
              },
            });
            for (const row of rows) {
              const mergedFields = mergeFranchiseOwnerUpdateData(
                rowToMergeBase(row),
                typed.data ?? {},
              );
              const merged = { ...row, ...mergedFields, _count: row._count };
              throwIfFoActivationBlocked(
                activationEvaluationFromFranchiseOwnerRow(merged),
              );
            }
            return query(args);
          },

          async createMany({ args, query }) {
            const typed = args as {
              data: Record<string, unknown>[] | Record<string, unknown>;
            };
            const raw = typed.data;
            const list = Array.isArray(raw)
              ? raw
              : raw && typeof raw === "object"
                ? [raw as Record<string, unknown>]
                : [];
            for (const data of list) {
              const scheduleRowCount =
                scheduleCountFromFranchiseOwnerCreateData(data);
              const merged = {
                status: String(data.status ?? "onboarding"),
                safetyHold: Boolean(data.safetyHold ?? false),
                isDeleted: data.isDeleted as boolean | null | undefined,
                isBanned: data.isBanned as boolean | null | undefined,
                homeLat: (data.homeLat as number | null) ?? null,
                homeLng: (data.homeLng as number | null) ?? null,
                maxTravelMinutes:
                  (data.maxTravelMinutes as number | null) ?? null,
                maxDailyLaborMinutes:
                  (data.maxDailyLaborMinutes as number | null) ?? null,
                maxLaborMinutes:
                  (data.maxLaborMinutes as number | null) ?? null,
                maxSquareFootage:
                  (data.maxSquareFootage as number | null) ?? null,
                _count: { foSchedules: scheduleRowCount },
              };
              throwIfFoActivationBlocked(
                activationEvaluationFromFranchiseOwnerRow(merged),
              );
            }
            return query(args);
          },
        },

        foSchedule: {
          async deleteMany({ args, query }) {
            if (foActivationGuardAls.getStore()?.bypassScheduleCoherence) {
              return query(args);
            }
            const where = (args as { where?: Record<string, unknown> }).where;
            if (!where || typeof where !== "object") {
              return query(args);
            }
            const keys = Object.keys(where);
            if (keys.length !== 1 || keys[0] !== "franchiseOwnerId") {
              return query(args);
            }
            const raw = (where as Record<string, unknown>).franchiseOwnerId;
            const foIds: string[] =
              typeof raw === "string" && raw.trim()
                ? [raw]
                : raw &&
                    typeof raw === "object" &&
                    Array.isArray((raw as { in?: string[] }).in)
                  ? ((raw as { in: string[] }).in ?? []).filter(
                      (id) => typeof id === "string" && id.trim(),
                    )
                  : [];
            if (foIds.length === 0) {
              return query(args);
            }

            for (const foId of foIds) {
              const fo = await prisma.franchiseOwner.findUnique({
                where: { id: foId },
                include: { _count: { select: { foSchedules: true } } },
              });
              if (!fo || !isFranchiseOwnerInActiveBookingPool(fo)) continue;

              const total = await prisma.foSchedule.count({
                where: { franchiseOwnerId: foId },
              });
              const wouldDelete = await prisma.foSchedule.count({
                where: { franchiseOwnerId: foId } as { franchiseOwnerId: string },
              });
              const remainingAfter = total - wouldDelete;
              throwIfFoActivationBlocked(
                activationEvaluationFromFranchiseOwnerRow({
                  ...fo,
                  _count: { foSchedules: Math.max(0, remainingAfter) },
                }),
              );
            }
            return query(args);
          },
        },
      },
    });
  },
);
