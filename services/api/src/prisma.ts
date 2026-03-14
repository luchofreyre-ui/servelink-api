import "dotenv/config";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

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

    // Prisma v5: apply hard immutability via client extension.
    // Returning the extended client from the constructor is intentional.
    return this.$extends(immutableLedgerExtension) as unknown as PrismaService;
  }

  async onModuleInit() {
    // Establish connection early so failures surface on boot.
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
