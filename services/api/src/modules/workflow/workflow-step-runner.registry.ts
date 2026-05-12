import { Injectable } from "@nestjs/common";
import type { WorkflowStepRunner } from "./workflow-step-execution.contract";
import { ObserveDeliveryPipelineRunner } from "./runners/observe-delivery-pipeline.runner";
import { EnrichOperationalTraceRunner } from "./runners/enrich-operational-trace.runner";
import { OrchestrationApprovalGateRunner } from "./runners/orchestration-approval-gate.runner";
import { RecordOrchestrationApprovalResolutionRunner } from "./runners/record-orchestration-approval-resolution.runner";

@Injectable()
export class WorkflowStepRunnerRegistry {
  private readonly byKey = new Map<string, WorkflowStepRunner>();

  constructor(
    observe: ObserveDeliveryPipelineRunner,
    enrich: EnrichOperationalTraceRunner,
    gate: OrchestrationApprovalGateRunner,
    resolution: RecordOrchestrationApprovalResolutionRunner,
  ) {
    this.register(observe);
    this.register(enrich);
    this.register(gate);
    this.register(resolution);
  }

  private register(runner: WorkflowStepRunner): void {
    const key = `${runner.stepType}:v${runner.stepVersion}`;
    this.byKey.set(key, runner);
  }

  resolve(stepType: string, stepVersion: number): WorkflowStepRunner | null {
    return this.byKey.get(`${stepType}:v${stepVersion}`) ?? null;
  }
}
