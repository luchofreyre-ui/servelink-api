import type { AuthoritySurfacePageData } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_SURFACE_SLUGS, type AuthoritySurfaceSlug } from "@/authority/data/authorityTaxonomy";

const M = (slug: string) => `/methods/${slug}`;
const P = (slug: string) => `/problems/${slug}`;

function esMethod(slug: string, title: string, summary?: string) {
  return { slug, title, href: M(slug), summary, kind: "method" as const };
}

function rp(slug: string, title: string, summary?: string) {
  return { slug, title, href: P(slug), summary };
}

function base(slug: string, title: string): AuthoritySurfacePageData {
  return {
    slug,
    title,
    summary: `${title}: first constraints, compatible methods, and escalation cues.`,
    whatToKnowFirst: "Finish type and manufacturer guidance define safe chemistry and moisture limits.",
    safeMethods: "Neutral maintenance, label-directed products, and controlled dwell.",
    avoidMethods: "Undocumented acids, dry abrasion on coatings, and excess moisture at seams.",
    commonProblems: [],
    recommendedTools: [{ name: "Microfiber", note: "Lint-free passes." }],
    recommendedChemicals: [{ name: "Neutral cleaner", note: "Dilute per label." }],
    commonMistakes: ["Cleaning hot surfaces.", "Single-cloth cross-contamination."],
    whenToEscalate: "Coating failure, widespread damage, or unidentified natural stone.",
    relatedSurfaces: [],
    relatedMethods: [],
  };
}

const SURFACES: Record<string, AuthoritySurfacePageData> = {
  tile: {
    ...base("tile", "Tile"),
    commonProblems: [
      rp("general-soil", "General soil"),
      rp("soap-scum", "Soap scum"),
      rp("grease-buildup", "Grease buildup"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("soap-scum-removal", "Soap scum removal"),
    ],
  },
  "shower-glass": {
    ...base("shower-glass", "Shower glass"),
    commonProblems: [
      rp("soap-scum", "Soap scum"),
      rp("hard-water-deposits", "Hard water deposits"),
      rp("light-mildew", "Light mildew appearance"),
    ],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning")],
  },
};

const TITLE: Record<string, string> = {
  grout: "Grout",
  "stainless-steel": "Stainless steel",
  "quartz-countertops": "Quartz countertops",
  "granite-countertops": "Granite countertops",
  laminate: "Laminate",
  "finished-wood": "Finished wood",
  "vinyl-flooring": "Vinyl flooring",
  "painted-walls": "Painted walls",
};

for (const slug of AUTHORITY_SURFACE_SLUGS) {
  if (SURFACES[slug]) continue;
  SURFACES[slug] = base(slug, TITLE[slug] ?? slug);
}

export function getSurfacePageBySlug(slug: string): AuthoritySurfacePageData | undefined {
  return SURFACES[slug];
}

export function getAllSurfacePages(): AuthoritySurfacePageData[] {
  return AUTHORITY_SURFACE_SLUGS.map((s) => SURFACES[s]);
}

export function surfaceSlugExists(slug: string): boolean {
  return AUTHORITY_SURFACE_SLUGS.includes(slug as AuthoritySurfaceSlug);
}
