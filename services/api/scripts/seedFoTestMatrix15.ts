import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { seedFoTestMatrix15 } from "../src/dev/foTestMatrix15Seed";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const pauseNonMatrix =
    process.env.FO_TEST_MATRIX15_PAUSE_NON_MATRIX === "1" ||
    process.env.FO_TEST_MATRIX15_PAUSE_NON_MATRIX === "true";

  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const result = await seedFoTestMatrix15(prisma, { pauseNonMatrix });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
