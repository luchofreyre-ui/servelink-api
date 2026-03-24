import type { AuthorityMethodPageData } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_METHOD_SLUGS, type AuthorityMethodSlug } from "@/authority/data/authorityTaxonomy";

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;

function esMethod(slug: string, title: string, summary?: string) {
  return { slug, title, href: M(slug), summary, kind: "method" as const };
}

function esSurface(slug: string, title: string, summary?: string) {
  return { slug, title, href: S(slug), summary, kind: "surface" as const };
}

function rp(slug: string, title: string, summary?: string) {
  return { slug, title, href: P(slug), summary };
}

function base(slug: string, title: string): AuthorityMethodPageData {
  return {
    slug,
    title,
    summary: `${title}: defined technique, compatible surfaces, and clear stop points.`,
    whatItIs: "A repeatable cleaning approach with bounded chemistry and mechanics.",
    whyItWorks: "Soil type, dwell, agitation, and rinse are aligned to the finish.",
    bestFor: "Residential maintenance where labels and surface type are known.",
    avoidOn: "Unknown coatings, damaged finishes, or surfaces outside label scope.",
    commonMistakes: ["Skipping dwell or rinse.", "Reusing dirty rinse water across rooms."],
    whenItFails: "If sheen, texture, or odor shifts after a careful pass, stop before escalation.",
    recommendedTools: [{ name: "Microfiber cloths", note: "Rotate to clean faces." }],
    recommendedChemicals: [{ name: "Label-rated cleaner", note: "Spot-test delicate areas." }],
    relatedSurfaces: [],
    relatedProblems: [],
    relatedMethods: [],
  };
}

const METHODS: Record<string, AuthorityMethodPageData> = {
  degreasing: {
    ...base("degreasing", "Degreasing"),
    relatedSurfaces: [
      esSurface("stainless-steel", "Stainless steel"),
      esSurface("laminate", "Laminate"),
    ],
    relatedProblems: [rp("grease-buildup", "Grease buildup")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
};

for (const slug of AUTHORITY_METHOD_SLUGS) {
  if (METHODS[slug]) continue;
  const title =
    slug === "soap-scum-removal"
      ? "Soap scum removal"
      : slug === "neutral-surface-cleaning"
        ? "Neutral surface cleaning"
        : slug === "detail-dusting"
          ? "Detail dusting"
          : slug === "touchpoint-sanitization"
            ? "Touchpoint sanitization"
            : slug === "glass-cleaning"
              ? "Glass cleaning"
              : slug === "hard-water-deposit-removal"
                ? "Hard water deposit removal"
                : slug === "dwell-and-lift-cleaning"
                  ? "Dwell-and-lift cleaning"
                  : slug;
  METHODS[slug] = base(slug, title);
}

export function getMethodPageBySlug(slug: string): AuthorityMethodPageData | undefined {
  return METHODS[slug];
}

export function getAllMethodPages(): AuthorityMethodPageData[] {
  return AUTHORITY_METHOD_SLUGS.map((s) => METHODS[s]);
}

export function methodSlugExists(slug: string): boolean {
  return AUTHORITY_METHOD_SLUGS.includes(slug as AuthorityMethodSlug);
}
