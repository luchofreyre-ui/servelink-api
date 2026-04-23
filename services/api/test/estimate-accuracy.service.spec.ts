import { EstimateVarianceReasonCode } from "@prisma/client";
import { EstimateAccuracyService } from "../src/modules/estimate-accuracy/estimate-accuracy.service";

describe("EstimateAccuracyService", () => {
  it("getAggregateMetrics computes band rates", async () => {
    const prisma = {
      estimateAccuracyAudit: {
        findMany: jest.fn().mockResolvedValue([
          {
            laborVariancePct: 5,
            varianceReasonCodes: [EstimateVarianceReasonCode.other],
            estimateInputSnapshot: {
              estimateInput: { overall_labor_condition: "normal_lived_in" },
            },
          },
          {
            laborVariancePct: 20,
            varianceReasonCodes: [
              EstimateVarianceReasonCode.kitchen_underestimated,
            ],
            estimateInputSnapshot: {
              estimateInput: { overall_labor_condition: "major_reset" },
            },
          },
        ]),
      },
    } as any;

    const svc = new EstimateAccuracyService(prisma);
    const m = await svc.getAggregateMetrics();
    expect(m.sampleSize).toBe(2);
    expect(m.pctWithin10Labor).toBe(50);
    expect(m.pctWithin15Labor).toBe(50);
    expect(m.pctWithin20Labor).toBe(100);
    expect(m.missRateBeyond15Pct).toBe(50);
    expect(m.topMissReasons.length).toBeGreaterThan(0);
    expect(m.worstCorrelatedIntakeSignals[0].signal).toBeDefined();
  });
});
