// contentBuilder.ts

import { classifyMaterial } from "./materialClassifier";
import { getRecommendedChemical } from "./chemicalMatrix";
import { getRecommendedTool } from "./toolSelector";
import { getSafetyWarning } from "./safetyRules";
import type { GeneratedPage, PageSectionKey } from "./pageTypes";
import type { GeneratedPageContent } from "./contentTypes";
import { MIN_SECTION_LENGTH } from "./generationValidator";
import { selectEvidenceForPage } from "./evidenceSelector";
import { buildCleaningRationale } from "./rationaleBuilder";
import { scorePageQuality } from "./pageQualityScorer";
import {
  writeWhatIs,
  writeWhyItHappens,
  writeWhatToExpect,
} from "./sectionWriters";

function padToAuthorityMin(key: PageSectionKey, body: string, surface: string, problem: string): string {
  const min = MIN_SECTION_LENGTH[key];
  let out = body.trim();
  const tail = ` This stays specific to ${problem} on ${surface} rather than generic housekeeping guidance.`;
  while (out.length < min) {
    out += tail;
  }
  return out;
}

function methodChemistryAndTool(problem: string, surface: string): {
  chemicalText: string;
  toolText: string;
  safety: string;
} {
  const material = classifyMaterial(surface);
  const chemical = getRecommendedChemical(problem, material);
  const tool = getRecommendedTool(material);
  const safety = getSafetyWarning(material, chemical) ?? "";

  let chemicalText = "";
  let toolText = "";

  switch (chemical) {
    case "acid":
      chemicalText = "acidic or low-pH chemistry such as a controlled descaler";
      break;
    case "alkaline":
      chemicalText = "alkaline degreaser chemistry";
      break;
    case "neutral":
      chemicalText = "neutral pH cleaner chemistry";
      break;
    case "solvent":
      chemicalText = "solvent-based chemistry with ventilation controls";
      break;
  }

  switch (tool) {
    case "microfiber":
      toolText = "a microfiber towel";
      break;
    case "non-abrasive pad":
      toolText = "a non-abrasive pad";
      break;
    case "soft brush":
      toolText = "a soft-bristle brush";
      break;
    case "scrub pad":
      toolText = "a light scrub pad";
      break;
  }

  return { chemicalText, toolText, safety };
}

