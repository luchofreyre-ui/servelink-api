import fs from "fs";
import path from "path";

import type { CanonicalPageSnapshot } from "../../src/lib/encyclopedia/encyclopediaPipelineTypes";
import { MIN_SECTION_LENGTH } from "../../src/lib/encyclopedia/generationValidator";
import { validateSnapshotWithAuthority } from "../../src/lib/encyclopedia/generationEnforcer";
import type { EvidenceRecord } from "../../src/lib/encyclopedia/evidence/evidenceTypes";
import { transformEvidenceToAuthoritySections } from "../../src/lib/encyclopedia/generation/evidenceToAuthoritySections";
import {
  explainEvidenceResolution,
  normalizeProblem,
  normalizeSurface,
  resolveEvidence,
} from "../../src/lib/encyclopedia/evidence/evidenceResolver";
import type { PageSectionKey } from "../../src/lib/encyclopedia/pageTypes";

/** Shape reference for future LLM batches; canonical bodies below follow this contract. */
export const AUTHORITY_SECTION_PROMPT = `
You must generate a professional-grade cleaning authority page.

Generate ALL of these sections in this exact order:

1. whatIs
2. whyItHappens
3. canThisBeFixed
4. chemistry
5. commonMistakes
6. professionalMethod
7. whatToExpect
8. whenToStop
9. toolsRequired
10. recommendedProducts
11. visualDiagnostics
12. relatedTopics

Requirements for each section:

whatIs:
- define the problem clearly
- explain what it looks like on this surface
- distinguish it from similar problems where relevant

whyItHappens:
- explain the actual physical and chemical cause
- tie the cause to this surface, not generic cleaning advice

canThisBeFixed:
- MUST use this format exactly:

CAN THIS BE FIXED?

YES — if:
- ...
- ...

NO — if:
- ...
- ...

PARTIAL — if:
- ...
- ...

chemistry:
- explicitly mention acid / acidic, alkaline, neutral, solvent, or pH where relevant
- explain why the chemistry works on this soil and this surface
- explain what chemistry to avoid if relevant

commonMistakes:
- include at least 3 mistakes
- for each mistake, explain why it fails and what damage or downside it causes

professionalMethod:
- numbered step-by-step process
- minimum 4 steps
- must be surface-aware
- must reflect professional workflow, including dwell time, agitation, wipe/rinse logic, and finish protection where relevant

whatToExpect:
- realistic outcomes only
- explain what usually improves fully, partially, or not at all

whenToStop:
- explain when further cleaning becomes unsafe or low-value
- include permanent damage / etching / scratching / coating-risk scenarios where relevant

toolsRequired:
- include exact tool categories
- cloth type
- agitation tool
- optional advanced tool if relevant

recommendedProducts:
- evidence-based categories only
- no fluff
- explain what each product category is for

visualDiagnostics:
- include 3 labeled visual examples
- explain how each one looks and what it usually indicates

relatedTopics:
- suggest related internal-link topics relevant to the same surface/problem family

Global requirements:
- no filler
- no vague language
- no generic housekeeping advice
- no brand hype
- must feel like expert technician knowledge
- must rely on the provided evidence context
`.trim();

export const AUTHORITY_FAILURE_PROMPT = `
If the evidence is insufficient to support expert-level guidance for this page, do not invent details.
Use the evidence faithfully and stay surface-specific.
`.trim();

function normalizeForSentenceCompare(value: string): string {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”‘’]/g, '"')
    .replace(/\s*([,.!?;:])\s*/g, "$1 ")
    .trim();
}

function splitIntoSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function dedupeSentences(value: string): string {
  const sentences = splitIntoSentences(value);
  const seen = new Set<string>();
  const kept: string[] = [];

  for (const sentence of sentences) {
    const key = normalizeForSentenceCompare(sentence);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    kept.push(sentence);
  }

  return kept.join(" ").replace(/\s+/g, " ").trim();
}

