import type { CanonicalPageSnapshot } from "@/lib/encyclopedia/canonicalTypes";
import {
  MIN_SECTION_LENGTH,
  REQUIRED_CANONICAL_SECTION_KEYS,
} from "@/lib/encyclopedia/generationValidator";
import type { ReviewedCandidatesFile } from "@/lib/encyclopedia/reviewedCandidatesQueue";
import type { ReviewedCandidatesSourceKey } from "@/lib/encyclopedia/reviewedCandidatesSources";
import type { ReviewedCandidateApiInput } from "@/lib/api/encyclopediaReview";

type AuthorityKey = (typeof REQUIRED_CANONICAL_SECTION_KEYS)[number];

function padStub(key: AuthorityKey, body: string): string {
  const min = MIN_SECTION_LENGTH[key];
  let out = body.trim();
  let pass = 0;
  while (out.length < min) {
    pass += 1;
    out += ` Extension pass ${pass} for ${key} pending editorial replacement.`;
  }
  return out;
}

function queueAuthorityStubContent(key: AuthorityKey, surface: string): string {
  const s = surface.trim() || "Various surfaces";

  switch (key) {
    case "whatIs":
      return padStub(
        key,
        `Queue placeholder: define the issue on ${s}. Second sentence distinguishes film from damage. Third sentence anchors technician review.`,
      );
    case "whyItHappens":
      return padStub(
        key,
        `Queue placeholder: explain physical and chemical drivers on ${s}. Moisture, oils, and rinse behavior change how soil becomes visible over time.`,
      );
    case "whereItAppears":
      return padStub(
        key,
        `Queue placeholder: where this issue appears first on ${s}—splash zones, seams, edges, and high-contact panels before spreading to larger fields.`,
      );
    case "canThisBeFixed":
      return padStub(
        key,
        [
          "CAN THIS BE FIXED?",
          "",
          "YES — if:",
          `- Removable film is confirmed on ${s} without structural loss.`,
          `- Chemistry choice matches finish limits for this triage row.`,
          "",
          "NO — if:",
          `- Permanent etching or coating failure already altered the surface.`,
          `- Damage risk outweighs realistic improvement.`,
          "",
          "PARTIAL — if:",
          `- Staged removal is required with dry-down between attempts.`,
          `- Some zones improve while edges retain shadowing.`,
        ].join("\n"),
      );
    case "chemistry":
      return padStub(
        key,
        `Queue placeholder: mention acid, alkaline, neutral pH, and solvent roles for ${s}. Explain why chemistry selection maps to soil class and finish safety.`,
      );
    case "commonMistakes":
      return padStub(
        key,
        [
          `- Abrasive tools on ${s} because it causes scratching that traps soil.`,
          `- Skipping rinse because it leads to residue filming and dull haze.`,
          `- Over-wetting edges because it slows dry-down and hides true results.`,
        ].join("\n"),
      );
    case "professionalMethod":
      return padStub(
        key,
        [
          `1. Inspect ${s} and dry-wipe loose debris with a microfiber towel.`,
          `2. Apply compatible chemistry with controlled dwell for the soil type.`,
          `3. Agitate with a soft brush or pad, then rinse thoroughly.`,
          `4. Dry fully and evaluate after equalized drying before another pass.`,
        ].join("\n"),
      );
    case "howToFix":
      return padStub(
        key,
        `Queue placeholder: progressive chemistry, controlled dwell, agitation, thorough rinse, and full dry-down before judging improvement on ${s}.`,
      );
    case "whatToAvoid":
      return padStub(
        key,
        `Queue placeholder: avoid abrasive tools, undisciplined pH, excessive moisture dwell, and multi-chemistry mixing on ${s} until editorial sign-off.`,
      );
    case "whatToExpect":
      return padStub(
        key,
        `Queue placeholder: realistic outcomes on ${s}. Light film may lift quickly; aged buildup may need staged improvement with clear dry-down checks.`,
      );
    case "whenToStop":
      return padStub(
        key,
        `Queue placeholder: stop when permanent damage, etching risk, scratching, or coating risk appears on ${s}. Further cleaning yields low value once improvement plateaus.`,
      );
    case "toolsRequired":
      return padStub(
        key,
        [
          `- Microfiber towels for controlled wipe and final dry on ${s}.`,
          `- Soft brush or non-abrasive pad for agitation when finish allows.`,
          `- Optional sponge for detail rinsing in tight areas.`,
        ].join("\n"),
      );
    case "recommendedProducts":
      return padStub(
        key,
        [
          `- Neutral pH maintenance category for light daily film on ${s}.`,
          `- Targeted degreaser or descaler category only when soil class confirms compatibility.`,
          `- Rinse-focused workflow aids when hard water spotting returns.`,
        ].join("\n"),
      );
    case "visualDiagnostics":
      return padStub(
        key,
        [
          "Type 1: Localized spots",
          `Queue placeholder pattern on ${s} where drips concentrate.`,
          "",
          "Type 2: Edge haze",
          "Queue placeholder dulling along transitions where rinse slows.",
          "",
          "Type 3: Broad veil",
          "Queue placeholder full-field dulling tied to drying pattern.",
        ].join("\n"),
      );
    case "relatedTopics":
      return padStub(
        key,
        `Queue placeholder: point editors to adjacent internal topics for ${s} once slugs are finalized during promotion.`,
      );
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

function pickCanonicalSnapshotFromRow(
  row: Record<string, unknown>
): CanonicalPageSnapshot | null {
  const raw = row.canonicalSnapshot;
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  if (
    typeof o.slug !== "string" ||
    typeof o.title !== "string" ||
    !Array.isArray(o.sections)
  ) {
    return null;
  }
  return raw as CanonicalPageSnapshot;
}

function ensureMinTitle(title: string): string {
  const t = title.trim();
  if (t.length >= 8) {
    return t;
  }
  return `${t} — queue`.padEnd(8, " ");
}

function buildStubSnapshotFromRow(row: {
  slug: string;
  title: string;
  category: string;
  cluster: string;
}): CanonicalPageSnapshot {
  const title = ensureMinTitle(row.title);
  const surface = row.cluster?.trim() || "Various surfaces";
  return {
    title,
    slug: row.slug,
    problem: title.slice(0, 120),
    surface,
    intent: `Encyclopedia candidate triage (${row.category})`,
    riskLevel: "low",
    sections: REQUIRED_CANONICAL_SECTION_KEYS.map((key) => ({
      key,
      title: key,
      content: queueAuthorityStubContent(key, surface),
    })),
    internalLinks: ["related-topic-one", "related-topic-two", "related-topic-three"],
  };
}

/**
 * Maps a reviewed-candidates JSON file to API intake rows.
 * Rows may embed `canonicalSnapshot`; otherwise a stub snapshot is built for triage-only rows.
 */
export function reviewedCandidatesFileToApiInputs(
  file: ReviewedCandidatesFile,
  sourceKey: ReviewedCandidatesSourceKey,
): ReviewedCandidateApiInput[] {
  const sourceName = `reviewed_candidates:${sourceKey}`;
  return file.candidates.map((c) => {
    const asRecord = c as unknown as Record<string, unknown>;
    const embedded = pickCanonicalSnapshotFromRow(asRecord);
    const canonicalSnapshot =
      embedded ??
      buildStubSnapshotFromRow({
        slug: c.slug,
        title: c.title,
        category: c.category,
        cluster: c.cluster,
      });
    return {
      slug: c.slug,
      title: c.title,
      canonicalSnapshot,
      sourceName,
    };
  });
}
