import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { PUBLIC_BOOKING_FIXTURE_HUB } from "../src/dev/publicBookingFoFixtures";
import { FoService } from "../src/modules/fo/fo.service";
import {
  deriveFoSupplyQueueState,
  mergeFoSupplyReasonCodes,
} from "../src/modules/fo/fo-supply-queue";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const foSvc = new FoService(prisma as never);

  try {
    const rows = await foSvc.listFoSupplyReadinessDiagnostics();

    const byOpsCategory = {
      ready: 0,
      blocked_configuration: 0,
      inactive_or_restricted: 0,
    };

    const byQueueState: Record<string, number> = {};
    const reasonCounts: Record<string, number> = {};

    for (const row of rows) {
      if (row.opsCategory === "ready") {
        byOpsCategory.ready += 1;
      } else if (row.opsCategory === "blocked_configuration") {
        byOpsCategory.blocked_configuration += 1;
      } else {
        byOpsCategory.inactive_or_restricted += 1;
      }

      const queueState = deriveFoSupplyQueueState({
        opsCategory: row.opsCategory,
        supply: row.supply,
        eligibility: row.eligibility,
        execution: row.execution,
      });
      byQueueState[queueState] = (byQueueState[queueState] ?? 0) + 1;

      const merged = mergeFoSupplyReasonCodes({
        opsCategory: row.opsCategory,
        supply: row.supply,
        eligibility: row.eligibility,
        execution: row.execution,
      });
      for (const code of merged) {
        reasonCounts[code] = (reasonCounts[code] ?? 0) + 1;
      }
    }

    const hub = PUBLIC_BOOKING_FIXTURE_HUB;
    const maintenanceCandidates = await foSvc.matchFOs({
      lat: hub.lat,
      lng: hub.lng,
      squareFootage: 1500,
      estimatedLaborMinutes: 200,
      recommendedTeamSize: 2,
      serviceType: "maintenance",
      limit: 50,
    });

    const reasonCountsSorted = Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([code, count]) => ({ code, count }));

    const atLeastOneReadyFo = byOpsCategory.ready > 0;
    const atLeastOneMaintenanceCandidate = maintenanceCandidates.length > 0;
    const healthy = atLeastOneReadyFo && atLeastOneMaintenanceCandidate;

    const out = {
      totalFranchiseOwners: rows.length,
      byOpsCategory,
      byQueueState,
      reasonCounts: reasonCountsSorted,
      maintenanceCandidatesAtFixtureHub: maintenanceCandidates.length,
      maintenanceCandidateIds: maintenanceCandidates.map((m) => m.id),
      atLeastOneReadyFo,
      atLeastOneMaintenanceCandidate,
      healthy,
    };

    console.log(JSON.stringify(out, null, 2));
    process.exit(healthy ? 0 : 2);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
