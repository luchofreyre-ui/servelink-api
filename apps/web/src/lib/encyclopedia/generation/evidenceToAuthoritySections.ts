import type { EvidenceRecord } from "../evidence/evidenceTypes";
import type { PageSectionKey } from "../pageTypes";

export type AuthoritySectionKey = PageSectionKey;

export type CanonicalSection = {
  key: AuthoritySectionKey;
  title: string;
  content: string;
};

type BuildAuthoritySectionsInput = {
  surface: string;
  problem: string;
  evidence: EvidenceRecord;
  relatedTopicSlugs: string[];
};

const SECTION_TITLES: Record<AuthoritySectionKey, string> = {
  whatIs: "What it is",
  whyItHappens: "Why it happens",
  whereItAppears: "Where it appears",
  canThisBeFixed: "Can this be fixed?",
  chemistry: "What chemistry works",
  commonMistakes: "What people do wrong",
  professionalMethod: "Professional method",
  howToFix: "How to fix",
  whatToAvoid: "What to avoid",
  whatToExpect: "What to expect",
  whenToStop: "When to stop",
  toolsRequired: "Tools required",
  recommendedProducts: "Recommended products",
  visualDiagnostics: "Visual diagnostics",
  relatedTopics: "Related topics",
};

/** Canonical render order for authority snapshots (15 keys). */
export const AUTHORITY_SECTION_RENDER_ORDER: readonly AuthoritySectionKey[] = [
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
];

const REQUIRED_FILL_KEYS: readonly AuthoritySectionKey[] = [
  "whatIs",
  "whyItHappens",
  "whereItAppears",
  "howToFix",
  "whatToAvoid",
  "whatToExpect",
] as const;

function buildFallbackContent(key: string, surface: string, problem: string): string {
  const s = surface.trim() || "this surface";
  const p = problem.trim() || "this issue";

  switch (key) {
    case "whereItAppears":
      return `On ${s}, ${p} commonly appears in areas exposed to repeated use, moisture, or residue buildup. It is most often seen in kitchens, bathrooms, and high-contact zones where contaminants accumulate over time.`;

    case "howToFix":
      return `To improve ${p} on ${s}, remove the underlying residue using the correct chemistry and mechanical action. The surface should be treated methodically to break down buildup, lift contamination, and restore the material without causing damage.`;

    case "whatToAvoid":
      return `While treating ${p} on ${s}, avoid overly aggressive chemicals or abrasive tools that can damage the finish. Using the wrong method can worsen the issue or permanently alter the material.`;

    case "whatIs":
      return `On ${s}, ${p} is a surface contamination or finish condition that needs to be identified correctly before the cleaning method is chosen.`;

    case "whyItHappens":
      return `On ${s}, ${p} develops when residues, contaminants, or environmental exposure interact with the surface over time, leading to visible or structural changes.`;

    case "whatToExpect":
      return `How much ${p} improves on ${s} depends on severity. Light buildup can often be removed completely, while deeper or long-term damage may only be partially improved.`;

    default:
      return `This section provides additional context for understanding and resolving ${p} on ${s}.`;
  }
}

/**
 * Ensures structural completeness for thin-evidence pages: required keys exist
 * with non-empty content (surface/problem-aware fallbacks).
 */
