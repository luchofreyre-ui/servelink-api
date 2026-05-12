import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma.module";
import { AdminOrchestrationPreviewController } from "./admin-orchestration-preview.controller";
import { AdminOrchestrationSimulationController } from "./admin-orchestration-simulation.controller";
import { AdminPortfolioOrchestrationController } from "./admin-portfolio-orchestration.controller";
import { AdminWorkflowApprovalsController } from "./admin-workflow-approvals.controller";
import { AdminWorkflowExecutionsController } from "./admin-workflow-executions.controller";
import { EnrichOperationalTraceRunner } from "./runners/enrich-operational-trace.runner";
import { ObserveDeliveryPipelineRunner } from "./runners/observe-delivery-pipeline.runner";
import { OrchestrationApprovalGateRunner } from "./runners/orchestration-approval-gate.runner";
import { RecordOrchestrationApprovalResolutionRunner } from "./runners/record-orchestration-approval-resolution.runner";
import { WorkflowApprovalService } from "./workflow-approval.service";
import { WorkflowExecutionCoordinatorService } from "./workflow-execution-coordinator.service";
import { WorkflowExecutionService } from "./workflow-execution.service";
import { WorkflowGovernanceExecutionGuard } from "./workflow-governance-execution.guard";
import { WorkflowStepRunnerRegistry } from "./workflow-step-runner.registry";
import { WorkflowOperationalDigestService } from "./workflow-operational-digest.service";
import { WorkflowOrchestrationPreviewService } from "./workflow-orchestration-preview.service";
import { WorkflowOrchestrationSimulationService } from "./workflow-orchestration-simulation.service";
import { WorkflowRecommendationAcceptanceService } from "./workflow-recommendation-acceptance.service";
import { OperationalPolicyEvaluationService } from "./operational-policy-evaluation.service";
import { OperationalPortfolioOrchestrationService } from "./operational-portfolio-orchestration.service";
import { WorkflowTimingSchedulerService } from "./workflow-timing-scheduler.service";
import { WorkflowTimerWakeService } from "./workflow-timer-wake.service";
import { WorkflowTimerWakeCron } from "./workflow-timer-wake.cron";

@Module({
  imports: [PrismaModule],
  controllers: [
    AdminWorkflowExecutionsController,
    AdminWorkflowApprovalsController,
    AdminPortfolioOrchestrationController,
    AdminOrchestrationPreviewController,
    AdminOrchestrationSimulationController,
  ],
  providers: [
    OperationalPolicyEvaluationService,
    OperationalPortfolioOrchestrationService,
    WorkflowGovernanceExecutionGuard,
    WorkflowApprovalService,
    ObserveDeliveryPipelineRunner,
    EnrichOperationalTraceRunner,
    OrchestrationApprovalGateRunner,
    RecordOrchestrationApprovalResolutionRunner,
    WorkflowStepRunnerRegistry,
    WorkflowOperationalDigestService,
    WorkflowExecutionCoordinatorService,
    WorkflowExecutionService,
    WorkflowTimingSchedulerService,
    WorkflowTimerWakeService,
    WorkflowTimerWakeCron,
    WorkflowOrchestrationPreviewService,
    WorkflowRecommendationAcceptanceService,
    WorkflowOrchestrationSimulationService,
  ],
  exports: [
    WorkflowOperationalDigestService,
    OperationalPolicyEvaluationService,
    OperationalPortfolioOrchestrationService,
    WorkflowExecutionService,
    WorkflowExecutionCoordinatorService,
    WorkflowApprovalService,
    WorkflowOrchestrationPreviewService,
  ],
})
export class WorkflowModule {}
