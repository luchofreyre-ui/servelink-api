import type {
  CanonicalPageSnapshot,
  PageSectionKey,
} from "../canonical/canonicalTypes";

/** All canonical body sections the pipeline expects for a complete page. */
export const REQUIRED_CANONICAL_SECTION_KEYS: readonly PageSectionKey[] = [
  "whatIs",
  "whyItHappens",
  "whereItAppears",
  "howToFix",
  "whatToAvoid",
  "whatToExpect",
] as const;

const MIN_TITLE_LEN = 8;
const MIN_META_LEN = 3;
const MIN_SECTION_BODY_LEN = 80;
const MIN_INTERNAL_LINKS = 2;

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
    const byKey = new Map(snapshot.sections.map((s) => [s.key, s]));
    for (const key of REQUIRED_CANONICAL_SECTION_KEYS) {
      const row = byKey.get(key);
      if (!row) {
        errors.push(`missing required section key: ${key}`);
        continue;
      }
      const body = row.content?.trim() ?? "";
      if (body.length < MIN_SECTION_BODY_LEN) {
        errors.push(
          `section "${key}" body too short (min ${MIN_SECTION_BODY_LEN} chars, got ${body.length})`
        );
      }
    }
  }

  const links = snapshot.internalLinks ?? [];
  if (links.length < MIN_INTERNAL_LINKS) {
    errors.push(
      `internalLinks must have at least ${MIN_INTERNAL_LINKS} slugs (scale-quality gate)`
    );
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

  return { valid: errors.length === 0, errors };
}
