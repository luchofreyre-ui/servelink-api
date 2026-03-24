import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import type { AuthorityProblemCategory } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_PROBLEM_SLUGS, type AuthorityProblemSlug } from "@/authority/data/authorityTaxonomy";

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;

function esMethod(slug: string, title: string, summary?: string) {
  return { slug, title, href: M(slug), summary, kind: "method" as const };
}

function esSurface(slug: string, title: string, summary?: string) {
  return { slug, title, href: S(slug), summary, kind: "surface" as const };
}

function prob(
  slug: string,
  title: string,
  category: AuthorityProblemCategory,
): AuthorityProblemPageData {
  return {
    slug,
    title,
    description: `${title}: what it usually is, safe method fit, and when to stop.`,
    summary: `${title}: identification, method fit, and finish protection.`,
    category,
    symptoms: ["Visible change versus clean baseline", "Recurring pattern after wipes"],
    causes: ["Use environment", "Water chemistry", "Maintenance cadence"],
    whatItUsuallyIs: "A surface-confined soil or film that may be removable with correct technique.",
    whyItHappens: "Soil accumulates where airflow, water, or contact concentrates residue.",
    commonOn: "Residential kitchens and baths; high-touch and wet zones.",
    bestMethods: "Neutral first; escalate only with label checks and spot tests.",
    avoidMethods: "Undocumented mixing, dry abrasion on coatings, and guessing acids on stone.",
    recommendedTools: [{ name: "Microfiber", note: "Dedicated cloths per step." }],
    recommendedChemicals: [{ name: "Surface-appropriate cleaner", note: "Read the label." }],
    commonMistakes: ["Treating damage as removable residue.", "Skipping rinse passes."],
    whenItFails: "If appearance worsens after a careful attempt, assume possible damage—not more force.",
    whenToEscalate: "Manufacturer-sensitive finishes, large areas, or structural moisture.",
    relatedProblems: [],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    relatedSurfaces: [esSurface("tile", "Tile")],
  };
}

const PROBLEMS: Record<string, AuthorityProblemPageData> = {
  "soap-scum": prob("soap-scum", "Soap scum", "residue"),
  "grease-buildup": prob("grease-buildup", "Grease buildup", "oil_based"),
  "hard-water-deposits": prob("hard-water-deposits", "Hard water deposits", "mineral"),
  "dust-buildup": prob("dust-buildup", "Dust buildup", "organic"),
  "fingerprints-and-smudges": prob("fingerprints-and-smudges", "Fingerprints and smudges", "transfer"),
  "stuck-on-residue": prob("stuck-on-residue", "Stuck-on residue", "residue"),
  "light-mildew": prob("light-mildew", "Light mildew appearance", "biological"),
  "streaking-on-glass": prob("streaking-on-glass", "Streaking on glass", "residue"),
  "general-soil": prob("general-soil", "General soil", "organic"),
  "touchpoint-contamination": prob("touchpoint-contamination", "Touchpoint contamination", "biological"),
};

export function getProblemPageBySlug(slug: string): AuthorityProblemPageData | undefined {
  return PROBLEMS[slug];
}

export function getAllProblemPages(): AuthorityProblemPageData[] {
  return AUTHORITY_PROBLEM_SLUGS.map((s) => PROBLEMS[s]);
}

export function problemSlugExists(slug: string): boolean {
  return AUTHORITY_PROBLEM_SLUGS.includes(slug as AuthorityProblemSlug);
}