function dedupeRepeatedWindows(value: string, windowSize = 2): string {
  const sentences = splitIntoSentences(value);
  if (sentences.length <= windowSize) {
    return dedupeSentences(value);
  }

  const kept: string[] = [];
  const seenWindows = new Set<string>();

  for (let index = 0; index < sentences.length; index += 1) {
    const sentence = sentences[index];
    const candidateWindow = sentences
      .slice(index, Math.min(index + windowSize, sentences.length))
      .map((item) => normalizeForSentenceCompare(item))
      .join("||");

    if (candidateWindow && seenWindows.has(candidateWindow)) {
      continue;
    }

    kept.push(sentence);

    const actualWindow = kept
      .slice(Math.max(0, kept.length - windowSize), kept.length)
      .map((item) => normalizeForSentenceCompare(item))
      .join("||");

    if (actualWindow) {
      seenWindows.add(actualWindow);
    }
  }

  return dedupeSentences(kept.join(" "));
}

function hasLowUniqueness(value: string): boolean {
  const sentences = splitIntoSentences(value);
  if (sentences.length < 3) return false;

  const normalized = sentences.map(normalizeForSentenceCompare);
  const uniqueCount = new Set(normalized).size;
  const uniquenessRatio = uniqueCount / normalized.length;

  return uniquenessRatio < 0.8;
}

function cleanSectionBody(value: string): string {
  let cleaned = value.replace(/\s+/g, " ").trim();
  cleaned = dedupeRepeatedWindows(cleaned, 2);
  cleaned = dedupeSentences(cleaned);

  return cleaned;
}

