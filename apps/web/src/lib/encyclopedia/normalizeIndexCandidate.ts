/**
 * Deterministic title/slug normalization for encyclopedia index candidates.
 * Pure functions — no I/O, no randomness.
 */

export type NormalizationAction = "keep" | "review" | "reject";

export type NormalizationWarningCode =
  | "REDUNDANT_ON_CLEANING"
  | "DOUBLE_PREPOSITION"
  | "COUNTERTOP_SURFACE_MISMATCH"
  | "FLOOR_ONLY_PROBLEM_ON_NON_FLOOR_SURFACE"
  | "SURFACE_NAME_NORMALIZED"
  | "DUPLICATE_SURFACE_SEGMENT"
  | "LOW_CONFIDENCE_REWRITE";

export interface NormalizedIndexCandidateResult {
  normalizedTitle: string;
  normalizedSlug: string;
  normalizationWarnings: NormalizationWarningCode[];
  normalizationAction: NormalizationAction;
}

type SurfaceRule = {
  /** Match surface segment (suffix) after extraction */
  variants: string[];
  normalizedSlug: string;
  normalizedTitle: string;
};

/** Longest variant strings first for deterministic suffix matching. */
const SURFACE_RULES: SurfaceRule[] = [
  { variants: ["hardwood-floors"], normalizedSlug: "hardwood-floors", normalizedTitle: "Hardwood Floors" },
  { variants: ["vinyl-floors"], normalizedSlug: "vinyl-floors", normalizedTitle: "Vinyl Floors" },
  { variants: ["laminate-floors"], normalizedSlug: "laminate-floors", normalizedTitle: "Laminate Floors" },
  { variants: ["bathroom-fixtures"], normalizedSlug: "bathroom-fixtures", normalizedTitle: "Bathroom Fixtures" },
  { variants: ["painted-walls"], normalizedSlug: "painted-walls", normalizedTitle: "Painted Walls" },
  { variants: ["tile-floors", "tile"], normalizedSlug: "tile-floors", normalizedTitle: "Tile Floors" },
  { variants: ["glass-surfaces", "glass"], normalizedSlug: "glass", normalizedTitle: "Glass" },
  { variants: ["shower-walls"], normalizedSlug: "shower-walls", normalizedTitle: "Shower Walls" },
  { variants: ["backsplashes", "backsplash"], normalizedSlug: "backsplashes", normalizedTitle: "Backsplashes" },
  { variants: ["baseboards", "baseboard"], normalizedSlug: "baseboards", normalizedTitle: "Baseboards" },
  { variants: ["appliances", "appliance"], normalizedSlug: "appliances", normalizedTitle: "Appliances" },
  { variants: ["cabinets", "cabinet"], normalizedSlug: "cabinets", normalizedTitle: "Cabinets" },
  { variants: ["shower-glass"], normalizedSlug: "shower-glass", normalizedTitle: "Shower Glass" },
  { variants: ["stainless-steel", "stainless"], normalizedSlug: "stainless-steel", normalizedTitle: "Stainless Steel" },
  { variants: ["finished-wood"], normalizedSlug: "finished-wood", normalizedTitle: "Finished Wood" },
  { variants: ["countertops", "countertop"], normalizedSlug: "countertops", normalizedTitle: "Countertops" },
  { variants: ["laminate"], normalizedSlug: "laminate", normalizedTitle: "Laminate" },
  { variants: ["vinyl"], normalizedSlug: "vinyl", normalizedTitle: "Vinyl" },
  { variants: ["grout"], normalizedSlug: "grout", normalizedTitle: "Grout" },
  { variants: ["floors", "floor"], normalizedSlug: "floors", normalizedTitle: "Floors" },
];

const SORTED_VARIANTS: Array<{ variant: string; rule: SurfaceRule }> = [];
for (const rule of SURFACE_RULES) {
  for (const variant of rule.variants) {
    SORTED_VARIANTS.push({ variant, rule });
  }
}
SORTED_VARIANTS.sort((a, b) => b.variant.length - a.variant.length);

/** Matches `TOOL_LEVELS` in encyclopedia expansion config (longest slug first for prefix strip). */
const INDEX_CANDIDATE_TOOL_PREFIXES_SORTED: Array<{ slug: string; title: string }> = [
  { slug: "soft-bristle-brush", title: "Soft-Bristle Brush" },
  { slug: "microfiber-cloth", title: "Microfiber Cloth" },
  { slug: "scrub-pad", title: "Scrub Pad" },
  { slug: "squeegee", title: "Squeegee" },
  { slug: "sponge", title: "Sponge" },
  { slug: "mop", title: "Mop" },
].sort((a, b) => b.slug.length - a.slug.length);

