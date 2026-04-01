import { describe, it, expect } from "vitest";
import {
  enforceAuthorityStructure,
  validateSnapshotWithAuthority,
} from "../generationEnforcer";
import { REQUIRED_CANONICAL_SECTION_KEYS, validateGeneratedSnapshot } from "../generationValidator";
import type { CanonicalPageSnapshot } from "../encyclopediaPipelineTypes";
import {
  ensureRequiredSections,
  transformEvidenceToAuthoritySections,
} from "../generation/evidenceToAuthoritySections";

function compliantSnapshot(): CanonicalPageSnapshot {
  return {
    title: "Authority snapshot title long enough",
    slug: "authority-snapshot-slug",
    problem: "Soap scum buildup on vertical surfaces",
    surface: "Glass shower doors",
    intent: "how-clean",
    riskLevel: "medium",
    seo: {
      title: "How to Clean Soap Scum from Glass Shower Doors",
      slug: "how-to-clean-soap-scum-from-glass-shower-doors",
      metaDescription: "Learn how to deal with soap scum on glass shower doors.",
    },
    internalLinks: ["cause-soap-scum", "prevent-soap-scum", "diagnose-etching"],
    sections: [
      {
        key: "whatIs",
        title: "What it is",
        content:
          "Soap scum is a bonded film that dulls glass. First sentence explains appearance. Second sentence ties soil class to rinse behavior. Third sentence contrasts etching from removable film for technician routing.",
      },
      {
        key: "whyItHappens",
        title: "Why it happens",
        content:
          "Hard water minerals combine with surfactants and body oils on glass. First driver is evaporation leaving solids behind. Second driver is incomplete squeegee or rinse allowing layered buildup. Third driver is heat and humidity accelerating film formation in enclosed showers.",
      },
      {
        key: "whereItAppears",
        title: "Where it appears",
        content:
          "Soap scum shows first on vertical glass panels, lower corners, and hardware-adjacent zones where rinse water slows. It also concentrates along door sweeps and track lines where moisture dwells between cleaning cycles.",
      },
      {
        key: "canThisBeFixed",
        title: "Can this be fixed?",
        content: [
          "CAN THIS BE FIXED?",
          "",
          "YES — if:",
          "- Film is removable and chemistry matches the sealer or bare glass.",
          "- No permanent etching is confirmed under raking light.",
          "",
          "NO — if:",
          "- Etching has permanently altered the glass structure.",
          "- Coating failure exposes a hazed layer that cleaning cannot restore.",
          "",
          "PARTIAL — if:",
          "- Heavy film lifts in stages with drying between attempts.",
          "- Edges retain shadowing while the field clears.",
        ].join("\n"),
      },
      {
        key: "chemistry",
        title: "Chemistry",
        content:
          "Acidic chemistry attacks mineral film but risks grout and some coatings. Alkaline chemistry cuts organic binders but needs rinse control. Neutral pH limits risk on sensitive finishes. Solvent chemistry is rarely primary here but matters for adhesive residues. pH discipline prevents cumulative damage.",
      },
      {
        key: "commonMistakes",
        title: "Common mistakes",
        content: [
          "- Using abrasive powders because they scratch glass and cause permanent haze.",
          "- Skipping dwell because it leads to incomplete soil release and repeat damage cycles.",
          "- Over-spraying unsealed stone nearby because it causes alkaline etching risk on marble.",
        ].join("\n"),
      },
      {
        key: "professionalMethod",
        title: "Professional method",
        content: [
          "1. Dry wipe loose debris with a microfiber towel before wet chemistry.",
          "2. Apply compatible chemistry with controlled dwell for the measured film thickness.",
          "3. Agitate with a soft brush or pad, then rinse thoroughly to remove solubilized soil.",
          "4. Squeegee or towel dry fully before judging gloss return after equalized drying.",
        ].join("\n"),
      },
      {
        key: "howToFix",
        title: "How to fix",
        content:
          "Remove the bonded film using chemistry matched to mineral and organic binders, then rinse thoroughly and dry fully before judging improvement. Repeat only when dwell and agitation remain within finish limits and improvement is still realistic.",
      },
      {
        key: "whatToAvoid",
        title: "What to avoid",
        content:
          "Avoid abrasive powders, razor scraping on coated glass, and acidic products that can attack adjacent stone or metal hardware. Avoid judging outcomes before the panel is fully dry because haze often appears late.",
      },
      {
        key: "whatToExpect",
        title: "What to expect",
        content:
          "Light film often resolves in one visit with correct chemistry. Older film may improve partially before a second pass. Permanent etching will not improve with stronger cleaning. Judge outcomes only after full dry-down.",
      },
      {
        key: "whenToStop",
        title: "When to stop",
        content:
          "Stop if micro-scratching appears or gloss tracks with abrasion depth. Permanent etching means cleaning cannot restore clarity. Coating damage risk rises when chemistry dwell exceeds manufacturer limits. Further work yields little gain once improvement plateaus.",
      },
      {
        key: "toolsRequired",
        title: "Tools required",
        content: [
          "- Microfiber towels for lint-controlled wiping and drying.",
          "- Soft brush or white pad for agitation without scratching.",
          "- Sponge or detail towel for tight corners and vertical rinse control.",
        ].join("\n"),
      },
      {
        key: "recommendedProducts",
        title: "Recommended products",
        content: [
          "- Acidic descaler category when mineral film dominates and adjacent stone is protected.",
          "- Mild alkaline bathroom cleaner when organic binders dominate the film.",
          "- Neutral daily maintenance product for light film between deep cycles.",
        ].join("\n"),
      },
      {
        key: "visualDiagnostics",
        title: "Visual diagnostics",
        content: [
          "Type 1: Spotty dull islands",
          "Random matte patches where droplets dry last; indicates localized film thickness.",
          "",
          "Type 2: Vertical tide lines",
          "Streaks that follow sheet flow; indicates rinse and squeegee sequencing issues.",
          "",
          "Type 3: Uniform cloud",
          "Full-panel haze; can indicate thin film or early etching—verify with touch and raking light.",
        ].join("\n"),
      },
      {
        key: "relatedTopics",
        title: "Related topics",
        content:
          "Link to hard water diagnosis, preventive squeegee routines, and grout-safe chemistry pages in the same shower envelope family.",
      },
    ],
  };
}

