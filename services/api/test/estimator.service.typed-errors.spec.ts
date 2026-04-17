import { EstimatorService } from "../src/modules/estimate/estimator.service";
import type { EstimateInput } from "../src/modules/estimate/estimator.service";
import {
  EstimatorExecutionError,
  EstimatorInputValidationError,
} from "../src/modules/estimate/errors/estimator.errors";

function baseInput(): EstimateInput {
  return {
    property_type: "house",
    sqft_band: "2000_2499",
    bedrooms: "2",
    bathrooms: "2",
    floors: "1",
    service_type: "deep_clean",
    first_time_with_servelink: "no",
    clutter_level: "minimal",
    kitchen_condition: "normal",
    bathroom_condition: "normal",
    pet_presence: "none",
  };
}

describe("EstimatorService typed errors", () => {
  it("wraps unexpected failures in EstimatorExecutionError with cause", async () => {
    const root = new Error("forced deep clean config failure");
    const fo = { matchFOs: jest.fn() };
    const deepCleanEstimatorConfig = {
      getActiveForEstimate: jest.fn().mockRejectedValue(root),
    };
    const svc = new EstimatorService(fo as never, deepCleanEstimatorConfig as never);

    await expect(svc.estimate(baseInput())).rejects.toBeInstanceOf(EstimatorExecutionError);

    try {
      await svc.estimate(baseInput());
    } catch (e) {
      expect(e).toBeInstanceOf(EstimatorExecutionError);
      const cause = (e as Error & { cause?: unknown }).cause;
      expect(cause).toBe(root);
    }
  });

  it("throws EstimatorInputValidationError for invalid enum combinations before execution", async () => {
    const fo = { matchFOs: jest.fn() };
    const deepCleanEstimatorConfig = { getActiveForEstimate: jest.fn() };
    const svc = new EstimatorService(fo as never, deepCleanEstimatorConfig as never);

    const bad = { ...baseInput(), sqft_band: "not_a_band" } as unknown as EstimateInput;

    await expect(svc.estimate(bad)).rejects.toBeInstanceOf(EstimatorInputValidationError);
    expect(deepCleanEstimatorConfig.getActiveForEstimate).not.toHaveBeenCalled();
  });
});