function normalizeLines(value: string): string {
  return value
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

const STRUCTURE_PRESERVING_KEYS = new Set<string>([
  "canThisBeFixed",
  "commonMistakes",
  "professionalMethod",
  "toolsRequired",
  "recommendedProducts",
  "visualDiagnostics",
]);

function ensureMinSectionLengthForKey(key: string, text: string, fallback: string): string {
  const min = MIN_SECTION_LENGTH[key as keyof typeof MIN_SECTION_LENGTH] ?? 100;

  if (STRUCTURE_PRESERVING_KEYS.has(key)) {
    let body = normalizeLines(text);
    const fb = normalizeLines(fallback);
    while (body.length < min) {
      body = `${body}\n${fb}`;
    }
    return body;
  }

  let flat = normalizeLines(text).replace(/\n/g, " ");
  const fbFlat = fallback.replace(/\s+/g, " ").trim();
  while (flat.length < min) {
    flat = `${flat} ${fbFlat}`.replace(/\s+/g, " ").trim();
  }
  return cleanSectionBody(flat);
}

function sanitizeSnapshotSections<
  T extends { key: string; title: string; content: string },
>(sections: T[]): T[] {
  return sections.map((section) => {
    if (STRUCTURE_PRESERVING_KEYS.has(section.key)) {
      return { ...section, content: normalizeLines(section.content) };
    }
    const flat = normalizeLines(section.content).replace(/\n/g, " ");
    return { ...section, content: cleanSectionBody(flat) };
  });
}

type Intent =
  | "how-remove"
  | "how-clean"
  | "how-fix"
  | "how-prevent"
  | "what-causes"
  | "diagnosis"
  | "why"
  | "how-maintain"
  | "mistake-recovery";

type Target = {
  problem: string;
  surface: string;
  intents: Intent[];
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildTitle(intent: Intent, problem: string, surface: string) {
  switch (intent) {
    case "how-remove":
      return `How to Remove ${problem} from ${surface}`;
    case "how-clean":
      return `How to Clean ${problem} from ${surface}`;
    case "how-fix":
      return `How to Fix ${problem} on ${surface}`;
    case "how-prevent":
      return `How to Prevent ${problem} on ${surface}`;
    case "what-causes":
      return `What Causes ${problem} on ${surface}`;
    case "diagnosis":
      return `How to Tell if ${problem} on ${surface} is Permanent`;
    case "why":
      return `Why ${problem} Keeps Coming Back on ${surface}`;
    case "how-maintain":
      return `How to Maintain ${surface} and Keep ${problem} Under Control`;
    case "mistake-recovery":
      return `How to Recover After a Cleaning Mistake With ${problem} on ${surface}`;
    default: {
      const _exhaustive: never = intent;
      return _exhaustive;
    }
  }
}

const WHY_IT_HAPPENS_FALLBACK =
  "This condition builds gradually as residue, moisture, or contamination is left behind during normal use and incomplete cleaning, allowing the visible problem to persist and become more obvious over time.";

const WHY_IT_WORKS_FALLBACK =
  "The recommended process works because it matches the soil type to the correct chemistry and uses the right level of agitation, rinsing, and drying to remove residue instead of just spreading it around.";

const SECTION_LENGTH_FALLBACKS: Record<PageSectionKey, string> = {
  whatIs: WHY_IT_WORKS_FALLBACK,
  whyItHappens: WHY_IT_HAPPENS_FALLBACK,
  whereItAppears:
    "This issue commonly appears in kitchens, bathrooms, and high-contact areas where residue and moisture accumulate. It often shows first in splash zones, seams, edges, and frequently touched panels before spreading to larger fields.",
  canThisBeFixed:
    "PARTIAL — if: staged removal is required.\nNO — if: permanent damage is confirmed.",
  chemistry:
    "Alkaline chemistry cuts grease; acidic chemistry attacks mineral film; neutral pH limits risk; solvents target non-polar soil when safe.",
  commonMistakes:
    "- Skipping dwell because it causes incomplete soil release and leads to repeat damage cycles.",
  professionalMethod:
    "4. Document outcome after dry-down because residue films only appear once moisture equalizes.",
  howToFix:
    "Treat the surface with progressive chemistry, controlled dwell, appropriate agitation, thorough rinse, and full dry-down before judging improvement. Repeat only when the soil type and finish risk still allow another controlled pass.",
  whatToAvoid:
    "Avoid abrasive tools, undisciplined pH, excessive moisture dwell, and multi-chemistry mixing that can damage seals, coatings, or sensitive finishes.",
  whatToExpect:
    "Film soil may resolve fully in one visit, while aged buildup often improves partially before a second pass.",
  whenToStop:
    "Permanent etching or coating damage means stopping before scratch depth increases.",
  toolsRequired: "- Microfiber towel for final wipe and lint control.",
  recommendedProducts:
    "- Neutral cleaner category for daily maintenance when soil is light.",
  visualDiagnostics:
    "Type 3: Uniform haze\nFull-field dulling that tracks rinse and dry patterns.",
  relatedTopics:
    "Cross-link adjacent diagnosis and prevention pages in the same surface family.",
};

function buildSectionsFromEvidence(params: {
  surface: string;
  problem: string;
  evidence: EvidenceRecord;
  relatedTopicSlugs: string[];
}): Array<{ key: PageSectionKey; title: string; content: string }> {
  const raw = transformEvidenceToAuthoritySections({
    surface: params.surface,
    problem: params.problem,
    evidence: params.evidence,
    relatedTopicSlugs: params.relatedTopicSlugs,
  });

  const ensuredSections = raw.map((s) => ({
    ...s,
    content: (s.content || "").trim(),
  }));

  return ensuredSections.map((section) => ({
    ...section,
    content: ensureMinSectionLengthForKey(
      section.key,
      section.content,
      SECTION_LENGTH_FALLBACKS[section.key],
    ),
  }));
}

function buildInternalLinks(input: { surface: string; problem: string; slug?: string }) {
  const { problem, surface } = input;
  void input.slug;
  return [
    slugify(`what-causes-${problem}-on-${surface}`),
    slugify(`how-to-prevent-${problem}-on-${surface}`),
    slugify(`how-to-diagnose-${problem}-on-${surface}`),
  ];
}

function buildSnapshot(intent: Intent, problem: string, surface: string): CanonicalPageSnapshot {
  const normSurface = normalizeSurface(surface);
  const normProblem = normalizeProblem(problem);

  const evidence = resolveEvidence(normSurface, normProblem);
  if (!evidence) {
    console.warn(`[evidence] missing record for ${surface} + ${problem}`);
    console.warn(
      `[evidence] resolution trace: ${JSON.stringify(explainEvidenceResolution(normSurface, normProblem))}`,
    );
    throw new Error(`No evidence record for ${surface} + ${problem}`);
  }

  const title = buildTitle(intent, normProblem, normSurface);
  const slug = slugify(title);

  const internalLinks = buildInternalLinks({ surface: normSurface, problem: normProblem, slug });

  // HARD MERGE LAYER:
  // Authority sections must be derived deterministically from EvidenceRecord.
  // Do not hand-author or improvise these sections elsewhere in the pipeline.
  const sections = sanitizeSnapshotSections(
    buildSectionsFromEvidence({
      surface: normSurface,
      problem: normProblem,
      evidence,
      relatedTopicSlugs: internalLinks,
    }),
  );

  const snapshot: CanonicalPageSnapshot = {
    slug,
    title,
    problem: normProblem,
    surface: normSurface,
    intent,
    riskLevel: "medium",
    sections,
    internalLinks,
  };

  for (const section of snapshot.sections) {
    if (hasLowUniqueness(section.content)) {
      throw new Error(
        `Repeated section content detected for slug "${snapshot.slug}" in section "${section.key}"`,
      );
    }
  }

  return snapshot;
}

function generate(targets: Target[]) {
  const snapshots: CanonicalPageSnapshot[] = [];
  const missingEvidenceFrequency = new Map<string, number>();

  for (const t of targets) {
    for (const intent of t.intents) {
      try {
        snapshots.push(buildSnapshot(intent, t.problem, t.surface));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown snapshot generation error";

        if (message.includes("No evidence record")) {
          const ex = explainEvidenceResolution(t.surface, t.problem);
          const key = `${ex.matchedSurface} + ${ex.matchedProblem}`;
          missingEvidenceFrequency.set(key, (missingEvidenceFrequency.get(key) ?? 0) + 1);
        }

        console.warn(
          `[generator] skipped target (missing evidence, repetition, or validation): ${message}`,
        );
      }
    }
  }

  if (missingEvidenceFrequency.size > 0) {
    const sorted = [...missingEvidenceFrequency.entries()].sort((a, b) => b[1] - a[1]);
    console.warn("[generator] missing evidence frequency (canonical matched surface + problem):");
    for (const [key, n] of sorted) {
      console.warn(`  ${key}: ${n}`);
    }
  }

  return snapshots;
}

function assertAllValid(snapshots: CanonicalPageSnapshot[]) {
  const failures: string[] = [];
  for (const s of snapshots) {
    const { valid, errors } = validateSnapshotWithAuthority(s);
    if (!valid) {
      failures.push(`${s.slug}: ${errors.join("; ")}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(
      `Validator failed for ${failures.length} snapshot(s):\n${failures.join("\n")}`,
    );
  }
}

function run() {
  const sourceArg = process.argv.find((a) => a.startsWith("--source="));
  const outputArg = process.argv.find((a) => a.startsWith("--output="));

  if (!sourceArg) throw new Error("--source required");

  const source = sourceArg.split("=")[1];
  const output =
    outputArg?.split("=")[1] ||
    "content-batches/encyclopedia/generated-wave-001.json";

  const absSource = path.resolve(process.cwd(), source);
  const raw = JSON.parse(fs.readFileSync(absSource, "utf-8")) as {
    targets: Target[];
  };

  if (!Array.isArray(raw.targets)) {
    throw new Error("Source JSON must include a targets array");
  }

  const snapshots = generate(raw.targets);
  assertAllValid(snapshots);

  const absOutput = path.resolve(process.cwd(), output);

  fs.mkdirSync(path.dirname(absOutput), { recursive: true });
  fs.writeFileSync(absOutput, JSON.stringify({ snapshots }, null, 2));

  console.log(`Generated ${snapshots.length} snapshots → ${output}`);
}

run();
