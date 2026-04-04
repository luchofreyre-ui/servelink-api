import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import type { AuthorityProblemCategory } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_PROBLEM_SLUGS, type AuthorityProblemSlug } from "@/authority/data/authorityTaxonomy";

/** Reusable voice + guardrails for core problem hubs (merged at read time). */
export type AuthorityToneBlock = {
  lead: string;
  subline: string;
  beforeYouClean: string[];
  diagnosticVoiceLines: string[];
};

export const AUTHORITY_CORE_PROBLEM_TONES = {
  "grease-buildup": {
    subline: "This is buildup, not damage. Remove it cleanly without spreading it around.",
    lead: "Grease buildup looks worse than it is. It's usually just layered oils that haven't been fully removed.",
    beforeYouClean: [
      "Do not start with a heavy degreaser. You'll smear it.",
      "Warm water matters more than people think here.",
      "You need removal, not redistribution.",
    ],
    diagnosticVoiceLines: [
      "If it feels slick, it's grease—not damage.",
      "If it smears, you're not breaking it down yet.",
      "If it keeps coming back, you're leaving residue behind.",
    ],
  },
  "hard-water-deposits": {
    subline: "Minerals sit on top. You dissolve them—you don't scrub them off.",
    lead: "Hard water deposits are mineral buildup. Scrubbing alone won't remove them, and can damage the surface.",
    beforeYouClean: [
      "Do not dry scrub this.",
      "Let chemistry do the work first.",
      "Time-on-surface matters more than pressure.",
    ],
    diagnosticVoiceLines: [
      "If it's chalky, it's mineral—not dirt.",
      "If it doesn't budge with scrubbing, you need acid—not force.",
      "If it comes back quickly, water source is the issue.",
    ],
  },
  "mold-growth": {
    subline: "You're not just removing it—you're preventing it from returning.",
    lead: "Mold growth is a moisture problem first, and a cleaning problem second.",
    beforeYouClean: [
      "Do not just wipe the surface.",
      "You need to address moisture, not just visibility.",
      "Disinfecting alone is not enough.",
    ],
    diagnosticVoiceLines: [
      "If it keeps coming back, moisture is still present.",
      "If it spreads, you're disturbing spores without removal.",
      "If it stains, you're dealing with both growth and residue.",
    ],
  },
} as const satisfies Record<string, AuthorityToneBlock>;

function applyCoreProblemTone(
  slug: string,
  base: AuthorityProblemPageData,
): AuthorityProblemPageData {
  const tone = AUTHORITY_CORE_PROBLEM_TONES[slug as keyof typeof AUTHORITY_CORE_PROBLEM_TONES];
  if (!tone) return base;
  return {
    ...base,
    heroSubline: tone.subline,
    whatItUsuallyIs: tone.lead,
    beforeYouClean: tone.beforeYouClean.join("\n\n"),
    diagnosticVoiceLines: [...tone.diagnosticVoiceLines],
  };
}

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;

