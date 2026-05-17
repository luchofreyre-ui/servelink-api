import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../src/prisma";
import { WorkflowOrchestrationSimulationService } from "../src/modules/workflow/workflow-orchestration-simulation.service";
import {
  OPERATIONAL_SAFETY_EVALUATION_CATEGORY,
  WORKFLOW_SIMULATION_SCENARIO_CATEGORY,
  ORCHESTRATION_SIMULATION_RESULT_VERSION,
  WORKFLOW_SIMULATION_STATE,
} from "../src/modules/workflow/workflow-orchestration-simulation.constants";
import {
  WORKFLOW_EXECUTION_STAGE,
  WORKFLOW_EXECUTION_STATE,
} from "../src/modules/workflow/workflow.constants";

function minimalWorkflowSnapshot() {
  return {
    id: "wf_unit",
    workflowType: "booking_delivery_observe_v1",
    aggregateType: "booking",
    aggregateId: "bk_unit",
    correlationId: "corr_unit",
    triggeringOutboxEventId: null as string | null,
    state: WORKFLOW_EXECUTION_STATE.WAITING_APPROVAL,
    executionStage: WORKFLOW_EXECUTION_STAGE.INITIALIZED,
    executionMode: "observe_only",
    failureReason: null as string | null,
    timers: [] as { wakeAt: Date; timerState: string }[],
    waitStates: [] as { waitState: string }[],
    approvals: [] as unknown[],
    activations: [] as unknown[],
    steps: [] as unknown[],
    policyEvaluations: [] as unknown[],
  };
}

