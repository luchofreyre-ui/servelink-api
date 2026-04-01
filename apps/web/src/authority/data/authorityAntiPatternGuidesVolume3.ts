import type { AuthorityEntitySummary, AuthorityGuideLinkGroupResolved, AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { getProblemPageBySlug } from "@/authority/data/authorityProblemPageData";

function sortPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

function normalizeProductComparisonSlug(leftSlug: string, rightSlug: string): string {
  const [l, r] = sortPair(leftSlug, rightSlug);
  return `${l}-vs-${r}`;
}

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
function cmpPair(leftSlug: string, rightSlug: string): AuthorityEntitySummary {
  return cmp(normalizeProductComparisonSlug(leftSlug, rightSlug));
}
function prLink(slug: string): AuthorityEntitySummary {
  return {
    slug,
    title: getProductBySlug(slug)?.name ?? humanizeSlugPart(slug),
    href: PR(slug),
    kind: "guide",
  };
}

type AP = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  intro: string;
  whyFails: string[];
  whatWorks: string[];
  whatWorksBullets?: string[];
  methods: AuthorityEntitySummary[];
  surfaces: AuthorityEntitySummary[];
  relatedProblems: AuthorityEntitySummary[];
  hubProblems: AuthorityEntitySummary[];
  comparisonPairs: [string, string][];
  products: string[];
};

function hub(slugs: string[]): AuthorityEntitySummary[] {
  return slugs.map((s) => rp(s, getProblemPageBySlug(s)?.title ?? humanizeSlugPart(s)));
}

function buildAntiPattern(p: AP): AuthorityGuidePageData {
  const linkGroups: AuthorityGuideLinkGroupResolved[] = [
    { title: "Problem hubs", links: p.hubProblems },
    { title: "Product comparisons", links: p.comparisonPairs.map(([a, b]) => cmpPair(a, b)) },
    { title: "Example products (dossiers)", links: p.products.map(prLink) },
  ];
  return {
    slug: p.slug,
    title: p.title,
    category: "anti_pattern",
    summary: p.summary,
    description: p.description,
    intro: p.intro,
    sections: [
      { id: "why-fails", title: "Why it fails", paragraphs: p.whyFails },
      {
        id: "what-works",
        title: "What actually works",
        paragraphs: p.whatWorks,
        bulletPoints: p.whatWorksBullets,
      },
    ],
    relatedMethods: p.methods,
    relatedSurfaces: p.surfaces,
    relatedProblems: p.relatedProblems,
    linkGroups,
  };
}

