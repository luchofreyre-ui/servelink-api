import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DeepCleanProgramCard } from "./DeepCleanProgramCard";
import type { DeepCleanProgramDisplay } from "@/types/deepCleanProgram";

const single: DeepCleanProgramDisplay = {
  programId: "p1",
  programType: "single_visit",
  title: "One-visit deep clean",
  description: null,
  totalPriceCents: 50000,
  visits: [
    {
      visitNumber: 1,
      label: "Full visit",
      description: "All scope",
      priceCents: 50000,
      taskBundleId: "dcc_single_visit_full_v1",
      taskBundleLabel: "Single session",
      tasks: [
        {
          taskId: "dcc_t_surface_reset",
          label: "Surface reset",
          description: null,
          category: "foundation",
          effortClass: "standard",
          tags: [],
        },
      ],
    },
  ],
};

const three: DeepCleanProgramDisplay = {
  programId: "p2",
  programType: "three_visit",
  title: "3-visit program",
  description: null,
  totalPriceCents: 60000,
  visits: [
    {
      visitNumber: 1,
      label: "Visit 1",
      description: null,
      priceCents: 30000,
      taskBundleId: null,
      taskBundleLabel: null,
      tasks: [],
    },
    {
      visitNumber: 2,
      label: "Visit 2",
      description: null,
      priceCents: 20000,
      taskBundleId: null,
      taskBundleLabel: null,
      tasks: [],
    },
    {
      visitNumber: 3,
      label: "Visit 3",
      description: null,
      priceCents: 10000,
      taskBundleId: null,
      taskBundleLabel: null,
      tasks: [],
    },
  ],
};

describe("DeepCleanProgramCard", () => {
  it("renders single visit with tasks", () => {
    render(<DeepCleanProgramCard program={single} />);
    expect(screen.getByText("One-visit deep clean")).toBeTruthy();
    expect(screen.getByText("Surface reset")).toBeTruthy();
  });

  it("renders three visits", () => {
    render(<DeepCleanProgramCard program={three} />);
    expect(screen.getByText("Visit 1")).toBeTruthy();
    expect(screen.getByText("Visit 3")).toBeTruthy();
  });

  it("with hideZeroPrices omits empty task message", () => {
    render(<DeepCleanProgramCard program={three} hideZeroPrices />);
    expect(screen.queryByText(/Task checklist unavailable/)).toBeNull();
  });

  it("expectationHeadings shows Visit N expectations", () => {
    render(<DeepCleanProgramCard program={single} expectationHeadings />);
    expect(screen.getByText(/Visit 1 expectations/)).toBeTruthy();
  });
});