type IntentProblemSurfaceNormSpec = {
  slugPrefix: string;
  parse: (body: string) => { problemSeg: string; surfaceSeg: string } | null;
  rebuildSlug: (problemKebab: string, surfaceKebab: string) => string;
  rebuildTitle: (problemTitle: string, surfaceTitle: string) => string;
};

function splitProblemSurfaceOnLastOn(body: string): { problemSeg: string; surfaceSeg: string } | null {
  const idx = body.lastIndexOf("-on-");
  if (idx <= 0) {
    return null;
  }
  return { problemSeg: body.slice(0, idx), surfaceSeg: body.slice(idx + 4) };
}

function splitWhyHappenOn(body: string): { problemSeg: string; surfaceSeg: string } | null {
  const sep = "-happen-on-";
  const i = body.indexOf(sep);
  if (i <= 0) {
    return null;
  }
  return { problemSeg: body.slice(0, i), surfaceSeg: body.slice(i + sep.length) };
}

function splitMaintainToPrevent(body: string): { problemSeg: string; surfaceSeg: string } | null {
  const sep = "-to-prevent-";
  const i = body.indexOf(sep);
  if (i <= 0) {
    return null;
  }
  /** maintenance slug is surface-first */
  return { surfaceSeg: body.slice(0, i), problemSeg: body.slice(i + sep.length) };
}

/**
 * Intent problem×surface rows use non-standard `-on-` layouts (e.g. `-happen-on-`).
 * Keep intent prefixes stable; normalize embedded surface tokens only.
 */
const INTENT_PROBLEM_SURFACE_NORM_SPECS: IntentProblemSurfaceNormSpec[] = [
  {
    slugPrefix: "how-to-maintain-",
    parse: (body: string) => {
      const p = splitMaintainToPrevent(body);
      return p ? { problemSeg: p.problemSeg, surfaceSeg: p.surfaceSeg } : null;
    },
    rebuildSlug: (problemKebab: string, surfaceKebab: string) =>
      `how-to-maintain-${surfaceKebab}-to-prevent-${problemKebab}`,
    rebuildTitle: (problemTitle: string, surfaceTitle: string) =>
      `How to Maintain ${surfaceTitle} to Prevent ${problemTitle}`,
  },
  {
    slugPrefix: "how-to-prevent-",
    parse: splitProblemSurfaceOnLastOn,
    rebuildSlug: (problemKebab: string, surfaceKebab: string) =>
      `how-to-prevent-${problemKebab}-on-${surfaceKebab}`,
    rebuildTitle: (problemTitle: string, surfaceTitle: string) =>
      `How to Prevent ${problemTitle} on ${surfaceTitle}`,
  },
  {
    slugPrefix: "how-to-avoid-",
    parse: splitProblemSurfaceOnLastOn,
    rebuildSlug: (problemKebab: string, surfaceKebab: string) =>
      `how-to-avoid-${problemKebab}-on-${surfaceKebab}`,
    rebuildTitle: (problemTitle: string, surfaceTitle: string) =>
      `How to Avoid ${problemTitle} on ${surfaceTitle}`,
  },
  {
    slugPrefix: "what-causes-",
    parse: splitProblemSurfaceOnLastOn,
    rebuildSlug: (problemKebab: string, surfaceKebab: string) =>
      `what-causes-${problemKebab}-on-${surfaceKebab}`,
    rebuildTitle: (problemTitle: string, surfaceTitle: string) =>
      `What Causes ${problemTitle} on ${surfaceTitle}?`,
  },
  {
    slugPrefix: "why-does-",
    parse: splitWhyHappenOn,
    rebuildSlug: (problemKebab: string, surfaceKebab: string) =>
      `why-does-${problemKebab}-happen-on-${surfaceKebab}`,
    rebuildTitle: (problemTitle: string, surfaceTitle: string) =>
      `Why Does ${problemTitle} Happen on ${surfaceTitle}?`,
  },
].sort((a, b) => b.slugPrefix.length - a.slugPrefix.length);

