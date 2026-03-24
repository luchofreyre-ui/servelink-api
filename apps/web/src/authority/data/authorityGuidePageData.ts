import type { AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_GUIDE_SLUGS, type AuthorityGuideSlug } from "@/authority/data/authorityTaxonomy";
import { CHEMICAL_USAGE_AND_SAFETY_GUIDE } from "@/authority/data/authorityChemicalSafetyGuideData";

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;

function es(
  slug: string,
  title: string,
  href: string,
  summary?: string,
): import("@/authority/types/authorityPageTypes").AuthorityEntitySummary {
  return { slug, title, href, summary, kind: href.startsWith("/methods") ? "method" : "surface" };
}

function rp(slug: string, title: string, summary?: string) {
  return { slug, title, href: P(slug), summary };
}

const HOW_TO_REMOVE_STAINS_SAFELY_GUIDE: AuthorityGuidePageData = {
  slug: "how-to-remove-stains-safely",
  title: "How to remove stains safely",
  description:
    "A structured guide to matching stain-removal approaches to surfaces, contamination type, and damage risk.",
  summary:
    "A structured guide to matching stain-removal approaches to surfaces, contamination type, and damage risk.",
  category: "stain_removal",
  intro:
    "Safe stain removal depends on identifying the contamination correctly, checking surface sensitivity, and matching the cleaning method to both. The goal is not just visible removal, but removal without residue, damage, or unnecessary escalation.",
  sections: [
    {
      id: "start-with-identification",
      title: "Start with identification before removal",
      paragraphs: [
        "Stains and visible marks are not all the same problem. Some are oil-based, some are mineral-based, some are transferred residue, and some are signs of surface damage rather than removable contamination.",
        "A safe process starts with identifying whether the issue is residue, buildup, transfer, biological contamination, or physical damage risk.",
      ],
      bulletPoints: [
        "Check whether the mark is sitting on the surface or has changed the surface itself.",
        "Look for recurring patterns such as spotting, haze, tackiness, discoloration, or dull patches.",
        "Avoid escalating immediately to aggressive chemistry or abrasion.",
      ],
    },
    {
      id: "match-method-to-surface",
      title: "Match the method to the surface",
      paragraphs: [
        "Even when a removal method works chemically, it may still be a poor fit for a sensitive surface.",
        "Natural stone, coated finishes, painted surfaces, glass, and moisture-sensitive materials all require different risk thresholds.",
      ],
      bulletPoints: [
        "Use the least aggressive effective method first.",
        "Treat etching risk, scratch risk, and moisture risk as separate concerns.",
        "Do not assume that stronger chemistry means better results.",
      ],
    },
  ],
  relatedMethods: [
    es("degreasing", "Degreasing", M("degreasing")),
    es("hard-water-deposit-removal", "Hard water deposit removal", M("hard-water-deposit-removal")),
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
    es("soap-scum-removal", "Soap scum removal", M("soap-scum-removal")),
  ],
  relatedSurfaces: [
    es("tile", "Tile", S("tile")),
    es("shower-glass", "Shower glass", S("shower-glass")),
    es("stainless-steel", "Stainless steel", S("stainless-steel")),
    es("granite-countertops", "Granite countertops", S("granite-countertops")),
  ],
  relatedProblems: [
    rp("grease-buildup", "Grease buildup"),
    rp("hard-water-deposits", "Hard water deposits"),
    rp("soap-scum", "Soap scum"),
    rp("stuck-on-residue", "Stuck-on residue"),
  ],
};

const WHY_CLEANING_FAILS_GUIDE: AuthorityGuidePageData = {
  slug: "why-cleaning-fails",
  title: "Why cleaning fails",
  description:
    "A structured guide to the most common reasons cleaning underperforms, including method mismatch, residue issues, surface sensitivity, and contamination misidentification.",
  summary:
    "A structured guide to the most common reasons cleaning underperforms, including method mismatch, residue issues, surface sensitivity, and contamination misidentification.",
  category: "failure_analysis",
  intro:
    "Cleaning failure is usually not random. It usually comes from a mismatch between the contamination, the surface, the method, or the finishing process. Understanding failure patterns makes cleaning more repeatable and more protective.",
  sections: [
    {
      id: "wrong-problem-definition",
      title: "The problem was defined incorrectly",
      paragraphs: [
        "Some cleaning failures begin before any chemical or tool touches the surface. A mineral deposit may be treated like grease. Surface damage may be treated like removable residue.",
        "If the problem type is wrong, the entire process can look active while still failing.",
      ],
      bulletPoints: [
        "Differentiate residue from damage.",
        "Differentiate oil-based contamination from mineral buildup.",
        "Treat repeated reappearance as a sign the root cause may be misread.",
      ],
    },
    {
      id: "residue-control-was-poor",
      title: "Residue control was poor",
      paragraphs: [
        "A surface can look cleaner during active wiping and still fail at the finish stage.",
        "Leftover product, dissolved soil, and incomplete removal often create haze, tackiness, streaking, or accelerated re-soiling.",
      ],
      bulletPoints: [
        "Treat residue removal as its own step.",
        "Inspect under finish light, not only during active agitation.",
      ],
    },
  ],
  relatedMethods: [
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
    es("glass-cleaning", "Glass cleaning", M("glass-cleaning")),
    es("detail-dusting", "Detail dusting", M("detail-dusting")),
  ],
  relatedSurfaces: [
    es("painted-walls", "Painted walls", S("painted-walls")),
    es("vinyl-flooring", "Vinyl flooring", S("vinyl-flooring")),
    es("tile", "Tile", S("tile")),
  ],
  relatedProblems: [
    rp("streaking-on-glass", "Streaking on glass"),
    rp("general-soil", "General soil"),
    rp("stuck-on-residue", "Stuck-on residue"),
    rp("fingerprints-and-smudges", "Fingerprints and smudges"),
  ],
};

