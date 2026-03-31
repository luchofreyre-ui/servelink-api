import { describe, it, expect, vi } from "vitest";
import type { CanonicalPageSnapshot } from "../encyclopediaPipelineTypes";
import { transformSnapshotToStructured } from "../structuredTransformer";

function minimalSnapshot(
  overrides: Partial<CanonicalPageSnapshot> & Pick<CanonicalPageSnapshot, "slug">
): CanonicalPageSnapshot {
  return {
    title: "Test",
    slug: overrides.slug,
    problem: "Stains",
    surface: "Carpet",
    intent: "Remove",
    riskLevel: "low",
    sections: [{ key: "whatIs", title: "What", content: "Body" }],
    ...overrides,
  };
}

describe("structured transformer", () => {
  it("builds structured article from snapshot", () => {
    const snapshot: CanonicalPageSnapshot = {
      title: "Test",
      slug: "test-slug",
      problem: "Stains",
      surface: "Carpet",
      intent: "Remove",
      riskLevel: "low",
      sections: [
        { key: "whatIs", title: "What this problem is", content: "Paragraph one.\n\nParagraph two." },
      ],
      internalLinks: ["other-topic"],
    };

    const result = transformSnapshotToStructured(snapshot);

    expect(result.title).toBe("Test");
    expect(result.slug).toBe("test-slug");
    expect(result.sections.length).toBeGreaterThan(0);

    const meta = result.sections.find((s) => s.kind === "meta_grid");
    expect(meta?.kind).toBe("meta_grid");
    if (meta?.kind === "meta_grid") {
      expect(meta.rows.some((r) => r.label === "Problem" && r.value === "Stains")).toBe(true);
    }

    const prose = result.sections.find((s) => s.kind === "prose" && s.id === "section_whatIs");
    expect(prose?.kind).toBe("prose");
    if (prose?.kind === "prose") {
      expect(prose.title).toBe("What this problem is");
      expect(prose.body).toContain("Paragraph one");
    }

    const links = result.sections.find((s) => s.kind === "link_list");
    expect(links?.kind).toBe("link_list");
    if (links?.kind === "link_list") {
      expect(links.slugs).toContain("other-topic");
    }
  });

  it("orders meta first, prose in build order, related links last", () => {
    const snapshot: CanonicalPageSnapshot = {
      title: "T",
      slug: "s",
      problem: "p",
      surface: "su",
      intent: "i",
      riskLevel: "medium",
      sections: [
        { key: "a", title: "A", content: "a" },
        { key: "b", title: "B", content: "b" },
      ],
      internalLinks: ["x"],
    };
    const result = transformSnapshotToStructured(snapshot);
    expect(result.sections[0].kind).toBe("meta_grid");
    expect(result.sections.at(-1)?.kind).toBe("link_list");
    const prose = result.sections.filter((x) => x.kind === "prose");
    expect(prose.map((p) => (p as { id: string }).id)).toEqual([
      "section_a",
      "section_b",
    ]);
  });

  it("dedupes internal link slugs case-insensitively preserving first spelling", () => {
    const snapshot = minimalSnapshot({
      slug: "s",
      internalLinks: ["foo-bar", "Foo-Bar", "  foo-bar  ", "other"],
    });
    const result = transformSnapshotToStructured(snapshot);
    const links = result.sections.find((x) => x.kind === "link_list");
    expect(links?.kind).toBe("link_list");
    if (links?.kind === "link_list") {
      expect(links.slugs).toEqual(["foo-bar", "other"]);
    }
  });

  it("maps canThisBeFixed to decision_box and relatedTopics to link_list", () => {
    const snapshot: CanonicalPageSnapshot = {
      title: "T",
      slug: "decision",
      problem: "p",
      surface: "s",
      intent: "i",
      riskLevel: "low",
      internalLinks: ["one-topic", "two-topic", "three-topic"],
      sections: [
        {
          key: "canThisBeFixed",
          title: "Can this be fixed?",
          content: [
            "YES — if:",
            "- first yes",
            "NO — if:",
            "- first no",
            "PARTIAL — if:",
            "- first partial",
          ].join("\n"),
        },
        {
          key: "relatedTopics",
          title: "Related",
          content: "See internal links for more.",
        },
      ],
    };
    const result = transformSnapshotToStructured(snapshot);
    const decision = result.sections.find((s) => s.kind === "decision_box");
    expect(decision?.kind).toBe("decision_box");
    if (decision?.kind === "decision_box") {
      expect(decision.yes).toContain("first yes");
      expect(decision.no).toContain("first no");
      expect(decision.partial).toContain("first partial");
    }
    const linkSections = result.sections.filter((s) => s.kind === "link_list");
    expect(linkSections.length).toBe(1);
    if (linkSections[0]?.kind === "link_list") {
      expect(linkSections[0].slugs).toEqual(["one-topic", "two-topic", "three-topic"]);
    }
  });

  it("throws and logs when canonical sections are missing", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const snapshot: CanonicalPageSnapshot = {
      title: "T",
      slug: "empty-sections",
      problem: "p",
      surface: "s",
      intent: "i",
      riskLevel: "low",
      sections: [],
    };
    expect(() => transformSnapshotToStructured(snapshot)).toThrow(
      "Missing sections for empty-sections"
    );
    expect(err).toHaveBeenCalledWith("[encyclopedia:render:failed]", {
      slug: "empty-sections",
      reason: "missing_sections",
    });
    err.mockRestore();
  });
});