function normalizeIntentProblemSurfaceSlugAndTitle(
  slugLower: string,
  _inputTitle: string,
  warnings: NormalizationWarningCode[],
): { slug: string; title: string } | null {
  for (const spec of INTENT_PROBLEM_SURFACE_NORM_SPECS) {
    if (!slugLower.startsWith(spec.slugPrefix)) {
      continue;
    }
    const body = slugLower.slice(spec.slugPrefix.length);
    const parts = spec.parse(body);
    if (!parts) {
      continue;
    }
    const surfRule = findRuleForSurfaceSegment(parts.surfaceSeg);
    const normSurfSlug = surfRule ? surfRule.normalizedSlug : parts.surfaceSeg.toLowerCase();
    if (surfRule && surfRule.normalizedSlug !== parts.surfaceSeg.toLowerCase()) {
      warnings.push("SURFACE_NAME_NORMALIZED");
    }
    const surfaceTitle = surfRule ? surfRule.normalizedTitle : wordsFromKebab(parts.surfaceSeg);
    const problemKebab = parts.problemSeg.toLowerCase();
    const problemTitle = wordsFromKebab(parts.problemSeg);
    const outSlug = spec.rebuildSlug(problemKebab, normSurfSlug);
    const outTitle = spec.rebuildTitle(problemTitle, surfaceTitle);
    return { slug: outSlug, title: outTitle };
  }
  return null;
}

const NON_FLOOR_SURFACES = new Set<string>([
  "glass",
  "glass-surfaces",
  "shower-glass",
  "stainless-steel",
  "countertops",
  "finished-wood",
]);

const FLOOR_CAPABLE_SURFACES = new Set<string>([
  "tile-floors",
  "grout",
  "floors",
  "hardwood-floors",
  "vinyl-floors",
  "laminate-floors",
]);

function uniqueWarnings(codes: NormalizationWarningCode[]): NormalizationWarningCode[] {
  return Array.from(new Set(codes));
}