const WHEN_CLEANING_DAMAGES_SURFACES_GUIDE: AuthorityGuidePageData = {
  slug: "when-cleaning-damages-surfaces",
  title: "When cleaning damages surfaces",
  description:
    "A structured guide to how surface damage happens during cleaning, including abrasion risk, chemical sensitivity, moisture exposure, and finish disruption.",
  summary:
    "A structured guide to how surface damage happens during cleaning, including abrasion risk, chemical sensitivity, moisture exposure, and finish disruption.",
  category: "surface_protection",
  intro:
    "Cleaning damage usually happens when the process is stronger than the surface can tolerate. The risk may come from chemistry, abrasion, moisture, dwell time, or repeated exposure. Protection starts with understanding the surface before escalation.",
  sections: [
    {
      id: "abrasion-damage",
      title: "Abrasion can remove soil and damage the surface at the same time",
      paragraphs: [
        "Mechanical action is useful, but it is not automatically safe. Abrasive agitation can permanently change the finish of glass, coated materials, natural stone, and polished surfaces.",
        "The question is not whether agitation works. The question is whether the surface can tolerate that level of friction.",
      ],
      bulletPoints: [
        "Scratch risk should be treated as separate from general cleaning difficulty.",
        "Finish sensitivity matters even when visible soil is heavy.",
      ],
    },
    {
      id: "chemical-damage",
      title: "Chemical mismatch can change the surface itself",
      paragraphs: [
        "Some surfaces are harmed not by poor effort, but by the wrong chemistry. Acid-sensitive materials, coated finishes, and paint systems can all react visibly or structurally.",
        "A process that removes the contamination but alters the finish is still a failed process.",
      ],
      bulletPoints: [
        "Etching is not the same problem as residue.",
        "Strong chemistry should not be the default escalation path.",
      ],
    },
  ],
  relatedMethods: [
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
    es("glass-cleaning", "Glass cleaning", M("glass-cleaning")),
  ],
  relatedSurfaces: [
    es("granite-countertops", "Granite countertops", S("granite-countertops")),
    es("shower-glass", "Shower glass", S("shower-glass")),
    es("finished-wood", "Finished wood", S("finished-wood")),
    es("painted-walls", "Painted walls", S("painted-walls")),
  ],
  relatedProblems: [
    rp("hard-water-deposits", "Hard water deposits"),
    rp("soap-scum", "Soap scum"),
    rp("light-mildew", "Light mildew appearance"),
  ],
};

const GUIDES: Record<string, AuthorityGuidePageData> = {
  "cleaning-every-surface": {
    slug: "cleaning-every-surface",
    title: "Complete Guide to Cleaning Every Surface",
    description:
      "A practical framework: choose the surface first, match the soil type, pick a compatible method family, and know when to stop and escalate.",
    summary:
      "A practical framework: choose the surface first, match the soil type, pick a compatible method family, and know when to stop and escalate.",
    category: "foundations",
    sections: [
      {
        id: "start-with-surface",
        title: "Start with the surface, not the product",
        body: "The same bottle marketed for ‘everything’ can still be wrong for sealed stone, coated glass, or waxed wood. Read the surface category, then the product label—not the reverse. When in doubt, manufacturer care sheets beat generic trends.",
      },
      {
        id: "escalate-test-patch",
        title: "When to escalate or test in an inconspicuous area first",
        body: "Test when finish type is unknown, when a prior attempt changed sheen, or when damage could be costly. Escalate when you see etching, swelling seams, persistent odor after cleaning, or structural moisture signs—these are not solved by stronger products.",
      },
    ],
    relatedMethods: [
      es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
      es("soap-scum-removal", "Soap scum removal", M("soap-scum-removal")),
      es("degreasing", "Degreasing", M("degreasing")),
      es("glass-cleaning", "Glass cleaning", M("glass-cleaning")),
    ],
    relatedSurfaces: [
      es("shower-glass", "Shower glass", S("shower-glass")),
      es("tile", "Tile", S("tile")),
      es("quartz-countertops", "Quartz countertops", S("quartz-countertops")),
      es("stainless-steel", "Stainless steel", S("stainless-steel")),
    ],
    relatedProblems: [
      rp("soap-scum", "Soap scum"),
      rp("grease-buildup", "Grease buildup"),
      rp("hard-water-deposits", "Hard water deposits"),
      rp("general-soil", "General soil"),
    ],
  },
  "chemical-usage-and-safety": CHEMICAL_USAGE_AND_SAFETY_GUIDE,
  "how-to-remove-stains-safely": HOW_TO_REMOVE_STAINS_SAFELY_GUIDE,
  "why-cleaning-fails": WHY_CLEANING_FAILS_GUIDE,
  "when-cleaning-damages-surfaces": WHEN_CLEANING_DAMAGES_SURFACES_GUIDE,
};

export function getGuidePageBySlug(slug: string): AuthorityGuidePageData | undefined {
  return GUIDES[slug];
}

export function getAllGuidePages(): AuthorityGuidePageData[] {
  return AUTHORITY_GUIDE_SLUGS.map((s) => GUIDES[s]);
}

export function guideSlugExists(slug: string): boolean {
  return AUTHORITY_GUIDE_SLUGS.includes(slug as AuthorityGuideSlug);
}
