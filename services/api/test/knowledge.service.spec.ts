import { NotFoundException } from "@nestjs/common";
import { KnowledgeService } from "../src/modules/knowledge/knowledge.service";

describe("KnowledgeService", () => {
  let service: KnowledgeService;

  beforeEach(() => {
    service = new KnowledgeService();
  });

  it("resolves an exact quick solve scenario", () => {
    const result = service.resolveQuickSolve({
      surfaceId: "glass_shower_door",
      problemId: "soap_scum",
      severity: "heavy",
    });

    expect(result.surface.id).toBe("glass_shower_door");
    expect(result.problem.id).toBe("soap_scum");
    expect(result.scenario.id).toBe("glass_shower_door_soap_scum_heavy");
    expect(result.method.id).toBe("acidic_descaling");
    expect(result.tools.length).toBeGreaterThan(0);
    expect(result.chemicals.length).toBeGreaterThan(0);
  });

  it("falls back to medium severity when exact severity is missing", () => {
    const result = service.resolveQuickSolve({
      surfaceId: "tile",
      problemId: "soap_scum",
      severity: "heavy",
    });

    expect(result.scenario.id).toBe("tile_soap_scum_medium");
    expect(result.input.severity).toBe("heavy");
  });

  it("falls back to first matching surface/problem scenario when medium is also missing", () => {
    const result = service.resolveQuickSolve({
      surfaceId: "granite_countertop",
      problemId: "food_residue",
      severity: "heavy",
    });

    expect(result.scenario.id).toBe("granite_countertop_food_residue_light");
  });

  it("throws a clean not found error when no scenario exists", () => {
    expect(() =>
      service.resolveQuickSolve({
        surfaceId: "tile",
        problemId: "grease",
        severity: "medium",
      }),
    ).toThrow(NotFoundException);
  });

  it("returns fully expanded tool and chemical objects", () => {
    const result = service.resolveQuickSolve({
      surfaceId: "sink_faucet",
      problemId: "hard_water_spots",
      severity: "medium",
    });

    expect(result.tools.some((tool) => tool.id === "microfiber_towel")).toBe(true);
    expect(result.chemicals.some((chemical) => chemical.id === "acidic_scale_remover")).toBe(true);
    expect(result.method.shortWhyItWorks.length).toBeGreaterThan(10);
  });
});
