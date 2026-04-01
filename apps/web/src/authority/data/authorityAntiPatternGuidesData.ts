import type { AuthorityEntitySummary, AuthorityGuideLinkGroupResolved, AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { ANTI_PATTERN_GUIDES_VOLUME2_BY_SLUG } from "@/authority/data/authorityAntiPatternGuidesVolume2";
import { ANTI_PATTERN_GUIDES_VOLUME3_BY_SLUG } from "@/authority/data/authorityAntiPatternGuidesVolume3";

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;
const PR = (slug: string) => `/products/${slug}`;
const CP = (comparisonSlug: string) => `/compare/products/${comparisonSlug}`;

function esMethod(slug: string, title: string): AuthorityEntitySummary {
  return { slug, title, href: M(slug), kind: "method" };
}
function esSurface(slug: string, title: string): AuthorityEntitySummary {
  return { slug, title, href: S(slug), kind: "surface" };
}
function rp(slug: string, title: string): AuthorityEntitySummary {
  return { slug, title, href: P(slug), kind: "problem" };
}
function humanizeSlugPart(slug: string): string {
  return slug
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function cmp(slug: string): AuthorityEntitySummary {
  const sep = "-vs-";
  const i = slug.indexOf(sep);
  const leftSlug = i === -1 ? slug : slug.slice(0, i);
  const rightSlug = i === -1 ? "" : slug.slice(i + sep.length);
  const leftName = getProductBySlug(leftSlug)?.name ?? humanizeSlugPart(leftSlug);
  const rightName = rightSlug ? (getProductBySlug(rightSlug)?.name ?? humanizeSlugPart(rightSlug)) : "";
  return {
    slug,
    title: rightSlug ? `${leftName} vs ${rightName}` : humanizeSlugPart(slug),
    href: CP(slug),
    kind: "guide",
  };
}

const ANTI_PATTERN_GUIDES_BASE_BY_SLUG: Record<string, AuthorityGuidePageData> = {
  "why-vinegar-doesnt-remove-grease": {
    slug: "why-vinegar-doesnt-remove-grease",
    title: "Why vinegar doesn’t remove grease",
    category: "anti_pattern",
    summary: "Vinegar is weak acid and surfactant-poor—great for some films, wrong default for kitchen lipid soils.",
    description: "Why vinegar fails on grease, what to use instead, and where to go in the authority graph.",
    intro:
      "Grease is oil-based. Vinegar does not emulsify lipids the way surfactant-forward chemistry does. It can look like it’s “doing something” while mostly pushing grease around or leaving an acidic film.",
    sections: [
      {
        id: "why-fails",
        title: "Why it fails",
        paragraphs: [
          "Kitchen grease bonds with surfactants and rinse water in a way mild acid alone does not replicate.",
          "Heat-set or polymerized films need mechanical help and the right alkaline or formulated degreaser—not a pantry shortcut.",
        ],
      },
      {
        id: "what-works",
        title: "What actually works",
        paragraphs: [
          "Match lipid soils to degreasing methods and surfactant-forward products, then control residue with rinse passes.",
        ],
        bulletPoints: [
          "Start with the grease problem hub, then pick a surface playbook.",
          "Escalate to labeled degreasers only when the surface allows it.",
        ],
      },
    ],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("stuck-on-residue", "Stuck-on residue")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("soap-film", "Soap film")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("dawn-platinum-dish-spray-vs-krud-kutter-kitchen-degreaser"),
          cmp("krud-kutter-kitchen-degreaser-vs-weiman-gas-range-cleaner-degreaser"),
          cmp("cerama-bryte-cooktop-cleaner-vs-weiman-gas-range-cleaner-degreaser"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "dawn-platinum-dish-spray", title: "Dawn Platinum EZ-Squeeze", href: PR("dawn-platinum-dish-spray"), kind: "guide" },
          { slug: "krud-kutter-kitchen-degreaser", title: "Krud Kutter Kitchen Degreaser", href: PR("krud-kutter-kitchen-degreaser"), kind: "guide" },
          { slug: "weiman-gas-range-cleaner-degreaser", title: "Weiman Gas Range Cleaner", href: PR("weiman-gas-range-cleaner-degreaser"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-dish-soap-fails-on-hard-water-stains": {
    slug: "why-dish-soap-fails-on-hard-water-stains",
    title: "Why dish soap fails on hard water stains",
    category: "anti_pattern",
    summary: "Dish soap lifts oils; mineral bonding needs acid-safe descaling chemistry on tolerant surfaces.",
    description: "Why surfactants stall on mineral film and how to route to hard-water playbooks.",
    intro:
      "Hard water stains are mineral-dominated. Dish soap can clean adjacent oils but does not reliably dissolve calcium-dominated bonding. You often get suds, effort, and a still-spotted finish.",
    sections: [
      {
        id: "why-fails",
        title: "Why it fails",
        paragraphs: [
          "Mineral film is not primarily lipid soil. Surfactants may improve rinse of *other* residues but won’t replace a descaler where the label allows it.",
        ],
      },
      {
        id: "what-works",
        title: "What actually works",
        paragraphs: [
          "Identify the surface first, then use hard-water deposit removal on label-safe materials—or stone-rated maintenance where acids are off-label.",
        ],
      },
    ],
    relatedMethods: [
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("glass-cleaning", "Glass cleaning"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile"), esSurface("stainless-steel", "Stainless steel")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("cloudy-glass", "Cloudy glass"), rp("soap-scum", "Soap scum")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("hard-water-deposits", "Hard water deposits"), rp("cloudy-glass", "Cloudy glass"), rp("soap-film", "Soap film")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("clr-calcium-lime-rust-vs-lime-a-way-cleaner"),
          cmp("clr-calcium-lime-rust-vs-zep-calcium-lime-rust-remover"),
          cmp("windex-original-glass-cleaner-vs-invisible-glass-premium-glass-cleaner"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "clr-calcium-lime-rust", title: "CLR Calcium, Lime & Rust", href: PR("clr-calcium-lime-rust"), kind: "guide" },
          { slug: "lime-a-way-cleaner", title: "Lime-A-Way", href: PR("lime-a-way-cleaner"), kind: "guide" },
          { slug: "windex-original-glass-cleaner", title: "Windex Original", href: PR("windex-original-glass-cleaner"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-disinfectants-dont-clean-surfaces": {
    slug: "why-disinfectants-dont-clean-surfaces",
    title: "Why disinfectants don’t clean surfaces",
    category: "anti_pattern",
    summary: "Disinfection is a kill step; soil removal still needs surfactants, rinse, and often a separate clean pass.",
    description: "Separate “clean” from “disinfect” and link to the right hubs.",
    intro:
      "A disinfectant can reduce organisms when used per label contact time, but heavy soil shields surfaces and blocks consistent contact. Cleaning and disinfection are related workflows—not the same single spray.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Soil consumes product, blocks contact time, and hides whether the surface is truly ready to disinfect."] },
      {
        id: "what-works",
        title: "What actually works",
        paragraphs: ["Remove loose soil, then disinfect on a visibly clean surface when the label allows that sequence."],
      },
    ],
    relatedMethods: [
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("general-soil", "General soil"), rp("odor-retention", "Odor retention")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("general-soil", "General soil"), rp("mold-growth", "Mold growth")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("lysol-disinfectant-spray-vs-microban-24-hour-disinfectant-sanitizing-spray"),
          cmp("lysol-disinfectant-spray-vs-odoban-disinfectant-odor-eliminator"),
          cmp("clorox-clean-up-cleaner-bleach-vs-seventh-generation-disinfecting-multi-surface-cleaner"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "lysol-disinfectant-spray", title: "Lysol Disinfectant Spray", href: PR("lysol-disinfectant-spray"), kind: "guide" },
          { slug: "microban-24-hour-disinfectant-sanitizing-spray", title: "Microban 24", href: PR("microban-24-hour-disinfectant-sanitizing-spray"), kind: "guide" },
          { slug: "pine-sol-original-multi-surface-cleaner", title: "Pine-Sol Original", href: PR("pine-sol-original-multi-surface-cleaner"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-bleach-isnt-a-universal-cleaner": {
    slug: "why-bleach-isnt-a-universal-cleaner",
    title: "Why bleach isn’t a universal cleaner",
    category: "anti_pattern",
    summary: "Bleach is a strong oxidizer with narrow compatibility—great for some disinfection, wrong default for grease, stone, and many mixes.",
    description: "Why bleach fails as an all-surface cleaner and safer routing.",
    intro:
      "Bleach can be appropriate for specific labeled workflows, but it is not a universal degreaser, descaler, or odor chemistry. Mixing hazards and finish damage risk rise quickly when bleach becomes the default.",
    sections: [
      {
        id: "why-fails",
        title: "Why it fails",
        paragraphs: [
          "Bleach does not replace surfactant cleaning for oils, and it is incompatible with acids and many other common cleaners.",
        ],
      },
      { id: "what-works", title: "What actually works", paragraphs: ["Pick the problem type first: grease vs mineral vs biological vs residue."] },
    ],
    relatedMethods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("painted-walls", "Painted walls"), esSurface("granite-countertops", "Granite countertops")],
    relatedProblems: [rp("mold-growth", "Mold growth"), rp("touchpoint-contamination", "Touchpoint contamination"), rp("grease-buildup", "Grease buildup")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("mold-growth", "Mold growth"), rp("touchpoint-contamination", "Touchpoint contamination"), rp("yellowing", "Yellowing")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("lysol-disinfectant-spray-vs-microban-24-hour-disinfectant-sanitizing-spray"),
          cmp("microban-24-hour-disinfectant-sanitizing-spray-vs-odoban-disinfectant-odor-eliminator"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "clorox-clean-up-cleaner-bleach", title: "Clorox Clean-Up + Bleach", href: PR("clorox-clean-up-cleaner-bleach"), kind: "guide" },
          { slug: "lysol-disinfectant-spray", title: "Lysol Disinfectant Spray", href: PR("lysol-disinfectant-spray"), kind: "guide" },
          { slug: "oxiclean-versatile-stain-remover", title: "OxiClean Versatile", href: PR("oxiclean-versatile-stain-remover"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-glass-cleaners-dont-work-on-grease": {
    slug: "why-glass-cleaners-dont-work-on-grease",
    title: "Why glass cleaners don’t work on grease",
    category: "anti_pattern",
    summary: "Glass cleaners optimize clarity films—not hood-level lipids. Grease needs surfactant load and rinse discipline.",
    description: "Route glass clarity jobs vs kitchen grease jobs correctly.",
    intro:
      "Glass cleaners are built for streaking, light dust, and some films. Kitchen grease on glass adjacent to cooking zones is closer to a degreasing job than a clarity pass.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Low surfactant packages smear lipids and can create haze when grease load is high."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Degrease with a labeled kitchen workflow, then finish with glass technique if needed."] },
    ],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("degreasing", "Degreasing")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("streaking-on-glass", "Streaking on glass"), rp("surface-streaking", "Surface streaking")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("grease-buildup", "Grease buildup"), rp("streaking-on-glass", "Streaking on glass"), rp("fingerprints-and-smudges", "Fingerprints and smudges")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("windex-original-glass-cleaner-vs-sprayway-glass-cleaner"),
          cmp("invisible-glass-premium-glass-cleaner-vs-windex-original-glass-cleaner"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "windex-original-glass-cleaner", title: "Windex Original", href: PR("windex-original-glass-cleaner"), kind: "guide" },
          { slug: "krud-kutter-kitchen-degreaser", title: "Krud Kutter Kitchen", href: PR("krud-kutter-kitchen-degreaser"), kind: "guide" },
          { slug: "dawn-platinum-dish-spray", title: "Dawn Platinum", href: PR("dawn-platinum-dish-spray"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-degreasers-dont-remove-limescale": {
    slug: "why-degreasers-dont-remove-limescale",
    title: "Why degreasers don’t remove limescale",
    category: "anti_pattern",
    summary: "Limescale is mineral-bonded; alkaline degreasers won’t replace acid-safe descaling where allowed.",
    description: "Stop fighting calcium with the wrong chemistry class.",
    intro:
      "Degreasers target oils and some organic films. Limescale is predominantly mineral. You can scrub harder and only damage the finish while the crystal structure remains.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Chemistry class mismatch: oils vs mineral deposits."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Hard-water deposit removal on tolerant surfaces, with stone-safe routing where needed."] },
    ],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile"), esSurface("stainless-steel", "Stainless steel")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("cloudy-glass", "Cloudy glass")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("soap-film", "Soap film")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("clr-calcium-lime-rust-vs-zep-calcium-lime-rust-remover"),
          cmp("clr-calcium-lime-rust-vs-lime-a-way-cleaner"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "clr-calcium-lime-rust", title: "CLR", href: PR("clr-calcium-lime-rust"), kind: "guide" },
          { slug: "lime-a-way-cleaner", title: "Lime-A-Way", href: PR("lime-a-way-cleaner"), kind: "guide" },
          { slug: "zep-calcium-lime-rust-remover", title: "Zep CLR", href: PR("zep-calcium-lime-rust-remover"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-all-purpose-cleaners-leave-residue": {
    slug: "why-all-purpose-cleaners-leave-residue",
    title: "Why all-purpose cleaners leave residue",
    category: "anti_pattern",
    summary: "Multi-surface formulas trade off rinse profile; too much product + weak rinse = haze and re-soil.",
    description: "Residue control beats more squirts.",
    intro:
      "All-purpose cleaners are compromises. On glossy finishes and floors, the failure mode is often leftover surfactant film—not lack of effort.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Over-wetting, insufficient rinse passes, and wrong dilution create sticky or streaky films."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Neutral maintenance, correct dilution, and finish-appropriate chemistry."] },
    ],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: [rp("general-soil", "General soil"), rp("stuck-on-residue", "Stuck-on residue"), rp("surface-streaking", "Surface streaking")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("general-soil", "General soil"), rp("stuck-on-residue", "Stuck-on residue"), rp("dust-buildup", "Dust buildup")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("bona-hard-surface-floor-cleaner-vs-zep-neutral-ph-floor-cleaner"),
          cmp("pledge-multisurface-cleaner-vs-method-wood-for-good-daily-clean"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "bona-hard-surface-floor-cleaner", title: "Bona Hard-Surface", href: PR("bona-hard-surface-floor-cleaner"), kind: "guide" },
          { slug: "zep-neutral-ph-floor-cleaner", title: "Zep Neutral pH Floor", href: PR("zep-neutral-ph-floor-cleaner"), kind: "guide" },
          { slug: "pine-sol-original-multi-surface-cleaner", title: "Pine-Sol Original", href: PR("pine-sol-original-multi-surface-cleaner"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-baking-soda-scratches-certain-surfaces": {
    slug: "why-baking-soda-scratches-certain-surfaces",
    title: "Why baking soda scratches certain surfaces",
    category: "anti_pattern",
    summary: "Baking soda is abrasive in practice; glossy plastics, soft coatings, and polished metal can dull.",
    description: "Separate mechanical abrasion risk from “natural = safe.”",
    intro:
      "People under-rate mechanical action. Even mild abrasives can create micro-scratches that show as haze—especially on glossy plastics, coated glass, and polished metal.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Abrasion removes soil and finish at the same time when pressure and particle size stack."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Use non-scratch tools, test patches, and chemistry matched to soil type."] },
    ],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate"), esSurface("stainless-steel", "Stainless steel")],
    relatedProblems: [rp("stuck-on-residue", "Stuck-on residue"), rp("smudge-marks", "Smudge marks"), rp("general-soil", "General soil")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("stuck-on-residue", "Stuck-on residue"), rp("soap-scum", "Soap scum"), rp("hard-water-deposits", "Hard water deposits")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("cerama-bryte-cooktop-cleaner-vs-weiman-gas-range-cleaner-degreaser"),
          cmp("therapy-stainless-steel-cleaner-polish-vs-weiman-stainless-steel-cleaner-polish"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "bar-keepers-friend-cleanser", title: "Bar Keepers Friend", href: PR("bar-keepers-friend-cleanser"), kind: "guide" },
          { slug: "cerama-bryte-cooktop-cleaner", title: "Cerama Bryte", href: PR("cerama-bryte-cooktop-cleaner"), kind: "guide" },
          { slug: "weiman-stainless-steel-cleaner-polish", title: "Weiman Stainless", href: PR("weiman-stainless-steel-cleaner-polish"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-using-too-much-cleaner-makes-things-worse": {
    slug: "why-using-too-much-cleaner-makes-things-worse",
    title: "Why using too much cleaner makes things worse",
    category: "anti_pattern",
    summary: "More product increases film, streak risk, and slip hazards—without increasing soil removal.",
    description: "Dilution and rinse discipline beat brute force.",
    intro:
      "Soil removal is bounded by chemistry contact, agitation, and rinse. Excess cleaner mostly increases residue that becomes the next cleaning problem.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Residue attracts dust, creates haze, and can damage finishes over repeated buildup."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Label dilution, fresh water passes, and dry-to-inspect between attempts."] },
    ],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass")],
    relatedProblems: [rp("stuck-on-residue", "Stuck-on residue"), rp("surface-streaking", "Surface streaking"), rp("soap-film", "Soap film")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("stuck-on-residue", "Stuck-on residue"), rp("surface-streaking", "Surface streaking"), rp("soap-film", "Soap film")],
      },
      {
        title: "Product comparisons",
        links: [cmp("bona-hard-surface-floor-cleaner-vs-rejuvenate-luxury-vinyl-floor-cleaner")],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "bona-hard-surface-floor-cleaner", title: "Bona Hard-Surface", href: PR("bona-hard-surface-floor-cleaner"), kind: "guide" },
          { slug: "method-daily-shower-spray", title: "Method Daily Shower", href: PR("method-daily-shower-spray"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-natural-cleaners-dont-always-work": {
    slug: "why-natural-cleaners-dont-always-work",
    title: "Why “natural cleaners” don’t always work",
    category: "anti_pattern",
    summary: "Natural is not a soil class. Biology, minerals, and films still need matched chemistry and technique.",
    description: "Avoid moral framing when the failure mode is chemistry mismatch.",
    intro:
      "Marketing language is not a compatibility matrix. A product can be mild and still wrong for mineral scale, heavy grease, or embedded biological soil.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Soil type beats brand story. Mild products can fail without being “weak people.”"] },
      { id: "what-works", title: "What actually works", paragraphs: ["Identify soil, pick method family, then choose labeled products inside that lane."] },
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("degreasing", "Degreasing"),
    ],
    relatedSurfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("tile", "Tile"), esSurface("finished-wood", "Finished wood")],
    relatedProblems: [rp("general-soil", "General soil"), rp("hard-water-deposits", "Hard water deposits"), rp("grease-buildup", "Grease buildup")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("general-soil", "General soil"), rp("hard-water-deposits", "Hard water deposits"), rp("odor-retention", "Odor retention")],
      },
      {
        title: "Product comparisons",
        links: [cmp("method-daily-shower-spray-vs-tilex-daily-shower-cleaner")],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "method-daily-shower-spray", title: "Method Daily Shower", href: PR("method-daily-shower-spray"), kind: "guide" },
          { slug: "seventh-generation-disinfecting-multi-surface-cleaner", title: "Seventh Gen Disinfecting", href: PR("seventh-generation-disinfecting-multi-surface-cleaner"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-you-shouldnt-mix-cleaners": {
    slug: "why-you-shouldnt-mix-cleaners",
    title: "Why you shouldn’t mix cleaners",
    category: "anti_pattern",
    summary: "Mixing creates toxic gas risk, neutralizes chemistry, and voids label safety assumptions.",
    description: "One product, one workflow, full ventilation.",
    intro:
      "Cleaning chemistry is formulated as a closed system. Mixing breaks pH control, surfactant balance, and safety testing. The failure mode can be immediate (fumes) or delayed (finish damage).",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Unpredictable reactions, inhalation hazards, and ruined surfaces."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Rinse between different chemistry families, ventilate, and follow one label at a time."] },
    ],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("painted-walls", "Painted walls")],
    relatedProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("general-soil", "General soil")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("mold-growth", "Mold growth")],
      },
      {
        title: "Guides",
        links: [
          { slug: "chemical-usage-and-safety", title: "Chemical usage and safety", href: "/guides/chemical-usage-and-safety", kind: "guide" },
        ],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("lysol-disinfectant-spray-vs-microban-24-hour-disinfectant-sanitizing-spray"),
          cmp("lysol-disinfectant-spray-vs-odoban-disinfectant-odor-eliminator"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "clorox-clean-up-cleaner-bleach", title: "Clorox Clean-Up", href: PR("clorox-clean-up-cleaner-bleach"), kind: "guide" },
          { slug: "lysol-disinfectant-spray", title: "Lysol Spray", href: PR("lysol-disinfectant-spray"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-odor-sprays-dont-remove-odors": {
    slug: "why-odor-sprays-dont-remove-odors",
    title: "Why odor sprays don’t remove odors",
    category: "anti_pattern",
    summary: "Many sprays mask or bind lightly; source removal + right chemistry class wins persistent odor.",
    description: "Separate fragrance from elimination.",
    intro:
      "Persistent odor usually means a source still exists (residue, moisture, biological soil). A spray can change perception temporarily without removing the cause.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["No source control → odor returns when the fragrance fades."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Remove soil, dry the environment, then use enzyme or neutralizer lanes where appropriate."] },
    ],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("odor-retention", "Odor retention"), rp("mold-growth", "Mold growth"), rp("touchpoint-contamination", "Touchpoint contamination")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("odor-retention", "Odor retention"), rp("mold-growth", "Mold growth"), rp("adhesive-residue", "Adhesive residue")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("febreze-fabric-refresher-antimicrobial-vs-zero-odor-eliminator-spray"),
          cmp("natures-miracle-stain-and-odor-remover-vs-rocco-roxie-stain-odor-eliminator"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "febreze-fabric-refresher-antimicrobial", title: "Febreze Fabric", href: PR("febreze-fabric-refresher-antimicrobial"), kind: "guide" },
          { slug: "zero-odor-eliminator-spray", title: "Zero Odor", href: PR("zero-odor-eliminator-spray"), kind: "guide" },
          { slug: "natures-miracle-stain-and-odor-remover", title: "Nature’s Miracle", href: PR("natures-miracle-stain-and-odor-remover"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-enzymes-dont-work-on-grease": {
    slug: "why-enzymes-dont-work-on-grease",
    title: "Why enzymes don’t work on grease",
    category: "anti_pattern",
    summary: "Enzymes target biological soils; fryer-grade lipids need surfactants and often alkaline degreasers.",
    description: "Stop using biology where the soil is oil physics.",
    intro:
      "Enzyme products can excel on biological odor sources when dwell and label steps are followed. Kitchen grease films are usually not the same problem class as pet urine chemistry.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Chemistry mismatch: enzymes won’t replace surfactant loading for heavy lipids."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Degrease first on hard surfaces; reserve enzymes for biological lanes."] },
    ],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("odor-retention", "Odor retention")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("odor-retention", "Odor retention")],
      },
      {
        title: "Product comparisons",
        links: [
          cmp("dawn-platinum-dish-spray-vs-krud-kutter-kitchen-degreaser"),
          cmp("natures-miracle-stain-and-odor-remover-vs-biokleen-bac-out-stain-odor-remover"),
        ],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "natures-miracle-stain-and-odor-remover", title: "Nature’s Miracle", href: PR("natures-miracle-stain-and-odor-remover"), kind: "guide" },
          { slug: "krud-kutter-kitchen-degreaser", title: "Krud Kutter Kitchen", href: PR("krud-kutter-kitchen-degreaser"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-acid-cleaners-damage-stone": {
    slug: "why-acid-cleaners-damage-stone",
    title: "Why acid cleaners damage stone",
    category: "anti_pattern",
    summary: "Many stones and sealers are acid-sensitive; etching is permanent, not residue.",
    description: "Stone-safe maintenance vs bathroom descalers.",
    intro:
      "Acids can dissolve mineral film on tolerant porcelain and glass, but they can also attack calcium-bearing stone and degrade some sealers. The failure mode is finish change, not “needs more scrubbing.”",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Acid + acid-sensitive stone = etch and dullness."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Stone-rated maintenance chemistry and manufacturer guidance."] },
    ],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    relatedSurfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops"), esSurface("tile", "Tile")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("soap-film", "Soap film")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("soap-film", "Soap film")],
      },
      {
        title: "Product comparisons",
        links: [cmp("clr-calcium-lime-rust-vs-lime-a-way-cleaner")],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "granite-gold-daily-cleaner", title: "Granite Gold Daily Cleaner", href: PR("granite-gold-daily-cleaner"), kind: "guide" },
          { slug: "stonetech-daily-cleaner", title: "StoneTech Daily Cleaner", href: PR("stonetech-daily-cleaner"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },

  "why-you-shouldnt-use-oven-cleaner-everywhere": {
    slug: "why-you-shouldnt-use-oven-cleaner-everywhere",
    title: "Why you shouldn’t use oven cleaner everywhere",
    category: "anti_pattern",
    summary: "Oven chemistry is caustic, fume-heavy, and surface-specific—counters and floors are not ovens.",
    description: "Isolate baked-on jobs to labeled oven/grill surfaces.",
    intro:
      "Oven cleaners are formulated for extreme baked carbon in controlled areas. Generalizing them to countertops, cabinets, or floors increases damage risk and inhalation exposure.",
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: ["Caustic chemistry, coating damage, and uncontrolled fumes outside the intended enclosure."] },
      { id: "what-works", title: "What actually works", paragraphs: ["Kitchen degreasers for hoods/cooktops; oven products only on labeled oven interiors."] },
    ],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("burnt-residue", "Burnt residue"), rp("cooked-on-grease", "Cooked-on grease"), rp("grease-buildup", "Grease buildup")],
    linkGroups: [
      {
        title: "Problem hubs",
        links: [rp("burnt-residue", "Burnt residue"), rp("cooked-on-grease", "Cooked-on grease"), rp("grease-buildup", "Grease buildup")],
      },
      {
        title: "Product comparisons",
        links: [cmp("easy-off-heavy-duty-oven-cleaner-vs-zep-oven-and-grill-cleaner"), cmp("easy-off-kitchen-degreaser-vs-krud-kutter-kitchen-degreaser")],
      },
      {
        title: "Example products (dossiers)",
        links: [
          { slug: "easy-off-heavy-duty-oven-cleaner", title: "Easy-Off Heavy Duty", href: PR("easy-off-heavy-duty-oven-cleaner"), kind: "guide" },
          { slug: "easy-off-kitchen-degreaser", title: "Easy-Off Kitchen", href: PR("easy-off-kitchen-degreaser"), kind: "guide" },
          { slug: "weiman-gas-range-cleaner-degreaser", title: "Weiman Range Degreaser", href: PR("weiman-gas-range-cleaner-degreaser"), kind: "guide" },
        ],
      },
    ] satisfies AuthorityGuideLinkGroupResolved[],
  },
};

export const ANTI_PATTERN_GUIDES_BY_SLUG: Record<string, AuthorityGuidePageData> = {
  ...ANTI_PATTERN_GUIDES_BASE_BY_SLUG,
  ...ANTI_PATTERN_GUIDES_VOLUME2_BY_SLUG,
  ...ANTI_PATTERN_GUIDES_VOLUME3_BY_SLUG,
};