describe("WorkflowOrchestrationSimulationService (unit)", () => {
  function createServiceWithMocks() {
    const txOps = {
      scenarioCreates: [] as unknown[],
      evaluationCreates: [] as unknown[],
      scenarioUpdates: [] as unknown[],
    };

    const tx = {
      workflowSimulationScenario: {
        create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
          const row = { id: `scen_${txOps.scenarioCreates.length}`, ...data };
          txOps.scenarioCreates.push(row);
          return row;
        }),
        update: jest.fn(async ({ where, data }: { where: { id: string }; data: unknown }) => {
          txOps.scenarioUpdates.push({ where, data });
          return { id: where.id, ...((data as object) ?? {}) };
        }),
      },
      operationalSafetyEvaluation: {
        create: jest.fn(
          async ({
            data,
            select,
          }: {
            data: Record<string, unknown>;
            select?: unknown;
          }) => {
            txOps.evaluationCreates.push(data);
            void select;
            return { id: `ev_${txOps.evaluationCreates.length}` };
          },
        ),
      },
    };

    const prismaMock = {
      workflowSimulationScenario: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      workflowExecution: {
        findUnique: jest.fn(),
      },
      workflowExecutionActivation: {
        findUnique: jest.fn(),
      },
      operationalOutboxDeliveryAttempt: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (fn: (t: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };

    const service = new WorkflowOrchestrationSimulationService(
      prismaMock as unknown as PrismaService,
    );

    return { service, prismaMock, tx, txOps };
  }

  it("rejects unsupported scenario categories before touching workflows", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    await expect(
      service.runScenario({
        workflowExecutionId: "wf1",
        scenarioCategory: "unknown_future_category",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.workflowExecution.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("replays idempotent requests without starting a new transaction", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue({
      id: "existing",
      workflowExecutionId: "wf1",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
      resultJson: { cached: true },
    });

    const out = await service.runScenario({
      workflowExecutionId: "wf1",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      idempotencyKey: "idem-a",
    });

    expect(out.replay).toBe(true);
    expect(out.scenarioId).toBe("existing");
    expect(out.resultJson).toEqual({ cached: true });
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("throws when idempotency key is scoped to another workflow", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue({
      id: "existing",
      workflowExecutionId: "other_wf",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      simulationState: WORKFLOW_SIMULATION_STATE.COMPLETED,
      resultJson: {},
    });

    await expect(
      service.runScenario({
        workflowExecutionId: "wf1",
        scenarioCategory:
          WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
        idempotencyKey: "shared",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires activation id for activation_focus_v1", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);

    await expect(
      service.runScenario({
        workflowExecutionId: "wf1",
        scenarioCategory:
          WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ACTIVATION_FOCUS_V1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.workflowExecution.findUnique).not.toHaveBeenCalled();
  });

  it("returns NotFound when workflow execution is missing", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);
    prismaMock.workflowExecution.findUnique.mockResolvedValue(null);

    await expect(
      service.runScenario({
        workflowExecutionId: "missing",
        scenarioCategory:
          WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects activation rows outside the workflow execution", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);
    prismaMock.workflowExecution.findUnique.mockResolvedValue(
      minimalWorkflowSnapshot(),
    );
    prismaMock.workflowExecutionActivation.findUnique.mockResolvedValue({
      id: "act_bad",
      workflowExecutionId: "other",
      activationState: "registered",
      activationCategory: "booking_transition_v1",
      createdAt: new Date(),
    });

    await expect(
      service.runScenario({
        workflowExecutionId: "wf_unit",
        scenarioCategory:
          WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ACTIVATION_FOCUS_V1,
        activationId: "act_bad",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("persists scenario + evaluations and exposes governance rails on snapshot success", async () => {
    const { service, prismaMock, txOps } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);
    prismaMock.workflowExecution.findUnique.mockResolvedValue(
      minimalWorkflowSnapshot(),
    );

    const out = await service.runScenario({
      workflowExecutionId: "wf_unit",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      requestedByUserId: "admin_actor",
    });

    expect(out.replay).toBe(false);
    expect(out.simulationState).toBe(WORKFLOW_SIMULATION_STATE.COMPLETED);
    const body = out.resultJson as Record<string, unknown>;
    expect(body.version).toBe(ORCHESTRATION_SIMULATION_RESULT_VERSION);
    expect(body.simulationOnly).toBe(true);
    expect(body.noAutonomousExecution).toBe(true);
    expect(body.evaluationSummary).toBeTruthy();

    expect(txOps.scenarioCreates.length).toBe(1);
    expect(txOps.evaluationCreates.length).toBeGreaterThan(0);
    expect(txOps.scenarioUpdates.length).toBeGreaterThan(0);
  });

  it("adds activation-chain evaluation for activation_focus_v1", async () => {
    const { service, prismaMock, txOps } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);
    prismaMock.workflowExecution.findUnique.mockResolvedValue(
      minimalWorkflowSnapshot(),
    );
    prismaMock.workflowExecutionActivation.findUnique.mockResolvedValue({
      id: "act_focus",
      workflowExecutionId: "wf_unit",
      activationState: "registered",
      activationCategory: "booking_transition_v1",
      createdAt: new Date(),
    });

    await service.runScenario({
      workflowExecutionId: "wf_unit",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ACTIVATION_FOCUS_V1,
      activationId: "act_focus",
    });

    const cats = txOps.evaluationCreates.map(
      (row) => (row as { evaluationCategory?: string }).evaluationCategory,
    );
    expect(cats).toContain(
      OPERATIONAL_SAFETY_EVALUATION_CATEGORY.ACTIVATION_CHAIN,
    );
    const focusRow = txOps.evaluationCreates.find(
      (row) =>
        (row as { evaluationCategory?: string }).evaluationCategory ===
        OPERATIONAL_SAFETY_EVALUATION_CATEGORY.ACTIVATION_CHAIN,
    ) as { payloadJson?: { activationId?: string } };
    expect(focusRow.payloadJson?.activationId).toBe("act_focus");
  });

  it("does not mutate workflow rows via prisma.update on execution", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);
    prismaMock.workflowExecution.findUnique.mockResolvedValue(
      minimalWorkflowSnapshot(),
    );

    const wfMutationProbe = prismaMock.workflowExecution as {
      findUnique: jest.Mock;
      update?: jest.Mock;
    };
    wfMutationProbe.update = jest.fn();

    const bookingMutationProbe = { update: jest.fn() };
    const prismaAny = prismaMock as typeof prismaMock & {
      booking?: typeof bookingMutationProbe;
    };
    prismaAny.booking = bookingMutationProbe;

    await service.runScenario({
      workflowExecutionId: "wf_unit",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
    });

    expect(wfMutationProbe.update).not.toHaveBeenCalled();
    expect(bookingMutationProbe.update).not.toHaveBeenCalled();
  });

  it("produces identical evaluation summaries for repeated snapshots with the same loaded workflow", async () => {
    const { service, prismaMock } = createServiceWithMocks();
    prismaMock.workflowSimulationScenario.findUnique.mockResolvedValue(null);
    const wf = minimalWorkflowSnapshot();
    prismaMock.workflowExecution.findUnique.mockResolvedValue(wf);

    const first = await service.runScenario({
      workflowExecutionId: "wf_unit",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
    });
    const second = await service.runScenario({
      workflowExecutionId: "wf_unit",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
    });

    const a = (first.resultJson as { evaluationSummary?: Record<string, unknown> })
      .evaluationSummary;
    const b = (second.resultJson as { evaluationSummary?: Record<string, unknown> })
      .evaluationSummary;
    expect(a).toEqual(b);
  });
});
