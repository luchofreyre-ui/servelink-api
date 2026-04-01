import type {
  AuthorityEntitySummary,
  AuthorityGuidePageData,
  AuthorityProblemSummary,
} from "@/authority/types/authorityPageTypes";

/** Local pair normalizer — avoid importing comparison selectors (labeling ↔ guide data cycles). */
function cmpSlug(a: string, b: string): string {
  const [x, y] = a.localeCompare(b) <= 0 ? [a, b] : [b, a];
  return `${x}-vs-${y}`;
}

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;
const CmpM = (a: string, b: string) => `/compare/methods/${cmpSlug(a, b)}`;
const CmpP = (a: string, b: string) => `/compare/problems/${cmpSlug(a, b)}`;
const CmpPr = (a: string, b: string) => `/compare/products/${cmpSlug(a, b)}`;

function es(
  slug: string,
  title: string,
  href: string,
  summary?: string,
): AuthorityEntitySummary {
  return {
    slug,
    title,
    href,
    summary,
    kind: href.startsWith("/methods") ? "method" : "surface",
  };
}

function rp(slug: string, title: string, summary?: string): AuthorityProblemSummary {
  return { slug, title, href: P(slug), summary };
}

function cx(title: string, href: string, summary?: string): AuthorityEntitySummary {
  return { slug: href.replace(/\//g, "-"), title, href, summary };
}

const BEST_CLEANERS_FOR_KITCHENS: AuthorityGuidePageData = {
  slug: "best-cleaners-for-kitchens",
  title: "Best cleaners for kitchens (how to choose)",
  summary:
    "Route kitchen soil to the right problem hubs, chemistry families, and product comparisons—grease, film, and touchpoints need different lanes.",
  description:
    "Entry guide: match kitchen problems to methods, surfaces, and vetted product comparisons without treating every bottle as interchangeable.",
  category: "foundations",
  intro:
    "Kitchens concentrate grease, dried films, adhesive transfer, and high-touch smudges. The best cleaner is the one that matches the soil class and finish, then finishes with controlled rinse and dry so residue does not become the next problem.",
  sections: [
    {
      id: "start-with-soil-not-brand",
      title: "Start with soil class, not marketing claims",
      paragraphs: [
        "Lipid grease, polymerized cook-on film, mineral spotting at the sink, and simple fingerprints are different failure modes. A degreasing lane, a dwell-and-lift lane, and a neutral maintenance lane each have different risk profiles.",
        "If the visible issue is haze or streaks after cleaning, you may be fighting residue or technique—not a lack of stronger chemistry.",
      ],
      bulletPoints: [
        "Heavy grease on range zones usually wants a degreasing-class process with ventilation.",
        "Daily quartz or laminate tops often stay safer on neutral maintenance before escalation.",
        "When film keeps returning, verify rinse, tool choice, and whether the problem is mineral—not oil.",
      ],
    },
    {
      id: "link-out-to-graph",
      title: "Use problem hubs and playbooks as the source of truth",
      paragraphs: [
        "Product comparisons show how two SKUs split on shared scenarios; problem pages explain what the contamination actually is. Combine both so you are not over-trusting a single bottle name.",
      ],
      bulletPoints: [
        "Open the problem hub that matches what you see, then pick a method and surface playbook.",
        "When two products look similar, use a comparison page to see scenario splits and failure modes.",
      ],
    },
  ],
  relatedMethods: [
    es("degreasing", "Degreasing", M("degreasing")),
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
    es("glass-cleaning", "Glass cleaning", M("glass-cleaning")),
    es("dwell-and-lift-cleaning", "Dwell and lift cleaning", M("dwell-and-lift-cleaning")),
  ],
  relatedSurfaces: [
    es("stainless-steel", "Stainless steel", S("stainless-steel")),
    es("quartz-countertops", "Quartz countertops", S("quartz-countertops")),
    es("laminate", "Laminate", S("laminate")),
    es("tile", "Tile", S("tile")),
  ],
  relatedProblems: [
    rp("grease-buildup", "Grease buildup"),
    rp("cooked-on-grease", "Cooked-on grease"),
    rp("fingerprints-and-smudges", "Fingerprints and smudges"),
    rp("stuck-on-residue", "Stuck-on residue"),
    rp("appliance-grime", "Appliance grime"),
  ],
  linkGroups: [
    {
      title: "Problem hubs (kitchen-heavy)",
      links: [
        cx("Grease buildup", P("grease-buildup"), "Lipid soils on fronts, hoods, and splatter zones."),
        cx("Cooked-on grease", P("cooked-on-grease"), "Heat-set films on cooktops and pans."),
        cx("Stuck-on residue", P("stuck-on-residue"), "Dried films that need dwell before abrasion."),
        cx("Fingerprints and smudges", P("fingerprints-and-smudges"), "High-gloss fronts and panels."),
      ],
    },
    {
      title: "Product comparisons",
      links: [
        cx(
          "Dish spray vs kitchen degreaser",
          CmpPr("dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"),
          "Everyday surfactant lift vs labeled degreaser lanes.",
        ),
        cx(
          "Cooktop cleaner vs range degreaser",
          CmpPr("cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"),
          "Glass-ceramic care vs steel range films.",
        ),
      ],
    },
    {
      title: "Method & problem comparisons",
      links: [
        cx(
          "Degreasing vs neutral cleaning",
          CmpM("degreasing", "neutral-surface-cleaning"),
          "When lipid removal justifies stronger surfactant vs daily-safe maintenance.",
        ),
        cx(
          "Grease buildup vs stuck-on residue",
          CmpP("grease-buildup", "stuck-on-residue"),
          "Oil-based vs cured film—different escalation paths.",
        ),
      ],
    },
  ],
};

const BEST_CLEANERS_FOR_BATHROOMS: AuthorityGuidePageData = {
  slug: "best-cleaners-for-bathrooms",
  title: "Best cleaners for bathrooms (how to choose)",
  summary:
    "Separate bath films, minerals, and biological growth so you do not acid-wash the wrong surface or confuse disinfection with soil removal.",
  description:
    "Entry guide: bathroom problems, surfaces, and comparisons for soap film, minerals, and moisture-adjacent risks.",
  category: "foundations",
  intro:
    "Bathrooms stack soap film, hard water spotting, grout porosity, and ventilation-limited chemistry. The best approach names the problem correctly first, then picks a method family that matches both the soil and the surface warranty.",
  sections: [
    {
      id: "film-vs-mineral-vs-bio",
      title: "Film, mineral, and biological issues are not one product problem",
      paragraphs: [
        "Soap scum behaves differently from limescale crystals, and both behave differently from mold that needs moisture control. Marketing language often collapses them; your process should not.",
      ],
      bulletPoints: [
        "Acid-class mineral removers are powerful and label-sensitive—surface class matters.",
        "Disinfectant labels describe kill claims, not automatic removal of visible film.",
        "Persistent musty odor usually needs source control, not only a scented spray.",
      ],
    },
    {
      id: "ventilation-and-rinse",
      title: "Ventilation and rinse complete the bath loop",
      paragraphs: [
        "Bath failures often return because chemistry was left to dry on glass or grout, or because humidity never drops between cleans.",
      ],
    },
  ],
  relatedMethods: [
    es("soap-scum-removal", "Soap scum removal", M("soap-scum-removal")),
    es("hard-water-deposit-removal", "Hard water deposit removal", M("hard-water-deposit-removal")),
    es("glass-cleaning", "Glass cleaning", M("glass-cleaning")),
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
  ],
  relatedSurfaces: [
    es("shower-glass", "Shower glass", S("shower-glass")),
    es("tile", "Tile", S("tile")),
    es("grout", "Grout", S("grout")),
    es("vinyl-flooring", "Vinyl flooring", S("vinyl-flooring")),
  ],
  relatedProblems: [
    rp("soap-scum", "Soap scum"),
    rp("hard-water-deposits", "Hard water deposits"),
    rp("soap-film", "Soap film"),
    rp("limescale-buildup", "Limescale buildup"),
    rp("light-mildew", "Light mildew appearance"),
    rp("mold-growth", "Mold growth"),
  ],
  linkGroups: [
    {
      title: "Problem hubs (bath-heavy)",
      links: [
        cx("Soap scum", P("soap-scum"), "Combined soap and mineral film behavior."),
        cx("Hard water deposits", P("hard-water-deposits"), "Spotting and crystal buildup."),
        cx("Limescale buildup", P("limescale-buildup"), "Joint and fixture scale."),
        cx("Soap film", P("soap-film"), "Thin recurring film on glass and tile."),
        cx("Mold growth", P("mold-growth"), "Moisture-driven growth—source matters."),
      ],
    },
    {
      title: "Product comparisons",
      links: [
        cx(
          "CLR vs Lime-A-Way",
          CmpPr("clr-calcium-lime-rust", "lime-a-way-cleaner"),
          "Acid-class mineral removers on labeled-safe surfaces.",
        ),
        cx(
          "Lysol spray vs Microban 24",
          CmpPr("lysol-disinfectant-spray", "microban-24-hour-disinfectant-sanitizing-spray"),
          "Disinfectant labels, dwell, and soil removal are different jobs.",
        ),
      ],
    },
    {
      title: "Problem & method comparisons",
      links: [
        cx(
          "Soap scum vs hard water",
          CmpP("soap-scum", "hard-water-deposits"),
          "Film chemistry vs crystal deposits—overlap but not identical."),
        cx(
          "Hard water removal vs neutral cleaning",
          CmpM("hard-water-deposit-removal", "neutral-surface-cleaning"),
          "When acid-class steps are justified vs daily maintenance.",
        ),
      ],
    },
  ],
};

const BEST_CLEANERS_FOR_FLOORS: AuthorityGuidePageData = {
  slug: "best-cleaners-for-floors",
  title: "Best cleaners for floors (how to choose)",
  summary:
    "Floors fail from mop residue, wrong dilution, and confusing scuffs with grease—use problem hubs and neutral floor lanes before chasing glossy coatings.",
  description:
    "Entry guide: resilient and hard-surface floors, residue control, and vetted floor-cleaner comparisons.",
  category: "foundations",
  intro:
    "Floor cleaning is mostly residue discipline: too much product, too little rinse, or the wrong tool loads soil back onto the surface. Start with the floor material, then match neutral maintenance to traffic type before escalating.",
  sections: [
    {
      id: "residue-is-the-hidden-failure",
      title: "Residue is the most common hidden failure mode",
      paragraphs: [
        "Streaks and tacky floors often mean cleaner dried into the film, or mop heads that redeposit soil. Fixing the chemistry without fixing the tool loop keeps the problem alive.",
      ],
      bulletPoints: [
        "Dilute to label strength; more concentrate is not automatically more clean.",
        "Rinse or swap water often in high-soil passes.",
        "Separate ‘gloss restoration’ marketing from soil removal.",
      ],
    },
  ],
  relatedMethods: [
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
    es("detail-dusting", "Detail dusting", M("detail-dusting")),
    es("dwell-and-lift-cleaning", "Dwell and lift cleaning", M("dwell-and-lift-cleaning")),
  ],
  relatedSurfaces: [
    es("vinyl-flooring", "Vinyl flooring", S("vinyl-flooring")),
    es("tile", "Tile", S("tile")),
    es("laminate", "Laminate", S("laminate")),
    es("finished-wood", "Finished wood", S("finished-wood")),
  ],
  relatedProblems: [
    rp("floor-residue-buildup", "Floor residue buildup"),
    rp("general-soil", "General soil"),
    rp("scuff-marks", "Scuff marks"),
    rp("dust-buildup", "Dust buildup"),
    rp("greasy-grime", "Greasy grime"),
  ],
  linkGroups: [
    {
      title: "Problem hubs (floors)",
      links: [
        cx("Floor residue buildup", P("floor-residue-buildup"), "Cleaner film and mop redeposit."),
        cx("General soil", P("general-soil"), "Traffic lanes and mixed finishes."),
        cx("Scuff marks", P("scuff-marks"), "Mechanical marks vs true stains."),
        cx("Dust buildup", P("dust-buildup"), "Dry soil before damp mopping."),
      ],
    },
    {
      title: "Product comparisons",
      links: [
        cx(
          "Bona hard-surface vs Zep neutral floor",
          CmpPr("bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"),
          "Neutral maintenance on labeled hard surfaces.",
        ),
        cx(
          "Bona vs Rejuvenate LVP",
          CmpPr("bona-hard-surface-floor-cleaner", "rejuvenate-luxury-vinyl-floor-cleaner"),
          "Resilient-floor labeled lanes.",
        ),
      ],
    },
    {
      title: "Surface comparisons",
      links: [
        cx(
          "Painted walls vs tile (traffic thinking)",
          `/compare/surfaces/${cmpSlug("painted-walls", "tile")}`,
          "Why wall products and floor products diverge.",
        ),
      ],
    },
  ],
};

const BEST_CLEANERS_FOR_APPLIANCES: AuthorityGuidePageData = {
  slug: "best-cleaners-for-appliances",
  title: "Best cleaners for appliances (how to choose)",
  summary:
    "Ovens, cooktops, and stainless fronts need different lanes—carbonized soil, glass-ceramic polish risk, and grain direction all change the playbook.",
  description:
    "Entry guide: appliance soils, stainless fronts, and heavy-duty oven cleaner comparisons.",
  category: "foundations",
  intro:
    "Appliances collect carbonized soil, adhesive labels, and greasy films on different substrates. Match the problem hub to what you see, then pick chemistry that the appliance manufacturer and coating type can tolerate.",
  sections: [
    {
      id: "oven-vs-front-panel",
      title: "Oven interiors and front panels are different risk profiles",
      paragraphs: [
        "Heavy-duty oven chemistry is built for enclosed, labeled oven cavities—not for every adjacent surface. Stainless fronts, controls, and surrounding cabinetry usually need a narrower lane.",
      ],
      bulletPoints: [
        "Ventilate for any high-alkaline or solvent-heavy product.",
        "Test inconspicuously when coatings or prints are unknown.",
        "Burnt-on soil often needs dwell time before aggressive scraping.",
      ],
    },
  ],
  relatedMethods: [
    es("degreasing", "Degreasing", M("degreasing")),
    es("dwell-and-lift-cleaning", "Dwell and lift cleaning", M("dwell-and-lift-cleaning")),
    es("neutral-surface-cleaning", "Neutral surface cleaning", M("neutral-surface-cleaning")),
  ],
  relatedSurfaces: [
    es("stainless-steel", "Stainless steel", S("stainless-steel")),
    es("tile", "Tile", S("tile")),
    es("laminate", "Laminate", S("laminate")),
  ],
  relatedProblems: [
    rp("burnt-residue", "Burnt residue"),
    rp("cooked-on-grease", "Cooked-on grease"),
    rp("appliance-grime", "Appliance grime"),
    rp("grease-buildup", "Grease buildup"),
    rp("stuck-on-residue", "Stuck-on residue"),
  ],
  linkGroups: [
    {
      title: "Problem hubs (appliances)",
      links: [
        cx("Burnt residue", P("burnt-residue"), "Carbonized oven and pan films."),
        cx("Cooked-on grease", P("cooked-on-grease"), "Heat-set grease on cooktops."),
        cx("Appliance grime", P("appliance-grime"), "Front panels, handles, and vents."),
      ],
    },
    {
      title: "Product comparisons",
      links: [
        cx(
          "Easy-Off vs Zep oven & grill",
          CmpPr("easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"),
          "Heavy-duty oven cavity chemistry—label and ventilate.",
        ),
        cx(
          "Cerama Bryte vs Weiman range degreaser",
          CmpPr("cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"),
          "Cooktop polish risk vs range grease films.",
        ),
      ],
    },
    {
      title: "Method comparisons",
      links: [
        cx(
          "Dwell-and-lift vs degreasing",
          CmpM("dwell-and-lift-cleaning", "degreasing"),
          "When time and softening beat immediate surfactant attack.",
        ),
      ],
    },
  ],
};

export const BEST_CLEANERS_ENTRY_GUIDES_BY_SLUG: Record<string, AuthorityGuidePageData> = {
  "best-cleaners-for-kitchens": BEST_CLEANERS_FOR_KITCHENS,
  "best-cleaners-for-bathrooms": BEST_CLEANERS_FOR_BATHROOMS,
  "best-cleaners-for-floors": BEST_CLEANERS_FOR_FLOORS,
  "best-cleaners-for-appliances": BEST_CLEANERS_FOR_APPLIANCES,
};