function wordsFromKebab(slugPart: string): string {
  return slugPart
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function splitLeadingSeverityFromSlug(slugLower: string): {
  severity: "light" | "moderate" | "heavy" | null;
  severityTitle: string | null;
  bodySlug: string;
} {
  const m = /^(light|moderate|heavy)-(.+)$/.exec(slugLower);
  if (!m) {
    return { severity: null, severityTitle: null, bodySlug: slugLower };
  }
  const sev = m[1] as "light" | "moderate" | "heavy";
  const titleMap = { light: "Light", moderate: "Moderate", heavy: "Heavy" } as const;
  return { severity: sev, severityTitle: titleMap[sev], bodySlug: m[2] };
}

function detectKind(slug: string): "problem" | "method" {
  return slug.includes("-on-") ? "problem" : "method";
}

function findRuleForSurfaceSegment(segment: string): SurfaceRule | null {
  const lower = segment.toLowerCase();
  return SURFACE_RULES.find((r) => r.variants.includes(lower)) ?? null;
}

function matchSurfaceSuffix(suffix: string): SurfaceRule | null {
  return findRuleForSurfaceSegment(suffix);
}

/** Longest variant match at end of full slug (method rows). */
function extractMethodPrefixAndSurface(slug: string): { prefix: string; suffix: string } | null {
  const lower = slug.toLowerCase();
  for (const { variant } of SORTED_VARIANTS) {
    if (lower.endsWith(`-${variant}`)) {
      return { prefix: slug.slice(0, -(variant.length + 1)), suffix: variant };
    }
    if (lower === variant) {
      return { prefix: "", suffix: variant };
    }
  }
  return null;
}

function extractProblemPrefixAndSurface(slug: string): { prefix: string; suffix: string } {
  const idx = slug.lastIndexOf("-on-");
  if (idx <= 0) {
    return { prefix: slug, suffix: "" };
  }
  return { prefix: slug.slice(0, idx), suffix: slug.slice(idx + 4) };
}

function stripCleaningPhrases(
  slug: string,
  title: string,
  warnings: NormalizationWarningCode[],
): { slug: string; title: string } {
  let s = slug;
  let t = title;

  if (/-on-cleaning-/.test(s)) {
    s = s.replace(/-on-cleaning-/g, "-on-");
    warnings.push("REDUNDANT_ON_CLEANING");
  }
  if (/-while-cleaning-/.test(s)) {
    s = s.replace(/-while-cleaning-/g, "-");
    warnings.push("REDUNDANT_ON_CLEANING");
  }
  if (/-for-cleaning-/.test(s)) {
    s = s.replace(/-for-cleaning-/g, "-for-");
    warnings.push("REDUNDANT_ON_CLEANING");
  }

  if (/\s+on\s+cleaning\s+/i.test(t)) {
    t = t.replace(/\s+on\s+cleaning\s+/gi, " on ");
    warnings.push("REDUNDANT_ON_CLEANING");
  }
  if (/\s+while\s+cleaning\s+/i.test(t)) {
    t = t.replace(/\s+while\s+cleaning\s+/gi, " ");
    warnings.push("REDUNDANT_ON_CLEANING");
  }
  if (/\s+for\s+cleaning\s+/i.test(t)) {
    t = t.replace(/\s+for\s+cleaning\s+/gi, " for ");
    warnings.push("REDUNDANT_ON_CLEANING");
  }

  const onCount = (s.match(/-on-/g) ?? []).length;
  if (onCount >= 2) {
    warnings.push("DOUBLE_PREPOSITION");
  }

  return { slug: s, title: t };
}

function collapseCountertopBridge(
  slug: string,
  title: string,
  hadBridge: boolean,
  warnings: NormalizationWarningCode[],
): { slug: string; title: string } {
  if (!hadBridge) {
    return { slug, title };
  }
  warnings.push("COUNTERTOP_SURFACE_MISMATCH");
  let s = slug.replace(/-on-countertops-on-/, "-on-").replace(/-on-countertop-on-/, "-on-");
  let t = title.replace(/\s+on\s+Countertops\s+on\s+/i, " on ").replace(/\s+on\s+Countertop\s+on\s+/i, " on ");
  return { slug: s, title: t };
}

/**
 * When the master index lists a method whose slug already ends with a surface
 * segment (e.g. degreasing-finished-wood) and we also append that surface from
 * the surface taxonomy, collapse the duplicate trailing segment.
 */
function collapseMethodDuplicateTrailingSurface(
  slug: string,
  warnings: NormalizationWarningCode[],
): string {
  const extracted = extractMethodPrefixAndSurface(slug);
  if (!extracted?.prefix) {
    return slug;
  }
  const rule = findRuleForSurfaceSegment(extracted.suffix);
  const suf = rule ? rule.normalizedSlug : extracted.suffix.toLowerCase();
  const prefixLower = extracted.prefix.toLowerCase();
  if (prefixLower.endsWith(`-${suf}`)) {
    warnings.push("DUPLICATE_SURFACE_SEGMENT");
    return `${extracted.prefix.slice(0, -(suf.length + 1))}-${suf}`;
  }
  return slug;
}

/** Minimum chars in method stem after stripping a duplicate surface phrase (Rule F guard). */
const MIN_RULE_F_METHOD_PREFIX_LENGTH = 4;

/**
 * Rule F (methods): stem already ends with a surface phrase that maps to the same
 * canonical surface as the appended trailing segment — collapse to a single surface.
 */
function collapseDuplicateSurfaceSegmentForMethod(
  slug: string,
  category: string,
  warnings: NormalizationWarningCode[],
): string {
  if (category !== "methods") {
    return slug;
  }

  let current = slug;
  for (let i = 0; i < 5; i += 1) {
    const extracted = extractMethodPrefixAndSurface(current);
    if (!extracted?.prefix) {
      return current;
    }

    const suffixRule = findRuleForSurfaceSegment(extracted.suffix);
    const canonical = suffixRule ? suffixRule.normalizedSlug : extracted.suffix.toLowerCase();

    const prefix = extracted.prefix;
    const prefixLower = prefix.toLowerCase();

    const variantsForCanonical = new Set<string>();
    for (const rule of SURFACE_RULES) {
      if (rule.normalizedSlug === canonical) {
        for (const v of rule.variants) {
          variantsForCanonical.add(v);
        }
        variantsForCanonical.add(rule.normalizedSlug);
      }
    }

    const sortedVariants = [...variantsForCanonical].sort((a, b) => b.length - a.length);

    let changed = false;
    for (const variant of sortedVariants) {
      const v = variant.toLowerCase();
      if (!prefixLower.endsWith(`-${v}`)) {
        continue;
      }
      const newPrefix = prefix.slice(0, -(v.length + 1));
      if (!newPrefix || !/^[a-z0-9-]+$/.test(newPrefix)) {
        continue;
      }
      if (newPrefix.length < MIN_RULE_F_METHOD_PREFIX_LENGTH) {
        warnings.push("LOW_CONFIDENCE_REWRITE");
        return current;
      }
      const nextSlug = `${newPrefix}-${canonical}`;
      if (nextSlug === current) {
        break;
      }
      warnings.push("DUPLICATE_SURFACE_SEGMENT");
      current = nextSlug;
      changed = true;
      break;
    }

    if (!changed) {
      return current;
    }
  }

  return current;
}

function canonicalizeSlug(
  slug: string,
  kind: "problem" | "method",
  warnings: NormalizationWarningCode[],
): string {
  if (kind === "problem") {
    const { prefix, suffix } = extractProblemPrefixAndSurface(slug);
    if (!suffix) {
      return slug;
    }
    const rule = findRuleForSurfaceSegment(suffix);
    if (!rule) {
      return slug;
    }
    const lower = suffix.toLowerCase();
    if (rule.normalizedSlug !== lower) {
      warnings.push("SURFACE_NAME_NORMALIZED");
      return `${prefix}-on-${rule.normalizedSlug}`;
    }
    return slug;
  }

  const extracted = extractMethodPrefixAndSurface(slug);
  if (!extracted?.prefix) {
    return slug;
  }
  const rule = findRuleForSurfaceSegment(extracted.suffix);
  if (!rule) {
    return slug;
  }
  const lower = extracted.suffix.toLowerCase();
  if (rule.normalizedSlug !== lower) {
    warnings.push("SURFACE_NAME_NORMALIZED");
    return `${extracted.prefix}-${rule.normalizedSlug}`;
  }
  return slug;
}

function rebuildTitle(slug: string, kind: "problem" | "method"): string {
  if (kind === "problem") {
    const { prefix, suffix } = extractProblemPrefixAndSurface(slug);
    if (!suffix) {
      return wordsFromKebab(prefix);
    }
    const rule = matchSurfaceSuffix(suffix);
    const surfaceTitle = rule ? rule.normalizedTitle : wordsFromKebab(suffix);
    return `${wordsFromKebab(prefix)} on ${surfaceTitle}`;
  }

  const extracted = extractMethodPrefixAndSurface(slug);
  if (!extracted || !extracted.prefix) {
    return wordsFromKebab(slug);
  }
  const rule = matchSurfaceSuffix(extracted.suffix);
  const surfaceTitle = rule ? rule.normalizedTitle : wordsFromKebab(extracted.suffix);
  return `${wordsFromKebab(extracted.prefix)} for ${surfaceTitle}`;
}

const FLOOR_MOPPING_PATTERN = /floor-residue-after-mopping/i;

function isFloorMoppingProblem(slug: string, title: string): boolean {
  return FLOOR_MOPPING_PATTERN.test(slug) || FLOOR_MOPPING_PATTERN.test(title);
}

function floorSurfaceReview(normalizedSuffix: string): boolean {
  if (FLOOR_CAPABLE_SURFACES.has(normalizedSuffix)) {
    return false;
  }
  if (NON_FLOOR_SURFACES.has(normalizedSuffix)) {
    return true;
  }
  return true;
}

function getNormalizedSuffixForRules(slug: string, kind: "problem" | "method"): string {
  if (kind === "problem") {
    const { suffix } = extractProblemPrefixAndSurface(slug);
    const rule = matchSurfaceSuffix(suffix);
    return rule ? rule.normalizedSlug : suffix.toLowerCase();
  }
  const extracted = extractMethodPrefixAndSurface(slug);
  if (!extracted) {
    return "";
  }
  const rule = matchSurfaceSuffix(extracted.suffix);
  return rule ? rule.normalizedSlug : extracted.suffix.toLowerCase();
}

/**
 * Final encyclopedia recommendation after scoring + normalization.
 * Normalization never upgrades a weak row; it can only keep or downgrade.
 */
export function reconcileFinalRecommendation(
  scorerRecommendation: "promote" | "review" | "reject",
  normalizationAction: NormalizationAction,
): "promote" | "review" | "reject" {
  if (scorerRecommendation === "reject") {
    return "reject";
  }
  if (normalizationAction === "reject") {
    return "reject";
  }
  if (scorerRecommendation === "review") {
    return "review";
  }
  if (normalizationAction === "review") {
    return "review";
  }
  return "promote";
}

export function normalizeIndexCandidate(input: {
  id: string;
  title: string;
  slug: string;
  category: string;
  cluster: string;
}): NormalizedIndexCandidateResult {
  const warnings: NormalizationWarningCode[] = [];
  const originalSlug = input.slug;
  const hadCountertopBridge = /-on-countertops-on-/.test(originalSlug) || /-on-countertop-on-/.test(originalSlug);

  let slug = input.slug.toLowerCase();
  let title = input.title;
  const severityParts = splitLeadingSeverityFromSlug(slug);
  if (severityParts.severity) {
    slug = severityParts.bodySlug;
  }

  let toolPrefix: { slug: string; title: string } | null = null;
  for (const t of INDEX_CANDIDATE_TOOL_PREFIXES_SORTED) {
    const p = `${t.slug}-`;
    if (slug.startsWith(p)) {
      toolPrefix = { slug: t.slug, title: t.title };
      slug = slug.slice(p.length);
      break;
    }
  }

  const stripped = stripCleaningPhrases(slug, title, warnings);
  slug = stripped.slug;
  title = stripped.title;

  const collapsed = collapseCountertopBridge(slug, title, hadCountertopBridge, warnings);
  slug = collapsed.slug;
  title = collapsed.title;

  const intentNorm = normalizeIntentProblemSurfaceSlugAndTitle(slug, title, warnings);
  if (intentNorm) {
    let outSlug = intentNorm.slug;
    let outTitle = intentNorm.title;
    if (toolPrefix) {
      outSlug = `${toolPrefix.slug}-${outSlug}`;
      outTitle = `${toolPrefix.title} ${outTitle}`;
    }
    if (severityParts.severity && severityParts.severityTitle) {
      outSlug = `${severityParts.severity}-${outSlug}`;
      outTitle = `${severityParts.severityTitle} ${outTitle}`;
    }
    const dedupedEarly = uniqueWarnings(warnings);
    let normalizationActionEarly: NormalizationAction = "keep";
    if (dedupedEarly.includes("COUNTERTOP_SURFACE_MISMATCH")) {
      normalizationActionEarly = "review";
    }
    if (dedupedEarly.includes("LOW_CONFIDENCE_REWRITE")) {
      normalizationActionEarly = "review";
    }
    return {
      normalizedTitle: outTitle,
      normalizedSlug: outSlug,
      normalizationWarnings: dedupedEarly,
      normalizationAction: normalizationActionEarly,
    };
  }

  const kind = detectKind(slug);
  slug = canonicalizeSlug(slug, kind, warnings);
  if (kind === "method") {
    slug = collapseMethodDuplicateTrailingSurface(slug, warnings);
    slug = collapseDuplicateSurfaceSegmentForMethod(slug, input.category, warnings);
  }

  if (!slug || !/^[-a-z0-9]+$/.test(slug)) {
    const bare = slug || "invalid";
    const withSev =
      severityParts.severity && bare !== "invalid" ? `${severityParts.severity}-${bare}` : bare;
    return {
      normalizedTitle: title.trim() || input.title,
      normalizedSlug: withSev,
      normalizationWarnings: uniqueWarnings([...warnings, "LOW_CONFIDENCE_REWRITE"]),
      normalizationAction: "reject",
    };
  }

  title = rebuildTitle(slug, kind);

  const normalizedSuffix = getNormalizedSuffixForRules(slug, kind);

  if (isFloorMoppingProblem(originalSlug, input.title) && floorSurfaceReview(normalizedSuffix)) {
    warnings.push("FLOOR_ONLY_PROBLEM_ON_NON_FLOOR_SURFACE");
  }

  const onSegCount = (slug.match(/-on-/g) ?? []).length;
  if (onSegCount >= 2) {
    warnings.push("LOW_CONFIDENCE_REWRITE");
  }

  if (toolPrefix) {
    slug = `${toolPrefix.slug}-${slug}`;
    title = `${toolPrefix.title} ${title}`;
  }

  if (severityParts.severity && severityParts.severityTitle) {
    slug = `${severityParts.severity}-${slug}`;
    title = `${severityParts.severityTitle} ${title}`;
  }

  const deduped = uniqueWarnings(warnings);

  let normalizationAction: NormalizationAction = "keep";
  if (deduped.includes("FLOOR_ONLY_PROBLEM_ON_NON_FLOOR_SURFACE")) {
    normalizationAction = "review";
  }
  if (deduped.includes("COUNTERTOP_SURFACE_MISMATCH")) {
    normalizationAction = "review";
  }
  if (deduped.includes("LOW_CONFIDENCE_REWRITE")) {
    normalizationAction = "review";
  }

  return {
    normalizedTitle: title,
    normalizedSlug: slug,
    normalizationWarnings: deduped,
    normalizationAction,
  };
}