export function ensureRequiredSections(
  sections: CanonicalSection[],
  surface: string,
  problem: string,
): CanonicalSection[] {
  const map = new Map<string, CanonicalSection>();
  for (const row of sections) {
    map.set(row.key, row);
  }

  for (const key of REQUIRED_FILL_KEYS) {
    const existing = map.get(key);
    const content = existing?.content?.trim() ?? "";
    if (!existing || !content) {
      map.set(key, {
        key,
        title: SECTION_TITLES[key as AuthoritySectionKey],
        content: buildFallbackContent(key, surface, problem),
      });
    }
  }

  const ordered: CanonicalSection[] = [];
  for (const key of AUTHORITY_SECTION_RENDER_ORDER) {
    const row = map.get(key);
    if (row) ordered.push(row);
  }
  return ordered;
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function sentence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function toBullets(values: string[]): string {
  return dedupe(values)
    .map((value) => `- ${sentence(value)}`)
    .join("\n");
}

function normalizeSlugToTopic(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getChemistryLabel(value: string): string {
  switch (value) {
    case "neutral":
      return "neutral";
    case "acidic":
      return "acidic";
    case "alkaline":
      return "alkaline";
    case "solvent":
      return "solvent";
    case "enzymatic":
      return "enzymatic";
    default:
      return value;
  }
}

function buildWhatIs(surface: string, problem: string, evidence: EvidenceRecord): string {
  const intro = `${toTitleCase(problem)} on ${surface} is a ${evidence.soilClass} issue that needs to be identified correctly before the cleaning method is chosen.`;
  const causeBridge = evidence.whyItHappens
    ? `On this surface, the issue usually develops because ${evidence.whyItHappens.trim().replace(/^[A-Z]/, (m) => m.toLowerCase())}`
    : "";
  const insight = evidence.professionalInsights?.[0]
    ? `A useful professional clue is that ${evidence.professionalInsights[0].trim().replace(/^[A-Z]/, (m) => m.toLowerCase())}`
    : "";
  const works = evidence.whyItWorks
    ? sentence(
        `Technically, ${evidence.whyItWorks.trim().replace(/^[A-Z]/, (m) => m.toLowerCase())}`,
      )
    : "";

  return [sentence(intro), sentence(causeBridge), sentence(insight), works]
    .filter(Boolean)
    .join(" ");
}

function buildWhyItHappens(surface: string, problem: string, evidence: EvidenceRecord): string {
  const lead = evidence.whyItHappens
    ? sentence(evidence.whyItHappens)
    : sentence(
        `${toTitleCase(problem)} on ${surface} usually develops from repeated residue loading, environmental exposure, or finish-related change.`,
      );

  const soil = sentence(
    `This problem falls into the ${evidence.soilClass} category, which matters because the removal strategy changes based on whether the issue is active soil, mineral loading, microbial film, or true surface damage.`,
  );

  const insightLines = dedupe(evidence.professionalInsights ?? []).slice(0, 2);
  const insightBlock = insightLines.length
    ? `Professional context:\n${toBullets(insightLines)}`
    : "";

  const worksNote = evidence.whyItWorks ? sentence(evidence.whyItWorks) : "";

  return [lead, soil, insightBlock, worksNote].filter(Boolean).join("\n\n");
}

function buildCanThisBeFixed(problem: string, evidence: EvidenceRecord): string {
  const benchmarks = dedupe(evidence.benchmarks ?? []);
  const positive = benchmarks.filter((line) =>
    /\bimprove|improves|improving|clear|remove|lift|soften|reset\b/i.test(line),
  );
  const negative = benchmarks.filter((line) =>
    /\bremain|permanent|damage|not\b|\bwon't\b|\bcannot\b|\bcorrosion\b|\betch\b/i.test(line),
  );
  const partial = benchmarks.filter(
    (line) => !positive.includes(line) && !negative.includes(line),
  );

  const yesItems = positive.length
    ? positive
    : [
        `The ${problem} is still residue-based and responds during the first controlled cleaning pass`,
        "The surface does not show permanent finish loss, pitting, etching, or structural damage",
      ];

  const noItems = negative.length
    ? negative
    : [
        "The remaining mark is true surface damage rather than removable soil",
        "The defect stays visible after the removable residue has been cleared",
      ];

  const partialItems = partial.length
    ? partial
    : [
        "Some of the appearance issue is removable residue, but part of the visual change is permanent",
      ];

  return [
    "CAN THIS BE FIXED?",
    "",
    "YES — if:",
    toBullets(yesItems),
    "",
    "NO — if:",
    toBullets(noItems),
    "",
    "PARTIAL — if:",
    toBullets(partialItems),
  ].join("\n");
}

function buildChemistry(evidence: EvidenceRecord): string {
  const recommended = [evidence.recommendedChemistry];

  const chemistryLine = `Recommended chemistry: ${recommended.map(getChemistryLabel).join(", ")}. pH discipline matters: match ${evidence.soilClass} soil to acidic, alkaline, neutral, or solvent action only when the finish allows it.`;

  const productLines = dedupe(
    (evidence.products ?? []).map((product) => {
      const chemistry = getChemistryLabel(product.chemistry);
      const avoidHint =
        product.avoids?.length > 0
          ? ` Avoid ${product.avoids.join(", ")} on incompatible zones.`
          : "";
      return `${product.name} (${chemistry}) works here because ${product.reason}.${avoidHint}`;
    }),
  );

  const avoidLine =
    evidence.avoidChemistry && evidence.avoidChemistry.length
      ? `Avoid chemistry: ${evidence.avoidChemistry.map(getChemistryLabel).join(", ")}.`
      : "";

  return [
    sentence(chemistryLine),
    productLines.length ? `Why this chemistry works:\n${toBullets(productLines)}` : "",
    avoidLine ? sentence(avoidLine) : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function mistakeWithBecause(line: string): string {
  const t = line.trim();
  if (!t) return "";
  if (/\b(because|leads to|causes)\b/i.test(t)) return t;
  return `${t}, because this leads to uneven removal and raises finish or coating risk.`;
}

function buildCommonMistakes(evidence: EvidenceRecord): string {
  const lines = dedupe(evidence.mistakes ?? []);
  const expanded = lines.length
    ? lines.map(mistakeWithBecause)
    : [
        mistakeWithBecause(
          "Using the wrong chemistry because the surface defect was not identified correctly",
        ),
        mistakeWithBecause(
          "Using too much force too early, which can create permanent finish damage",
        ),
        mistakeWithBecause(
          "Judging the surface before the area is fully clean and fully dry",
        ),
      ];

  return toBullets(expanded);
}

/** Derive numbered steps from EvidenceRecord.method (no summary/steps on type). */
function buildMethodStepStrings(evidence: EvidenceRecord): string[] {
  const m = evidence.method;
  const steps: string[] = [];

  if (m.tools?.length) {
    steps.push(`Gather ${m.tools.join(", ")} and prep the work area.`);
  }

  const dwellChunks = m.dwell
    .split(/;\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const chunk of dwellChunks) {
    steps.push(chunk);
  }

  if (m.agitation?.trim()) {
    steps.push(`Agitation: ${m.agitation.trim()}`);
  }
  if (m.rinse?.trim()) {
    steps.push(`Rinse: ${m.rinse.trim()}`);
  }
  if (m.dry?.trim()) {
    steps.push(`Dry: ${m.dry.trim()}`);
  }

  const deduped = dedupe(steps);
  while (deduped.length < 4) {
    deduped.push(
      "Reinspect under good light after dry-down before repeating chemistry, because residue films reappear once moisture equalizes.",
    );
  }

  return deduped.slice(0, 12);
}

function buildProfessionalMethod(evidence: EvidenceRecord): string {
  const steps = buildMethodStepStrings(evidence);
  const summary = evidence.whyItWorks
    ? sentence(
        `Overall approach: ${evidence.whyItWorks.trim().replace(/^[A-Z]/, (c) => c.toLowerCase())}`,
      )
    : "";

  const numbered = steps.map((step, index) => `${index + 1}. ${sentence(step)}`).join("\n");

  return [summary, numbered].filter(Boolean).join("\n\n");
}

function buildWhatToExpect(evidence: EvidenceRecord): string {
  const benchmarks = dedupe(evidence.benchmarks ?? []);
  const extra = evidence.professionalInsights?.length
    ? evidence.professionalInsights.slice(0, 2)
    : [];
  const merged = dedupe([...benchmarks, ...extra]);
  return merged.length
    ? toBullets(merged)
    : toBullets([
        "Light residue-based issues should improve during the first controlled pass",
        "Layered or older buildup may take repeated passes",
        "Permanent finish change or damage will remain after removable residue is gone",
      ]);
}

function buildWhenToStop(evidence: EvidenceRecord): string {
  const stopLines = [
    ...(evidence.benchmarks ?? []).filter((line) =>
      /\bpermanent|remain|damage|etch|pitting|corrosion|won't|cannot\b/i.test(line),
    ),
    ...(evidence.mistakes ?? []).filter((line) =>
      /\bdamage|scratch|abrasive|overwork|over-polish|overwet|stress\b/i.test(line),
    ),
  ];

  const unique = dedupe(stopLines);

  const fallback = [
    "Stop when the remaining issue appears to be permanent finish change or surface damage",
    "Stop when further scrubbing, stronger chemistry, or more moisture would raise the risk of scratching, etching, swelling, or coating damage",
    "Stop when the removable residue is gone and only the underlying defect remains",
  ];

  return toBullets(unique.length ? unique : fallback);
}

function extractToolHints(evidence: EvidenceRecord): string[] {
  const fromMethod = dedupe(evidence.method?.tools ?? []);
  const fromFields = [
    evidence.method.dwell,
    evidence.method.agitation,
    evidence.method.rinse,
    evidence.method.dry,
  ]
    .join(" ")
    .toLowerCase();

  const hits: string[] = [];
  if (fromFields.includes("microfiber")) hits.push("Microfiber cloth or microfiber pad");
  if (fromFields.includes("brush")) hits.push("Soft brush or detail brush");
  if (fromFields.includes("non-scratch") || fromFields.includes("pad"))
    hits.push("Non-scratch pad");
  if (fromFields.includes("scrubber")) hits.push("Surface-safe scrubber");
  if (fromFields.includes("dry") || fromFields.includes("towel"))
    hits.push("Dry finishing microfiber or towel");
  if (fromFields.includes("light") || fromFields.includes("inspect"))
    hits.push("Good inspection lighting");

  const combined = dedupe([...fromMethod, ...hits]);

  return combined.length
    ? combined
    : [
        "Microfiber cloth",
        "Surface-appropriate agitation tool",
        "Dry finishing towel or pad",
      ];
}

function buildToolsRequired(evidence: EvidenceRecord): string {
  return toBullets(extractToolHints(evidence));
}

function buildRecommendedProducts(evidence: EvidenceRecord): string {
  const productLines = dedupe(
    (evidence.products ?? []).map((product) => {
      const chemistry = getChemistryLabel(product.chemistry);
      const brand = product.brand ? ` (${product.brand})` : "";
      return `${product.name}${brand} (${chemistry}) — ${sentence(product.reason)}`;
    }),
  );

  return productLines.length
    ? toBullets(productLines)
    : toBullets([
        "Use the least aggressive surface-safe product category that matches the actual soil or damage condition.",
      ]);
}

function buildVisualDiagnostics(surface: string, problem: string, evidence: EvidenceRecord): string {
  const insightA = evidence.professionalInsights?.[0]
    ? sentence(evidence.professionalInsights[0])
    : sentence(
        `The problem may first appear as uneven color, dullness, film, or localized surface change on ${surface}.`,
      );

  const insightB = evidence.professionalInsights?.[1]
    ? sentence(evidence.professionalInsights[1])
    : sentence(
        `A second visual pattern is residue that looks heavier around seams, edges, splash zones, grout lines, or heat zones.`,
      );

  const insightC = evidence.professionalInsights?.[2]
    ? sentence(evidence.professionalInsights[2])
    : sentence(
        `A third pattern is a defect that stays visible even after proper cleaning, which usually signals permanent finish change or damage rather than active ${problem}.`,
      );

  return ["Type 1", insightA, "", "Type 2", insightB, "", "Type 3", insightC].join("\n");
}

function buildRelatedTopics(relatedTopicSlugs: string[]): string {
  const topics = dedupe(relatedTopicSlugs).slice(0, 6);
  return topics.length
    ? toBullets(topics.map(normalizeSlugToTopic))
    : toBullets([
        "Related surface-specific cleaning topics",
        "Adjacent stain or residue categories",
        "Damage-versus-soil diagnosis topics",
      ]);
}

export function transformEvidenceToAuthoritySections(
  input: BuildAuthoritySectionsInput,
): CanonicalSection[] {
  const { surface, problem, evidence, relatedTopicSlugs } = input;

  const sections: CanonicalSection[] = [
    {
      key: "whatIs",
      title: SECTION_TITLES.whatIs,
      content: buildWhatIs(surface, problem, evidence),
    },
    {
      key: "whyItHappens",
      title: SECTION_TITLES.whyItHappens,
      content: buildWhyItHappens(surface, problem, evidence),
    },
    {
      key: "canThisBeFixed",
      title: SECTION_TITLES.canThisBeFixed,
      content: buildCanThisBeFixed(problem, evidence),
    },
    {
      key: "chemistry",
      title: SECTION_TITLES.chemistry,
      content: buildChemistry(evidence),
    },
    {
      key: "commonMistakes",
      title: SECTION_TITLES.commonMistakes,
      content: buildCommonMistakes(evidence),
    },
    {
      key: "professionalMethod",
      title: SECTION_TITLES.professionalMethod,
      content: buildProfessionalMethod(evidence),
    },
    {
      key: "whatToExpect",
      title: SECTION_TITLES.whatToExpect,
      content: buildWhatToExpect(evidence),
    },
    {
      key: "whenToStop",
      title: SECTION_TITLES.whenToStop,
      content: buildWhenToStop(evidence),
    },
    {
      key: "toolsRequired",
      title: SECTION_TITLES.toolsRequired,
      content: buildToolsRequired(evidence),
    },
    {
      key: "recommendedProducts",
      title: SECTION_TITLES.recommendedProducts,
      content: buildRecommendedProducts(evidence),
    },
    {
      key: "visualDiagnostics",
      title: SECTION_TITLES.visualDiagnostics,
      content: buildVisualDiagnostics(surface, problem, evidence),
    },
    {
      key: "relatedTopics",
      title: SECTION_TITLES.relatedTopics,
      content: buildRelatedTopics(relatedTopicSlugs),
    },
  ];

  return ensureRequiredSections(sections, surface, problem);
}
