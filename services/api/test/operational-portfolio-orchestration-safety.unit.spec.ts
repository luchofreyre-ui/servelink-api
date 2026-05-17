import { OperationalPortfolioOrchestrationService } from "../src/modules/workflow/operational-portfolio-orchestration.service";
import type { OrchestrationSafetyPortfolioCounts } from "../src/modules/workflow/operational-portfolio-orchestration.service";

type PrivatePortfolioSafety = {
  getAdminOrchestrationSafetyPortfolio(
    since24h: Date,
  ): Promise<OrchestrationSafetyPortfolioCounts>;
  getFoOrchestrationSafetyPortfolio(
    workflowExecutionIds: string[],
    since24h: Date,
  ): Promise<OrchestrationSafetyPortfolioCounts>;
};

describe("OperationalPortfolioOrchestrationService — orchestration safety mirrors", () => {
  it("admin rollup counts delivery attempts + successes globally", async () => {
    const prisma = {
      workflowExecutionActivation: {
        count: jest.fn().mockResolvedValueOnce(2).mockResolvedValueOnce(1).mockResolvedValueOnce(0),
      },
      workflowDryRunExecution: {
        count: jest.fn().mockResolvedValueOnce(3),
      },
      operationalSafetyEvaluation: {
        count: jest.fn().mockResolvedValueOnce(4),
      },
      workflowSimulationScenario: {
        count: jest.fn().mockResolvedValueOnce(5),
      },
      operationalOutboxDeliveryAttempt: {
        count: jest.fn().mockResolvedValueOnce(20).mockResolvedValueOnce(18),
      },
    };

    const svc = new OperationalPortfolioOrchestrationService(prisma as never);
    const row = await (
      svc as unknown as PrivatePortfolioSafety
    ).getAdminOrchestrationSafetyPortfolio(new Date());

    expect(row).toMatchObject({
      activationsRegistered: 2,
      activationsApprovedForInvoke: 1,
      activationsFailed: 0,
      dryRunsFailedLast24h: 3,
      safetyEvaluationsAttentionLast24h: 4,
      simulationsCompletedLast24h: 5,
      deliveryAttemptsLast24h: 20,
      deliverySuccessesLast24h: 18,
    });
  });

  it("FO rollup scopes primitive counts and nulls delivery mirror fields", async () => {
    const prisma = {
      workflowExecutionActivation: {
        count: jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(0).mockResolvedValueOnce(2),
      },
      workflowDryRunExecution: {
        count: jest.fn().mockResolvedValueOnce(6),
      },
      operationalSafetyEvaluation: {
        count: jest.fn().mockResolvedValueOnce(7),
      },
      workflowSimulationScenario: {
        count: jest.fn().mockResolvedValueOnce(8),
      },
    };

    const svc = new OperationalPortfolioOrchestrationService(prisma as never);
    const row = await (
      svc as unknown as PrivatePortfolioSafety
    ).getFoOrchestrationSafetyPortfolio(["wf_scope"], new Date());

    expect(row.deliveryAttemptsLast24h).toBeNull();
    expect(row.deliverySuccessesLast24h).toBeNull();
    expect(row.dryRunsFailedLast24h).toBe(6);
    expect(row.safetyEvaluationsAttentionLast24h).toBe(7);
    expect(row.simulationsCompletedLast24h).toBe(8);
    expect(row.activationsFailed).toBe(2);
  });

  it("FO rollup returns empty counts when no workflow ids", async () => {
    const prisma = {
      workflowExecutionActivation: { count: jest.fn() },
      workflowDryRunExecution: { count: jest.fn() },
      operationalSafetyEvaluation: { count: jest.fn() },
      workflowSimulationScenario: { count: jest.fn() },
    };

    const svc = new OperationalPortfolioOrchestrationService(prisma as never);
    const row = await (
      svc as unknown as PrivatePortfolioSafety
    ).getFoOrchestrationSafetyPortfolio([], new Date());

    expect(prisma.workflowExecutionActivation.count).not.toHaveBeenCalled();
    expect(row.deliveryAttemptsLast24h).toBeNull();
    expect(row.dryRunsFailedLast24h).toBe(0);
  });
});
