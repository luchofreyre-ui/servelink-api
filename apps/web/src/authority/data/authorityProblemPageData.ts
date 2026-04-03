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
    summary: "Soap scum is one of the most common—and most misidentified—bathroom problems.",
    heroSubline:
      "Most cases are removable with the right method. The key is knowing what you're actually dealing with before you clean.",
    whatItUsuallyIs:
      "Soap scum is a surface film made from soap residue, minerals in water, and body oils.\n\nIt builds up in layers and can look like staining or damage, especially on grout, tile, and glass.",
    whyItHappens:
      "It forms in areas that stay damp and don't get fully rinsed.\n\nOver time, residue layers combine with minerals in the water, creating a film that becomes harder to remove the longer it sits.",
    commonOn:
      "Showers, grout lines, glass, and any surface that regularly stays wet.\n\nHigh-use areas build it faster, especially where airflow is limited.",
    beforeYouClean:
      "Most people go too aggressive too early.\n\nSoap scum is usually removable, but using the wrong method can make it worse or cause surface damage.\n\nStart neutral, test first, and only escalate if needed.",
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
  },
  "hard-water-deposits": {
    ...prob("hard-water-deposits", "Hard water deposits", "mineral"),
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
  },
  "dust-buildup": prob("dust-buildup", "Dust buildup", "organic"),
  "fingerprints-and-smudges": prob("fingerprints-and-smudges", "Fingerprints and smudges", "transfer"),
  "stuck-on-residue": prob("stuck-on-residue", "Stuck-on residue", "residue"),
  "light-mildew": prob("light-mildew", "Light mildew appearance", "biological"),
  "streaking-on-glass": prob("streaking-on-glass", "Streaking on glass", "residue"),
  "general-soil": prob("general-soil", "General soil", "organic"),
  "touchpoint-contamination": prob("touchpoint-contamination", "Touchpoint contamination", "biological"),

  "adhesive-residue": {
    ...prob("adhesive-residue", "Adhesive residue", "residue"),
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
      { problem: "odor retention", surface: "carpet" },
      { problem: "odor retention", surface: "laundry" },
      { problem: "odor retention", surface: "garbage cans" },
    ],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },

  "mold-growth": {
    ...prob("mold-growth", "Mold growth", "biological"),
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
      { problem: "cloudy film", surface: "shower glass" },
      { problem: "cloudy film", surface: "glass" },
    ],
  },

  "cooked-on-grease": {
    ...prob("cooked-on-grease", "Cooked-on grease", "oil_based"),
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
      { problem: "smudge marks", surface: "laminate" },
      { problem: "smudge marks", surface: "stainless steel" },
    ],
  },

  "soap-film": {
    ...prob("soap-film", "Soap film (light mineral + surfactant haze)", "residue"),
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
    relatedProblems: [rpRel("cloudy-glass", "Cloudy glass"), rpRel("product-residue-buildup", "Product residue buildup")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [
      { problem: "surface haze", surface: "shower glass" },
      { problem: "surface haze", surface: "glass" },
    ],
  },
  "product-residue-buildup": {
    ...prob("product-residue-buildup", "Product residue buildup", "residue"),
    relatedProblems: [rpRel("surface-streaking", "Surface streaking"), rpRel("soap-film", "Soap film")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    productScenarios: [{ problem: "product residue", surface: "laminate" }],
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
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("water-spotting", "Water spotting")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("grout", "Grout")],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "limescale", surface: "tile" }],
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
