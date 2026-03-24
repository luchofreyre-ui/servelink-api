import { BookingIntelligenceService } from "../src/modules/authority/booking-intelligence.service";

describe("BookingIntelligenceService", () => {
  let service: BookingIntelligenceService;

  beforeEach(() => {
    service = new BookingIntelligenceService();
  });

  it("detects tile + grease and returns degreasing", () => {
    const result = service.resolveTags({
      notes: "Kitchen tile has heavy grease buildup near backsplash",
    });

    expect(result.surfaces).toContain("tile");
    expect(result.problems).toContain("grease-buildup");
    expect(result.methods).toContain("degreasing");
  });

  it("detects shower glass + hard water", () => {
    const result = service.resolveTags({
      notes: "Shower glass has hard water spots and limescale",
    });

    expect(result.surfaces).toContain("shower-glass");
    expect(result.problems).toContain("hard-water-deposits");
    expect(result.problems).toContain("limescale");
    expect(result.methods).toContain("hard-water-deposit-removal");
  });

  it("detects touchpoint contamination on painted walls", () => {
    const result = service.resolveTags({
      notes: "Painted wall around switches needs sanitize for high touch contamination",
    });

    expect(result.surfaces).toContain("painted-walls");
    expect(result.problems).toContain("touchpoint-contamination");
    expect(result.methods).toContain("touchpoint-sanitization");
  });

  it("returns stable empty arrays when nothing matches", () => {
    const result = service.resolveTags({
      notes: "No recognizable authority keywords here",
    });

    expect(result.surfaces).toEqual([]);
    expect(result.problems).toEqual([]);
    expect(result.methods).toEqual([]);
    expect(Array.isArray(result.reasons)).toBe(true);
  });
});
