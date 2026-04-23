import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { seedPublicBookingFoFixtures } from "../src/dev/publicBookingFoFixtures";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const result = await seedPublicBookingFoFixtures(prisma);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