function rpRel(slug: string, title: string) {
  return { slug, title, href: P(slug) };
}

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
  "soap-scum": {
    ...prob("soap-scum", "Soap scum", "residue"),
    summary:
      "Soap scum is a grabby bathroom film from soap, minerals, and oils—remove it with the right cleaner order, not guesswork.",
    problemDefinitionLine:
      "A film of soap residue, hard-water minerals, and body oils on wet surfaces—often mistaken for permanent damage.",
    executionQuickFix: {
      use: "Neutral bathroom cleaner (non-abrasive).",
      do: "Spray → wait 1–2 min → soft scrub → rinse.",
      ifNeeded: "Stronger cleaner if needed. No abrasives on delicate surfaces.",
    },
    whyThisWorksShort:
      "Soap scum is a surface film. Gentle cleaners break it up without damaging the material.",
    whatItUsuallyIs:
      "Soap scum is a surface film made from soap residue, minerals in water, and body oils.\n\nIt builds up in layers and can look like staining or damage, especially on grout, tile, and glass.",
    whyItHappens:
      "It forms in areas that stay damp and don't get fully rinsed.\n\nOver time, residue layers combine with minerals in the water, creating a film that becomes harder to remove the longer it sits.",
    commonOn:
      "Showers, grout lines, glass, and any surface that regularly stays wet.\n\nHigh-use areas build it faster, especially where airflow is limited.",
    beforeYouClean:
      "Spot-test first. Go gentle → stronger; don’t guess acids on stone or coated glass.\n\nIf the look or feel changes after a pass, stop immediately—more chemistry usually makes it worse.",
    bestMethods:
      "Start with a neutral cleaner and a soft tool to break up the film.\n\nIf buildup remains, step up gradually—don't jump straight to harsh chemicals.\n\nRinsing thoroughly matters just as much as the cleaner you use.",
    avoidMethods:
      "Jumping straight to strong acids\nDry scrubbing on sensitive finishes\nMixing products without knowing compatibility\nAssuming all buildup is removable residue",
    whenItFails:
      "If the surface gets dull, rough, or worse after cleaning, you may be dealing with damage—not residue.\n\nAt that point, more cleaning won't fix it.",
    diagnosticVoiceLines: [
      "You don't need anything aggressive to fix this.",
      "This is where most people go wrong.",
      "If it gets worse, stop—this usually means damage.",
    ],
  },
  "grease-buildup": {
    ...prob("grease-buildup", "Grease buildup", "oil_based"),
    summary:
      "Kitchen grease: degrease with label-safe chemistry, rinse, protect finishes.",
    problemDefinitionLine:
      "Layered cooking oil on hoods, backsplashes, and appliances—degrease, then rinse.",
    executionQuickFix: {
      use: "Degreasing cleaner (kitchen-safe)",
      do: "Spray → wait 1–2 min → wipe or soft scrub → rinse",
      ifNeeded: "Repeat or use stronger degreaser. Avoid harsh scrubbing on finishes.",
    },
    whyThisWorksShort:
      "Grease is oil-based. Degreasers break it down so it can be removed from the surface.",
    decisionShortcuts: [
      {
        label: "Light buildup on everyday hard surfaces",
        body: "Start with surfactant-forward cleaners you can rinse clean; escalate only if soil stays after a careful pass.",
        productSlugs: ["dawn-platinum-dish-spray"],
      },
      {
        label: "Heavy hood or cooktop grease films",
        body: "Use labeled kitchen degreasers with ventilation—oven cleaners and broad industrial SKUs are for different jobs.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "weiman-gas-range-cleaner-degreaser"],
      },
      {
        label: "Delicate or sealed stone finishes",
        body: "Default to stone-rated maintenance chemistry; do not borrow cooktop degreasers without a label check.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
    ],
    bestBySurfaceExtras: [
      {
        line: "Cooktops (smudges / light film): Cerama Bryte or Weiman cooktop products beat heavy hood degreasers.",
        href: "/products/cerama-bryte-cooktop-cleaner",
      },
      {
        line: "Range hoods (greasy film): Krud Kutter Kitchen or Weiman cooktop degreaser.",
        href: "/products/krud-kutter-kitchen-degreaser",
      },
      {
        line: "Stainless fronts / appliances: appearance polishes vs true degreasing—match chemistry to soil depth.",
        href: "/products/weiman-stainless-steel-cleaner-polish",
      },
    ],
    productScenarios: [
      {
        problem: "grease buildup",
        surface: "kitchen",
        products: [
          { slug: "dawn-platinum-dish-spray", name: "Dawn Platinum EZ-Squeeze Dish Spray" },
          { slug: "krud-kutter-kitchen-degreaser", name: "Krud Kutter Kitchen Degreaser" },
        ],
      },
    ],
  },
  "hard-water-deposits": {
    ...prob("hard-water-deposits", "Hard water deposits", "mineral"),
    summary:
      "Hard water leaves mineral residue—dissolve with surface-safe acids, then rinse.",
    problemDefinitionLine:
      "Mineral buildup left behind when water evaporates, often appearing as white or cloudy residue.",
    executionQuickFix: {
      use: "Acid-based cleaner (safe for the surface)",
      do: "Apply → wait 1–3 min → light scrub → rinse",
      ifNeeded: "Repeat or increase dwell time. Avoid acids on stone.",
    },
    whyThisWorksShort:
      "Hard water deposits are mineral-based. Acids dissolve the minerals so they can be removed.",
    decisionShortcuts: [
      {
        label: "Light spotting on glass or chrome",
        body: "Try glass-focused maintenance first; acids are powerful—respect labels and dwell.",
        productSlugs: ["windex-original-glass-cleaner"],
      },
      {
        label: "Visible scale or stubborn mineral film",
        body: "Acid descalers win when the surface allows it—never guess on acid-sensitive stone.",
        productSlugs: ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
      },
      {
        label: "Stone or unknown sealers",
        body: "Pause and use stone-rated products; vinegar and CLR-class acids can etch or dull the wrong finish.",
        productSlugs: ["granite-gold-daily-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "hard water",
        surface: "fixtures",
        products: [
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "zep-calcium-lime-rust-remover", name: "Zep Calcium, Lime & Rust Remover" },
        ],
      },
    ],
  },
  "dust-buildup": {
    ...prob("dust-buildup", "Dust buildup", "organic"),
    problemDefinitionLine:
      "Loose dry soil and fibers that resettle after wiping—capture first, then damp-clean only where the finish allows.",
    executionQuickFix: {
      use: "Dry microfiber or electrostatic duster; damp cleaner only after dry soil is lifted.",
      do: "Top-down → edges → floors; vacuum or dry-dust first → then light damp pass on hard surfaces.",
      ifNeeded:
        "If dust returns in hours, check HVAC filters, textiles shedding, and whether you are smearing with a loaded cloth.",
    },
    whyThisWorksShort:
      "Dust is mostly particles and lint. Dry capture removes bulk; damp passes lift what clings without turning it into muddy streaks.",
    decisionShortcuts: [
      {
        label: "Hard floors and open areas",
        body: "Dry soil first—neutral damp mopping beats soaking when the goal is dust, not disinfecting.",
        productSlugs: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      },
      {
        label: "Counters, shelves, and baseboards",
        body: "Light all-purpose pass after dry dusting; avoid heavy fragrance loads that leave film.",
        productSlugs: ["simple-green-all-purpose-cleaner", "seventh-generation-disinfecting-multi-surface-cleaner"],
      },
      {
        label: "Glass and glossy finishes showing dust trails",
        body: "Finish with a dry buff; if haze persists, treat as residue—not more dust.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "dust buildup",
        surface: "hardwood",
        products: [
          { slug: "bona-hard-surface-floor-cleaner", name: "Bona Hard-Surface Floor Cleaner" },
          { slug: "zep-neutral-ph-floor-cleaner", name: "Zep Neutral pH Floor Cleaner" },
          { slug: "method-all-purpose-cleaner", name: "Method All-Purpose Cleaner (Pink Grapefruit)" },
        ],
      },
      { problem: "dust buildup", surface: "laminate" },
      { problem: "dust buildup", surface: "tile" },
    ],
    relatedProblems: [
      rpRel("general-soil", "General soil"),
      rpRel("floor-residue-buildup", "Floor residue buildup"),
      rpRel("fingerprints-and-smudges", "Fingerprints and smudges"),
    ],
  },
  "fingerprints-and-smudges": prob("fingerprints-and-smudges", "Fingerprints and smudges", "transfer"),
  "stuck-on-residue": prob("stuck-on-residue", "Stuck-on residue", "residue"),
  "light-mildew": {
    ...prob("light-mildew", "Light mildew appearance", "biological"),
    problemDefinitionLine:
      "A thin biofilm on damp bathroom surfaces—usually surface-level, not the same as heavy mold growth.",
    executionQuickFix: {
      use: "Bathroom disinfectant or mildew cleaner labeled for the surface.",
      do: "Ventilate → spray → dwell per label → soft scrub → rinse and dry thoroughly.",
      ifNeeded: "Improve airflow and fix lingering moisture. If it spreads or returns fast, reassess as broader growth—not just ‘wipe harder.’",
    },
    whyThisWorksShort:
      "On non-porous surfaces, labeled chemistry removes the film; drying and ventilation remove what lets it come back.",
    productScenarios: [
      {
        problem: "light mildew cleanup",
        surface: "bathroom",
        products: [
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
          { slug: "heinz-distilled-white-vinegar-5pct", name: "White Vinegar (5%)" },
          { slug: "scrubbing-bubbles-daily-shower-cleaner", name: "Scrubbing Bubbles Daily Shower Cleaner" },
        ],
      },
    ],
  },
  "streaking-on-glass": {
    ...prob("streaking-on-glass", "Streaking on glass", "residue"),
    problemDefinitionLine:
      "Wipe trails and haze from cleaner residue, cloth friction, or minerals—often technique and rinse, not ‘dirtier glass.’",
    executionQuickFix: {
      use: "Glass cleaner or very light surfactant; two clean microfibers (wet wipe + dry buff).",
      do: "Mist lightly → wipe in one direction → flip cloth or switch to dry side → buff dry.",
      ifNeeded: "Swap cloths if product loads up; rinse first if layers stack. Treat mineral spots with label-safe steps separately.",
    },
    whyThisWorksShort:
      "Streaks are usually leftover product or water minerals. Less chemistry, fresh cloth, and a true dry pass stop the smear loop.",
    productScenarios: [
      {
        problem: "streak-free glass cleaning",
        surface: "glass",
        products: [
          { slug: "invisible-glass-premium-glass-cleaner", name: "Invisible Glass" },
          { slug: "windex-original-glass-cleaner", name: "Windex Original" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
    ],
  },
  "general-soil": prob("general-soil", "General soil", "organic"),
  "touchpoint-contamination": prob("touchpoint-contamination", "Touchpoint contamination", "biological"),

  "adhesive-residue": {
    ...prob("adhesive-residue", "Adhesive residue", "residue"),
    problemDefinitionLine:
      "Sticky tape, label, or glue residue that grabs dust—needs dwell and the right solvent, not blind scraping.",
    executionQuickFix: {
      use: "Adhesive remover or petroleum/citrus solvent labeled for the finish (start mild).",
      do: "Spot-test → apply → short dwell → lift with plastic edge or cloth → wipe clean.",
      ifNeeded: "Step up only if the label allows; skip metal razors on soft plastics and coated glass.",
    },
    whyThisWorksShort:
      "Solvents soften the adhesive so it releases; controlled lift avoids driving gum deeper or scratching the finish.",
    whatItUsuallyIs:
      "Tape, label, or sticker residue that re-gums when heated, plus light tacky films that attract dust.",
    bestMethods: "Start with the least aggressive solvent that the label allows; dwell, then lift—don’t gouge.",
    avoidMethods: "Attacking stone or painted finishes with strong solvents without a spot test.",
    commonMistakes: [
      "Using razor blades on soft plastics or coated glass.",
      "Applying citrus or petroleum solvents to unfinished stone.",
      "Rubbing adhesive deeper into porous grout lines.",
    ],
    decisionShortcuts: [
      {
        label: "Tape or sticker residue on hard plastic",
        body: "Start with mild citrus or petroleum-based removers before jumping to aggressive solvents.",
        productSlugs: ["goo-gone-original-liquid", "un-du-adhesive-remover"],
      },
      {
        label: "Heavy adhesive or cured gum",
        body: "Stronger solvent blends may be warranted—ventilation and finish tests matter more here.",
        productSlugs: ["goof-off-professional-strength-remover", "3m-adhesive-remover"],
      },
      {
        label: "Stone, painted trim, or unknown coatings",
        body: "Spot-test and favor the gentlest effective remover; adhesives are not worth a ruined finish.",
        productSlugs: ["un-du-adhesive-remover"],
      },
    ],
    productScenarios: [
      { problem: "adhesive residue", surface: "plastic" },
      { problem: "adhesive residue", surface: "glass" },
      { problem: "sticky residue", surface: "laminate" },
    ],
    relatedSurfaces: [
      esSurface("laminate", "Laminate"),
      esSurface("tile", "Tile"),
      esSurface("painted-walls", "Painted walls"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
  },

  "odor-retention": {
    ...prob("odor-retention", "Odor retention", "organic"),
    problemDefinitionLine:
      "Smells that return because organic film or soil is still hiding in fibers, drains, or bins—not a missing ‘fresh scent.’",
    executionQuickFix: {
      use: "Remove visible soil first; then odor neutralizer, enzyme, or disinfectant matched to the source (per label).",
      do: "Clean the surface or container → apply product → dwell → ventilate, rinse, or extract as the label directs.",
      ifNeeded:
        "Laundry: proper rinse/extract. Drains: remove debris, then labeled drain care. Skip fragrance-only cover-ups.",
    },
    whyThisWorksShort:
      "Odor compounds cling to film and porous material. Hitting the labeled source beats perfume that masks without removing what holds the smell.",
    whatItUsuallyIs:
      "Smells that return after cleaning—often from soft surfaces, drains, or garbage zones holding organic film.",
    bestMethods:
      "Remove soil first, then use odor chemistry matched to the source (neutralizers vs enzymes vs disinfectants when appropriate).",
    avoidMethods: "Masking with fragrance-only sprays when biology or film is still present.",
    commonMistakes: [
      "Using disinfectant sprays as a substitute for fabric or carpet odor chemistry.",
      "Skipping laundry rinse or extraction on soft surfaces.",
      "Treating pet urine like a generic “room spray” problem.",
    ],
    decisionShortcuts: [
      {
        label: "Soft surfaces holding organic film",
        body: "Enzyme or neutralizer-forward SKUs beat disinfectant-only masking when biology is involved.",
        productSlugs: ["natures-miracle-stain-and-odor-remover", "zero-odor-eliminator-spray"],
      },
      {
        label: "Laundry or fabric refresh",
        body: "Fabric refreshers and sanitizers play different roles—match chemistry to whether you need biology vs hygiene.",
        productSlugs: ["febreze-fabric-refresher-antimicrobial", "clorox-laundry-sanitizer"],
      },
      {
        label: "Garbage or plastic bins",
        body: "Clean soil first, then deodorize; heavy fragrance without removal usually fails fast.",
        productSlugs: ["fresh-wave-odor-removing-spray"],
      },
    ],
    productScenarios: [
      {
        problem: "neutralize lingering odors",
        surface: "home",
        products: [
          { slug: "zero-odor-eliminator-spray", name: "Zero Odor Eliminator" },
          { slug: "natures-miracle-stain-and-odor-remover", name: "Nature's Miracle Stain & Odor Remover" },
          { slug: "fresh-wave-odor-removing-spray", name: "Fresh Wave Odor Removing Spray" },
        ],
      },
      { problem: "odor retention", surface: "carpet" },
      { problem: "odor retention", surface: "laundry" },
      { problem: "odor retention", surface: "garbage cans" },
    ],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },

  "mold-growth": {
    ...prob("mold-growth", "Mold growth", "biological"),
    problemDefinitionLine:
      "Active or recurring fungal growth on damp surfaces—moisture control matters as much as cleaning.",
    executionQuickFix: {
      use: "Mold-control or remediation product labeled for the surface (follow the label exactly).",
      do: "Ventilate → apply per label → wait → wipe and bag visible debris → dry the area.",
      ifNeeded:
        "If it returns, find and fix the moisture source. Large areas, hidden cavities, or HVAC involvement → professional help.",
    },
    whyThisWorksShort:
      "Mold needs moisture to persist. Labeled removal steps address visible growth while drying and source control reduce what grows back.",
    whatItUsuallyIs:
      "Active or recurring microbial growth—distinct from a single light mildew film—often tied to moisture and ventilation.",
    bestMethods: "Identify moisture, reduce humidity, then use label-correct remediation chemistry; escalate large areas.",
    avoidMethods: "Bleach-forward guessing on porous materials without understanding what the label allows.",
    commonMistakes: [
      "Painting over active growth without fixing moisture.",
      "Using vinegar or weak cleaners when EPA-registered steps are required.",
      "Treating all musty smells as “disinfectant only.”",
    ],
    decisionShortcuts: [
      {
        label: "Small, surface-limited growth in wet areas",
        body: "Fix moisture first; use label-correct remediation chemistry and stop if spread is unclear.",
        productSlugs: ["concrobium-mold-control", "mold-armor-rapid-clean-remediation"],
      },
      {
        label: "Bathroom film that might be mildew vs soap scum",
        body: "Soap-scum removers and mold products overlap—choose based on growth vs mineral film.",
        productSlugs: ["zep-shower-tub-tile-cleaner", "concrobium-mold-control"],
      },
      {
        label: "Large areas or HVAC involvement",
        body: "Escalate to professionals—this hub is not a substitute for containment planning.",
      },
    ],
    productScenarios: [
      {
        problem: "bathroom mold removal",
        surface: "bathroom",
        products: [
          { slug: "scrubbing-bubbles-bathroom-grime-fighter", name: "Scrubbing Bubbles Bathroom Cleaner" },
          { slug: "concrobium-mold-control", name: "Concrobium Mold Control" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      { problem: "mold growth", surface: "tile" },
      { problem: "mold growth", surface: "countertops" },
      { problem: "mildew stains", surface: "shower glass" },
    ],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass"),
      esSurface("tile", "Tile"),
      esSurface("grout", "Grout"),
    ],
    relatedMethods: [
      esMethod("soap-scum-removal", "Soap scum removal"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
  },

  "burnt-residue": {
    ...prob("burnt-residue", "Burnt residue", "oil_based"),
    whatItUsuallyIs:
      "Carbonized oils, browned-on films, and char that behave more like polymerized grease than loose dust.",
    bestMethods: "Ventilate, use labeled oven or cooktop chemistry only where the surface allows it, then rinse residue fully.",
    avoidMethods: "Borrowing oven cleaner for countertops, cabinets, or unknown coatings.",
    relatedProblems: [rpRel("cooked-on-grease", "Cooked-on grease"), rpRel("grease-buildup", "Grease buildup")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    decisionShortcuts: [
      {
        label: "Inside labeled ovens / grills",
        body: "Heavy-duty oven products are for enclosed, labeled interiors—not open food-prep zones.",
        productSlugs: ["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"],
      },
      {
        label: "Cooktops and hoods (not oven interiors)",
        body: "Kitchen degreasers and cooktop lines beat oven chemistry for daily hard surfaces.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "weiman-gas-range-cleaner-degreaser"],
      },
      {
        label: "Light film after cooking",
        body: "Start mild, rinse, then escalate only if soil remains and the label agrees.",
        productSlugs: ["dawn-platinum-dish-spray"],
      },
    ],
    productScenarios: [
      { problem: "burnt residue", surface: "stainless steel" },
      { problem: "burnt residue", surface: "glass" },
    ],
  },

  "cloudy-glass": {
    ...prob("cloudy-glass", "Cloudy glass", "residue"),
    problemDefinitionLine:
      "Dull or foggy glass from mineral film, soap residue, or product buildup—sometimes confused with permanent etching.",
    executionQuickFix: {
      use: "Glass cleaner or neutral bath spray; acid descalers only when labels allow and you are targeting mineral film.",
      do: "Rinse → spray → short dwell → soft scrub → squeegee or dry buff → re-check under light.",
      ifNeeded:
        "If appearance does not improve after careful passes, assume possible etch or coating damage—not more aggressive scrubbing.",
    },
    whyThisWorksShort:
      "Removable haze is usually film on the surface. Matched chemistry and rinse lift that film; etched damage will not wipe away.",
    whatItUsuallyIs:
      "A dull or foggy appearance from mineral film, etched damage, or cleaner residue—not always removable with glass spray alone.",
    bestMethods: "Separate mineral film from damage: tolerant glass can accept descale steps; damage needs replacement or professional polish.",
    avoidMethods: "Scrubbing coated or acid-sensitive glass with the wrong chemistry.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("streaking-on-glass", "Streaking on glass"), rpRel("soap-film", "Soap film")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    decisionShortcuts: [
      {
        label: "Spotting / mineral haze on tolerant glass",
        body: "Hard-water chemistry can help when labels allow—never guess on coated or unknown glass.",
        productSlugs: ["clr-calcium-lime-rust", "windex-original-glass-cleaner"],
      },
      {
        label: "Soap or product film",
        body: "Rinse-first discipline and a clean glass workflow often beats adding more product.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "restore cloudy glass",
        surface: "glass",
        products: [
          { slug: "bar-keepers-friend-cleanser", name: "Bar Keepers Friend" },
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
      { problem: "cloudy film", surface: "shower glass" },
      { problem: "cloudy film", surface: "glass" },
    ],
  },

  "cooked-on-grease": {
    ...prob("cooked-on-grease", "Cooked-on grease", "oil_based"),
    problemDefinitionLine:
      "Heat-set oil and food residue on cooktops, hoods, and backsplashes—tougher than fresh splatter.",
    executionQuickFix: {
      use: "Kitchen degreaser or surfactant-forward cleaner labeled for the surface.",
      do: "Ventilate → spray → dwell 2–5 min → wipe or soft scrub → rinse.",
      ifNeeded:
        "Repeat or use a stronger labeled degreaser. Keep oven-class caustics off open food-prep surfaces unless the label allows it.",
    },
    whyThisWorksShort:
      "Heat polymerizes oils into a film. Surfactants and degreasers break that film so it lifts and rinses away instead of smearing.",
    whatItUsuallyIs:
      "Heat-set lipid films that resist quick wipes—different from light kitchen dust or fresh splatter.",
    bestMethods: "Dwell with surfactant-forward or labeled degreasers; finish with rinse passes so residue does not attract soil.",
    avoidMethods: "Enzyme-only workflows for fryer-grade grease on hard surfaces where surfactants are the primary tool.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("burnt-residue", "Burnt residue")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    decisionShortcuts: [
      {
        label: "Range hoods and backsplashes",
        body: "Kitchen degreasers with ventilation; match chemistry to soil depth.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "dawn-platinum-dish-spray"],
      },
      {
        label: "Glass cooktops",
        body: "Cooktop-specific polishers reduce scratch risk versus generic scrub pads.",
        productSlugs: ["cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"],
      },
    ],
    productScenarios: [
      { problem: "cooked-on grease", surface: "stainless steel" },
      { problem: "cooked-on grease", surface: "glass" },
    ],
  },

  "oxidation": {
    ...prob("oxidation", "Oxidation / tarnish", "physical_damage"),
    whatItUsuallyIs:
      "Chemical change in the finish—often on metals—not a simple removable soil layer.",
    bestMethods: "Match metal polish or manufacturer guidance; stop if appearance worsens.",
    avoidMethods: "Acid guessing on plated finishes or mixed-material assemblies.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("yellowing", "Yellowing")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    decisionShortcuts: [
      {
        label: "Stainless fronts and fixtures",
        body: "Polish-forward maintenance lines vs true degreasing when the issue is appearance, not fresh grease.",
        productSlugs: ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish"],
      },
    ],
    productScenarios: [
      { problem: "oxidation", surface: "stainless steel" },
      { problem: "tarnish", surface: "stainless steel" },
    ],
  },

  "smudge-marks": {
    ...prob("smudge-marks", "Smudge marks", "transfer"),
    problemDefinitionLine:
      "Oils and fingerprints that smear on brushed stainless and glossy fronts—often a film problem, not missing pressure.",
    executionQuickFix: {
      use: "Stainless cleaner–polish labeled for appliance fronts, or mild surfactant + clean microfiber when soil is heavy.",
      do: "Wipe with the grain → dry buff with a fresh cloth; flip or swap cloths instead of re-smearing.",
      ifNeeded:
        "Heavy kitchen grease: degrease first where labels allow, then a separate polish pass—don’t turn polish into your only soil removal step.",
    },
    whyThisWorksShort:
      "Smudges are oil film caught in the grain or on gloss. Grain-direction passes and dry buffing lift film instead of spreading it.",
    whatItUsuallyIs:
      "Oils and films that redistribute under wiping—common on glossy laminates, appliances, and some walls.",
    bestMethods: "Low-residue damp passes with clean microfiber; escalate chemistry only when the label matches the finish.",
    avoidMethods: "Heavy wax or oil polishes that add more transferable film.",
    relatedProblems: [rpRel("fingerprints-and-smudges", "Fingerprints and smudges"), rpRel("grease-buildup", "Grease buildup")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("stainless-steel", "Stainless steel"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Appliance fronts",
        body: "Stainless polishes can be appearance tools—separate from true degreasing when soil is heavy.",
        productSlugs: ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish"],
      },
      {
        label: "High-gloss hard surfaces",
        body: "Glass-forward streak control can help when the finish behaves like glass.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "remove fingerprints and smudges",
        surface: "surfaces",
        products: [
          { slug: "windex-original-glass-cleaner", name: "Windex Original" },
          { slug: "method-all-purpose-cleaner", name: "Method All-Purpose Cleaner" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
      { problem: "smudge marks", surface: "laminate" },
      { problem: "smudge marks", surface: "stainless steel" },
    ],
  },

  "soap-film": {
    ...prob("soap-film", "Soap film (light mineral + surfactant haze)", "residue"),
    problemDefinitionLine:
      "A clingy bath and shower film from soaps, conditioners, and minerals—lighter than chunky soap scum but still layer-forming.",
    executionQuickFix: {
      use: "Neutral bathroom cleaner or daily shower spray (non-abrasive).",
      do: "Rinse with warm water → spray → short dwell → soft scrub → rinse thoroughly.",
      ifNeeded:
        "If film remains, step up gradually (soap-scum–class cleaners). Spot-test stone, coatings, and delicate glass.",
    },
    whyThisWorksShort:
      "The film is surfactant + mineral residue on the surface. Short dwell and rinse cycles let chemistry work without grinding soil into the finish.",
    whatItUsuallyIs:
      "A clingy film from soaps and conditioners that reads differently than chunky soap scum—often on glass and tile.",
    bestMethods: "Rinse-first passes, then bath or glass maintenance lines that match label chemistry.",
    avoidMethods: "Attacking unknown stone with bathroom acids meant for tolerant porcelain.",
    relatedProblems: [rpRel("soap-scum", "Soap scum"), rpRel("hard-water-deposits", "Hard water deposits"), rpRel("cloudy-glass", "Cloudy glass")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Daily shower maintenance",
        body: "Daily sprays reduce film between deeper cleans—still read stone and coating rules.",
        productSlugs: ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      },
      {
        label: "Heavier bath film",
        body: "Foam bathroom cleaners when labels allow; ventilate and rinse.",
        productSlugs: ["scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner"],
      },
    ],
    productScenarios: [
      { problem: "white film", surface: "shower glass" },
      { problem: "soap scum", surface: "tile" },
    ],
  },

  "surface-streaking": {
    ...prob("surface-streaking", "Streaking (non-glass surfaces)", "residue"),
    whatItUsuallyIs:
      "Visible wipe trails from cleaner residue, wrong cloth friction, or too much product on glossy hard surfaces.",
    bestMethods: "Less chemistry, cleaner water, and fresh microfiber; finish with dry buff where safe.",
    avoidMethods: "Stacking fragranced all-purpose sprays on already-coated finishes.",
    relatedProblems: [rpRel("streaking-on-glass", "Streaking on glass"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    decisionShortcuts: [
      {
        label: "Countertops and cabinets",
        body: "pH-neutral maintenance lines with rinse discipline beat ‘more product’ for streak loops.",
        productSlugs: ["simple-green-all-purpose-cleaner", "seventh-generation-disinfecting-multi-surface-cleaner"],
      },
    ],
    productScenarios: [
      { problem: "streaking", surface: "laminate" },
      { problem: "streaking", surface: "quartz" },
    ],
  },

  "yellowing": {
    ...prob("yellowing", "Yellowing / discoloration", "physical_damage"),
    whatItUsuallyIs:
      "Aging polymers, heat history, or absorbed organics—sometimes maintenance, sometimes irreversible change.",
    bestMethods: "Identify material first (sealed stone vs plastic vs paint), then use label-correct brightening or accept replacement.",
    avoidMethods: "Bleach-forward guessing on unknown plastics or stone.",
    relatedProblems: [rpRel("oxidation", "Oxidation / tarnish"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    decisionShortcuts: [
      {
        label: "Sealed counters with mystery dullness",
        body: "Stone-rated dailies vs aggressive acids—misclassification is the common failure mode.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
    ],
    productScenarios: [
      { problem: "yellowing", surface: "laminate" },
      { problem: "discoloration", surface: "vinyl" },
    ],
  },

  "surface-haze": {
    ...prob("surface-haze", "Surface haze", "residue"),
    problemDefinitionLine:
      "A dull or greasy-looking film that reads as ‘fog’ or uneven sheen—often residue, minerals, or stacked cleaners rather than true abrasion.",
    executionQuickFix: {
      use: "Neutral or label-correct glass / hard-surface cleaner; rinse water for layered products.",
      do: "Dry dust or rinse loose soil → clean in one direction → fresh cloth dry buff → reassess before adding acid.",
      ifNeeded:
        "If haze survives neutral passes, separate mineral film from product film—misclassification drives the wrong chemistry.",
    },
    whyThisWorksShort:
      "Haze is usually removable film. Removing soil and old product in thin layers restores clarity without grinding the finish.",
    decisionShortcuts: [
      {
        label: "Glass and mirrors",
        body: "Two-cloth technique: wet clean + dry buff; streaks often mean cloth or product load, not ‘more spray.’",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
      {
        label: "Showers and glossy tile / quartz",
        body: "Daily maintenance sprays reduce film stacking; heavy acids are a last resort when labels allow.",
        productSlugs: ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      },
      {
        label: "Mineral or soap film suspected",
        body: "Acid-capable products only when the surface allows—stone and sealed finishes need label discipline.",
        productSlugs: ["clr-calcium-lime-rust", "granite-gold-daily-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "surface haze",
        surface: "shower glass",
        products: [
          { slug: "windex-original-glass-cleaner", name: "Windex Original Glass Cleaner" },
          { slug: "invisible-glass-premium-glass-cleaner", name: "Invisible Glass Premium Glass Cleaner" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      { problem: "surface haze", surface: "glass" },
      { problem: "surface haze", surface: "quartz" },
    ],
    relatedProblems: [
      rpRel("cloudy-glass", "Cloudy glass"),
      rpRel("product-residue-buildup", "Product residue buildup"),
      rpRel("streaking-on-glass", "Streaking on glass"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "product-residue-buildup": {
    ...prob("product-residue-buildup", "Product residue buildup", "residue"),
    problemDefinitionLine:
      "Cleaner, polish, or fragrance left behind in layers—sticky, streaky, or dull—often from too much product or incomplete rinse.",
    executionQuickFix: {
      use: "Plain water rinse + fresh microfiber; mild surfactant only if labels agree.",
      do: "Remove excess product → rinse → dry buff → repeat thin passes instead of stacking new chemistry.",
      ifNeeded:
        "If residue is baked on or wax-like, escalate to label-correct removers—never guess acids on stone or coatings.",
    },
    whyThisWorksShort:
      "Residue problems are removal problems. Dilution and rinse break the film so you are not smearing old product into new streaks.",
    decisionShortcuts: [
      {
        label: "Kitchen films on counters and appliances",
        body: "Degrease gently, then rinse—heavy fragrance cleaners often leave the most visible film.",
        productSlugs: ["dawn-platinum-dish-spray", "simple-green-all-purpose-cleaner"],
      },
      {
        label: "Daily stone or sealed tops",
        body: "Stone-rated dailies beat all-purpose stacking on sensitive finishes.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
      {
        label: "Floors that feel tacky after mopping",
        body: "Cut product ratio, change water often, and finish dry—tacky usually means leftover surfactant.",
        productSlugs: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "product residue",
        surface: "laminate",
        products: [
          { slug: "dawn-platinum-dish-spray", name: "Dawn Platinum EZ-Squeeze Dish Spray" },
          { slug: "simple-green-all-purpose-cleaner", name: "Simple Green All-Purpose Cleaner" },
          { slug: "granite-gold-daily-cleaner", name: "Granite Gold Daily Cleaner" },
        ],
      },
      { problem: "product residue", surface: "quartz" },
      { problem: "product residue", surface: "glass" },
    ],
    relatedProblems: [
      rpRel("surface-streaking", "Surface streaking"),
      rpRel("soap-film", "Soap film"),
      rpRel("surface-haze", "Surface haze"),
    ],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
  },
  "appliance-grime": {
    ...prob("appliance-grime", "Buildup on appliances", "oil_based"),
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("greasy-grime", "Greasy grime")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "surface-discoloration": {
    ...prob("surface-discoloration", "Discoloration on surfaces", "physical_damage"),
    relatedProblems: [rpRel("yellowing", "Yellowing"), rpRel("surface-dullness", "Surface dullness")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "discoloration", surface: "laminate" }],
  },
  "light-film-buildup": {
    ...prob("light-film-buildup", "Light film buildup", "residue"),
    relatedProblems: [rpRel("soap-film", "Soap film"), rpRel("water-spotting", "Water spotting")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "light film", surface: "shower glass" }],
  },
  "surface-dullness": {
    ...prob("surface-dullness", "Surface dullness", "physical_damage"),
    relatedProblems: [rpRel("uneven-finish", "Uneven finish"), rpRel("etching-on-finishes", "Etching on finishes")],
    relatedSurfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "dullness", surface: "granite" }],
  },
  "uneven-finish": {
    ...prob("uneven-finish", "Uneven finish", "physical_damage"),
    relatedProblems: [rpRel("surface-dullness", "Surface dullness"), rpRel("etching-on-finishes", "Etching on finishes")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "uneven finish", surface: "quartz" }],
  },
  "water-spotting": {
    ...prob("water-spotting", "Water spotting (evaporation film)", "mineral"),
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("limescale-buildup", "Limescale buildup")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    productScenarios: [{ problem: "hard water film", surface: "shower glass" }],
  },
  "limescale-buildup": {
    ...prob("limescale-buildup", "Limescale buildup", "mineral"),
    problemDefinitionLine:
      "Mineral scale left behind by hard water, usually bonding in layers on fixtures, glass, and tile.",
    executionQuickFix: {
      use: "Label-safe descaler or acid-based cleaner approved for the surface",
      do: "Apply → wait briefly → light scrub → rinse thoroughly",
      ifNeeded:
        "Repeat for buildup in layers. Avoid acids on natural stone and other acid-sensitive finishes.",
    },
    whyThisWorksShort:
      "Limescale is mineral-based. Compatible acids dissolve the deposit so it can be lifted and rinsed away.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("water-spotting", "Water spotting")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("grout", "Grout")],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [
      {
        problem: "remove limescale",
        surface: "fixtures",
        products: [
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "zep-calcium-lime-rust-remover", name: "Zep Calcium, Lime & Rust Remover" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      { problem: "limescale", surface: "tile" },
    ],
  },
  "greasy-grime": {
    ...prob("greasy-grime", "Greasy grime", "oil_based"),
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("appliance-grime", "Buildup on appliances")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "greasy film", surface: "tile" }],
  },
  "floor-residue-buildup": {
    ...prob("floor-residue-buildup", "Floor residue buildup", "residue"),
    relatedProblems: [rpRel("general-soil", "General soil"), rpRel("product-residue-buildup", "Product residue buildup")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    productScenarios: [{ problem: "floor residue", surface: "vinyl" }],
  },
  "scuff-marks": {
    ...prob("scuff-marks", "Scuff marks", "physical_damage"),
    relatedProblems: [rpRel("finish-scratches", "Finish scratches"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    productScenarios: [{ problem: "scuff marks", surface: "vinyl" }],
  },
  "finish-scratches": {
    ...prob("finish-scratches", "Finish scratches", "physical_damage"),
    relatedProblems: [rpRel("scuff-marks", "Scuff marks"), rpRel("etching-on-finishes", "Etching on finishes")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "scratches", surface: "laminate" }],
  },
  "etching-on-finishes": {
    ...prob("etching-on-finishes", "Etching on finishes", "physical_damage"),
    relatedProblems: [rpRel("surface-dullness", "Surface dullness"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "etching", surface: "marble" }],
  },
  "heat-damage-marks": {
    ...prob("heat-damage-marks", "Heat damage marks", "physical_damage"),
    relatedProblems: [rpRel("burnt-residue", "Burnt residue"), rpRel("surface-discoloration", "Discoloration on surfaces")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "heat damage", surface: "laminate" }],
  },
  "metal-tarnish": {
    ...prob("metal-tarnish", "Metal tarnish", "physical_damage"),
    relatedProblems: [rpRel("oxidation", "Oxidation / tarnish"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "tarnish", surface: "stainless steel" }],
  },
  "musty-odor": {
    ...prob("musty-odor", "Musty odor", "biological"),
    relatedProblems: [rpRel("odor-retention", "Odor retention"), rpRel("mold-growth", "Mold growth")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("grout", "Grout")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    productScenarios: [{ problem: "musty odor", surface: "tile" }],
  },
  "biofilm-buildup": {
    ...prob("biofilm-buildup", "Biofilm buildup", "biological"),
    relatedProblems: [rpRel("touchpoint-contamination", "Touchpoint contamination"), rpRel("mold-growth", "Mold growth")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    productScenarios: [{ problem: "biofilm", surface: "tile" }],
  },
  "organic-stains": {
    ...prob("organic-stains", "Organic stains", "organic"),
    relatedProblems: [rpRel("odor-retention", "Odor retention"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    productScenarios: [{ problem: "organic stains", surface: "carpet" }],
  },
  "laundry-odor": {
    ...prob("laundry-odor", "Laundry odor", "organic"),
    relatedProblems: [rpRel("odor-retention", "Odor retention"), rpRel("musty-odor", "Musty odor")],
    relatedSurfaces: [esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "laundry odor", surface: "laundry" }],
  },

  "residue-buildup": {
    ...prob("residue-buildup", "Residue buildup", "residue"),
    quickAnswer:
      "Residue buildup is usually spent cleaner or soil left in solution—it improves with less product, cleaner water, and a true finish pass before you change chemistry families.",
    whatItUsuallyIs: "Tacky, fast-re-soiling, or streaky surfaces after cleaning that looked fine mid-wipe.",
    relatedProblems: [rpRel("product-residue-buildup", "Product residue buildup"), rpRel("surface-streaking", "Surface streaking")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Counters and cabinets",
        body: "Neutral maintenance with rinse discipline; avoid stacking scented sprays.",
        productSlugs: ["simple-green-all-purpose-cleaner", "seventh-generation-disinfecting-multi-surface-cleaner"],
      },
    ],
    bestBySurfaceExtras: [
      { line: "Compare residue vs true etch on stone before acids.", href: "/problems/etching-on-finishes" },
    ],
    productScenarios: [{ problem: "product residue", surface: "laminate" }],
  },
  "film-buildup": {
    ...prob("film-buildup", "Film buildup", "residue"),
    quickAnswer:
      "Film buildup is a thin layer of soap, minerals, or polymers that changes how light reflects—fix it by naming film vs damage, then matching chemistry to the soil class.",
    whatItUsuallyIs: "Rainbow smears, foggy gloss, or ‘clean but dingy’ hard surfaces.",
    relatedProblems: [rpRel("light-film-buildup", "Light film buildup"), rpRel("soap-film", "Soap film")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    decisionShortcuts: [
      {
        label: "Shower glass",
        body: "Separate grease from mineral-soap film before picking acids.",
        productSlugs: ["windex-original-glass-cleaner", "method-daily-shower-spray"],
      },
    ],
    productScenarios: [{ problem: "light film", surface: "shower glass" }],
  },
  "grime-buildup": {
    ...prob("grime-buildup", "Grime buildup", "oil_based"),
    quickAnswer:
      "Grime is usually mixed dust and oil that polymerizes in corners—capture dry soil first, then use surfactant-forward chemistry where labels allow.",
    whatItUsuallyIs: "Dark lines along trim, sticky dust on cabinets, or textured soil that resists plain water.",
    relatedProblems: [rpRel("greasy-grime", "Greasy grime"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Kitchen cabinets",
        body: "Mild surfactant and frequent water changes beat heavy solvents near finishes.",
        productSlugs: ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "greasy film", surface: "laminate" }],
  },
  dullness: {
    ...prob("dullness", "Dullness", "physical_damage"),
    quickAnswer:
      "Dullness can be residue, wear, or etch—if aggressive chemistry made it worse, stop and treat it as finish risk, not ‘more scrubbing.’",
    whatItUsuallyIs: "Sheen loss on sealed stone, coated wood, or glossy synthetics.",
    relatedProblems: [rpRel("surface-dullness", "Surface dullness"), rpRel("uneven-finish", "Uneven finish")],
    relatedSurfaces: [esSurface("finished-wood", "Finished wood"), esSurface("granite-countertops", "Granite countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Sealed stone tops",
        body: "Stone-rated dailies before any restorative polish marketing.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
    ],
    productScenarios: [{ problem: "dullness", surface: "granite" }],
  },
  "water-spots": {
    ...prob("water-spots", "Water spots", "mineral"),
    problemDefinitionLine:
      "Mineral rings after water dries on glass, chrome, or glossy tile—light film vs bonded scale need different chemistry.",
    executionQuickFix: {
      use: "Glass cleaner or damp microfiber for light spots; label-approved descaler only where acids are explicitly allowed.",
      do: "Wet wipe → dry buff → if haze remains, short dwell with compatible chemistry → rinse thoroughly.",
      ifNeeded:
        "Do not guess acids on stone or coated finishes. If the surface etches or dulls, stop—treat as damage, not more scrubbing.",
    },
    whyThisWorksShort:
      "Spots are minerals left on the surface. The right cleaner lifts or dissolves that film on tolerant materials; wrong surfaces need non-acid lanes.",
    quickAnswer:
      "Water spots are minerals left after evaporation—mild spots lift with glass maintenance; bonded scale needs label-approved descalers on tolerant surfaces only.",
    whatItUsuallyIs: "Round marks on glass, chrome, or glossy tile after drying.",
    relatedProblems: [rpRel("water-spotting", "Water spotting"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    decisionShortcuts: [
      {
        label: "Fixture spotting",
        body: "Try glass-forward maintenance before acid-class bathroom sprays.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
      {
        label: "Bonded scale",
        body: "Acid descalers only where labels explicitly allow—never guess on stone.",
        productSlugs: ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
      },
    ],
    productScenarios: [{ problem: "hard water film", surface: "shower glass" }],
  },
  "mineral-film": {
    ...prob("mineral-film", "Mineral film", "mineral"),
    quickAnswer:
      "Mineral film is dissolved hardness redeposited as it dries—neutral cleaners maintain; acids remove only when the surface class is explicitly compatible.",
    whatItUsuallyIs: "Hazy sheen on glass and tile that returns quickly after wipes.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("limescale-buildup", "Limescale buildup")],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass"),
      esSurface("tile", "Tile"),
      esSurface("grout", "Grout"),
    ],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Shower glass",
        body: "Stage from glass cleaner to acid only if film persists and labels allow.",
        productSlugs: ["windex-original-glass-cleaner", "clr-calcium-lime-rust"],
      },
    ],
    productScenarios: [{ problem: "hard water stains", surface: "shower glass" }],
  },
  "sticky-film": {
    ...prob("sticky-film", "Sticky film", "residue"),
    problemDefinitionLine:
      "Tacky, dust-grabbing film on counters and edges—often sugar, soap, or adhesive residue, not ordinary dust.",
    executionQuickFix: {
      use: "Neutral all-purpose or surfactant cleaner; mild citrus or label-safe solvent if it behaves like adhesive.",
      do: "Dwell briefly → wipe with a clean cloth → rinse or dry buff. Warm (not hot) water can help sugary films.",
      ifNeeded:
        "Persistent gum: use adhesive-style remover with ventilation and spot tests on paint, stone, and plastics.",
    },
    whyThisWorksShort:
      "Surfactants break oily and sugary films; solvents soften adhesive-style tack so it lifts instead of smearing into the finish.",
    quickAnswer:
      "Sticky film is often sugar, soap, or adhesive plasticizers—pick solvent or surfactant lane based on whether it gums when warm or smears when wet.",
    whatItUsuallyIs: "Tack that grabs dust; common near handles, edges, and plastics.",
    relatedProblems: [rpRel("adhesive-residue", "Adhesive residue"), rpRel("stuck-on-residue", "Stuck-on residue")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    productScenarios: [{ problem: "sticky residue", surface: "laminate" }],
  },
  "kitchen-grease-film": {
    ...prob("kitchen-grease-film", "Kitchen grease film", "oil_based"),
    quickAnswer:
      "Kitchen grease film is airborne lipid that settles on fronts and cabinets—degrease with ventilation, then avoid turning polishes into your only soil removal step.",
    whatItUsuallyIs: "Yellowing tack near the range, matte fingerprints that return fast, or haze that smears under heat.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("appliance-grime", "Buildup on appliances")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Hood and adjacent cabinets",
        body: "Kitchen degreaser class with rinse; keep oven chemistry away from painted surfaces.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "easy-off-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "bathroom-buildup": {
    ...prob("bathroom-buildup", "Bathroom buildup", "residue"),
    problemDefinitionLine:
      "Layered soap, minerals, and biofilm in wet zones—corners, grout, and glass dingy before open tile fields look obviously dirty.",
    executionQuickFix: {
      use: "Bathroom cleaner or foam spray labeled for tile and glass; daily shower spray for lighter maintenance passes.",
      do: "Ventilate → spray → dwell per label → scrub corners and grout lines → rinse thoroughly.",
      ifNeeded:
        "Step up between deep cleans with daily spray; spot-test stone, coatings, and delicate finishes before stronger chemistry.",
    },
    whyThisWorksShort:
      "Buildup is staged residue in water paths. Dwell plus rinse breaks the film; wiping only tile fields misses where soil actually bonds.",
    quickAnswer:
      "Bathroom buildup is usually soap + mineral complexes plus biofilm in corners—ventilate, stage chemistry, and detail grout lines instead of only wiping tile fields.",
    whatItUsuallyIs: "Dingy corners, pink or gray films, and texture change along caulk.",
    relatedProblems: [rpRel("soap-scum", "Soap scum"), rpRel("biofilm-buildup", "Biofilm buildup")],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass"),
      esSurface("tile", "Tile"),
      esSurface("grout", "Grout"),
    ],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    decisionShortcuts: [
      {
        label: "Daily maintenance",
        body: "Daily sprays reduce bonding between deep cleans.",
        productSlugs: ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      },
    ],
    productScenarios: [{ problem: "soap scum", surface: "tile" }],
  },
  "appliance-buildup": {
    ...prob("appliance-buildup", "Appliance buildup", "oil_based"),
    quickAnswer:
      "Appliance buildup combines touch oils, cooking aerosols, and cleaner residue—match stainless vs painted panels and separate degrease from cosmetic polish passes.",
    whatItUsuallyIs: "Finger waves, vertical drip lines, and tacky bands along handles.",
    relatedProblems: [rpRel("appliance-grime", "Buildup on appliances"), rpRel("smudge-marks", "Smudge marks")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Stainless fronts",
        body: "Degrease first when soil is heavy; polish last when labels allow.",
        productSlugs: ["weiman-stainless-steel-cleaner-polish", "dawn-platinum-dish-spray"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "countertop-residue": {
    ...prob("countertop-residue", "Countertop residue", "residue"),
    quickAnswer:
      "Countertop residue is usually too much daily cleaner or mixed incompatible sprays—reset with neutral rinse passes before assuming the seal failed.",
    whatItUsuallyIs: "Streaks, tack, or fog on quartz and laminate that worsens under raking light.",
    relatedProblems: [rpRel("product-residue-buildup", "Product residue buildup"), rpRel("surface-streaking", "Surface streaking")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "product residue", surface: "quartz" }],
  },
  "floor-buildup": {
    ...prob("floor-buildup", "Floor buildup", "residue"),
    quickAnswer:
      "Floor buildup is mop redeposit and over-concentrate—fix dilution, water changes, and dry passes before buying a new ‘shine’ product.",
    whatItUsuallyIs: "Dull lanes, footprints that return in hours, or tacky vinyl.",
    relatedProblems: [rpRel("floor-residue-buildup", "Floor residue buildup"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Resilient hard floors",
        body: "Neutral pH floor lines with frequent rinse water.",
        productSlugs: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      },
    ],
    productScenarios: [{ problem: "floor residue", surface: "vinyl" }],
  },
  "mirror-haze": {
    ...prob("mirror-haze", "Mirror haze", "residue"),
    quickAnswer:
      "Mirror haze is usually residue or coating failure on the reflective stack—try glass technique first; replace or service when etch lives in the glass itself.",
    whatItUsuallyIs: "Foggy reflection that survives cleaning or returns in patches.",
    relatedProblems: [rpRel("surface-haze", "Surface haze"), rpRel("streaking-on-glass", "Streaking on glass")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning")],
    productScenarios: [{ problem: "surface haze", surface: "glass" }],
  },
  "chrome-water-spots": {
    ...prob("chrome-water-spots", "Chrome water spots", "mineral"),
    quickAnswer:
      "Chrome water spots are evaporated minerals on plated metal—gentle acids help only when labels allow; pitting means stop and reassess.",
    whatItUsuallyIs: "Speckled or cloudy fixtures after drying hard water.",
    relatedProblems: [rpRel("water-spotting", "Water spotting"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    productScenarios: [{ problem: "hard water film", surface: "stainless steel" }],
  },
  "plastic-yellowing": {
    ...prob("plastic-yellowing", "Plastic yellowing", "physical_damage"),
    quickAnswer:
      "Plastic yellowing is often UV or heat aging—not always removable soil—test small areas before aggressive oxidizers.",
    whatItUsuallyIs: "Uniform yellow shift on appliance handles, switch plates, or vinyl edges.",
    relatedProblems: [rpRel("yellowing", "Yellowing"), rpRel("surface-discoloration", "Discoloration on surfaces")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "yellowing", surface: "laminate" }],
  },
  "cabinet-grime": {
    ...prob("cabinet-grime", "Cabinet grime", "oil_based"),
    quickAnswer:
      "Cabinet grime is aerosolized grease plus dust on vertical paint or laminate—work top-down with mild surfactant and dry buff to protect edges.",
    whatItUsuallyIs: "Darkening near hardware and sticky dust on rails.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("grime-buildup", "Grime buildup")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Painted cabinet faces",
        body: "Avoid oven and heavy solvent overspray; kitchen degreasers only with label checks.",
        productSlugs: ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "laminate" }],
  },
  "glass-cloudiness": {
    ...prob("glass-cloudiness", "Glass cloudiness", "residue"),
    quickAnswer:
      "Glass cloudiness splits into removable film vs permanent etch or failed coating—if acid and surfactant lanes both fail evenly, assume damage not ‘dirt.’",
    whatItUsuallyIs: "Uniform milkiness that survives multiple cleaning styles.",
    relatedProblems: [rpRel("cloudy-glass", "Cloudy glass"), rpRel("surface-haze", "Surface haze")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "cloudy film", surface: "shower glass" }],
  },
  "exhaust-hood-film": {
    ...prob("exhaust-hood-film", "Exhaust hood film", "oil_based"),
    quickAnswer:
      "Hood film is concentrated lipid aerosol—ventilate, use labeled kitchen degreasers, and keep caustic oven chemistry away from painted adjacent cabinets.",
    whatItUsuallyIs: "Thick tack on mesh filters and satin stainless that smears when hot.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("kitchen-grease-film", "Kitchen grease film")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("degreasing", "Degreasing")],
    decisionShortcuts: [
      {
        label: "Filters and baffles",
        body: "Soak-and-rinse beats spraying hot surfaces blindly.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "easy-off-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "sink-ring-stains": {
    ...prob("sink-ring-stains", "Sink ring stains", "mineral"),
    quickAnswer:
      "Sink rings are mineral and soap complexes at the water line—gentle acids or descalers win on tolerant porcelain; stone sinks need different lanes.",
    whatItUsuallyIs: "Brown or white bands where water sits longest.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("soap-scum", "Soap scum")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "hard water stains", surface: "stainless steel" }],
  },
};

export function getProblemPageBySlug(slug: string): AuthorityProblemPageData | undefined {
  const base = PROBLEMS[slug];
  if (!base) return undefined;
  return applyCoreProblemTone(slug, base);
}

export function getAllProblemPages(): AuthorityProblemPageData[] {
  return AUTHORITY_PROBLEM_SLUGS.map((s) => {
    const base = PROBLEMS[s];
    return applyCoreProblemTone(s, base);
  });
}

export function problemSlugExists(slug: string): boolean {
  return AUTHORITY_PROBLEM_SLUGS.includes(slug as AuthorityProblemSlug);
}
