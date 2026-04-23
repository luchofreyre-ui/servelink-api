import "dotenv/config";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { franchiseOwnerFoActivationGuardExtension } from "./modules/fo/fo-activation-prisma.extension";
import { ensureProviderForFranchiseOwner } from "./modules/fo/fo-provider-sync";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check services/api/.env");
}

const adapter = new PrismaPg({ connectionString });

/**
 * HARD GUARANTEE:
 * - Ledger is append-only. JournalEntry / JournalLine are immutable after insert.
 * - Any update/delete/upsert attempts are blocked at the ORM layer (Prisma v5 extension).
 */
const immutableLedgerExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: "immutable-ledger",
    query: {
      journalEntry: {
        update() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalEntry:update");
        },
        updateMany() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalEntry:updateMany");
        },
        delete() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalEntry:delete");
        },
        deleteMany() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalEntry:deleteMany");
        },
        upsert() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalEntry:upsert");
        },
      },
      journalLine: {
        update() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalLine:update");
        },
        updateMany() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalLine:updateMany");
        },
        delete() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalLine:delete");
        },
        deleteMany() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalLine:deleteMany");
        },
        upsert() {
          throw new Error("LEDGER_IMMUTABLE_BLOCKED:JournalLine:upsert");
        },
      },
    },
  }),
);

function getResultId(result: unknown): string | null {
  const raw = (result as any)?.id;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * GUARANTEE:
 * Every FranchiseOwner must have exactly one backing ServiceProvider.
 *
 * This extension repairs FO -> provider linkage after:
 * - create
 * - createMany
 * - upsert
 * - update (when providerId becomes null or is still null)
 *
 * It does NOT migrate FO-keyed downstream systems yet.
 */
const franchiseOwnerProviderSyncExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: "franchise-owner-provider-sync",
    query: {
      franchiseOwner: {
        async create({ args, query }) {
          const result = await query(args);

          const foId = getResultId(result);
          if (foId) {
            await ensureProviderForFranchiseOwner(client as PrismaClient, foId);
          }

          return result;
        },

        async upsert({ args, query }) {
          const result = await query(args);

          const foId = getResultId(result);
          if (foId) {
            await ensureProviderForFranchiseOwner(client as PrismaClient, foId);
          }

          return result;
        },

        async update({ args, query }) {
          const result = await query(args);

          const shouldRepair =
            "providerId" in ((args as any)?.data ?? {}) ||
            (result as any)?.providerId == null;

          if (shouldRepair) {
            const foId = getResultId(result);
            if (foId) {
              await ensureProviderForFranchiseOwner(client as PrismaClient, foId);
            }
          }

          return result;
        },

        async createMany({ args, query }) {
          const result = await query(args);

          const data = Array.isArray((args as any)?.data)
            ? (args as any).data
            : (args as any)?.data
              ? [(args as any).data]
              : [];

          const userIds: string[] = Array.from(
            new Set(
              data
                .map((row: any) =>
                  row?.userId != null ? String(row.userId).trim() : "",
                )
                .filter((value: string) => value.length > 0),
            ),
          );

          if (userIds.length > 0) {
            const fos = await (client as PrismaClient).franchiseOwner.findMany({
              where: {
                userId: { in: userIds },
                providerId: null,
              },
              select: { id: true },
            });

            for (const fo of fos) {
              if (typeof fo.id === "string" && fo.id.trim().length > 0) {
                await ensureProviderForFranchiseOwner(
                  client as PrismaClient,
                  fo.id,
                );
              }
            }
          }

          return result;
        },
      },
    },
  }),
);

/**
 * PrismaService is the ONLY supported way to access Prisma in this codebase.
 * Do not export singleton clients. Always inject PrismaService via PrismaModule.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({ adapter });

    // Prisma v5: apply hard immutability + FO/provider sync via client extensions.
    // Returning the extended client from the constructor is intentional.
    return this.$extends(immutableLedgerExtension)
      .$extends(franchiseOwnerFoActivationGuardExtension)
      .$extends(franchiseOwnerProviderSyncExtension) as unknown as PrismaService;
  }

  async onModuleInit() {
    // Establish connection early so failures surface on boot.
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
