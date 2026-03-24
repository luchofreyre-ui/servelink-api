import { mapAuthorityTagsToFoKnowledgeLinks } from "../src/modules/authority/fo-authority-knowledge.mapper";

describe("mapAuthorityTagsToFoKnowledgeLinks", () => {
  it("maps a problem tag to /problems/{slug}", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      problems: ["grease-buildup"],
    });
    expect(links).toEqual([
      expect.objectContaining({
        kind: "problem",
        slug: "grease-buildup",
        pathname: "/problems/grease-buildup",
        title: "Grease Buildup",
        sourceTags: ["grease-buildup"],
      }),
    ]);
  });

  it("maps a method tag to /methods/{slug}", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      methods: ["degreasing"],
    });
    expect(links).toEqual([
      expect.objectContaining({
        kind: "method",
        slug: "degreasing",
        pathname: "/methods/degreasing",
        sourceTags: ["degreasing"],
      }),
    ]);
  });

  it("maps a surface tag to /surfaces/{slug}", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      surfaces: ["shower-glass"],
    });
    expect(links).toEqual([
      expect.objectContaining({
        kind: "surface",
        slug: "shower-glass",
        pathname: "/surfaces/shower-glass",
        sourceTags: ["shower-glass"],
      }),
    ]);
  });

  it("maps smudging to the web fingerprints-and-smudges problem slug", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      problems: ["smudging"],
    });
    expect(links).toEqual([
      expect.objectContaining({
        kind: "problem",
        slug: "fingerprints-and-smudges",
        pathname: "/problems/fingerprints-and-smudges",
        sourceTags: ["smudging"],
      }),
    ]);
  });

  it("aliases API problem tags to web problem slugs and merges duplicates", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      problems: ["limescale", "hard-water-deposits"],
    });
    const hw = links.filter((l) => l.pathname === "/problems/hard-water-deposits");
    expect(hw).toHaveLength(1);
    expect(hw[0]!.sourceTags).toEqual(["hard-water-deposits", "limescale"]);
    expect(hw[0]!.slug).toBe("hard-water-deposits");
  });

  it("ignores tags not in the bundled authority snapshot", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      problems: ["unknown-problem"],
      surfaces: ["unknown-surface"],
      methods: ["unknown-method"],
    });
    expect(links).toHaveLength(0);
  });

  it("orders problems before methods before surfaces, then by pathname", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      problems: ["soap-scum"],
      surfaces: ["tile"],
      methods: ["glass-cleaning"],
    });
    expect(links.map((l) => l.kind)).toEqual(["problem", "method", "surface"]);
  });

  it("keeps merged duplicate paths stable after kind-priority sort", () => {
    const links = mapAuthorityTagsToFoKnowledgeLinks({
      problems: ["limescale", "hard-water-deposits"],
      methods: ["degreasing"],
    });
    const hw = links.find((l) => l.pathname === "/problems/hard-water-deposits");
    expect(hw?.sourceTags).toEqual(["hard-water-deposits", "limescale"]);
    expect(links[0]?.kind).toBe("problem");
  });
});
