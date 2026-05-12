import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { WorkflowModule } from "../workflow/workflow.module";
import { AdminOperationalCommandPresenceController } from "./admin-operational-command-presence.controller";
import { AdminOperationalCommandCollaborationController } from "./admin-operational-command-collaboration.controller";
import { AdminOperationalIntelligenceController } from "./admin-operational-intelligence.controller";
import { OperationalCommandCollaborationService } from "./operational-command-collaboration.service";
import { OperationalCommandPresenceService } from "./operational-command-presence.service";
import { OperationalAnalyticsAggregationService } from "./operational-analytics-aggregation.service";
import { OperationalBalancingAggregationService } from "./operational-balancing-aggregation.service";
import { OperationalIntelligenceQueryService } from "./operational-intelligence-query.service";
import { OperationalOutcomeAggregationService } from "./operational-outcome-aggregation.service";
import { OperationalBenchmarkAggregationService } from "./operational-benchmark-aggregation.service";
import { OperationalSimulationLabAggregationService } from "./operational-simulation-lab-aggregation.service";
import { OperationalLongitudinalAggregationService } from "./operational-longitudinal-aggregation.service";
import { OperationalScienceAggregationService } from "./operational-science-aggregation.service";
import { OperationalInterventionValidityAggregationService } from "./operational-intervention-validity-aggregation.service";
import { OperationalIncidentCommandAggregationService } from "./operational-incident-command-aggregation.service";
import { OperationalEntityGraphAggregationService } from "./operational-entity-graph-aggregation.service";
import { OperationalReplayIntelligenceSuiteService } from "./operational-replay-intelligence-suite.service";

@Module({
  imports: [PrismaModule, WorkflowModule],
  controllers: [
    AdminOperationalIntelligenceController,
    AdminOperationalCommandCollaborationController,
    AdminOperationalCommandPresenceController,
  ],
  providers: [
    OperationalEntityGraphAggregationService,
    OperationalIncidentCommandAggregationService,
    OperationalBalancingAggregationService,
    OperationalOutcomeAggregationService,
    OperationalBenchmarkAggregationService,
    OperationalSimulationLabAggregationService,
    OperationalLongitudinalAggregationService,
    OperationalScienceAggregationService,
    OperationalInterventionValidityAggregationService,
    OperationalAnalyticsAggregationService,
    OperationalReplayIntelligenceSuiteService,
    OperationalIntelligenceQueryService,
    OperationalCommandCollaborationService,
    OperationalCommandPresenceService,
  ],
  exports: [
    OperationalAnalyticsAggregationService,
    OperationalBalancingAggregationService,
    OperationalOutcomeAggregationService,
    OperationalBenchmarkAggregationService,
    OperationalSimulationLabAggregationService,
    OperationalLongitudinalAggregationService,
    OperationalScienceAggregationService,
    OperationalInterventionValidityAggregationService,
    OperationalIntelligenceQueryService,
  ],
})
export class OperationalAnalyticsModule {}
