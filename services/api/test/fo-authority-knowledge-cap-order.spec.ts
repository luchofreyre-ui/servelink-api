import { AUTHORITY_SNAPSHOT } from "../src/modules/authority/authority.snapshot";
import { mapAuthorityTagsToFoKnowledgeLinks } from "../src/modules/authority/fo-authority-knowledge.mapper";

describe("FO knowledge links cap after ranking", () => {
  it("slice keeps higher-priority kinds first when capping", () => {
    const problems = [...AUTHORITY_SNAPSHOT.problems];
    const methods = [...AUTHORITY_SNAPSHOT.methods];
    const surfaces = [...AUTHORITY_SNAPSHOT.surfaces];
    const full = mapAuthorityTagsToFoKnowledgeLinks({
      problems,
      methods,
      surfaces,
    });
    const capped = full.slice(0, 12);
    expect(capped.length).toBe(12);
    expect(capped[0]!.kind).toBe("problem");
    expect(capped[11]!.kind).not.toBe("surface");
  });
});
