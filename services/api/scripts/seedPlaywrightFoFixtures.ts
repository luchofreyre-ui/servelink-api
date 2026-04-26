import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { seedFoTestMatrix15 } from "../src/dev/foTestMatrix15Seed";
import { seedPublicBookingFoFixtures } from "../src/dev/publicBookingFoFixtures";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  await prisma.$connect();

  const publicBookingFixtures = await seedPublicBookingFoFixtures(prisma);
  const matrixFixtures = await seedFoTestMatrix15(prisma);

  console.log("CI FO fixtures seeded");
  console.log(
    JSON.stringify(
      {
        publicBookingFixtures,
        matrixFixtures,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
