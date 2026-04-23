import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { seedFoProductionReadiness } from "../src/dev/foProductionReadinessSeed";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const pause =
    String(process.env.FO_READINESS_SEED_PAUSE_OTHERS ?? "true").trim() ===
    "true";

  const prisma = new PrismaClient();
  await prisma.$connect();
  try {
    const result = await seedFoProductionReadiness(prisma, {
      pauseOtherFranchiseOwners: pause,
    });
    console.log(JSON.stringify({ ...result, pauseOtherFranchiseOwners: pause }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