const NEUT = [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")];
const GLASS = [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")];
const DEG = [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")];
const HW = [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")];
const TILE_BATH = [esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass"), esSurface("grout", "Grout")];
const KITCHEN = [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")];

const SPECS: AP[] = [
  {
    slug: "why-neutral-cleaners-dont-remove-limescale",
    title: "Why neutral cleaners don’t remove limescale",
    summary: "pH-neutral maintenance lifts daily soil—it does not dissolve calcium crystals bonded to glass or fixtures.",
    description: "When to leave neutral lane and open the mineral problem hub.",
    intro:
      "Neutral cleaners are the right default for many finishes, but limescale is a mineral bond problem—not a ‘more neutral’ problem.",
    whyFails: ["No meaningful dissolution of calcium salts at safe consumer dwell.", "Scrubbing harder just risks finish damage without chemistry fit."],
    whatWorks: ["Confirm mineral class, then use label-approved acid descalers only where the surface allows them."],
    whatWorksBullets: ["Open the limescale or hard water hub before swapping bottles at random.", "Stone and unknown sealers need a different lane than porcelain."],
    methods: [...HW, ...NEUT],
    surfaces: TILE_BATH,
    relatedProblems: hub(["limescale-buildup", "hard-water-deposits", "water-spotting"]),
    hubProblems: hub(["limescale-buildup", "hard-water-deposits", "mineral-film"]),
    comparisonPairs: [
      ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
      ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
    ],
    products: ["clr-calcium-lime-rust", "lime-a-way-cleaner", "simple-green-all-purpose-cleaner"],
  },
  {
    slug: "why-polish-doesnt-fix-mineral-damage",
    title: "Why polish doesn’t fix mineral damage",
    summary: "Polish can improve gloss temporarily—it does not rebuild acid-etched structure or remove embedded crystals.",
    description: "Separate appearance oils from true mineral removal.",
    intro:
      "If the surface changed texture after the wrong chemistry, polish is not a reversal tool—it is a cosmetic mask at best.",
    whyFails: ["Polish fills micro-roughness briefly but does not remove scale inside pores.", "Wrong polish on stone can add incompatible films."],
    whatWorks: ["Identify etching vs film: films can lift with correct chemistry; etching needs professional assessment."],
    methods: NEUT,
    surfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: hub(["etching-on-finishes", "surface-dullness", "hard-water-deposits"]),
    hubProblems: hub(["etching-on-finishes", "surface-dullness", "mineral-film"]),
    comparisonPairs: [["granite-gold-daily-cleaner", "stonetech-daily-cleaner"]],
    products: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner", "clr-calcium-lime-rust"],
  },
  {
    slug: "why-disinfecting-wipes-leave-streaks",
    title: "Why disinfecting wipes leave streaks",
    summary: "Quat films and fast evaporation leave polymers and surfactant trails—especially on glossy hard surfaces.",
    description: "Disinfection ≠ streak-free finish chemistry.",
    intro:
      "Wipes trade convenience for controlled residue. On gloss finishes, that residue reads as smears even when microbes were hit.",
    whyFails: ["Low water volume means chemistry dries into the finish.", "Fragrance carriers add non-cleaning film."],
    whatWorks: ["Soil removal pass first, labeled dwell disinfect second, optional rinse where labels allow."],
    methods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), ...NEUT],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("tile", "Tile")],
    relatedProblems: hub(["surface-streaking", "product-residue-buildup", "touchpoint-contamination"]),
    hubProblems: hub(["surface-streaking", "touchpoint-contamination", "film-buildup"]),
    comparisonPairs: [["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"]],
    products: ["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray", "seventh-generation-disinfecting-multi-surface-cleaner"],
  },
  {
    slug: "why-shower-sprays-dont-remove-heavy-buildup",
    title: "Why shower sprays don’t remove heavy buildup",
    summary: "Daily maintainers reduce new film—they rarely bust mature soap-mineral complexes without dwell + mechanical help.",
    description: "Match maintenance vs restoration jobs.",
    intro:
      "If the glass is already cloudy and tacky, a light daily spray is the wrong escalation path—you need a problem-class decision first.",
    whyFails: ["Insufficient chemistry concentration for bonded film.", "No time or agitation where the label allows it."],
    whatWorks: ["Open soap scum / hard water hubs, then staged cleaning with ventilation and rinse discipline."],
    methods: [esMethod("soap-scum-removal", "Soap scum removal"), ...GLASS],
    surfaces: TILE_BATH,
    relatedProblems: hub(["soap-scum", "soap-film", "hard-water-deposits"]),
    hubProblems: hub(["bathroom-buildup", "soap-scum", "light-film-buildup"]),
    comparisonPairs: [
      ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      ["scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner"],
    ],
    products: ["method-daily-shower-spray", "tilex-daily-shower-cleaner", "scrubbing-bubbles-bathroom-grime-fighter"],
  },
  {
    slug: "why-floor-cleaners-can-leave-film",
    title: "Why floor cleaners can leave film",
    summary: "Too much product, dirty mop water, or skipping rinse leaves surfactant polymers that read as haze and tack.",
    description: "Floors fail on process more often than on brand.",
    intro:
      "The same neutral floor SKU can look amazing or terrible depending on dilution, water changes, and drying airflow.",
    whyFails: ["Over-wetting drives soil into grout lines and corners.", "Old mop heads redeposit grease."],
    whatWorks: ["Label dilution, frequent water refresh, and dry passes on resilient floors when allowed."],
    methods: NEUT,
    surfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedProblems: hub(["floor-residue-buildup", "product-residue-buildup", "surface-haze"]),
    hubProblems: hub(["floor-buildup", "floor-residue-buildup", "film-buildup"]),
    comparisonPairs: [
      ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      ["bona-hard-surface-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"],
    ],
    products: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"],
  },
  {
    slug: "why-glass-cleaners-dont-fix-haze",
    title: "Why glass cleaners don’t fix haze",
    summary: "Haze can be mineral, polymer coating damage, or etched glass—surfactant glass sprays only solve the easy slice.",
    description: "Name the haze class before buying another blue bottle.",
    intro:
      "Glass cleaner wins on light oils and dust. It loses when the failure mode is bonded mineral, etched silica, or failing coatings.",
    whyFails: ["Wrong soil class: acid or abrasion damage is not ‘dirty glass.’", "Old coatings yellow or craze underneath apparent haze."],
    whatWorks: ["Use the surface haze / cloudy glass hubs to split film vs damage, then pick chemistry accordingly."],
    methods: GLASS,
    surfaces: [esSurface("shower-glass", "Shower glass")],
    relatedProblems: hub(["cloudy-glass", "surface-haze", "hard-water-deposits"]),
    hubProblems: hub(["mirror-haze", "glass-cloudiness", "surface-haze"]),
    comparisonPairs: [
      ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      ["sprayway-glass-cleaner", "windex-original-glass-cleaner"],
    ],
    products: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner", "sprayway-glass-cleaner"],
  },
  {
    slug: "why-rust-keeps-returning-after-cleaning",
    title: "Why rust keeps returning after cleaning",
    summary: "You removed orange powder—not the iron source still wetting the metal or stone.",
    description: "Rust is a corrosion loop, not a one-wipe soil.",
    intro:
      "If water chemistry, fasteners, or failed coatings keep re-wetting steel, any acid brightener is a temporary cosmetic.",
    whyFails: ["Active corrosion continues under the film you wiped.", "Porous stone can wick iron from backing materials."],
    whatWorks: ["Stop moisture, replace failing hardware, then treat remaining stain with label-correct chemistry."],
    methods: [...HW, ...NEUT],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedProblems: hub(["oxidation", "hard-water-deposits", "metal-tarnish"]),
    hubProblems: hub(["oxidation", "chrome-water-spots", "hard-water-deposits"]),
    comparisonPairs: [["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"]],
    products: ["clr-calcium-lime-rust", "bar-keepers-friend-cleanser", "weiman-stainless-steel-cleaner-polish"],
  },
  {
    slug: "why-odor-neutralizers-dont-remove-grease",
    title: "Why odor neutralizers don’t remove grease",
    summary: "Binding VOCs is not emulsifying lipids—grease still feeds smell and re-soils surfaces.",
    description: "Degrease first, deodorize second.",
    intro:
      "Zero-odor style chemistry can help volatile smells, but a hood filter soaked in oil is still a grease problem underneath.",
    whyFails: ["Odor chemistry does not reduce lipid load.", "Masking can hide incomplete removal."],
    whatWorks: ["Remove soil with surfactant-forward degreasing where labels allow, then reassess odor."],
    methods: DEG,
    surfaces: KITCHEN,
    relatedProblems: hub(["grease-buildup", "odor-retention", "appliance-grime"]),
    hubProblems: hub(["kitchen-grease-film", "grease-buildup", "odor-retention"]),
    comparisonPairs: [
      ["febreze-fabric-refresher-antimicrobial", "zero-odor-eliminator-spray"],
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
    ],
    products: ["zero-odor-eliminator-spray", "dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
  },
  {
    slug: "why-enzymes-dont-fix-mildew-staining",
    title: "Why enzymes don’t fix mildew staining",
    summary: "Enzymes help some biological films—pigmented staining and porous grout may need different removal or remediation.",
    description: "Match biology to product lane and surface porosity.",
    intro:
      "If the color is embedded or the colony is behind caulk, enzymes on the surface won’t rewrite what you see in one pass.",
    whyFails: ["Insufficient contact on the actual biomass.", "Porous matrix holds pigment after cells die."],
    whatWorks: ["Ventilation + moisture control, then labeled mold/mildew maintenance products where appropriate."],
    methods: [esMethod("soap-scum-removal", "Soap scum removal"), ...NEUT],
    surfaces: TILE_BATH,
    relatedProblems: hub(["light-mildew", "mold-growth", "biofilm-buildup"]),
    hubProblems: hub(["light-mildew", "mold-growth", "bathroom-buildup"]),
    comparisonPairs: [
      ["natures-miracle-stain-and-odor-remover", "biokleen-bac-out-stain-odor-remover"],
      ["concrobium-mold-control", "mold-armor-rapid-clean-remediation"],
    ],
    products: ["concrobium-mold-control", "mold-armor-rapid-clean-remediation", "biokleen-bac-out-stain-odor-remover"],
  },
  {
    slug: "why-bleach-can-make-stains-look-better-but-not-solve-them",
    title: "Why bleach can make stains look better but not solve them",
    summary: "Oxidation can lighten chromophores while leaving film, damage, or embedded soil behind.",
    description: "Bleach is not a universal stain eraser.",
    intro:
      "A temporarily brighter spot is not proof the problem class was correct—especially on stone, metals, and unknown textiles.",
    whyFails: ["Color shift ≠ complete removal.", "Wrong substrate risks etching or corrosion."],
    whatWorks: ["Identify stain type (organic vs mineral vs dye transfer) before picking an oxidizer."],
    methods: NEUT,
    surfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: hub(["organic-stains", "surface-discoloration", "musty-odor"]),
    hubProblems: hub(["organic-stains", "surface-discoloration", "laundry-odor"]),
    comparisonPairs: [["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"]],
    products: ["clorox-clean-up-cleaner-bleach", "lysol-disinfectant-spray", "oxiclean-versatile-stain-remover"],
  },
  {
    slug: "why-stainless-polish-isnt-a-degreaser",
    title: "Why stainless polish isn’t a degreaser",
    summary: "Polish oils improve grain appearance—they do not emulsify hood-level lipids safely.",
    description: "Degrease first, polish last when labels allow.",
    intro:
      "Smearing cooking oil into cooking oil feels productive because the panel looks wet—then it attracts dust faster.",
    whyFails: ["Insufficient surfactant loading for thick grease.", "Oil-on-oil can polymerize with heat history."],
    whatWorks: ["Surfactant degrease compatible with the appliance label, rinse, then optional polish pass."],
    methods: DEG,
    surfaces: [esSurface("stainless-steel", "Stainless steel")],
    relatedProblems: hub(["grease-buildup", "appliance-grime", "smudge-marks"]),
    hubProblems: hub(["appliance-buildup", "appliance-grime", "grease-buildup"]),
    comparisonPairs: [
      ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish"],
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
    ],
    products: ["weiman-stainless-steel-cleaner-polish", "dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
  },
  {
    slug: "why-cooktop-cleaners-arent-oven-cleaners",
    title: "Why cooktop cleaners aren’t oven cleaners",
    summary: "Glass-ceramic polish chemistry is tuned for scratch risk—not for baked-on caustic oven soils.",
    description: "Keep cavity chemistry out of daily tops.",
    intro:
      "Oven cleaners can etch or cloud cooktops; cooktop creams won’t touch pyrolyzed carbon the same way labeled oven products do.",
    whyFails: ["pH and solvent packages target different temperature histories and substrates."],
    whatWorks: ["Use the cooktop problem hub for daily films; oven cavity chemistry only inside labeled ovens."],
    methods: [esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning"), ...DEG],
    surfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate")],
    relatedProblems: hub(["cooked-on-grease", "burnt-residue", "stuck-on-residue"]),
    hubProblems: hub(["kitchen-grease-film", "cooked-on-grease", "burnt-residue"]),
    comparisonPairs: [
      ["cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"],
      ["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"],
    ],
    products: ["cerama-bryte-cooktop-cleaner", "easy-off-heavy-duty-oven-cleaner", "weiman-gas-range-cleaner-degreaser"],
  },
  {
    slug: "why-oven-cleaners-damage-finished-surfaces",
    title: "Why oven cleaners damage finished surfaces",
    summary: "High-alkaline cavity chemistry dissolves lipid soils—and also attacks paints, films, and aluminum trims.",
    description: "Containment and label surfaces only.",
    intro:
      "Oven cleaner belongs where the label says. Overspray onto cabinets or counters is one of the fastest ways to create permanent finish change.",
    whyFails: ["Aggressive alkalinity swells coatings and corrodes soft metals.", "Heat accelerates reaction on the wrong substrate."],
    whatWorks: ["Mask adjacent surfaces, ventilate, and keep chemistry inside the cavity or on labeled grates only."],
    methods: [esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedProblems: hub(["burnt-residue", "heat-damage-marks", "surface-discoloration"]),
    hubProblems: hub(["burnt-residue", "etching-on-finishes", "heat-damage-marks"]),
    comparisonPairs: [["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"]],
    products: ["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner", "easy-off-kitchen-degreaser"],
  },
  {
    slug: "why-fabric-refreshers-dont-sanitize-laundry",
    title: "Why fabric refreshers don’t sanitize laundry",
    summary: "Soft-surface sprays are not wash-cycle sanitizers—contact, dilution, and fiber saturation differ.",
    description: "Read kill claims on the right product class.",
    intro:
      "Febreze-class refresh can help odor perception on upholstery; it does not replace laundry sanitizer chemistry in water.",
    whyFails: ["Insufficient coverage and dwell in fiber mass.", "Different regulatory and formulation intent than laundry SKU."],
    whatWorks: ["For hygiene targets, use laundry-label sanitizers and hot-water rules where safe for textiles."],
    methods: NEUT,
    surfaces: [esSurface("laminate", "Laminate")],
    relatedProblems: hub(["laundry-odor", "odor-retention", "touchpoint-contamination"]),
    hubProblems: hub(["laundry-odor", "odor-retention", "musty-odor"]),
    comparisonPairs: [
      ["febreze-fabric-refresher-antimicrobial", "zero-odor-eliminator-spray"],
      ["lysol-laundry-sanitizer", "clorox-laundry-sanitizer"],
    ],
    products: ["febreze-fabric-refresher-antimicrobial", "lysol-laundry-sanitizer", "clorox-laundry-sanitizer"],
  },
  {
    slug: "why-sanitizers-dont-remove-visible-soil",
    title: "Why sanitizers don’t remove visible soil",
    summary: "Kill claims need contact with organisms—grease and dust physically block that contact.",
    description: "Clean, then disinfect when the label requires it.",
    intro:
      "Spraying disinfectant onto a greasy light switch is mostly disinfecting the grease layer on top of the grease layer.",
    whyFails: ["Biofilms and lipids shield microbes.", "Wiping too fast breaks required dwell."],
    whatWorks: ["Remove soil with neutral or degreasing maintenance, then disinfect per label on compatible surfaces."],
    methods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), ...NEUT],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("tile", "Tile")],
    relatedProblems: hub(["touchpoint-contamination", "grease-buildup", "general-soil"]),
    hubProblems: hub(["touchpoint-contamination", "grease-buildup", "grime-buildup"]),
    comparisonPairs: [["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"]],
    products: ["lysol-disinfectant-spray", "seventh-generation-disinfecting-multi-surface-cleaner", "simple-green-all-purpose-cleaner"],
  },
  {
    slug: "why-steam-alone-wont-remove-films",
    title: "Why steam alone won’t remove films",
    summary: "Heat re-softens some soils but still needs wipe chemistry and capture—steam without surfactant often smears.",
    description: "Steam is a helper, not a soil class solver.",
    intro:
      "Steam can loosen edges, but polymerized grease and mineral films still need the right chemistry and residue control.",
    whyFails: ["Condensation redeposits if towels are dirty.", "No surfactant means lipids smear instead of lifting."],
    whatWorks: ["Pair controlled moisture with compatible cleaners and fresh microfiber."],
    methods: [...NEUT, ...DEG],
    surfaces: TILE_BATH,
    relatedProblems: hub(["soap-film", "grease-buildup", "stuck-on-residue"]),
    hubProblems: hub(["film-buildup", "sticky-film", "soap-film"]),
    comparisonPairs: [["method-daily-shower-spray", "scrubbing-bubbles-daily-shower-cleaner"]],
    products: ["method-daily-shower-spray", "scrubbing-bubbles-bathroom-grime-fighter", "dawn-platinum-dish-spray"],
  },
  {
    slug: "why-squeegee-skips-leave-spots",
    title: "Why squeegee skips leave spots",
    summary: "Missed bands dry at different rates—minerals nucleate exactly where water last sat.",
    description: "Overlap passes and dry edges.",
    intro:
      "A squeegee is only as good as blade condition and overlap. Skips become a dot-matrix of evaporation film.",
    whyFails: ["Blade nick leaves water fingers.", "Hard water concentrates in the last droplets."],
    whatWorks: ["Detailing dry on edges, periodic descale where labels allow, and clean rubber."],
    methods: GLASS,
    surfaces: [esSurface("shower-glass", "Shower glass")],
    relatedProblems: hub(["water-spotting", "hard-water-deposits", "streaking-on-glass"]),
    hubProblems: hub(["water-spots", "water-spotting", "chrome-water-spots"]),
    comparisonPairs: [["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"]],
    products: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
  },
  {
    slug: "why-powder-cleansers-cloud-glass",
    title: "Why powder cleansers cloud glass",
    summary: "Alumina/silica abrasives cut film—and can frost glass or coatings when pressure exceeds tolerance.",
    description: "Glass is not porcelain.",
    intro:
      "What works on a tub can permanently alter glass microtexture. The haze afterward is often damage, not residue.",
    whyFails: ["Mechanical removal changes the surface itself.", "Coatings fail unevenly under abrasion."],
    whatWorks: ["Use glass-appropriate chemistry and technique; escalate cautiously."],
    methods: GLASS,
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedProblems: hub(["cloudy-glass", "etching-on-finishes", "surface-haze"]),
    hubProblems: hub(["glass-cloudiness", "cloudy-glass", "surface-haze"]),
    comparisonPairs: [["bar-keepers-friend-cleanser", "simple-green-all-purpose-cleaner"]],
    products: ["bar-keepers-friend-cleanser", "windex-original-glass-cleaner", "sprayway-glass-cleaner"],
  },
  {
    slug: "why-peroxide-bubbles-dont-equal-clean",
    title: "Why peroxide bubbles don’t equal clean",
    summary: "Oxygen release shows reaction—not completion. Soil can remain while fizzing feels productive.",
    description: "Judge by removal, not theater.",
    intro:
      "Bubbles help perception more than measurement. You still need contact time, agitation where safe, and rinse.",
    whyFails: ["Reaction stops before soil clears.", "Wrong stain class never fully oxidizes."],
    whatWorks: ["Identify stain chemistry, follow label dwell, blot/rinse, reassess."],
    methods: NEUT,
    surfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: hub(["organic-stains", "mold-growth", "light-mildew"]),
    hubProblems: hub(["organic-stains", "light-mildew", "biofilm-buildup"]),
    comparisonPairs: [["oxiclean-versatile-stain-remover", "natures-miracle-stain-and-odor-remover"]],
    products: ["oxiclean-versatile-stain-remover", "natures-miracle-stain-and-odor-remover", "biokleen-bac-out-stain-odor-remover"],
  },
  {
    slug: "why-magic-erasers-dull-gloss-finishes",
    title: "Why melamine erasers dull gloss finishes",
    summary: "Micro-abrasion removes marks—and also micro-scatters gloss into haze.",
    description: "Test hidden areas on plastics and coated surfaces.",
    intro:
      "Melamine is sandpaper at a tiny scale. On matte surfaces it can look fine; on gloss it often reads as permanent dull patches.",
    whyFails: ["Removes finish layer along with soil.", "Uneven pressure creates patchy sheen."],
    whatWorks: ["Start with least aggressive chemistry; reserve abrasion for label-tolerant hard surfaces only."],
    methods: NEUT,
    surfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedProblems: hub(["scuff-marks", "surface-dullness", "finish-scratches"]),
    hubProblems: hub(["scuff-marks", "surface-dullness", "dullness"]),
    comparisonPairs: [["pledge-multisurface-cleaner", "method-wood-for-good-daily-clean"]],
    products: ["pledge-multisurface-cleaner", "simple-green-all-purpose-cleaner", "method-wood-for-good-daily-clean"],
  },
  {
    slug: "why-bucket-water-gets-dirtier-than-it-looks",
    title: "Why bucket water gets dirtier than it looks",
    summary: "Dissolved surfactant hides soil until you redeposit it on the next wall swath.",
    description: "Change water like you mean it.",
    intro:
      "Murky is not the only failure mode—clear water can still be loaded with fine grit that scratches gloss paints.",
    whyFails: ["Soil capacity exceeded without visual cue.", "Same cloth crosses rooms and mixes grease with dust."],
    whatWorks: ["Section cleaning, frequent rinse, and color-coded cloths."],
    methods: [...NEUT, esMethod("detail-dusting", "Detail dusting")],
    surfaces: [esSurface("painted-walls", "Painted walls"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedProblems: hub(["general-soil", "surface-streaking", "dust-buildup"]),
    hubProblems: hub(["grime-buildup", "general-soil", "residue-buildup"]),
    comparisonPairs: [["pine-sol-original-multi-surface-cleaner", "simple-green-all-purpose-cleaner"]],
    products: ["simple-green-all-purpose-cleaner", "pine-sol-original-multi-surface-cleaner", "bona-hard-surface-floor-cleaner"],
  },
  {
    slug: "why-nanocoatings-still-show-water-spots",
    title: "Why coatings still show water spots",
    summary: "Hydrophobic layers change bead shape—not always mineral nucleation on the first rinse.",
    description: "Expect maintenance, not invisibility.",
    intro:
      "Coatings reduce adhesion but hard water can still leave rings at contact points; some spots are etch under the coating.",
    whyFails: ["Evaporation still concentrates salts at defects.", "Coating wear is uneven in traffic zones."],
    whatWorks: ["Gentle maintenance chemistry compatible with coating warranties; mineral hub if spots etch."],
    methods: GLASS,
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedProblems: hub(["water-spotting", "hard-water-deposits", "surface-haze"]),
    hubProblems: hub(["water-spots", "mineral-film", "water-spotting"]),
    comparisonPairs: [["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"]],
    products: ["windex-original-glass-cleaner", "sprayway-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
  },
  {
    slug: "why-aerosol-foam-doesnt-penetrate-grout",
    title: "Why aerosol foam doesn’t penetrate grout",
    summary: "Foam sits on top—porous joints need contact time and often mechanical help.",
    description: "Bath marketing ≠ joint extraction.",
    intro:
      "Thick foam looks like deep cleaning; grout pulls soil inward where spray contact is shallow.",
    whyFails: ["Limited penetration vs porosity.", "Rinse incomplete leaves new film in pores."],
    whatWorks: ["Targeted brush + compatible chemistry + controlled moisture for the joint line."],
    methods: [esMethod("soap-scum-removal", "Soap scum removal"), ...HW],
    surfaces: [esSurface("grout", "Grout"), esSurface("tile", "Tile")],
    relatedProblems: hub(["soap-scum", "mold-growth", "hard-water-deposits"]),
    hubProblems: hub(["bathroom-buildup", "grime-buildup", "soap-scum"]),
    comparisonPairs: [["scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner"]],
    products: ["scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner", "tilex-daily-shower-cleaner"],
  },
  {
    slug: "why-soft-scrub-misread-on-stone",
    title: "Why bathroom creams misread on stone",
    summary: "Abrasive bathroom pastes can micro-scratch acid-sensitive or resin-filled stone finishes.",
    description: "Stone label first, tub label second.",
    intro:
      "If the bottle shows a tub icon, assume it is not authorization for your expensive countertop.",
    whyFails: ["Abrasive + wrong pH for stone class.", "Residue in pores reads as new haze."],
    whatWorks: ["Stone-rated dailies and professional assessment for etch."],
    methods: NEUT,
    surfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: hub(["etching-on-finishes", "surface-dullness", "soap-scum"]),
    hubProblems: hub(["countertop-residue", "etching-on-finishes", "soap-scum"]),
    comparisonPairs: [["granite-gold-daily-cleaner", "stonetech-daily-cleaner"]],
    products: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner", "bar-keepers-friend-cleanser"],
  },
  {
    slug: "why-diluted-bleach-still-stains-textiles",
    title: "Why diluted bleach still stains textiles",
    summary: "Cellulosics and dyes react unpredictably—dilution doesn’t remove incompatibility.",
    description: "Spot test hidden fibers.",
    intro:
      "Bleach can remove color you wanted to keep while leaving the stain you hated. Fiber chemistry matters more than concentration bravado.",
    whyFails: ["Dye loss vs stain removal are different outcomes.", "Residual chlorine damages elasticity over time."],
    whatWorks: ["Fiber-appropriate stain lanes; enzyme or oxygen programs where labels allow."],
    methods: NEUT,
    surfaces: [esSurface("laminate", "Laminate")],
    relatedProblems: hub(["organic-stains", "laundry-odor", "surface-discoloration"]),
    hubProblems: hub(["organic-stains", "laundry-odor", "plastic-yellowing"]),
    comparisonPairs: [["oxiclean-versatile-stain-remover", "natures-miracle-stain-and-odor-remover"]],
    products: ["clorox-clean-up-cleaner-bleach", "oxiclean-versatile-stain-remover", "biokleen-bac-out-stain-odor-remover"],
  },
  {
    slug: "why-caulk-lines-trap-film",
    title: "Why caulk lines trap film",
    summary: "Silicone is soft and irregular—soil wedges in while wipes skate over the top.",
    description: "Detail the joint, not only the tile plane.",
    intro:
      "Bright tile with dark caulk lines usually means the joint is the soil reservoir, not the field tile.",
    whyFails: ["Wiper geometry skips concave zones.", "Biofilm likes rubbery interfaces."],
    whatWorks: ["Gentle mechanical detail + ventilation + compatible mildew maintenance."],
    methods: [esMethod("soap-scum-removal", "Soap scum removal"), ...NEUT],
    surfaces: TILE_BATH,
    relatedProblems: hub(["soap-scum", "biofilm-buildup", "light-mildew"]),
    hubProblems: hub(["bathroom-buildup", "biofilm-buildup", "soap-scum"]),
    comparisonPairs: [["method-daily-shower-spray", "tilex-daily-shower-cleaner"]],
    products: ["concrobium-mold-control", "scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner"],
  },
  {
    slug: "why-dish-soap-isnt-a-disinfectant-story",
    title: "Why dish soap isn’t a disinfectant story",
    summary: "Surfactants lift soil well—kill claims and dwell live on disinfectant labels, not on Dawn-class SKUs.",
    description: "Clean first, kill second when required.",
    intro:
      "Greasy phones and switches need soil removal before disinfectant contact time means anything.",
    whyFails: ["No label kill claim → no verified disinfection outcome.", "Grease shields microbes from contact."],
    whatWorks: ["Degrease/neutral wipe, then disinfectant where labels and surface class allow."],
    methods: [...DEG, esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    surfaces: KITCHEN,
    relatedProblems: hub(["grease-buildup", "touchpoint-contamination", "general-soil"]),
    hubProblems: hub(["grease-buildup", "touchpoint-contamination", "kitchen-grease-film"]),
    comparisonPairs: [
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      ["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"],
    ],
    products: ["dawn-platinum-dish-spray", "lysol-disinfectant-spray", "seventh-generation-disinfecting-multi-surface-cleaner"],
  },
  {
    slug: "why-wood-oil-isnt-countertop-sealer",
    title: "Why wood oil soap isn’t stone sealer",
    summary: "Murphy-class oil soaps condition wood narratives—they don’t re-seal porous stone.",
    description: "Keep wood chemistry on wood programs.",
    intro:
      "Oils on stone can attract dust and complicate future stain removal. Stone maintenance has its own labeled lane.",
    whyFails: ["Wrong polymer chemistry for silicate surfaces.", "Residue reads as dull patches."],
    whatWorks: ["Stone-rated dailies; professional reseal when water no longer beads as expected."],
    methods: NEUT,
    surfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("finished-wood", "Finished wood")],
    relatedProblems: hub(["surface-dullness", "product-residue-buildup", "surface-discoloration"]),
    hubProblems: hub(["countertop-residue", "cabinet-grime", "surface-dullness"]),
    comparisonPairs: [["murphy-oil-soap-wood-cleaner", "pledge-multisurface-cleaner"]],
    products: ["murphy-oil-soap-wood-cleaner", "pledge-multisurface-cleaner", "granite-gold-daily-cleaner"],
  },
  {
    slug: "why-desiccant-sprays-dont-remove-oil",
    title: "Why dry solvent sprays don’t emulsify kitchen grease",
    summary: "Fast-evaporating sprays move oil around—surfactant water phases still do the heavy lifting on hoods.",
    description: "Match solvent class to soil volume.",
    intro:
      "A quick blast can feel clean because volatiles flash off—thick films return when condensed oils remain.",
    whyFails: ["Insufficient volume to solvate heavy lipid load.", "Safety/ventilation limits real dwell."],
    whatWorks: ["Kitchen degreasers with surfactant + rinse discipline on labeled surfaces."],
    methods: DEG,
    surfaces: KITCHEN,
    relatedProblems: hub(["grease-buildup", "appliance-grime", "stuck-on-residue"]),
    hubProblems: hub(["kitchen-grease-film", "exhaust-hood-film", "grease-buildup"]),
    comparisonPairs: [
      ["goof-off-professional-strength-remover", "krud-kutter-kitchen-degreaser"],
      ["dawn-platinum-dish-spray", "easy-off-kitchen-degreaser"],
    ],
    products: ["goof-off-professional-strength-remover", "easy-off-kitchen-degreaser", "krud-kutter-kitchen-degreaser"],
  },
  {
    slug: "why-lysol-doesnt-cut-baked-on-grease",
    title: "Why Lysol doesn’t cut baked-on grease",
    summary: "Disinfectant-first formulations are not surfactant-heavy degreasers—soil shields both microbes and chemistry.",
    description: "Degrease lane vs disinfect lane.",
    intro:
      "If the pan or stovetop is polymerized, you need lipid chemistry and technique—not a kill claim shortcut.",
    whyFails: ["Insufficient emulsification for thick lipids.", "Dwell spent on the wrong soil class."],
    whatWorks: ["Degrease with labeled kitchen products, rinse, then disinfect touchpoints if still required."],
    methods: [...DEG, esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    surfaces: KITCHEN,
    relatedProblems: hub(["cooked-on-grease", "grease-buildup", "burnt-residue"]),
    hubProblems: hub(["cooked-on-grease", "burnt-residue", "kitchen-grease-film"]),
    comparisonPairs: [
      ["lysol-disinfectant-spray", "dawn-platinum-dish-spray"],
      ["dawn-platinum-dish-spray", "easy-off-kitchen-degreaser"],
    ],
    products: ["lysol-disinfectant-spray", "dawn-platinum-dish-spray", "easy-off-kitchen-degreaser"],
  },
];

export const ANTI_PATTERN_GUIDES_VOLUME3_BY_SLUG: Record<string, AuthorityGuidePageData> = Object.fromEntries(
  SPECS.map((s) => [s.slug, buildAntiPattern(s)]),
);
