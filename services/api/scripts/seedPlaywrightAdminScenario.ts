import "dotenv/config";

import { runPlaywrightAdminScenario } from "../src/dev/playwrightAdminScenario";
import { DispatchDecisionService } from "../src/modules/bookings/dispatch-decision.service";
import { DispatchConfigService } from "../src/modules/dispatch/dispatch-config.service";
import { PrismaService } from "../src/prisma";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaService();
  await prisma.$connect();

  try {
    const dispatchDecisionService = new DispatchDecisionService(prisma);
    const dispatchConfigService = new DispatchConfigService(prisma);
    const result = await runPlaywrightAdminScenario({
      prisma,
      dispatchDecisionService,
      dispatchConfigService,
    });
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