describe("generation enforcer", () => {
  it("merges authority errors with base validation", () => {
    const snap = compliantSnapshot();
    const baseOnly = validateGeneratedSnapshot(snap);
    expect(baseOnly.valid).toBe(true);

    const full = validateSnapshotWithAuthority(snap);
    expect(full.valid).toBe(true);
  });

  it("rejects chemistry without chemistry language", () => {
    const errors = enforceAuthorityStructure("chemistry", "Only vague cleaning advice with no specifics.");
    expect(errors.some((e) => e.includes("chemistry language"))).toBe(true);
  });

  it("rejects incomplete snapshots at base layer", () => {
    const bad: CanonicalPageSnapshot = {
      ...compliantSnapshot(),
      sections: compliantSnapshot().sections.slice(0, 4),
    };
    const result = validateSnapshotWithAuthority(bad);
    expect(result.valid).toBe(false);
  });

  it("flags missing required keys from validator list", () => {
    expect(REQUIRED_CANONICAL_SECTION_KEYS.length).toBe(15);
  });

  it("fills missing required sections via fallback", () => {
    const sections = [
      {
        key: "whatIs",
        title: "What it is",
        content:
          "valid content here that is long enough to satisfy minimum length requirements for the whatIs section in the canonical pipeline validator.",
      },
    ];

    const result = ensureRequiredSections(sections as any, "test surface", "test problem");

    const keys = result.map((s) => s.key);

    expect(keys).toContain("whereItAppears");
    expect(keys).toContain("howToFix");
    expect(keys).toContain("whatToAvoid");
  });
});

describe("transformEvidenceToAuthoritySections", () => {
  it("builds all 15 authority sections deterministically from evidence", () => {
    const sections = transformEvidenceToAuthoritySections({
      surface: "stainless steel",
      problem: "corrosion",
      relatedTopicSlugs: [
        "how-to-remove-rust-stains-from-stainless-steel",
        "how-to-tell-if-stainless-steel-is-pitted",
        "when-stainless-steel-damage-is-permanent",
      ],
      evidence: {
        surface: "stainless steel",
        problem: "corrosion",
        soilClass: "damage",
        recommendedChemistry: "neutral",
        products: [
          {
            name: "neutral stainless-safe cleaner",
            chemistry: "neutral",
            surfaces: ["stainless steel"],
            avoids: ["aggressive chemistry on damaged zones"],
            reason: "clean the surface without adding chemical stress",
          },
        ],
        method: {
          tools: ["Microfiber cloth", "Inspection lighting"],
          dwell:
            "Clean to expose the actual defect.; Inspect for pitting and roughness.; Wipe gently with the grain.; Dry thoroughly.; Stop once the defect is clearly exposed.",
          agitation: "Gentle with-grain wipes only.",
          rinse: "Damp-clear if needed.",
          dry: "Dry thoroughly.",
        },
        whyItHappens:
          "Corrosion follows finish damage, chloride exposure, prolonged neglect, or harsh environmental conditions.",
        whyItWorks:
          "Neutral cleaning clarifies the condition without adding more chemical stress.",
        professionalInsights: [
          "Differentiate corrosion from transferable rust or residue first.",
          "Pitting and texture matter more than color alone.",
          "Aggressive correction often enlarges the damaged area.",
        ],
        mistakes: [
          "Treating corrosion like dirt.",
          "Using aggressive acids or abrasives.",
          "Ignoring chloride or moisture source.",
          "Overworking the surrounding finish.",
          "Assuming color alone confirms corrosion.",
        ],
        benchmarks: [
          "Transfer stains may improve.",
          "Visible pitting usually means permanent damage.",
          "Cleaning should clarify, not restore.",
        ],
        avoidChemistry: ["acidic", "alkaline"],
        sources: ["test source"],
      },
    });

    expect(sections).toHaveLength(15);
    expect(sections.map((section) => section.key)).toEqual([
      "whatIs",
      "whyItHappens",
      "whereItAppears",
      "canThisBeFixed",
      "chemistry",
      "commonMistakes",
      "professionalMethod",
      "howToFix",
      "whatToAvoid",
      "whatToExpect",
      "whenToStop",
      "toolsRequired",
      "recommendedProducts",
      "visualDiagnostics",
      "relatedTopics",
    ]);

    expect(sections.find((section) => section.key === "canThisBeFixed")?.content).toContain(
      "YES — if:",
    );
    expect(sections.find((section) => section.key === "chemistry")?.content).toContain(
      "Recommended chemistry:",
    );
    expect(sections.find((section) => section.key === "professionalMethod")?.content).toContain(
      "1.",
    );
    expect(
      sections.find((section) => section.key === "relatedTopics")?.content,
    ).toContain("How To Remove Rust Stains From Stainless Steel");
  });
});
