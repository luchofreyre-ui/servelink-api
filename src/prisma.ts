import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing. Check services/api/.env");
}

const adapter = new PrismaPg({ connectionString });

export class PrismaService extends PrismaClient {
  constructor() {
    super({ adapter });
  }
}

export const prisma = new PrismaService();
