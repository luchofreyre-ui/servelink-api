import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { seedFoTestMatrix15 } from "../src/dev/foTestMatrix15Seed";
import { seedPublicBookingFoFixtures } from "../src/dev/publicBookingFoFixtures";

function assertSafeSeedEnvironment() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const isAllowedAutomationContext =
    process.env.CI === "true" ||
    process.env.NODE_ENV === "test" ||
    process.env.PLAYWRIGHT_UPLOAD_SOURCE === "github-actions";

  if (!isAllowedAutomationContext) {
    console.error(
      "Refusing to seed Playwright FO fixtures outside CI/test automation.",
    );
    process.exit(1);
  }

  let databaseHostname = "";
  try {
    databaseHostname = new URL(databaseUrl).hostname.toLowerCase();
  } catch {
    console.error("DATABASE_URL must be a valid URL.");
    process.exit(1);
  }

  const railwayProductionHostPattern = /(railway|rlwy\.net)/i;
  if (railwayProductionHostPattern.test(databaseHostname)) {
    console.error(
      `Refusing to seed Playwright FO fixtures against Railway database host: ${databaseHostname}`,
    );
    process.exit(1);
  }
}

async function main() {
  assertSafeSeedEnvironment();

  const prisma = new PrismaClient();
  try {
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
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