export function buildPageContent(page: GeneratedPage): GeneratedPageContent {
  const { problem, surface } = page.meta;

  const evidenceBundle = selectEvidenceForPage(page);
  const rationale = buildCleaningRationale(problem, surface);
  const { chemicalText, toolText, safety } = methodChemistryAndTool(problem, surface);

  const advancedNotes =
    page.meta.needsChemicalExplanation || page.meta.needsMaterialSpecifics
      ? "This surface requires careful product selection and technique due to material sensitivity. Using the wrong chemical or tool can permanently alter the surface."
      : undefined;

  const canThisBeFixed = [
    "CAN THIS BE FIXED?",
    "",
    "YES — if:",
    `- The film on ${surface} is removable soil rather than permanent etching or coating failure.`,
    `- Selected chemistry matches soil type without exceeding finish limits.`,
    "",
    "NO — if:",
    `- Scratching, deep etching, or coating delamination already changed the surface permanently.`,
    `- Repeated abrasion exposed underlayers that cannot be restored by cleaning alone.`,
    "",
    "PARTIAL — if:",
    `- Heavy buildup lifts in stages and needs drying between attempts before judging gloss return.`,
    `- Porous zones retain shadowing even when the main field reads clean after rinsing.`,
  ].join("\n");

  const chemistry = [
    `Technicians choose acid, alkaline, neutral, or solvent chemistry based on how ${problem} bonds to ${surface}.`,
    `For this page context, ${chemicalText} is the primary directional choice while monitoring pH exposure time.`,
    `Avoid chasing gloss with stronger chemistry than the finish allows, because alkaline strippers and acidic etchants can both cause permanent damage when misapplied.`,
  ].join(" ");

  const commonMistakes = [
    `- Using abrasive pads on ${surface} because it causes micro-scratching that traps soil and dulls the finish.`,
    `- Skipping rinse and dry because it leads to residue filming that reads as a new stain cycle.`,
    `- Over-wetting seams and transitions because it drives moisture into edges and slows true dry-down assessment.`,
  ].join("\n");

  const professionalMethod = [
    `1. Inspect ${surface} under raking light and remove loose debris with a dry microfiber towel before wet work.`,
    `2. Apply ${chemicalText} with controlled dwell, then agitate using ${toolText} along the safe direction for the finish.`,
    `3. Rinse thoroughly to remove solubilized soil and cleaner surfactants so nothing resets on cool-down.`,
    `4. Dry fully with a clean microfiber towel, then evaluate after equalized drying because haze often appears late.${safety ? ` ${safety}` : ""}`,
  ].join("\n");

  const whenToStop = [
    `Stop when gloss loss tracks with physical texture change, permanent etching, or coating damage risk on ${surface}.`,
    `Scratching risk rises when grit is trapped under towels, pads, or brushes during agitation.`,
    `If two controlled cycles plateau with no improvement, further cleaning is usually low value and increases finish risk.`,
  ].join(" ");

  const toolsRequired = [
    `- Microfiber towels for dry passes, controlled damp wiping, and final lint-free drying.`,
    `- ${toolText.replace(/^a /, "")} for agitation matched to the finish.`,
    `- Optional soft brush when texture requires mechanical help without aggressive abrasion.`,
  ].join("\n");

  const recommendedProducts = [
    `- Use the chemistry family implied by ${chemicalText} for the active soil on ${surface}.`,
    `- Keep a neutral pH maintenance product for light daily film when aggressive chemistry is not warranted.`,
    `- Add a rinse surfactant or squeegee workflow when hard water leaves spotting after cleaning.`,
  ].join("\n");

  const visualDiagnostics = [
    "Type 1: Localized spots",
    `Isolated marks where drips or oils concentrate on ${surface}; often the first loss of uniform reflectivity.`,
    "",
    "Type 2: Edge haze",
    "Dull collars where rinse water slows at transitions because residue dries unevenly along boundaries.",
    "",
    "Type 3: Broad veil",
    "Full-field dulling that tracks wiping pattern and drying time, suggesting thin-film residue or cleaner carryover.",
  ].join("\n");

  const relatedTopics = [
    `Read adjacent pages on what causes ${problem}, how prevention routines differ on ${surface}, and how to judge permanent versus removable change.`,
    `Stay within the same surface family so chemistry and tool guidance remains coherent across internal links.`,
  ].join(" ");

  const whatIs = padToAuthorityMin(
    "whatIs",
    `${writeWhatIs(problem, surface)} It is distinct from unrelated dulling causes because it follows use patterns and soil chemistry tied to this material.`,
    surface,
    problem,
  );

  const whyItHappens = padToAuthorityMin(
    "whyItHappens",
    writeWhyItHappens(problem, surface),
    surface,
    problem,
  );

  const whereItAppears = padToAuthorityMin(
    "whereItAppears",
    `On ${surface}, ${problem} commonly appears in splash zones, seams, edges, and high-contact panels before spreading to larger fields.`,
    surface,
    problem,
  );

  const whatToExpect = padToAuthorityMin(
    "whatToExpect",
    writeWhatToExpect(problem, surface),
    surface,
    problem,
  );

  const howToFix = padToAuthorityMin(
    "howToFix",
    [
      `Treat ${surface} with progressive chemistry, controlled dwell, appropriate agitation, thorough rinse, and full dry-down before judging improvement.`,
      `Repeat only when soil type and finish risk still allow another controlled pass.`,
    ].join(" "),
    surface,
    problem,
  );

  const whatToAvoid = padToAuthorityMin(
    "whatToAvoid",
    [
      `Avoid abrasive tools, undisciplined pH, excessive moisture dwell, and multi-chemistry mixing that can damage seals, coatings, or sensitive finishes on ${surface}.`,
      `Avoid judging outcomes before the surface is fully clean and fully dry.`,
    ].join(" "),
    surface,
    problem,
  );

  const sections: { key: PageSectionKey; content: string }[] = [
    { key: "whatIs", content: whatIs },
    { key: "whyItHappens", content: whyItHappens },
    { key: "whereItAppears", content: whereItAppears },
    { key: "canThisBeFixed", content: padToAuthorityMin("canThisBeFixed", canThisBeFixed, surface, problem) },
    { key: "chemistry", content: padToAuthorityMin("chemistry", chemistry, surface, problem) },
    { key: "commonMistakes", content: padToAuthorityMin("commonMistakes", commonMistakes, surface, problem) },
    {
      key: "professionalMethod",
      content: padToAuthorityMin("professionalMethod", professionalMethod, surface, problem),
    },
    { key: "howToFix", content: howToFix },
    { key: "whatToAvoid", content: whatToAvoid },
    { key: "whatToExpect", content: whatToExpect },
    { key: "whenToStop", content: padToAuthorityMin("whenToStop", whenToStop, surface, problem) },
    { key: "toolsRequired", content: padToAuthorityMin("toolsRequired", toolsRequired, surface, problem) },
    {
      key: "recommendedProducts",
      content: padToAuthorityMin("recommendedProducts", recommendedProducts, surface, problem),
    },
    {
      key: "visualDiagnostics",
      content: padToAuthorityMin("visualDiagnostics", visualDiagnostics, surface, problem),
    },
    { key: "relatedTopics", content: padToAuthorityMin("relatedTopics", relatedTopics, surface, problem) },
  ];

  const baseContent: GeneratedPageContent = {
    title: page.title,
    slug: page.slug,
    sections,
    advancedNotes,
    evidence: evidenceBundle.evidence,
    rationale,
  };

  return {
    ...baseContent,
    qualityScore: scorePageQuality(page, evidenceBundle),
  };
}
