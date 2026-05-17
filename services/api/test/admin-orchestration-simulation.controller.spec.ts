import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AdminOrchestrationSimulationController } from "../src/modules/workflow/admin-orchestration-simulation.controller";
import { WorkflowOrchestrationSimulationService } from "../src/modules/workflow/workflow-orchestration-simulation.service";
import { WORKFLOW_SIMULATION_SCENARIO_CATEGORY } from "../src/modules/workflow/workflow-orchestration-simulation.constants";
import { AdminGuard } from "../src/guards/admin.guard";

describe("AdminOrchestrationSimulationController", () => {
  let controller: AdminOrchestrationSimulationController;
  const runScenario = jest.fn();
  const listScenarios = jest.fn();
  const listSafetyEvaluations = jest.fn();

  beforeEach(async () => {
    runScenario.mockReset();
    listScenarios.mockReset();
    listSafetyEvaluations.mockReset();

    const moduleRef = await Test.createTestingModule({
      controllers: [AdminOrchestrationSimulationController],
      providers: [
        {
          provide: WorkflowOrchestrationSimulationService,
          useValue: {
            runScenario,
            listScenarios,
            listSafetyEvaluations,
          },
        },
      ],
    }).compile();

    controller = moduleRef.get(AdminOrchestrationSimulationController);
  });

  it("requires authenticated actor user id", async () => {
    await expect(
      controller.run({ user: { role: "admin" } } as never, {
        workflowExecutionId: "wf",
        scenarioCategory:
          WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("trims ids and forwards to simulation service", async () => {
    runScenario.mockResolvedValue({
      replay: false,
      scenarioId: "scen_1",
      simulationState: "completed",
      resultJson: { simulationOnly: true },
    });

    const out = await controller.run(
      { user: { userId: "  actor  ", role: "admin" } } as never,
      {
        workflowExecutionId: "  wf1 ",
        scenarioCategory: `  ${WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1} `,
        activationId: " act ",
        idempotencyKey: " idem ",
      },
    );

    expect(out).toEqual({
      ok: true,
      replay: false,
      scenarioId: "scen_1",
      simulationState: "completed",
      resultJson: { simulationOnly: true },
    });
    expect(runScenario).toHaveBeenCalledWith({
      workflowExecutionId: "wf1",
      scenarioCategory:
        WORKFLOW_SIMULATION_SCENARIO_CATEGORY.ORCHESTRATION_SAFETY_SNAPSHOT_V1,
      activationId: "act",
      requestedByUserId: "actor",
      idempotencyKey: "idem",
    });
  });

  it("lists scenarios with bounded take default", async () => {
    listScenarios.mockResolvedValue([{ id: "a" }]);
    const out = await controller.scenarios("wf9", undefined);
    expect(out).toEqual({ ok: true, items: [{ id: "a" }] });
    expect(listScenarios).toHaveBeenCalledWith("wf9", 30);
  });

  it("lists safety evaluations", async () => {
    listSafetyEvaluations.mockResolvedValue([]);
    await controller.safetyEvaluations("wf9", "60");
    expect(listSafetyEvaluations).toHaveBeenCalledWith("wf9", 60);
  });
});

describe("AdminGuard (orchestration simulation surface)", () => {
  const guard = new AdminGuard();

  it("allows admin role", () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "admin" } }),
      }),
    } as never;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("blocks franchise-owner role", () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: "fo" } }),
      }),
    } as never;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
