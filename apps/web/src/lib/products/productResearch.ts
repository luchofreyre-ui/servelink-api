import type { CleaningProductResearch } from "./productResearchTypes";
import { PRODUCT_RESEARCH_EXTRA } from "./productResearchExpansion";

export const PRODUCT_RESEARCH: Record<string, CleaningProductResearch> = {
  "bar-keepers-friend-cleanser": {
    slug: "bar-keepers-friend-cleanser",
    manufacturerSummary:
      "A powdered hard-surface cleanser centered on oxalic-acid stain removal with abrasive support for restoring mineral-stained and tarnished surfaces.",
    manufacturerClaims: [
      "Removes rust stains",
      "Cuts mineral deposits",
      "Restores stainless steel and cookware",
      "Removes tarnish and discoloration",
    ],
    activeIngredients: ["oxalic acid", "abrasive mineral", "surfactants"],
    rinseGuidance:
      "Rinse thoroughly after use and fully clear residue from the surface.",
    residueNotes:
      "Can leave visible powder residue if under-rinsed or used too heavily.",
    fragranceNotes: "Low fragrance profile; more functional than perfumed.",
    safetyWarnings: [
      "Can irritate skin and eyes",
      "Can scratch delicate or glossy finishes",
      "Do not leave residue on food-contact surfaces",
    ],
    incompatibilities: ["bleach", "ammonia"],
    ppeRecommendations: ["gloves"],
    ventilationNotes:
      "Normal household ventilation is usually sufficient, but avoid prolonged exposure in tight spaces.",
    expertAnalysis: [
      "Its strongest value is oxalic-acid-driven removal of rust, mineral deposits, and some discoloration patterns that ordinary detergents leave behind.",
      "The abrasive component improves restoration power but raises scratch risk on soft, polished, coated, or delicate surfaces.",
      "This is best understood as a restoration cleaner, not a universal daily cleaner.",
    ],
    commonMisusePatterns: [
      "Using it on delicate finishes or polished stone",
      "Scrubbing too aggressively on glossy metal or glass-adjacent trim",
      "Treating it like a no-rinse everyday cleaner",
    ],
    bestAlternatives: [
      "Bon Ami Powder Cleanser",
      "CLR Calcium, Lime & Rust Remover",
    ],
    useInsteadOf: [
      "Use this instead of dish soap for rust and mineral staining",
      "Use this instead of weak all-purpose cleaners for stainless discoloration",
    ],
    verdictSummary:
      "One of the strongest consumer products for rust, mineral, and tarnish correction on suitable hard surfaces, but it should be used selectively and with surface awareness.",
    reviewHighlights: [
      "Restores stainless steel shine effectively",
      "Removes stubborn rust and mineral stains",
      "Performs well on cookware and sinks",
    ],
    reviewComplaints: [
      "Can scratch if overworked",
      "Powder residue can linger if not rinsed well",
      "Not ideal for delicate finishes",
    ],
    sources: [
      {
        label: "Bar Keepers Friend product page",
        url: "https://barkeepersfriend.com/products/cleanser/",
        type: "manufacturer",
      },
      {
        label: "Bar Keepers Friend cleanser SDS",
        url: "https://www.barkeepersfriend.com/wp-content/uploads/2014/12/SDS_BKF_Cleanser_Polish_6-12-15.pdf",
        type: "sds",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "dawn-platinum-dish-spray": {
    slug: "dawn-platinum-dish-spray",
    manufacturerSummary:
      "A high-performance dish soap built around surfactant-driven grease and food-residue removal for manual cleaning.",
    manufacturerClaims: [
      "Cuts grease effectively",
      "Removes stuck-on food soils",
      "Designed for dish and kitchen cleaning",
    ],
    activeIngredients: ["surfactants"],
    rinseGuidance:
      "Designed to rinse clean, but overuse can still leave film if diluted poorly or under-rinsed.",
    residueNotes:
      "Generally low residue when properly diluted and rinsed; film risk increases with overapplication.",
    fragranceNotes:
      "Noticeable fragrance depending on variant; typically moderate household scent profile.",
    safetyWarnings: [
      "Can irritate eyes",
      "May dry skin with repeated exposure",
    ],
    ppeRecommendations: [],
    ventilationNotes: "No unusual ventilation requirements for routine use.",
    expertAnalysis: [
      "This is a strong grease-and-food-residue cleaner because of surfactant strength and dwell-assisted manual cleaning performance.",
      "Its real strength is versatility in kitchen cleaning, but it should not be treated as a specialist for mineral deposits, rust, or restoration work.",
      "It is best classified as a surfactant-first cleaner, not a heavy restoration chemical.",
    ],
    commonMisusePatterns: [
      "Using it as a hard-water or mineral remover",
      "Using too much and causing streaking or film",
      "Expecting disinfecting performance from a dish soap workflow",
    ],
    bestAlternatives: [
      "Method Heavy Duty Degreaser",
      "Krud Kutter Original Cleaner/Degreaser",
    ],
    useInsteadOf: [
      "Use this instead of weak bargain dish soaps for heavy grease",
      "Use this instead of all-purpose cleaner for hand-washed greasy kitchen items",
    ],
    verdictSummary:
      "A very strong mainstream grease and food-residue cleaner, especially for kitchen workflows, but it is still a detergent—not a descaler, rust remover, or disinfectant substitute.",
    reviewHighlights: [
      "Cuts grease fast",
      "Performs well on pots, pans, and stovetop residue",
      "Easy dispensing format",
    ],
    reviewComplaints: [
      "Can be overused and create film",
      "Fragrance may be stronger than some users want",
      "Not ideal for mineral or hard-water problems",
    ],
    sources: [
      {
        label: "Dawn Platinum EZ-Squeeze product page",
        url: "https://dawn-dish.com/en-us/products/dawn-platinum-ez-squeeze-fresh-rain-scent/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "clr-calcium-lime-rust": {
    slug: "clr-calcium-lime-rust",
    manufacturerSummary:
      "An acidic descaler and rust remover formulated for calcium, lime, and rust deposits on compatible hard surfaces.",
    manufacturerClaims: [
      "Removes calcium buildup",
      "Cuts lime and hard-water deposits",
      "Removes rust stains",
    ],
    activeIngredients: ["acidic descaling agents"],
    dwellTime: "Follow label dwell guidance closely; avoid extended overexposure.",
    rinseGuidance:
      "Rinse thoroughly after treatment, especially on surfaces where residue may continue reacting.",
    residueNotes:
      "Primary concern is not cosmetic residue but continued chemical interaction if under-rinsed.",
    fragranceNotes:
      "Functional chemical odor; more noticeable than daily cleaners.",
    safetyWarnings: [
      "Can irritate skin and eyes",
      "Can damage incompatible surfaces",
      "Can generate dangerous fumes if mixed improperly",
    ],
    incompatibilities: ["bleach", "chlorine products", "pool chemicals"],
    ppeRecommendations: ["gloves", "eye protection"],
    ventilationNotes:
      "Use with strong ventilation, especially in bathrooms or enclosed spaces.",
    expertAnalysis: [
      "CLR is highly useful when the real problem is mineral scale, limescale, calcium, or rust—not grease or organic film.",
      "Its value comes from acidic chemistry, which also creates the need for strict surface compatibility rules.",
      "This should not be treated as a general bathroom cleaner; it is a targeted mineral-and-rust correction product.",
    ],
    commonMisusePatterns: [
      "Using it on natural stone or incompatible finishes",
      "Using it for soap-and-grease problems better handled by surfactants",
      "Mixing it near bleach or chlorine chemistry",
    ],
    bestAlternatives: [
      "Lime-A-Way Cleaner",
      "Zep Calcium, Lime & Rust Stain Remover",
      "Bar Keepers Friend Cleanser",
    ],
    useInsteadOf: [
      "Use this instead of dish soap for calcium, lime, and rust",
      "Use this instead of vinegar when stronger descaling power is needed",
    ],
    verdictSummary:
      "A strong targeted descaler and rust remover with real value for mineral-heavy cleaning problems, but its surface restrictions and mixing risks must be taken seriously.",
    reviewHighlights: [
      "Very effective on hard-water buildup",
      "Removes rust and mineral scale quickly",
      "Useful in bathrooms and around fixtures",
    ],
    reviewComplaints: [
      "Strong smell",
      "Can damage the wrong surfaces",
      "Requires care and rinsing discipline",
    ],
    sources: [
      {
        label: "CLR product page",
        url: "https://www.clrbrands.com/products/clr-household/clr-calcium-lime-and-rust-remover/",
        type: "manufacturer",
      },
      {
        label: "CLR SDS",
        url: "https://clrbrands.com/wp-content/uploads/2025/07/CLR-Brands-CALCIUM-LIME-RUST-SDS_19-March-2025.pdf",
        type: "sds",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "oxiclean-versatile-stain-remover": {
    slug: "oxiclean-versatile-stain-remover",
    manufacturerSummary:
      "An oxygen-based stain remover centered on sodium percarbonate chemistry for oxidation-driven stain treatment.",
    manufacturerClaims: [
      "Removes many household stains",
      "Uses oxygen-based cleaning power",
      "Supports laundry and other household stain workflows",
    ],
    activeIngredients: [
      "sodium percarbonate",
      "sodium carbonate",
      "surfactants",
      "polymer",
    ],
    dwellTime:
      "Performance improves with soak or dwell time where label directions support it.",
    rinseGuidance:
      "Rinse or wash out thoroughly after treatment to prevent leftover residue.",
    residueNotes:
      "Powder products can leave residue if under-dissolved or under-rinsed.",
    fragranceNotes: "Low to mild scent compared with heavily fragranced cleaners.",
    safetyWarnings: [
      "Can irritate eyes and skin",
      "Can discolor or weaken sensitive materials if misused",
    ],
    incompatibilities: [],
    ppeRecommendations: ["gloves"],
    ventilationNotes: "No unusual ventilation requirements for typical use.",
    expertAnalysis: [
      "This is best understood as an oxidizer-plus-alkaline stain remover rather than a general all-purpose cleaner.",
      "It is strongest for stain categories where oxygen bleaching helps, not for grease-heavy, adhesive, or mineral-heavy correction.",
      "Its usefulness expands with correct dwell time, dilution, and rinsing discipline.",
    ],
    commonMisusePatterns: [
      "Using it as a universal degreaser",
      "Applying it casually to color-sensitive or delicate materials",
      "Expecting mineral-removal performance from an oxygen stain remover",
    ],
    bestAlternatives: [
      "OxiClean Max Force Laundry Stain Remover Spray",
      "Lysol Disinfectant Spray",
      "Dawn Platinum EZ-Squeeze",
    ],
    useInsteadOf: [
      "Use this instead of weak laundry boosters for oxygen-based stain work",
      "Use this instead of chlorine bleach when oxygen chemistry is the better fit",
    ],
    verdictSummary:
      "A strong oxygen-based stain treatment product with broad household usefulness, but it works best when used as a stain system rather than a general cleaner.",
    reviewHighlights: [
      "Helpful on laundry and stain removal",
      "Good oxygen-based alternative to harsher bleach workflows",
      "Useful for soak-based stain treatment",
    ],
    reviewComplaints: [
      "Can leave residue if not dissolved well",
      "Not ideal for grease-heavy cleaning",
      "Can disappoint when used outside stain-removal scenarios",
    ],
    sources: [
      {
        label: "OxiClean Versatile Stain Remover product page",
        url: "https://www.oxiclean.com/en/products/stain-fighters/oxiclean-versatile-stain-remover",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "heinz-distilled-white-vinegar-5pct": {
    slug: "heinz-distilled-white-vinegar-5pct",
    manufacturerSummary:
      "A distilled white vinegar product with 5% acidity often used as a household cleaning baseline and mild acidic comparator.",
    manufacturerClaims: ["5% acidity distilled white vinegar"],
    activeIngredients: ["acetic acid"],
    phRange: "Acidic",
    rinseGuidance:
      "Rinse where odor, lingering acidity, or food-contact cleanliness matters.",
    residueNotes:
      "Low visible residue, but odor and acid exposure can remain relevant after use.",
    fragranceNotes: "Strong vinegar odor during and shortly after use.",
    safetyWarnings: [
      "Can irritate eyes",
      "Can etch or dull sensitive stone and some finishes",
    ],
    incompatibilities: ["bleach"],
    ppeRecommendations: [],
    ventilationNotes:
      "Ventilation helps manage odor in enclosed spaces.",
    expertAnalysis: [
      "This is important as a reference product because many users overestimate what vinegar can do across all cleaning scenarios.",
      "It can help with mild mineral issues and odor-related DIY workflows, but it is often weaker than purpose-built descalers and ineffective for grease-heavy cleaning.",
      "Its biggest value in your library is as a comparison benchmark, not as a universal recommendation leader.",
    ],
    commonMisusePatterns: [
      "Using it on natural stone",
      "Using it for grease problems better handled by surfactants or degreasers",
      "Treating it as a disinfectant substitute",
    ],
    bestAlternatives: [
      "CLR Calcium, Lime & Rust Remover",
      "Dawn Platinum EZ-Squeeze",
    ],
    useInsteadOf: [
      "Use this instead of stronger acids only when a mild acidic baseline is appropriate",
      "Use this instead of fragranced household hacks when simplicity matters more than power",
    ],
    verdictSummary:
      "Useful as a mild acidic benchmark and household reference point, but overused and often overrated compared with specialized cleaning chemistry.",
    reviewHighlights: [
      "Cheap and widely available",
      "Useful for simple household workflows",
      "Recognizable baseline cleaner",
    ],
    reviewComplaints: [
      "Strong smell",
      "Limited power versus purpose-built products",
      "Can damage the wrong surfaces",
    ],
    sources: [
      {
        label: "Heinz distilled white vinegar product page",
        url: "https://www.heinz.com/products/00013000008525-distilled-white-vinegar-with-5-acidity",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "lysol-disinfectant-spray": {
    slug: "lysol-disinfectant-spray",
    manufacturerSummary:
      "A disinfectant aerosol designed for hard and certain soft-surface sanitizing and disinfecting workflows when label directions are followed.",
    manufacturerClaims: [
      "Kills 99.9% of viruses and bacteria",
      "Disinfects hard surfaces",
      "Can be used on selected soft surfaces per label",
    ],
    activeIngredients: ["disinfectant actives"],
    dwellTime:
      "Effectiveness depends on label contact time and full wet coverage.",
    fragranceNotes:
      "Typically moderate to strong fragrance depending on variant.",
    safetyWarnings: [
      "Do not inhale intentionally",
      "Use away from open flame or ignition sources",
      "Can irritate eyes and skin",
    ],
    incompatibilities: [],
    ppeRecommendations: [],
    ventilationNotes:
      "Use with ventilation, especially for repeated indoor spraying.",
    expertAnalysis: [
      "This product is strongest when the goal is label-backed disinfecting or sanitizing, not just visual cleaning.",
      "Its soft-surface usefulness is part of what makes it distinct from many standard liquid hard-surface disinfectants.",
      "Users often misuse disinfectant sprays by skipping cleaning, under-wetting, or ignoring contact time.",
    ],
    commonMisusePatterns: [
      "Spraying lightly without achieving contact time",
      "Using it as a grease cleaner first",
      "Assuming visible cleaning equals full disinfection",
    ],
    bestAlternatives: [
      "Clorox Disinfecting Wipes",
      "Seventh Generation Disinfecting Multi-Surface Cleaner",
    ],
    useInsteadOf: [
      "Use this instead of standard all-purpose spray when disinfection is the priority",
      "Use this instead of non-disinfecting fabric freshener when label soft-surface sanitizing matters",
    ],
    verdictSummary:
      "Strong value when true disinfecting is needed and the label is followed carefully, but its performance is heavily dependent on process discipline.",
    reviewHighlights: [
      "Convenient disinfecting format",
      "Useful for quick hard-surface treatment",
      "Trusted household disinfectant brand recognition",
    ],
    reviewComplaints: [
      "Strong aerosol smell",
      "Can feel harsh in enclosed spaces",
      "Users dislike waiting for full contact time",
    ],
    sources: [
      {
        label: "Lysol disinfectant spray product page",
        url: "https://www.lysol.com/products/disinfectant-spray/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "windex-original-glass-cleaner": {
    slug: "windex-original-glass-cleaner",
    manufacturerSummary:
      "A mainstream glass cleaner built for streak-resistant cleaning on glass, mirrors, and similar hard shiny surfaces.",
    manufacturerClaims: [
      "Cleans glass and mirrors",
      "Helps deliver a streak-free shine",
    ],
    activeIngredients: ["detergents", "solvents", "ammonia-based components"],
    rinseGuidance:
      "Typically designed as a wipe-dry cleaner rather than a rinse-required product.",
    residueNotes:
      "Low residue when used correctly, but overapplication can still cause smearing or streaking.",
    fragranceNotes:
      "Moderate cleaner scent depending on variant.",
    safetyWarnings: [
      "Can irritate eyes",
      "Not a fit for every coated or specialty surface without label confirmation",
    ],
    incompatibilities: [],
    ppeRecommendations: [],
    ventilationNotes:
      "Routine room ventilation is generally enough for normal use.",
    expertAnalysis: [
      "Windex is strongest when the real goal is quick visual clarity on glass and mirror surfaces.",
      "Its value comes from evaporation profile and low-residue wiping behavior, not from deep degreasing, descaling, or restoration chemistry.",
      "Users often over-assign glass cleaners to jobs that actually need detergent, acid, or specialty chemistry.",
    ],
    commonMisusePatterns: [
      "Using it for mineral-heavy shower buildup",
      "Trying to use it as a grease specialist",
      "Overapplying and causing streaks",
    ],
    bestAlternatives: [
      "Sprayway Glass Cleaner",
      "Invisible Glass Premium Glass Cleaner",
    ],
    useInsteadOf: [
      "Use this instead of all-purpose cleaner when visual glass clarity is the main goal",
      "Use this instead of heavier cleaners that tend to smear on mirrors",
    ],
    verdictSummary:
      "A strong everyday glass-and-mirror cleaner for fast shine and low-residue wiping, but not a specialist for hard-water, grease, or restoration problems.",
    reviewHighlights: [
      "Quick shine on mirrors and windows",
      "Easy to use",
      "Widely trusted for glass cleaning",
    ],
    reviewComplaints: [
      "Can streak if overused",
      "Not enough for hard-water or shower-glass correction",
      "Fragrance can bother some users",
    ],
    sources: [
      {
        label: "Windex FAQ",
        url: "https://windex.com/en-us/faq",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "scrubbing-bubbles-bathroom-grime-fighter": {
    slug: "scrubbing-bubbles-bathroom-grime-fighter",
    manufacturerSummary:
      "A bathroom-focused cleaner designed for soap scum, grime, and hard-surface bathroom cleaning workflows.",
    manufacturerClaims: [
      "Removes bathroom grime",
      "Targets soap scum and buildup",
      "Designed for bathroom hard surfaces",
    ],
    activeIngredients: ["surfactants", "bathroom cleaning actives"],
    dwellTime:
      "Performance improves when allowed brief dwell before wiping or rinsing.",
    rinseGuidance:
      "Rinse or wipe thoroughly, especially on high-residue bathroom soils.",
    residueNotes:
      "Can leave some film if overapplied or under-rinsed on glossy surfaces.",
    fragranceNotes: "Moderate to strong bathroom-cleaner scent.",
    safetyWarnings: [
      "Can irritate eyes and skin",
      "Use carefully in enclosed bathrooms",
    ],
    incompatibilities: [],
    ppeRecommendations: ["gloves"],
    ventilationNotes:
      "Ventilation is helpful in bathrooms due to aerosol or stronger fragrance exposure.",
    expertAnalysis: [
      "This is strongest on soap-scum and bathroom-grime workflows where surfactant action and bathroom-specific dwell behavior matter.",
      "It is more useful as a bathroom maintenance cleaner than as a deep descaler or hard-water specialist.",
      "Users often expect one bathroom spray to solve mineral scale, mold, soap scum, and disinfection equally well, which is rarely true.",
    ],
    commonMisusePatterns: [
      "Using it as a true hard-water descaler",
      "Expecting restoration-level performance on heavy mineral film",
      "Using too much product on glossy surfaces and creating film",
    ],
    bestAlternatives: [
      "Lysol Power Bathroom Cleaner",
      "Zep Shower, Tub & Tile Cleaner",
    ],
    useInsteadOf: [
      "Use this instead of all-purpose spray for bathroom grime and soap scum maintenance",
      "Use this instead of a plain glass cleaner in mixed bathroom residue conditions",
    ],
    verdictSummary:
      "A strong bathroom-maintenance cleaner for soap scum and daily grime, but not the best choice for severe mineral scale or restoration-level buildup.",
    reviewHighlights: [
      "Works well on bathroom grime",
      "Useful for routine shower and tub cleaning",
      "Convenient spray format",
    ],
    reviewComplaints: [
      "Can struggle with severe hard-water deposits",
      "Scent can be strong",
      "Can leave film if overused",
    ],
    sources: [
      {
        label: "Scrubbing Bubbles Grime Fighter product page",
        url: "https://scrubbingbubbles.com/en-us/products/multi-surface/grime-fighter-aerosol",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "goo-gone-original-liquid": {
    slug: "goo-gone-original-liquid",
    manufacturerSummary:
      "A specialty sticky-residue remover designed for adhesive, gummy, greasy, and waxy residues.",
    manufacturerClaims: [
      "Removes adhesive residue",
      "Cuts sticky messes",
      "Helps remove waxy and greasy residue",
    ],
    activeIngredients: ["solvents", "citrus-based solvent components"],
    rinseGuidance:
      "Wipe off thoroughly and follow with a cleaner if the surface needs final degreasing or film removal.",
    residueNotes:
      "Can leave its own oily residue if not followed by a cleanup step.",
    fragranceNotes:
      "Noticeable citrus-solvent scent.",
    safetyWarnings: [
      "Can affect sensitive finishes",
      "Can irritate skin and eyes",
      "Keep away from ignition sources",
    ],
    incompatibilities: [],
    ppeRecommendations: ["gloves"],
    ventilationNotes:
      "Use with ventilation, especially when working with larger amounts or enclosed spaces.",
    expertAnalysis: [
      "Goo Gone is strongest when the real problem is adhesive, gummy residue, waxy residue, or sticky contamination—not ordinary soil.",
      "Its usefulness comes from solvent action, which also explains why it can leave behind its own residue and why follow-up cleaning often matters.",
      "This is a specialty remover, not an everyday cleaner.",
    ],
    commonMisusePatterns: [
      "Using it as a general-purpose cleaner",
      "Applying it to delicate finishes without spot testing",
      "Failing to remove leftover oily film after residue removal",
    ],
    bestAlternatives: [
      "Goof Off Professional Strength Remover",
      "3M Adhesive Remover",
    ],
    useInsteadOf: [
      "Use this instead of scraping when adhesive residue needs chemical softening first",
      "Use this instead of weak all-purpose cleaner for sticker and tape residue",
    ],
    verdictSummary:
      "A very useful specialty solvent cleaner for sticky, waxy, and adhesive messes, but it needs smarter follow-up cleaning and stronger caution around delicate materials.",
    reviewHighlights: [
      "Works well on stickers and adhesive residue",
      "Useful for gummy messes and tape residue",
      "Good specialty tool to keep on hand",
    ],
    reviewComplaints: [
      "Can leave oily residue",
      "Not ideal on every finish",
      "Strong smell for some users",
    ],
    sources: [
      {
        label: "Goo Gone Original product page",
        url: "https://googone.com/original",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "clorox-toilet-bowl-cleaner-bleach": {
    slug: "clorox-toilet-bowl-cleaner-bleach",
    manufacturerSummary:
      "A bleach-based toilet bowl cleaner designed for bowl whitening, stain removal, and disinfecting performance on toilet interiors.",
    manufacturerClaims: [
      "Whitens and brightens toilet bowls",
      "Removes toilet stains",
      "Disinfects bowl surfaces when used per label",
    ],
    activeIngredients: ["sodium hypochlorite", "bleach-supporting cleaning agents"],
    dwellTime:
      "Follow label contact time for disinfecting claims.",
    rinseGuidance:
      "Use according to toilet-bowl label instructions and flush/rinse as directed.",
    residueNotes:
      "Not positioned as a cosmetic low-residue cleaner; bleach-use discipline matters more than shine.",
    fragranceNotes:
      "Typical bleach-cleaner odor profile.",
    epaRegistered: true,
    safetyWarnings: [
      "Can irritate skin and eyes",
      "Can discolor fabrics and nearby materials",
      "Can release dangerous gases if mixed improperly",
    ],
    incompatibilities: ["ammonia", "acidic cleaners"],
    ppeRecommendations: ["gloves"],
    ventilationNotes:
      "Use with ventilation, especially in small bathrooms.",
    expertAnalysis: [
      "This should be modeled as bleach-first unless SKU-level documentation proves additional chemistry categories beyond that core identity.",
      "Its value is bowl disinfection, whitening, and stain removal inside the toilet—not broad multi-surface bathroom use.",
      "Users often misuse bleach toilet products by treating them as interchangeable with acid descalers or general bathroom sprays.",
    ],
    commonMisusePatterns: [
      "Mixing with acidic bowl cleaners or other bathroom chemicals",
      "Using it outside intended toilet workflows",
      "Expecting it to solve every form of hard-water scale equally well",
    ],
    bestAlternatives: [
      "Lysol Power Toilet Bowl Cleaner",
      "CLR Calcium, Lime & Rust Remover (non-bowl surfaces only; never mix chemistry)",
    ],
    useInsteadOf: [
      "Use this instead of non-disinfecting bowl cleaners when bleach disinfection is desired",
      "Use this instead of weak maintenance products for bleach-driven bowl whitening",
    ],
    verdictSummary:
      "A bleach-first toilet product with clear value for bowl disinfection and whitening, but it requires strict mixing discipline and should not be casually generalized into other chemistry roles.",
    reviewHighlights: [
      "Good whitening action in toilet bowls",
      "Recognizable bleach disinfection value",
      "Useful for routine toilet sanitation",
    ],
    reviewComplaints: [
      "Strong bleach odor",
      "Harsh feel compared with gentler cleaners",
      "Not the right fit for every stain type",
    ],
    sources: [
      {
        label: "Clorox Toilet Bowl Cleaner with Bleach product page",
        url: "https://www.clorox.com/products/clorox-toilet-bowl-cleaner-with-bleach/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },
  ...PRODUCT_RESEARCH_EXTRA,
};
