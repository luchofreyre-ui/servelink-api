import { AUTHORITY_PROBLEM_SLUGS, AUTHORITY_SURFACE_SLUGS, type AuthorityProblemSlug, type AuthoritySurfaceSlug } from "@/authority/data/authorityTaxonomy";

const KNOWN_PROBLEM_SLUGS = new Set<string>(AUTHORITY_PROBLEM_SLUGS);
const KNOWN_SURFACE_SLUGS = new Set<string>(AUTHORITY_SURFACE_SLUGS);

const VISUAL_PROBLEM_ALIASES: Record<string, readonly AuthorityProblemSlug[]> = {
  "hard-water-stains": ["hard-water-deposits"],
  "product-residue": ["product-residue-buildup"],
  streaking: ["streaking-on-glass", "surface-streaking"],
  "mold-mildew": ["light-mildew", "mold-growth"],
  "rust-stains": ["hard-water-deposits", "metal-tarnish"],
};

const VISUAL_SLUGS_BY_AUTHORITY_PROBLEM: Partial<Record<AuthorityProblemSlug, readonly string[]>> = {
  "soap-scum": ["soap-scum", "soap-scum-vs-hard-water"],
  "hard-water-deposits": ["hard-water-stains", "soap-scum-vs-hard-water", "haze-vs-etching"],
  "surface-haze": ["surface-haze", "haze-vs-etching"],
  "streaking-on-glass": ["streaking", "streaking-vs-residue"],
  "surface-streaking": ["streaking", "streaking-vs-residue"],
  "grease-buildup": ["grease-buildup"],
  "product-residue-buildup": ["product-residue", "streaking-vs-residue"],
  "light-mildew": ["mold-mildew", "mildew-vs-soil-staining"],
  "mold-growth": ["mold-mildew", "mildew-vs-soil-staining"],
  "cloudy-glass": ["surface-haze", "haze-vs-etching"],
  "glass-cloudiness": ["surface-haze", "haze-vs-etching"],
  "mineral-film": ["hard-water-stains", "haze-vs-etching"],
  "bathroom-buildup": ["soap-scum", "hard-water-stains", "mold-mildew", "soap-scum-vs-hard-water"],
  "metal-tarnish": ["rust-stains"],
};

const VISUAL_SLUGS_BY_AUTHORITY_SURFACE: Partial<Record<AuthoritySurfaceSlug, readonly string[]>> = {
  "shower-glass": ["shower-glass"],
  grout: ["grout", "mildew-vs-soil-staining"],
  "stainless-steel": ["stainless-steel"],
  "finished-wood": ["finished-wood"],
  hardwood: ["finished-wood"],
};

function unique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function isAuthorityProblemSlug(slug: string): slug is AuthorityProblemSlug {
  return KNOWN_PROBLEM_SLUGS.has(slug);
}

export function isAuthoritySurfaceSlug(slug: string): slug is AuthoritySurfaceSlug {
  return KNOWN_SURFACE_SLUGS.has(slug);
}

export function normalizeAuthorityProblemSlug(slug: string): AuthorityProblemSlug | null {
  if (isAuthorityProblemSlug(slug)) return slug;
  const aliases = VISUAL_PROBLEM_ALIASES[slug];
  return aliases?.[0] ?? null;
}

export function normalizeAuthoritySurfaceSlug(slug: string): AuthoritySurfaceSlug | null {
  return isAuthoritySurfaceSlug(slug) ? slug : null;
}

export function getAuthorityProblemSlugsForVisualSlug(visualSlug: string): AuthorityProblemSlug[] {
  if (isAuthorityProblemSlug(visualSlug)) return [visualSlug];
  return [...(VISUAL_PROBLEM_ALIASES[visualSlug] ?? [])];
}

export function getVisualDiagnosticSlugsForAuthorityProblem(problemSlug: string): string[] {
  const canonical = normalizeAuthorityProblemSlug(problemSlug);
  if (!canonical) return [];
  return unique([canonical, ...(VISUAL_SLUGS_BY_AUTHORITY_PROBLEM[canonical] ?? [])]);
}

export function getVisualDiagnosticSlugsForAuthoritySurface(surfaceSlug: string): string[] {
  const canonical = normalizeAuthoritySurfaceSlug(surfaceSlug);
  if (!canonical) return [];
  return unique([canonical, ...(VISUAL_SLUGS_BY_AUTHORITY_SURFACE[canonical] ?? [])]);
}
