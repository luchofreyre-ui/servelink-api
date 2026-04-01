import type { AuthorityEntitySummary, AuthorityGuideLinkGroupResolved, AuthorityGuidePageData } from "@/authority/types/authorityPageTypes";
import { getProductBySlug } from "@/lib/products/productRegistry";

function sortPair(a: string, b: string): [string, string] {
  return a.localeCompare(b) <= 0 ? [a, b] : [b, a];
}

/** Same URL shape as `normalizeComparisonSlug` without importing the selectors graph (avoids cycles). */
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
  /** Registered product comparison pairs (order-free; normalized for URLs). */
  comparisonPairs: [string, string][];
  products: string[];
};

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

const SPECS: AP[] = [
  {
    slug: "why-vinegar-leaves-streaks-on-glass",
    title: "Why vinegar leaves streaks on glass",
    summary: "Acid can shift mineral film but surfactant-poor vinegar often redeposits and streaks without rinse discipline.",
    description: "Glass streaking, vinegar limits, and better graph routes.",
    intro:
      "Vinegar changes how some films behave, but glass clarity is usually a rinse, cloth, and residue story—not only pH.",
    whyFails: [
      "Without enough surfactant and rinse water, acid can leave uneven drying lines—especially on large panes.",
      "Dirty tools or paper towels add lint and oil back onto the surface.",
    ],
    whatWorks: ["Glass-cleaning workflow: minimal chemistry, clean microfiber, and dry buff where safe."],
    whatWorksBullets: ["Use the streaking-on-glass hub for technique.", "Separate mineral film from grease before picking chemistry."],
    methods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedProblems: [rp("streaking-on-glass", "Streaking on glass"), rp("hard-water-deposits", "Hard water deposits"), rp("cloudy-glass", "Cloudy glass")],
    hubProblems: [rp("streaking-on-glass", "Streaking on glass"), rp("soap-film", "Soap film"), rp("hard-water-deposits", "Hard water deposits")],
    comparisonPairs: [
      ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      ["sprayway-glass-cleaner", "windex-original-glass-cleaner"],
    ],
    products: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner", "sprayway-glass-cleaner"],
  },
  {
    slug: "why-paper-towels-scratch-surfaces",
    title: "Why paper towels scratch surfaces",
    summary: "Wood pulp fibers and embossing act like micro-abrasives on gloss plastics, soft coatings, and some glass.",
    description: "Tool choice matters as much as chemistry for fine finishes.",
    intro:
      "Paper towels feel soft in the hand but can leave micro-scratches and lint films on high-gloss or coated surfaces.",
    whyFails: ["Dry friction moves hard particles across the finish.", "Cheap towels shed fibers that read as haze."],
    whatWorks: ["Dedicated microfiber for wet and dry passes; wash cloths without fabric softener buildup."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops"), esSurface("shower-glass", "Shower glass")],
    relatedProblems: [rp("smudge-marks", "Smudge marks"), rp("surface-streaking", "Surface streaking"), rp("surface-haze", "Surface haze")],
    hubProblems: [rp("smudge-marks", "Smudge marks"), rp("streaking-on-glass", "Streaking on glass"), rp("surface-haze", "Surface haze")],
    comparisonPairs: [
      ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish"],
      ["invisible-glass-premium-glass-cleaner", "windex-original-glass-cleaner"],
    ],
    products: ["pledge-everyday-clean-multisurface", "windex-original-glass-cleaner", "sprayway-glass-cleaner"],
  },
  {
    slug: "why-all-purpose-cleaners-arent-universal",
    title: "Why “all-purpose” cleaners aren’t universal",
    summary: "Marketing language ≠ stone-safe, wax-safe, or disinfecting chemistry in one bottle.",
    description: "Read the surface class before the front label.",
    intro:
      "All-purpose products are formulated for a middle band of soils and finishes. Acid-sensitive stone, specialty coatings, and heavy grease are different jobs.",
    whyFails: ["One SKU cannot simultaneously be the best degreaser, descaler, and stone daily.", "Fragrance and dye are not indicators of fit."],
    whatWorks: ["Route through the problem hub, then match chemistry class to the surface page."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("degreasing", "Degreasing")],
    surfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("general-soil", "General soil"), rp("grease-buildup", "Grease buildup"), rp("surface-streaking", "Surface streaking")],
    hubProblems: [rp("general-soil", "General soil"), rp("grease-buildup", "Grease buildup"), rp("product-residue-buildup", "Product residue buildup")],
    comparisonPairs: [
      ["method-wood-for-good-daily-clean", "pledge-multisurface-cleaner"],
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
    ],
    products: ["simple-green-all-purpose-cleaner", "method-heavy-duty-degreaser", "seventh-generation-disinfecting-multi-surface-cleaner"],
  },
  {
    slug: "why-you-shouldnt-mix-vinegar-and-baking-soda",
    title: "Why you shouldn’t mix vinegar and baking soda",
    summary: "You mostly make salt water and CO₂—neutralizing both cleaners’ intended jobs.",
    description: "One chemistry at a time, with rinse between families.",
    intro:
      "The foaming reaction looks satisfying but often ends chemistry early, wastes product, and tells you nothing about surface safety.",
    whyFails: ["pH swings cancel acid and base before they finish their labeled work.", "Uncontrolled fizz pushes liquid into seams you did not intend to flood."],
    whatWorks: ["Pick one lane (acid descale vs alkaline degrease), follow the label, rinse, then reassess."],
    methods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("general-soil", "General soil")],
    hubProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("soap-film", "Soap film")],
    comparisonPairs: [
      ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
      ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
    ],
    products: ["heinz-distilled-white-vinegar-5pct", "clr-calcium-lime-rust", "lime-a-way-cleaner"],
  },
  {
    slug: "why-too-much-product-causes-residue",
    title: "Why too much product causes residue",
    summary: "Surfactant and polymer films left behind read as “still dirty” and attract dust faster.",
    description: "Less product, more rinse, cleaner tools.",
    intro:
      "More chemistry does not linearly improve removal. Excess product needs more water to clear—and most people stop too early.",
    whyFails: ["Undried surfactant equals streaks and tack.", "Layering scents masks soil without removing it."],
    whatWorks: ["Use label dilution, work in sections, and finish with a clean water pass on tolerant surfaces."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: [rp("surface-streaking", "Surface streaking"), rp("product-residue-buildup", "Product residue buildup"), rp("soap-film", "Soap film")],
    hubProblems: [rp("product-residue-buildup", "Product residue buildup"), rp("surface-streaking", "Surface streaking"), rp("light-film-buildup", "Light film buildup")],
    comparisonPairs: [
      ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      ["method-daily-shower-spray", "scrubbing-bubbles-daily-shower-cleaner"],
    ],
    products: ["method-daily-shower-spray", "pine-sol-original-multi-surface-cleaner", "simple-green-all-purpose-cleaner"],
  },
  {
    slug: "why-cleaning-without-rinsing-fails",
    title: "Why cleaning without rinsing fails",
    summary: "Soil lifts into solution—if you leave solution behind, soil returns as film.",
    description: "Rinse discipline is part of the clean, not an extra step.",
    intro:
      "Wiping product around without removing the spent chemistry is one of the most common reasons problems “come back overnight.”",
    whyFails: ["Residue refracts light and reads as haze.", "Sticky films grab dust immediately."],
    whatWorks: ["Two-bucket or two-cloth discipline: clean application, clean finish pass."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    surfaces: [esSurface("tile", "Tile"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedProblems: [rp("soap-film", "Soap film"), rp("product-residue-buildup", "Product residue buildup"), rp("floor-residue-buildup", "Floor residue buildup")],
    hubProblems: [rp("soap-film", "Soap film"), rp("product-residue-buildup", "Product residue buildup"), rp("general-soil", "General soil")],
    comparisonPairs: [
      ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
    ],
    products: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
  },
  {
    slug: "why-microfiber-matters",
    title: "Why microfiber matters",
    summary: "Split fibers grab and hold soil; cotton and paper often redistribute it.",
    description: "Tool physics beats stronger smell.",
    intro:
      "Microfiber is not magic—it's mechanical capture. The right weave reduces streaking because it removes spent product instead of smearing it.",
    whyFails: ["Smooth cotton pushes oils into a thin film.", "Dirty microfiber is just another contaminant source."],
    whatWorks: ["Color-code cloths, wash without softener, and swap when the cloth loads up."],
    methods: [esMethod("detail-dusting", "Detail dusting"), esMethod("glass-cleaning", "Glass cleaning")],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("shower-glass", "Shower glass")],
    relatedProblems: [rp("streaking-on-glass", "Streaking on glass"), rp("smudge-marks", "Smudge marks"), rp("dust-buildup", "Dust buildup")],
    hubProblems: [rp("streaking-on-glass", "Streaking on glass"), rp("smudge-marks", "Smudge marks"), rp("surface-streaking", "Surface streaking")],
    comparisonPairs: [
      ["invisible-glass-premium-glass-cleaner", "windex-original-glass-cleaner"],
      ["sprayway-glass-cleaner", "windex-original-glass-cleaner"],
    ],
    products: ["pledge-multisurface-cleaner", "windex-original-glass-cleaner", "sprayway-glass-cleaner"],
  },
  {
    slug: "why-water-alone-doesnt-clean-grease",
    title: "Why water alone doesn’t clean grease",
    summary: "Oil is non-polar; water needs surfactants to emulsify and rinse lipids.",
    description: "Match polarity to soil class.",
    intro:
      "Hot water can soften some grease, but without surfactant loading you rarely achieve stable emulsion and complete removal.",
    whyFails: ["Water beads on oil instead of lifting it.", "Heat without chemistry can polymerize films further."],
    whatWorks: ["Degreasing lane: surfactant-forward products and rinse control."],
    methods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("greasy-grime", "Greasy grime")],
    hubProblems: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("appliance-grime", "Buildup on appliances")],
    comparisonPairs: [
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      ["krud-kutter-kitchen-degreaser", "weiman-gas-range-cleaner-degreaser"],
    ],
    products: ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
  },
  {
    slug: "why-fragrance-is-not-cleaning-power",
    title: "Why fragrance ≠ cleaning power",
    summary: "Scent masks perception; it does not remove soil chemistry.",
    description: "Separate smell from elimination and residue.",
    intro:
      "A product can smell clean while leaving film—or while failing on the actual soil class you have.",
    whyFails: ["Olfactory bias hides incomplete removal.", "Heavy perfume can add VOC load without adding surfactants."],
    whatWorks: ["Identify soil class first, then pick chemistry; treat odor hubs separately from disinfectant hubs."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("tile", "Tile")],
    relatedProblems: [rp("odor-retention", "Odor retention"), rp("product-residue-buildup", "Product residue buildup"), rp("general-soil", "General soil")],
    hubProblems: [rp("odor-retention", "Odor retention"), rp("touchpoint-contamination", "Touchpoint contamination"), rp("product-residue-buildup", "Product residue buildup")],
    comparisonPairs: [
      ["febreze-fabric-refresher-antimicrobial", "zero-odor-eliminator-spray"],
      ["febreze-fabric-refresher-antimicrobial", "fresh-wave-odor-removing-spray"],
    ],
    products: ["febreze-fabric-refresher-antimicrobial", "zero-odor-eliminator-spray", "pine-sol-original-multi-surface-cleaner"],
  },
  {
    slug: "why-antibacterial-doesnt-mean-clean",
    title: "Why “antibacterial” doesn’t mean clean",
    summary: "Kill claims require label dwell and starting soil removal—dirt can shield microbes.",
    description: "Clean first, disinfect when the label says so.",
    intro:
      "Antibacterial marketing is not a substitute for removing grease, biofilm, or porous soil that blocks contact time.",
    whyFails: ["Organic film reduces contact efficacy.", "Spray-and-wipe often skips required dwell."],
    whatWorks: ["Remove soil, then use disinfectants per label on compatible surfaces."],
    methods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("biofilm-buildup", "Biofilm buildup"), rp("grease-buildup", "Grease buildup")],
    hubProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("general-soil", "General soil"), rp("grease-buildup", "Grease buildup")],
    comparisonPairs: [
      ["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"],
    ],
    products: ["lysol-disinfectant-spray", "clorox-disinfecting-wipes"],
  },
  {
    slug: "why-scrubbing-harder-doesnt-fix-buildup",
    title: "Why scrubbing harder doesn’t fix buildup",
    summary: "Wrong chemistry stays wrong—force just damages finish while soil remains.",
    description: "Change method class before you change pressure.",
    intro:
      "Buildup is often chemistry-class mismatch (mineral vs oil vs biofilm). Scrubbing harder converts a cleaning problem into a damage problem.",
    whyFails: ["Mineral bonds need compatible removal chemistry.", "Soft coatings scratch before soil fully releases."],
    whatWorks: ["Identify buildup type, use dwell-and-lift where appropriate, protect gloss finishes."],
    methods: [esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("grout", "Grout")],
    relatedProblems: [rp("soap-scum", "Soap scum"), rp("hard-water-deposits", "Hard water deposits"), rp("limescale-buildup", "Limescale buildup")],
    hubProblems: [rp("soap-scum", "Soap scum"), rp("limescale-buildup", "Limescale buildup"), rp("stuck-on-residue", "Stuck-on residue")],
    comparisonPairs: [
      ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
    ],
    products: ["clr-calcium-lime-rust", "zep-shower-tub-tile-cleaner"],
  },
  {
    slug: "why-bleach-doesnt-remove-dirt",
    title: "Why bleach doesn’t remove dirt",
    summary: "Bleach oxidizes; it is not a surfactant-forward soil lifter for everyday grime.",
    description: "Disinfection lane vs cleaning lane.",
    intro:
      "Bleach can lighten stains and address some microbes when used per label, but greasy soil and particulate still need removal chemistry and mechanical lift.",
    whyFails: ["Oxidation without surfactants leaves oils and films behind.", "Misuse risks finish damage and fume exposure."],
    whatWorks: ["Clean soil with the right maintenance chemistry, then disinfect only when appropriate."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    surfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("general-soil", "General soil"), rp("grease-buildup", "Grease buildup"), rp("touchpoint-contamination", "Touchpoint contamination")],
    hubProblems: [rp("general-soil", "General soil"), rp("grease-buildup", "Grease buildup"), rp("touchpoint-contamination", "Touchpoint contamination")],
    comparisonPairs: [
      ["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"],
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
    ],
    products: ["clorox-clean-up-cleaner-bleach", "lysol-disinfectant-spray", "dawn-platinum-dish-spray"],
  },
  {
    slug: "why-degreasers-damage-some-finishes",
    title: "Why degreasers damage some finishes",
    summary: "High pH and solvents attack coatings, painted cabinets, and some plastics.",
    description: "Match strength to finish class.",
    intro:
      "Kitchen degreasers excel on tolerant hard surfaces. They are poor defaults for decorative finishes, unknown sealers, and thin coatings.",
    whyFails: ["Alkaline chemistry swells or dulls sensitive films.", "Over-spray carries chemistry to unintended zones."],
    whatWorks: ["Stone-rated or neutral maintenance on sensitive zones; degreasers only where labels agree."],
    methods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls"), esSurface("granite-countertops", "Granite countertops")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("surface-dullness", "Surface dullness"), rp("uneven-finish", "Uneven finish")],
    hubProblems: [rp("grease-buildup", "Grease buildup"), rp("appliance-grime", "Buildup on appliances"), rp("cooked-on-grease", "Cooked-on grease")],
    comparisonPairs: [
      ["krud-kutter-kitchen-degreaser", "easy-off-kitchen-degreaser"],
    ],
    products: ["krud-kutter-kitchen-degreaser", "granite-gold-daily-cleaner"],
  },
  {
    slug: "why-soap-scum-isnt-just-soap",
    title: "Why soap scum isn’t just soap",
    summary: "Hard water minerals react with surfactants—film is often soap + mineral complex.",
    description: "Treat the film class, not the marketing word.",
    intro:
      "Soap scum behaves differently from loose dust or pure grease. Acid-tolerant surfaces may need descale thinking; sensitive stone needs stone-rated maintenance.",
    whyFails: ["All-purpose wipes move film without dissolving bonds.", "Wrong acid risks etch on the wrong finish."],
    whatWorks: ["Bath problem hubs + label-correct bathroom chemistry + ventilation."],
    methods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedProblems: [rp("soap-scum", "Soap scum"), rp("soap-film", "Soap film"), rp("hard-water-deposits", "Hard water deposits")],
    hubProblems: [rp("soap-scum", "Soap scum"), rp("soap-film", "Soap film"), rp("hard-water-deposits", "Hard water deposits")],
    comparisonPairs: [
      ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      ["method-daily-shower-spray", "scrubbing-bubbles-daily-shower-cleaner"],
    ],
    products: ["scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner", "clr-calcium-lime-rust"],
  },
  {
    slug: "why-hard-water-keeps-coming-back",
    title: "Why hard water keeps coming back",
    summary: "You removed film, not the water source—new droplets redeposit minerals immediately.",
    description: "Maintenance chemistry + drying habits + occasional descale where allowed.",
    intro:
      "Hard water is a supply chemistry problem. Cleaning resets the surface; it does not change what evaporates from the next rinse.",
    whyFails: ["Spotting returns with the next evaporation cycle.", "Incomplete rinse leaves nucleation sites."],
    whatWorks: ["Squeegee or dry glass, improve ventilation, use labeled descalers only on tolerant surfaces."],
    methods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("glass-cleaning", "Glass cleaning")],
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("water-spotting", "Water spotting"), rp("limescale-buildup", "Limescale buildup")],
    hubProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("water-spotting", "Water spotting"), rp("limescale-buildup", "Limescale buildup")],
    comparisonPairs: [
      ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
    ],
    products: ["clr-calcium-lime-rust", "windex-original-glass-cleaner"],
  },
  {
    slug: "why-one-direction-wiping-causes-streaks",
    title: "Why one-direction wiping causes streaks",
    summary: "Re-wiping spent product without a clean edge redistributes residue in visible bands.",
    description: "Fold cloths and rotate to clean faces.",
    intro:
      "Streaks are often mechanical: you are seeing cleaner residue left in wipe tracks, not mysterious glass disease.",
    whyFails: ["Saturated cloth edges smear instead of lift.", "Circular motions hide soil instead of removing it."],
    whatWorks: ["Work top-to-bottom with fresh faces; finish with dry buff on tolerant glass."],
    methods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("streaking-on-glass", "Streaking on glass"), rp("surface-streaking", "Surface streaking"), rp("product-residue-buildup", "Product residue buildup")],
    hubProblems: [rp("streaking-on-glass", "Streaking on glass"), rp("surface-streaking", "Surface streaking"), rp("smudge-marks", "Smudge marks")],
    comparisonPairs: [
      ["windex-original-glass-cleaner", "sprayway-glass-cleaner"],
    ],
    products: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
  },
  {
    slug: "why-hot-water-alone-wont-cut-grease",
    title: "Why hot water alone won’t cut grease",
    summary: "Heat lowers viscosity but does not emulsify—surfactants carry oil into rinse water.",
    description: "Pair heat with the right chemistry where labels allow.",
    intro:
      "Hot water helps on dishware with detergent present. On counters and hoods, heat without surfactant often just spreads a thinner oil film.",
    whyFails: ["No stable micelles → grease re-bonds on cooldown.", "Steam can drive soil into seams."],
    whatWorks: ["Surfactant-forward maintenance, then labeled degreasers for heavy zones."],
    methods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("greasy-grime", "Greasy grime")],
    hubProblems: [rp("grease-buildup", "Grease buildup"), rp("cooked-on-grease", "Cooked-on grease"), rp("burnt-residue", "Burnt residue")],
    comparisonPairs: [
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      ["dawn-platinum-dish-spray", "weiman-gas-range-cleaner-degreaser"],
    ],
    products: ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
  },
  {
    slug: "why-steel-wool-damages-finished-surfaces",
    title: "Why steel wool damages finished surfaces",
    summary: "Metal fibers embed and scratch; rust-prone fragments stain grout and stainless grain.",
    description: "Use non-scratch pads labeled for your finish.",
    intro:
      "Steel wool is for specific pro workflows—not a universal scrub upgrade for coated glass, polished stone, or factory appliance finishes.",
    whyFails: ["Hard fibers exceed coating hardness.", "Embedded fragments oxidize and leave rust trails."],
    whatWorks: ["Plastic razor lift on glass where trained; melamine-style erasers only where finish allows."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("granite-countertops", "Granite countertops")],
    relatedProblems: [rp("finish-scratches", "Finish scratches"), rp("stuck-on-residue", "Stuck-on residue"), rp("surface-dullness", "Surface dullness")],
    hubProblems: [rp("finish-scratches", "Finish scratches"), rp("etching-on-finishes", "Etching on finishes"), rp("stuck-on-residue", "Stuck-on residue")],
    comparisonPairs: [
      ["cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"],
      ["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"],
    ],
    products: ["weiman-stainless-steel-cleaner-polish", "cerama-bryte-cooktop-cleaner", "therapy-stainless-steel-cleaner-polish"],
  },
  {
    slug: "why-lemon-and-stone-dont-mix",
    title: "Why lemon and stone don’t mix",
    summary: "Citric acid is still acid—many marbles and limestones etch; sealers degrade unevenly.",
    description: "Stone-rated maintenance beats pantry acids.",
    intro:
      "Natural cleaning trends often smuggle acids into stone zones. The failure mode is permanent finish change, not “needs more scrubbing.”",
    whyFails: ["Calcium-bearing stone reacts with acid.", "Etching is not reversible with more lemon."],
    whatWorks: ["Stone daily cleaners and manufacturer guidance; separate bath descalers for tolerant porcelain only."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    surfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("tile", "Tile")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("etching-on-finishes", "Etching on finishes"), rp("surface-dullness", "Surface dullness")],
    hubProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("etching-on-finishes", "Etching on finishes"), rp("soap-film", "Soap film")],
    comparisonPairs: [
      ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
      ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
    ],
    products: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner", "heinz-distilled-white-vinegar-5pct"],
  },
  {
    slug: "why-rinsing-tools-prevents-streaks",
    title: "Why rinsing tools prevents streaks",
    summary: "Sponges and mop heads load chemistry—without rinse, you paint residue back on.",
    description: "Reset tools per room or per step.",
    intro:
      "The fifth wipe with a saturated sponge is not “more cleaning”—it is redepositing everything you picked up in step one.",
    whyFails: ["Soil load exceeds absorbency.", "Dirty water dries as film."],
    whatWorks: ["Rinse tools, change water, swap to clean microfiber for final passes."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    surfaces: [esSurface("tile", "Tile"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedProblems: [rp("surface-streaking", "Surface streaking"), rp("product-residue-buildup", "Product residue buildup"), rp("floor-residue-buildup", "Floor residue buildup")],
    hubProblems: [rp("product-residue-buildup", "Product residue buildup"), rp("floor-residue-buildup", "Floor residue buildup"), rp("general-soil", "General soil")],
    comparisonPairs: [
      ["bona-hard-surface-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"],
    ],
    products: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
  },
  {
    slug: "why-ventilation-matters-for-fumes",
    title: "Why ventilation matters for fumes",
    summary: "Inhalation risk scales with concentration × time—small bathrooms and closed kitchens compound exposure.",
    description: "Airflow is part of PPE.",
    intro:
      "Even everyday cleaners become hazardous when labels assume ventilation you are not providing.",
    whyFails: ["Vapor pressure climbs in still air.", "Mixing mistakes become emergencies faster."],
    whatWorks: ["Fans, open windows, leave the space during dwell when labels say so."],
    methods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), esMethod("soap-scum-removal", "Soap scum removal")],
    surfaces: [esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass")],
    relatedProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("mold-growth", "Mold growth"), rp("odor-retention", "Odor retention")],
    hubProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("mold-growth", "Mold growth"), rp("general-soil", "General soil")],
    comparisonPairs: [
      ["lysol-disinfectant-spray", "odoban-disinfectant-odor-eliminator"],
    ],
    products: ["lysol-disinfectant-spray", "scrubbing-bubbles-bathroom-grime-fighter"],
  },
  {
    slug: "why-overwet-mops-leave-residue",
    title: "Why overwet mops leave residue",
    summary: "Floors dry from the edges inward—puddles concentrate surfactant and soil in low spots.",
    description: "Damp mop, not flood mop.",
    intro:
      "Vinyl and laminate tolerate moisture differently than tile. Over-wetting is a top cause of hazy floors and seam swelling.",
    whyFails: ["Slow drying traps solutes.", "Dirty mop water equals thin mud."],
    whatWorks: ["Neutral floor chemistry, frequent water changes, and dry passes on resilient floors."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    surfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedProblems: [rp("floor-residue-buildup", "Floor residue buildup"), rp("surface-streaking", "Surface streaking"), rp("light-film-buildup", "Light film buildup")],
    hubProblems: [rp("floor-residue-buildup", "Floor residue buildup"), rp("general-soil", "General soil"), rp("product-residue-buildup", "Product residue buildup")],
    comparisonPairs: [
      ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
    ],
    products: ["bona-hard-surface-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"],
  },
  {
    slug: "why-labels-matter-on-stone-and-coatings",
    title: "Why labels matter on stone and coatings",
    summary: "“Works everywhere” marketing breaks first on acid-sensitive stone and factory coatings.",
    description: "Finish class beats bottle color.",
    intro:
      "The same acid that clears porcelain film can etch calcium-bearing stone. Labels exist because damage is not always visible in a 2-second spot test.",
    whyFails: ["Guessing pH on sealed stone is high stakes.", "Coatings void warranties with wrong chemistry."],
    whatWorks: ["Stone-rated dailies, manufacturer sheets, and problem hubs before power cleaners."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    surfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: [rp("etching-on-finishes", "Etching on finishes"), rp("surface-dullness", "Surface dullness"), rp("hard-water-deposits", "Hard water deposits")],
    hubProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("etching-on-finishes", "Etching on finishes"), rp("soap-film", "Soap film")],
    comparisonPairs: [
      ["method-wood-for-good-daily-clean", "pledge-multisurface-cleaner"],
      ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
    ],
    products: ["stonetech-daily-cleaner", "granite-gold-daily-cleaner", "simple-green-all-purpose-cleaner"],
  },
  {
    slug: "why-disinfectant-dwell-time-is-not-optional",
    title: "Why disinfectant dwell time is not optional",
    summary: "Kill claims are time-bound on the label—wipe-off in 5 seconds is often just wet dusting.",
    description: "Read dwell, then decide if disinfecting is even the goal.",
    intro:
      "If you need disinfection, the label’s contact time is part of the chemistry. Skipping it is the most common “disinfectant didn’t work” story.",
    whyFails: ["Insufficient contact → survival pockets.", "Soil shields organisms."],
    whatWorks: ["Remove soil, apply as directed, ventilate, then maintain with neutral cleaners between deep cycles."],
    methods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("biofilm-buildup", "Biofilm buildup"), rp("general-soil", "General soil")],
    hubProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("mold-growth", "Mold growth"), rp("general-soil", "General soil")],
    comparisonPairs: [
      ["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"],
    ],
    products: ["lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"],
  },
  {
    slug: "why-same-cloth-room-to-room-spreads-soil",
    title: "Why the same cloth room-to-room spreads soil",
    summary: "Cross-contamination moves bacteria and oils from high-soil zones to clean-looking finishes.",
    description: "Segment tools like a pro: bath vs kitchen vs glass.",
    intro:
      "One cloth ‘for the whole house’ is efficient until you grind bathroom film into kitchen cabinets.",
    whyFails: ["Soil loading transfers between rooms.", "Color-blind microfiber hides saturation."],
    whatWorks: ["Color coding, per-room bags, and final buff cloths that never touch toilets."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    surfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("odor-retention", "Odor retention"), rp("grease-buildup", "Grease buildup")],
    hubProblems: [rp("touchpoint-contamination", "Touchpoint contamination"), rp("general-soil", "General soil"), rp("grease-buildup", "Grease buildup")],
    comparisonPairs: [
      ["goo-gone-original-liquid", "un-du-adhesive-remover"],
      ["goo-gone-original-liquid", "3m-adhesive-remover"],
    ],
    products: ["clorox-disinfecting-wipes", "lysol-disinfectant-spray", "seventh-generation-disinfecting-multi-surface-cleaner"],
  },
  {
    slug: "why-abrasive-cleansers-arent-interchangeable",
    title: "Why abrasive cleansers aren’t interchangeable",
    summary: "Oxalic polish chemistry ≠ quartz-safe daily—grain and acid matter more than brand color.",
    description: "Match abrasive class to hardness and coating.",
    intro:
      "Powder cleansers dominate stainless restoration conversations, but they are the wrong default for many factory finishes.",
    whyFails: ["Hard particles scratch soft coatings.", "Acid content surprises users on sensitive stone."],
    whatWorks: ["Read finish class, test inconspicuously, prefer non-scratch lifts where possible."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedProblems: [rp("oxidation", "Oxidation / tarnish"), rp("finish-scratches", "Finish scratches"), rp("stuck-on-residue", "Stuck-on residue")],
    hubProblems: [rp("stuck-on-residue", "Stuck-on residue"), rp("oxidation", "Oxidation / tarnish"), rp("surface-dullness", "Surface dullness")],
    comparisonPairs: [
      ["sprayway-stainless-steel-cleaner", "therapy-stainless-steel-cleaner-polish"],
      ["therapy-stainless-steel-cleaner-polish", "weiman-stainless-steel-cleaner-polish"],
    ],
    products: ["bar-keepers-friend-cleanser", "therapy-stainless-steel-cleaner-polish", "weiman-stainless-steel-cleaner-polish"],
  },
  {
    slug: "why-glass-spray-on-grease-makes-smears",
    title: "Why glass spray on grease makes smears",
    summary: "Glass chemistry is not surfactant-loaded for lipids—you thin oil into smear tracks.",
    description: "Degrease tolerant zones, then glass-clean.",
    intro:
      "Cooktop splatter on a glass microwave door is a grease problem first. Glass spray redistributes oil into rainbow smears.",
    whyFails: ["Low lipid solubility in glass-focused formulas.", "Linty tools compound the look."],
    whatWorks: ["Remove grease with kitchen-appropriate chemistry, then finish with glass workflow on true glass."],
    methods: [esMethod("degreasing", "Degreasing"), esMethod("glass-cleaning", "Glass cleaning")],
    surfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedProblems: [rp("grease-buildup", "Grease buildup"), rp("smudge-marks", "Smudge marks"), rp("streaking-on-glass", "Streaking on glass")],
    hubProblems: [rp("grease-buildup", "Grease buildup"), rp("streaking-on-glass", "Streaking on glass"), rp("smudge-marks", "Smudge marks")],
    comparisonPairs: [
      ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      ["invisible-glass-premium-glass-cleaner", "windex-original-glass-cleaner"],
    ],
    products: ["dawn-platinum-dish-spray", "windex-original-glass-cleaner", "krud-kutter-kitchen-degreaser"],
  },
  {
    slug: "why-drying-beats-more-product",
    title: "Why drying beats more product",
    summary: "Evaporation deposits solutes—controlled drying removes the last dirty water layer.",
    description: "Squeegee, dry mop, or buff before re-spraying.",
    intro:
      "If two sprays failed, the third rarely fixes a drying problem. You are stacking films.",
    whyFails: ["Air dry leaves mineral edges on hard water.", "Humid rooms slow evaporation unevenly."],
    whatWorks: ["Mechanical water removal on glass and floors, then reassess true soil."],
    methods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    surfaces: [esSurface("shower-glass", "Shower glass"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedProblems: [rp("water-spotting", "Water spotting"), rp("streaking-on-glass", "Streaking on glass"), rp("hard-water-deposits", "Hard water deposits")],
    hubProblems: [rp("water-spotting", "Water spotting"), rp("streaking-on-glass", "Streaking on glass"), rp("surface-streaking", "Surface streaking")],
    comparisonPairs: [
      ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
    ],
    products: ["windex-original-glass-cleaner", "bona-hard-surface-floor-cleaner"],
  },
  {
    slug: "why-enzymes-need-dwell-time",
    title: "Why enzymes need dwell time",
    summary: "Biological chemistry works on contact time—spray-and-wipe often ends before proteins break down.",
    description: "Follow label dwell like disinfectants.",
    intro:
      "Enzyme products can work well on biological soils, but they lose to impatience more often than to the stain itself.",
    whyFails: ["Insufficient dwell → no meaningful breakdown.", "Wrong temperature range reduces activity."],
    whatWorks: ["Apply, wait per label, blot or extract, then reassess—not immediate scrubbing."],
    methods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    surfaces: [esSurface("laminate", "Laminate"), esSurface("tile", "Tile")],
    relatedProblems: [rp("odor-retention", "Odor retention"), rp("organic-stains", "Organic stains"), rp("biofilm-buildup", "Biofilm buildup")],
    hubProblems: [rp("odor-retention", "Odor retention"), rp("organic-stains", "Organic stains"), rp("biofilm-buildup", "Biofilm buildup")],
    comparisonPairs: [
      ["natures-miracle-stain-and-odor-remover", "biokleen-bac-out-stain-odor-remover"],
    ],
    products: ["natures-miracle-stain-and-odor-remover", "biokleen-bac-out-stain-odor-remover"],
  },
  {
    slug: "why-acid-on-grout-lines-is-risky",
    title: "Why acid on grout lines is risky",
    summary: "Cementitious grout is porous—repeat acid can weaken joints and discolor sealers unevenly.",
    description: "Test grout age and sealer before bathroom descalers.",
    intro:
      "The same acid that cheers up glass and chrome can age grout faster than you notice until corners powder.",
    whyFails: ["Acid attacks cement matrix over time.", "Color-sealed grout can fade unevenly."],
    whatWorks: ["Gentle maintenance, targeted problem hubs, and professional regrout when joints fail."],
    methods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    surfaces: [esSurface("grout", "Grout"), esSurface("tile", "Tile")],
    relatedProblems: [rp("hard-water-deposits", "Hard water deposits"), rp("soap-scum", "Soap scum"), rp("limescale-buildup", "Limescale buildup")],
    hubProblems: [rp("soap-scum", "Soap scum"), rp("limescale-buildup", "Limescale buildup"), rp("hard-water-deposits", "Hard water deposits")],
    comparisonPairs: [
      ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
      ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
    ],
    products: ["zep-shower-tub-tile-cleaner", "concrobium-mold-control", "clr-calcium-lime-rust"],
  },
];

export const ANTI_PATTERN_GUIDES_VOLUME2_BY_SLUG: Record<string, AuthorityGuidePageData> = Object.fromEntries(
  SPECS.map((s) => [s.slug, buildAntiPattern(s)]),
);
