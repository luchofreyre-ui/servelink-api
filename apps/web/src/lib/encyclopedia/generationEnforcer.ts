import type { CanonicalPageSnapshot } from "./encyclopediaPipelineTypes";
import {
  type GenerationValidationResult,
  validateGeneratedSnapshot,
} from "./generationValidator";

export type RejectedGenerationSnapshot = {
  slug: string;
  errors: string[];
};

export function enforceAuthorityStructure(sectionKey: string, body: string): string[] {
  const errors: string[] = [];
  const normalized = body.trim();

  if (!normalized) {
    errors.push(`${sectionKey}: empty body`);
    return errors;
  }

  if (sectionKey === "canThisBeFixed") {
    const hasYes = /\bYES\b/i.test(normalized);
    const hasNo = /\bNO\b/i.test(normalized);
    const hasPartial = /\bPARTIAL\b/i.test(normalized);

    if (!hasYes || !hasNo) {
      errors.push("canThisBeFixed must include YES and NO decision logic");
    }

    if (!/if:/i.test(normalized) && !/if\s/i.test(normalized)) {
      errors.push("canThisBeFixed must include condition-based guidance");
    }

    if (!hasPartial) {
      errors.push("canThisBeFixed should include PARTIAL condition when applicable");
    }
  }

  if (sectionKey === "chemistry") {
    if (!/\bacid|\bacidic|\balkaline|\bneutral|\bsolvent|\bpH\b/i.test(normalized)) {
      errors.push("chemistry must include visible chemistry language");
    }
  }

  if (sectionKey === "commonMistakes") {
    const lines = normalized.split("\n").map((line) => line.trim());
    const bulletish = lines.filter((line) => /^[-*•]|\d+\./.test(line));
    if (bulletish.length < 3) {
      errors.push("commonMistakes must include at least 3 distinct mistakes");
    }

    if (!/\bwhy\b|\bbecause\b|\bcauses\b|\bleads to\b/i.test(normalized)) {
      errors.push("commonMistakes must explain why the mistake fails");
    }
  }

  if (sectionKey === "professionalMethod") {
    const stepCount = normalized
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => /^\d+\./.test(line)).length;
    if (stepCount < 4) {
      errors.push("professionalMethod must include at least 4 numbered steps");
    }
  }

  if (sectionKey === "toolsRequired") {
    if (!/\bmicrofiber|\bbrush|\bpad|\bsponge|\btowel\b/i.test(normalized)) {
      errors.push("toolsRequired must name actual cleaning tools");
    }
  }

  if (sectionKey === "visualDiagnostics") {
    const visualCount =
      (normalized.match(/\btype\s*1\b|\bvariation\s*1\b|\bexample\s*1\b/gi) || []).length +
      (normalized.match(/\btype\s*2\b|\bvariation\s*2\b|\bexample\s*2\b/gi) || []).length +
      (normalized.match(/\btype\s*3\b|\bvariation\s*3\b|\bexample\s*3\b/gi) || []).length;

    if (visualCount < 3) {
      errors.push("visualDiagnostics must describe 3 visual examples or variations");
    }
  }

  if (sectionKey === "whenToStop") {
    if (!/\bpermanent|\betch|\bdamage|\brisk|\bscratch|\bcoating\b/i.test(normalized)) {
      errors.push("whenToStop must explain damage/risk stop conditions");
    }
  }

  return errors;
}

export function validateSnapshotWithAuthority(
  snapshot: CanonicalPageSnapshot
): GenerationValidationResult {
  const base = validateGeneratedSnapshot(snapshot);
  const errors = [...base.errors];

  for (const section of snapshot.sections ?? []) {
    errors.push(...enforceAuthorityStructure(section.key, section.content ?? ""));
  }

  return { valid: errors.length === 0, errors };
}

export function enforceGenerationQuality(snapshots: CanonicalPageSnapshot[]): {
  accepted: CanonicalPageSnapshot[];
  rejected: RejectedGenerationSnapshot[];
} {
  const accepted: CanonicalPageSnapshot[] = [];
  const rejected: RejectedGenerationSnapshot[] = [];

  for (const snapshot of snapshots) {
    const { valid, errors } = validateSnapshotWithAuthority(snapshot);
    if (valid) {
      accepted.push(snapshot);
    } else {
      rejected.push({ slug: snapshot.slug ?? "(no slug)", errors });
    }
  }

  return { accepted, rejected };
}
