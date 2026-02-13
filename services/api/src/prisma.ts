import "dotenv/config";
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check services/api/.env");
}

const adapter = new PrismaPg({ connectionString });

/**
 * PrismaService is the ONLY supported way to access Prisma in this codebase.
 * Do not export singleton clients. Always inject PrismaService via PrismaModule.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter });
  }

  async onModuleInit() {
    // Establish connection early so failures surface on boot.
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
