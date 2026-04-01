import type { CanonicalPageSnapshot } from "./encyclopediaPipelineTypes";
import type { PageSectionKey } from "./pageTypes";

/** All canonical body sections the pipeline renderer expects for a complete authority page. */
export const REQUIRED_CANONICAL_SECTION_KEYS = [
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
] as const satisfies readonly PageSectionKey[];

export const MIN_SECTION_LENGTH: Record<
  (typeof REQUIRED_CANONICAL_SECTION_KEYS)[number],
  number
> = {
  whatIs: 140,
  whyItHappens: 180,
  whereItAppears: 120,
  canThisBeFixed: 140,
  chemistry: 180,
  commonMistakes: 180,
  professionalMethod: 260,
  howToFix: 120,
  whatToAvoid: 120,
  whatToExpect: 140,
  whenToStop: 140,
  toolsRequired: 120,
  recommendedProducts: 120,
  visualDiagnostics: 180,
  relatedTopics: 60,
};

const MIN_TITLE_LEN = 8;
const MIN_META_LEN = 3;
const MIN_INTERNAL_LINKS = 3;

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type GenerationValidationResult = {
  valid: boolean;
  errors: string[];
};

function nonEmptyTrimmed(s: string | undefined | null, label: string): string[] {
  if (s === undefined || s === null || s.trim().length < MIN_META_LEN) {
    return [`${label} is missing or too short (min ${MIN_META_LEN} chars)`];
  }
  return [];
}

export function validateGeneratedSnapshot(
  snapshot: CanonicalPageSnapshot
): GenerationValidationResult {
  const errors: string[] = [];

  if (!snapshot.slug?.trim()) {
    errors.push("slug is required");
  } else if (!SLUG_RE.test(snapshot.slug.trim())) {
    errors.push("slug must be lowercase kebab-case");
  }

  if (!snapshot.title?.trim() || snapshot.title.trim().length < MIN_TITLE_LEN) {
    errors.push(`title is missing or too short (min ${MIN_TITLE_LEN} chars)`);
  }

  errors.push(...nonEmptyTrimmed(snapshot.problem, "problem"));
  errors.push(...nonEmptyTrimmed(snapshot.surface, "surface"));
  errors.push(...nonEmptyTrimmed(snapshot.intent, "intent"));

  if (!snapshot.riskLevel) {
    errors.push("riskLevel is required");
  } else if (!["low", "medium", "high"].includes(snapshot.riskLevel)) {
    errors.push("riskLevel must be low, medium, or high");
  }

  if (!snapshot.sections?.length) {
    errors.push("sections must be a non-empty array");
  } else {
    for (const key of REQUIRED_CANONICAL_SECTION_KEYS) {
      const section = snapshot.sections.find((s) => s.key === key);

      if (!section) {
        errors.push(`Missing section: ${key}`);
        continue;
      }

      const content = (section.content || "").trim();
      const minLen = MIN_SECTION_LENGTH[key] ?? 100;

      if (!content) {
        errors.push(`Empty section: ${key}`);
        continue;
      }

      if (content.length < minLen) {
        errors.push(`Section too short: ${key}`);
      }
    }
  }

  const links = snapshot.internalLinks ?? [];
  if (links.length < MIN_INTERNAL_LINKS) {
    errors.push("At least 3 internal links are required");
  } else {
    for (const raw of links) {
      if (typeof raw !== "string" || !raw.trim()) {
        errors.push("internalLinks must be non-empty strings");
        break;
      }
      const t = raw.trim();
      if (!SLUG_RE.test(t)) {
        errors.push(`internal link slug invalid: ${t}`);
      }
    }
  }

  if (!snapshot.seo?.title || snapshot.seo.title.length < 10) {
    errors.push("Missing or weak SEO title");
  }

  if (!snapshot.seo?.slug || !snapshot.seo.slug.includes("-")) {
    errors.push("Invalid slug");
  }

  return { valid: errors.length === 0, errors };
}
