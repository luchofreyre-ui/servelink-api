import type { CleaningProductResearch } from "./productResearchTypes";

/** Dossiers for the 10 → 25 product expansion (merged into PRODUCT_RESEARCH). */
export const PRODUCT_RESEARCH_EXTRA: Record<string, CleaningProductResearch> = {
  "lime-a-way-cleaner": {
    slug: "lime-a-way-cleaner",
    manufacturerSummary:
      "A bathroom-oriented acidic scale remover positioned against general CLR-style descalers, with emphasis on porcelain, chrome, and tile contexts.",
    activeIngredients: ["acidic descaling agents (verify SDS for exact acids)", "surfactants"],
    safetyWarnings: [
      "Skin and eye irritation risk",
      "Never mix with bleach, ammonia, or other cleaners",
      "Can etch or damage natural stone and sensitive grout",
    ],
    incompatibilities: ["bleach", "chlorine products", "ammonia", "alkaline cleaners used simultaneously"],
    expertAnalysis: [
      "This product exists primarily to compete in the same mental shelf as CLR but with bathroom-forward marketing and often similar acid-family constraints.",
      "The engine should treat it as a descaler first: strong on limescale and hard-water staining on compatible surfaces, weak on grease and adhesives.",
      "Differentiation from CLR is mostly positioning, fragrance, viscosity, and label surface lists—not a different fundamental soil class.",
    ],
    verdictSummary:
      "A legitimate CLR-class comparator for bathroom mineral work when the label approves the surface; mixing and stone discipline matter as much as chemistry choice.",
    sources: [
      {
        label: "Lime-A-Way brand site",
        url: "https://www.limeaway.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "zep-calcium-lime-rust-remover": {
    slug: "zep-calcium-lime-rust-remover",
    manufacturerSummary:
      "Zep’s consumer-facing calcium, lime, and rust remover positioned as a stronger commercial-reference descaler for stubborn mineral film.",
    activeIngredients: ["acidic descaling agents (confirm via SDS)"],
    safetyWarnings: [
      "Corrosive to eyes and skin",
      "Fume and ventilation concerns in enclosed bathrooms",
      "Surface incompatibility includes many stones and sensitive metals if overexposed",
    ],
    incompatibilities: ["bleach", "chlorine products", "ammonia", "other acids combined in the same step"],
    expertAnalysis: [
      "Useful in the library as the ‘heavier commercial tone’ peer to CLR and Lime-A-Way, not as a different mineral chemistry family.",
      "Ranking should reward it on heavy mineral clusters while still penalizing stone, laminate, and grease/adhesive misuse.",
      "SDS verification matters because retail formulas can change while the brand name stays stable.",
    ],
    verdictSummary:
      "Strong anchor for heavy mineral scenarios on label-safe hard surfaces; should track closely with CLR/Lime-A-Way with modest ‘commercial strength’ bias, not a new ruleset.",
    sources: [
      {
        label: "Zep residential calcium/lime/rust product family",
        url: "https://www.zep.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "lysol-power-toilet-bowl-cleaner": {
    slug: "lysol-power-toilet-bowl-cleaner",
    manufacturerSummary:
      "An acid-forward toilet bowl cleaner that separates acid-bowl workflows from bleach-gel bowl workflows while still carrying disinfect-style claims on many SKUs.",
    activeIngredients: ["acidic cleaning agents", "disinfectant actives (SKU-specific; verify label)"],
    safetyWarnings: [
      "Never mix with bleach, ammonia, or other toilet or bathroom products",
      "Acid splashes can damage nearby chrome, stone, and flooring",
      "Severe eye and skin hazard if mishandled",
    ],
    incompatibilities: ["bleach", "ammonia", "chlorinated cleaners", "other bowl products in the same application"],
    expertAnalysis: [
      "The catalog needs this SKU to explain why mineral-stained bowls sometimes favor acid chemistry while organic staining may favor bleach—without telling users to mix them.",
      "Recommendations should heavily gate non-toilet surfaces, similar to other bowl-only products.",
      "EPA registration details and exact acid identity are bottle-specific; the dossier should never overspecify beyond verified labels.",
    ],
    verdictSummary:
      "Essential comparator for acid vs bleach toilet chemistry; high trust value when the engine refuses to generalize it outside the bowl.",
    sources: [
      {
        label: "Lysol toilet cleaning products hub",
        url: "https://www.lysol.com/products/toilet-cleaning/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "krud-kutter-original-cleaner-degreaser": {
    slug: "krud-kutter-original-cleaner-degreaser",
    manufacturerSummary:
      "A widely sold water-based degreaser concentrate used as a benchmark for grease cutting beyond dish-spray surfactant systems.",
    activeIngredients: ["surfactants", "water-based cleaning agents (verify SDS)"],
    safetyWarnings: ["Skin and eye irritation", "Slip hazard if over-applied to floors"],
    incompatibilities: ["strong oxidizers unless label explicitly allows"],
    expertAnalysis: [
      "This is the right peer for Dawn when the soil is truly grease-heavy or spread across larger vertical surfaces and tools.",
      "It should not be promoted for mineral scale, toilet disinfection, or adhesive removal without changing chemistry class.",
      "Dilution discipline is part of product identity; misuse is often ‘too weak’ or ‘too soapy’ rather than ‘too dangerous’ compared with solvents.",
    ],
    verdictSummary:
      "Strong degreaser benchmark that widens kitchen and garage coverage without pretending to be a descaler or disinfectant.",
    sources: [
      {
        label: "Krud Kutter Original product information",
        url: "https://www.krudkutter.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "method-heavy-duty-degreaser": {
    slug: "method-heavy-duty-degreaser",
    manufacturerSummary:
      "A consumer-packaged heavy-duty degreaser spray aimed at stovetops and kitchen grease films with brand positioning toward familiar retail aesthetics.",
    activeIngredients: ["alkaline cleaning agents", "surfactants"],
    safetyWarnings: ["Alkaline irritation to skin and eyes", "Avoid overspray on stone and aluminum without testing"],
    incompatibilities: ["acids in the same step (neutralization and heat can occur)"],
    expertAnalysis: [
      "Useful as the ‘friendly retail’ counterweight to Krud Kutter concentrate workflows.",
      "The engine can explain tradeoffs: convenience and pre-mixed dosing vs concentrate economics and flexibility.",
      "Still fundamentally alkaline/surfactant grease chemistry, not a mineral or adhesive specialist.",
    ],
    verdictSummary:
      "Solid comparator for grease clusters where users want spray-and-wipe ergonomics without jumping to industrial labeling.",
    sources: [
      {
        label: "Method cleaning products",
        url: "https://methodhome.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "simple-green-all-purpose-cleaner": {
    slug: "simple-green-all-purpose-cleaner",
    manufacturerSummary:
      "A dilutable all-purpose cleaner with mainstream recognition, often misunderstood as a disinfectant or descaler by casual users.",
    activeIngredients: ["surfactants", "alkaline builders (verify SDS)"],
    safetyWarnings: ["Eye and skin irritation at use concentration", "Residue or slip risk if used too strong on floors"],
    incompatibilities: ["bleach", "strong acids unless label explicitly allows"],
    expertAnalysis: [
      "The engine should use this SKU to correct misuse patterns: it is primarily a general soil and light-grease tool at correct dilution.",
      "It strengthens coverage for ‘default mainstream cleaner’ comparisons without adding a new chemistry family.",
      "Positioning against disinfectants and descalers should be explicit to prevent trust erosion.",
    ],
    verdictSummary:
      "Important mainstream benchmark for general cleaning intent, not for disinfection leadership or heavy mineral removal.",
    sources: [
      {
        label: "Simple Green product information",
        url: "https://simplegreen.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "sprayway-glass-cleaner": {
    slug: "sprayway-glass-cleaner",
    manufacturerSummary:
      "A foaming aerosol glass cleaner frequently compared to trigger-spray ammoniated cleaners for mirror and window workflows.",
    activeIngredients: ["solvents", "surfactants", "propellants", "ammonia or ammonia-free variants exist—verify SKU"],
    safetyWarnings: [
      "Flammable aerosol; ignition risk",
      "Eye and respiratory irritation in poorly ventilated spaces",
      "Not all coated glass tolerates ammonia or solvents",
    ],
    incompatibilities: ["bleach", "other reactive cleaners applied simultaneously"],
    expertAnalysis: [
      "Adds aerosol mechanics as a first-class comparison axis against Windex-style triggers.",
      "Ranking should treat it as glass-clarity chemistry with added flammability and propellant responsibilities.",
      "SKU-level ammonia vs ammonia-free splits should be documented when the catalog differentiates variants.",
    ],
    verdictSummary:
      "Strong Windex peer focused on foam cling and wipe behavior; risk signaling must stay higher than many pump sprays due to propellants.",
    sources: [
      {
        label: "Sprayway glass cleaner product line",
        url: "https://www.spraywayinc.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "invisible-glass-premium-glass-cleaner": {
    slug: "invisible-glass-premium-glass-cleaner",
    manufacturerSummary:
      "A clarity-positioned glass cleaner marketed heavily around low-residue and ammonia-free narratives compared with legacy ammoniated brands.",
    activeIngredients: ["solvents", "surfactants"],
    safetyWarnings: ["Flammable components common—check SDS", "Eye irritation"],
    incompatibilities: ["bleach"],
    expertAnalysis: [
      "This SKU helps the engine separate ‘ammonia glass’ from ‘solvent-forward clarity glass’ without claiming safety equivalence to water-only cleaning.",
      "It should not outrank descalers on mineral-heavy shower glass problems.",
      "Automotive and household variants may differ; treat labeling as authoritative.",
    ],
    verdictSummary:
      "Best used to explain ammonia-free glass choices and streak mechanics, not mineral restoration.",
    sources: [
      {
        label: "Invisible Glass / Stoner Car Care",
        url: "https://stoner.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "goof-off-professional-strength-remover": {
    slug: "goof-off-professional-strength-remover",
    manufacturerSummary:
      "A stronger solvent remover positioned above citrus-style adhesive removers for stubborn adhesives and some paint-related residues.",
    activeIngredients: ["organic solvents (verify SDS)"],
    safetyWarnings: [
      "High finish damage risk on paint, plastics, and coatings",
      "Flammable; strict ventilation and ignition control",
      "Serious eye and skin hazard",
    ],
    incompatibilities: ["oxidizers", "reactive household chemicals", "mixing with other cleaners"],
    expertAnalysis: [
      "This is the catalog’s primary ‘more power, more risk’ peer to Goo Gone.",
      "Recommendations should pair strength with explicit misuse penalties on painted, plastic, and stone contexts.",
      "It improves explainability for users who need chemical softening before mechanical removal.",
    ],
    verdictSummary:
      "High-value comparator for adhesive clusters where Goo Gone is insufficient, with stronger safety and finish-risk storytelling obligations.",
    sources: [
      {
        label: "Goof Off product information",
        url: "https://goofoff.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "3m-adhesive-remover": {
    slug: "3m-adhesive-remover",
    manufacturerSummary:
      "A specialty adhesive cleaner commonly referenced for automotive, graphics, and tape residue removal workflows.",
    activeIngredients: ["solvent blend (verify SDS)"],
    safetyWarnings: ["Flammable", "Plastic and paint test patch required", "Eye and skin irritation"],
    incompatibilities: ["oxidizers", "mixing with other cleaners in the same step"],
    expertAnalysis: [
      "Provides a ‘clean specialty’ adhesive benchmark distinct from citrus consumer marketing.",
      "Useful for explaining when tape/glue removal is a materials science problem, not a degreasing problem.",
      "Should track close to Goof Off in risk profile but often differs in recommended substrates by label.",
    ],
    verdictSummary:
      "Strong adhesive-cluster anchor for tape/decal scenarios; must stay paired with testing and ventilation guidance.",
    sources: [
      {
        label: "3M adhesive remover product family",
        url: "https://www.3m.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "clorox-disinfecting-wipes": {
    slug: "clorox-disinfecting-wipes",
    manufacturerSummary:
      "Mainstream disinfecting wipes with a workflow distinct from sprays: pre-moistened fabric, wipe contact patterns, and frequent under-timing misuse.",
    activeIngredients: ["disinfectant actives (SKU-specific; verify label)"],
    safetyWarnings: [
      "Bleach or non-bleach variants differ materially—never assume chemistry from brand alone",
      "Skin irritation and fabric bleaching risk",
      "Surface restrictions include many porous and delicate materials",
    ],
    incompatibilities: ["ammonia", "acids", "other cleaners used simultaneously on the same surface"],
    expertAnalysis: [
      "The library needs this to compare disinfecting ergonomics: wipes vs spray wetting and contact time.",
      "Ranking should reward disinfect intent but penalize grease-first and mineral-first misuse.",
      "Kill claims and contact times are EPA-label locked; the system should not invent timing.",
    ],
    verdictSummary:
      "Essential disinfect workflow comparator; trust depends on separating wipe chemistry variants and enforcing contact-time literacy.",
    sources: [
      {
        label: "Clorox disinfecting wipes product hub",
        url: "https://www.clorox.com/products/clorox-disinfecting-wipes/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "seventh-generation-disinfecting-multi-surface-cleaner": {
    slug: "seventh-generation-disinfecting-multi-surface-cleaner",
    manufacturerSummary:
      "A disinfecting multi-surface spray commonly positioned with botanical or thymol-style actives and EPA-registered claims on qualifying SKUs.",
    activeIngredients: ["thymol or other listed actives—verify EPA label"],
    safetyWarnings: ["Eye and skin irritation still possible", "Contact time and soil removal requirements still apply"],
    incompatibilities: ["bleach", "mixing with other disinfectants or acids"],
    expertAnalysis: [
      "Adds a non-aerosol disinfect comparator that helps users compare positioning without assuming bleach.",
      "The engine should treat marketing language as secondary to label kill claims, surfaces, and times.",
      "Pairs naturally against Lysol spray and Clorox wipes for workflow education.",
    ],
    verdictSummary:
      "Useful disinfect-cluster diversity SKU; correctness still comes from EPA label fidelity, not brand narrative.",
    sources: [
      {
        label: "Seventh Generation disinfecting products",
        url: "https://www.seventhgeneration.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "zep-shower-tub-tile-cleaner": {
    slug: "zep-shower-tub-tile-cleaner",
    manufacturerSummary:
      "A stronger bathroom maintenance cleaner aimed at soap scum and hard-water film on typical tub and tile surfaces.",
    activeIngredients: ["alkaline builders", "surfactants", "chelants (verify SDS)"],
    safetyWarnings: ["Slip hazard on tub surfaces", "Eye and skin irritation", "Stone overspray risk"],
    incompatibilities: ["acids applied immediately after without thorough rinse", "bleach unless label allows"],
    expertAnalysis: [
      "This strengthens the ‘strong bathroom maintenance’ lane next to Scrubbing Bubbles without being a descaler.",
      "It should gain on soap scum clusters but lose on pure limescale restoration compared with acid descalers.",
      "Zep branding signals pro-maintenance expectations; residue and rinse discipline still matter.",
    ],
    verdictSummary:
      "Strong soap-scum and bathroom-film comparator; should defer to CLR-class products for heavy scale on tolerant surfaces.",
    sources: [
      {
        label: "Zep bathroom cleaning products",
        url: "https://www.zep.com/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "lysol-power-bathroom-cleaner": {
    slug: "lysol-power-bathroom-cleaner",
    manufacturerSummary:
      "A bathroom spray cleaner that often combines grime removal with disinfect-style claims depending on SKU, overlapping Scrubbing Bubbles use cases.",
    activeIngredients: ["disinfectant actives", "surfactants", "builders (verify label)"],
    safetyWarnings: ["Ventilation in small bathrooms", "Eye and skin irritation", "Stone sensitivity"],
    incompatibilities: ["bleach", "ammonia", "mixing with other bathroom chemicals"],
    expertAnalysis: [
      "Helps separate bathroom ‘clean + disinfect’ intent from toilet-only acid or bleach gel products.",
      "Should compete with Scrubbing Bubbles on biofilm and soap scum while still losing to descalers on heavy mineral cases.",
      "SKU-level differences are common; registration and surface lists must be verified on bottle.",
    ],
    verdictSummary:
      "Important overlap SKU for bathroom clusters where users conflate cleaning, disinfecting, and descaling—good for educational ranking contrasts.",
    sources: [
      {
        label: "Lysol bathroom cleaners",
        url: "https://www.lysol.com/products/bathroom-cleaning/",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "oxiclean-max-force-spray": {
    slug: "oxiclean-max-force-spray",
    manufacturerSummary:
      "A targeted oxygen-based stain spray intended for pre-treat workflows rather than soak buckets of powder percarbonate systems.",
    activeIngredients: ["hydrogen peroxide-derived oxygen bleach chemistry", "surfactants", "polymers (verify SDS)"],
    safetyWarnings: ["Eye and skin irritation", "Color loss risk if misapplied", "Never mix with chlorine bleach"],
    incompatibilities: ["chlorine bleach", "acidic cleaners combined in the same application"],
    expertAnalysis: [
      "This SKU exists to split ‘spot stain spray’ from ‘Versatile powder soak’ mentally and in ranking.",
      "It should win on localized stain pre-treat scenarios and lose on grease-heavy degreasing and mineral removal.",
      "Laundry-first labeling still matters even when users borrow it for hard surfaces.",
    ],
    verdictSummary:
      "Sharp tool for stain-spray workflows; strengthens oxygen chemistry coverage without duplicating powder positioning.",
    sources: [
      {
        label: "OxiClean Max Force product page",
        url: "https://www.oxiclean.com/en/products/stain-fighters/oxiclean-max-force-spray",
        type: "manufacturer",
      },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "granite-gold-daily-cleaner": {
    slug: "granite-gold-daily-cleaner",
    manufacturerSummary:
      "A pH-neutral daily cleaner positioned for sealed granite and stone countertops to remove dust and light films without acid-family etch risk.",
    activeIngredients: ["surfactants", "pH-neutral builders (verify SDS)"],
    safetyWarnings: ["Eye and skin irritation at use concentration", "Slip hazard if floors are over-wetted"],
    incompatibilities: ["acidic descalers", "bleach", "mixing with other cleaners in the same step"],
    expertAnalysis: [
      "This SKU exists to stop the common failure mode of recommending CLR, vinegar, or BKF on routine granite maintenance.",
      "It should dominate stone-surface daily cleaning clusters while losing intentionally on grease, mineral scale, and disinfection leadership.",
      "The dossier and seed must agree: this is maintenance chemistry, not restoration chemistry.",
    ],
    verdictSummary:
      "Critical trust SKU for sealed-stone daily cleaning; correct use is as much about what not to use as what to spray.",
    sources: [
      { label: "Granite Gold products", url: "https://www.granitegold.com/", type: "manufacturer" },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "stonetech-daily-cleaner": {
    slug: "stonetech-daily-cleaner",
    manufacturerSummary:
      "A neutral stone maintenance cleaner aimed at sealed natural stone and many tile contexts for routine soil removal.",
    activeIngredients: ["surfactants", "chelants or builders per SDS"],
    safetyWarnings: ["Irritation risk", "Residue or slip risk if not diluted or rinsed per label"],
    incompatibilities: ["acids", "strong oxidizers unless label allows"],
    expertAnalysis: [
      "Pairs with Granite Gold as the comparator pair for ‘stone-safe daily’ versus acid mineral removers.",
      "It should never be the top answer for limescale restoration, toilet stains, or carpet spotting.",
    ],
    verdictSummary:
      "Strong stone-maintenance anchor; keep it out of heavy soil classes or the system loses credibility.",
    sources: [
      { label: "StoneTech / LATICRETE stone care", url: "https://www.stonetech.com/", type: "manufacturer" },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "bona-hardwood-floor-cleaner": {
    slug: "bona-hardwood-floor-cleaner",
    manufacturerSummary:
      "A mainstream hardwood floor cleaner formulated around gentle, finish-aware maintenance rather than aggressive stripping or descaling.",
    activeIngredients: ["surfactants", "polymers or shine agents per SKU SDS"],
    safetyWarnings: ["Slip hazard on oversaturated floors", "Eye irritation"],
    incompatibilities: ["wax or oil systems unless label approves", "mixing with bleach or acids"],
    expertAnalysis: [
      "This is the floor-tier anchor that should beat kitchen degreasers when the surface is hardwood and the soil is floor residue.",
      "It must remain isolated from drain chemistry, toilet products, and stone acid workflows.",
    ],
    verdictSummary:
      "Essential hardwood maintenance benchmark; misuse is usually ‘wrong surface’ not ‘weak chemistry’.",
    sources: [
      { label: "Bona floor care", url: "https://us.bona.com/", type: "manufacturer" },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "zep-neutral-ph-floor-cleaner": {
    slug: "zep-neutral-ph-floor-cleaner",
    manufacturerSummary:
      "A neutral pH floor cleaner concentrate commonly used in commercial and residential maintenance programs.",
    activeIngredients: ["surfactants", "neutral builders (verify SDS)"],
    safetyWarnings: ["Dilution errors change performance and residue", "Slip hazard when floors stay wet"],
    incompatibilities: ["acids", "bleach unless explicitly approved"],
    expertAnalysis: [
      "Should track as the Zep peer to Bona for neutral floor programs, especially on tile and multi-surface finished floors.",
      "Must lose to drain openers on clogs and to descalers on mineral bond—by design.",
    ],
    verdictSummary:
      "Strong neutral-floor comparator; keep it in floor residue clusters, not bathroom scale restoration.",
    sources: [{ label: "Zep floor care", url: "https://www.zep.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "resolve-carpet-cleaner-spray": {
    slug: "resolve-carpet-cleaner-spray",
    manufacturerSummary:
      "A carpet spot spray aimed at fresh stains and soils on wall-to-wall carpet and rugs after blotting.",
    activeIngredients: ["surfactants", "solvents (SKU-dependent)"],
    safetyWarnings: ["Flammability on some variants", "Colorfastness testing required", "Ventilation for solvent-forward SKUs"],
    incompatibilities: ["bleach", "mixing with other spot chemicals"],
    expertAnalysis: [
      "This fills the missing textile spot system so Oxi powder is not treated as the carpet default.",
      "It should pair competitively with Folex while staying out of hard-surface degreaser leaderboards.",
    ],
    verdictSummary:
      "Textile spot anchor; correct framing is fiber-first, never mineral-first.",
    sources: [{ label: "Resolve carpet care", url: "https://www.resolveclean.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "folex-instant-carpet-spot-remover": {
    slug: "folex-instant-carpet-spot-remover",
    manufacturerSummary:
      "A widely recognized water-based carpet spot remover marketed for quick blot-and-treat workflows.",
    activeIngredients: ["surfactants", "water-based cleaning agents"],
    safetyWarnings: ["Always test hidden fibers", "Eye irritation"],
    incompatibilities: ["bleach", "strong oxidizers unless label allows"],
    expertAnalysis: [
      "Folex versus Resolve is the right ‘similar’ story for carpet spotting without dragging in CLR or Dawn.",
      "Biological odor in pad may still need enzyme follow-up—position honestly.",
    ],
    verdictSummary:
      "Low-odor spotter benchmark; keep it in textile workflows.",
    sources: [{ label: "Folex Company", url: "https://www.folexcompany.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "natures-miracle-stain-and-odor-remover": {
    slug: "natures-miracle-stain-and-odor-remover",
    manufacturerSummary:
      "An enzyme-forward stain and odor product commonly used for pet urine and biological messes on surfaces and fibers.",
    activeIngredients: ["bacterial/enzyme blend", "surfactants", "fragrance (SKU-dependent)"],
    safetyWarnings: ["Do not mix with incompatible disinfectants—enzyme inactivation risk", "Skin and eye irritation"],
    incompatibilities: ["bleach", "many quats and strong oxidizers when used simultaneously per label"],
    expertAnalysis: [
      "This is the enzyme chemistry anchor the catalog was missing for urine, pet odor, and organic stain narratives.",
      "It must win those clusters without being promoted as a grease cutter, descaler, or adhesive remover.",
    ],
    verdictSummary:
      "High-trust biological soil SKU; sequencing and mix discipline are part of its identity.",
    sources: [
      { label: "Nature's Miracle", url: "https://www.naturesmiracle.com/", type: "manufacturer" },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "odoban-disinfectant-odor-eliminator": {
    slug: "odoban-disinfectant-odor-eliminator",
    manufacturerSummary:
      "A concentrate positioned as both disinfectant (EPA claims on qualifying SKUs) and odor control for hard and some soft contexts.",
    activeIngredients: ["quaternary ammonium compounds (verify label)", "fragrance and surfactants"],
    safetyWarnings: ["Dilution errors break both safety and efficacy", "Eye and skin irritation"],
    incompatibilities: ["bleach", "mixing with acids or other cleaners"],
    expertAnalysis: [
      "Hybrid SKUs are where recommendation engines fail—this one must sit below dedicated disinfect leaders on pure disinfection problems.",
      "On odor retention it can be competitive, but enzyme workflows still matter for biological sources.",
    ],
    verdictSummary:
      "Useful overlap product; containment rules matter more than peak scores.",
    sources: [{ label: "OdoBan / Clean Control", url: "https://www.odoban.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "wet-and-forget-shower-cleaner": {
    slug: "wet-and-forget-shower-cleaner",
    manufacturerSummary:
      "A no-rinse shower spray marketed around ongoing maintenance rather than immediate heavy scrubbing or descaling.",
    activeIngredients: ["surfactants", "chelants or builders per SDS"],
    safetyWarnings: ["Ventilation in enclosed showers", "Coating and stone restrictions on label"],
    incompatibilities: ["bleach", "acids used simultaneously"],
    expertAnalysis: [
      "Behaviorally distinct: boost under maintain intent, penalize under restore intent.",
      "It should relate to bathroom cleaners only as a passive maintenance alternative, not a CLR replacement.",
    ],
    verdictSummary:
      "Maintenance-behavior SKU; misuse expectations are the primary risk.",
    sources: [
      { label: "Wet & Forget shower products", url: "https://www.wetandforget.com/", type: "manufacturer" },
    ],
    lastReviewed: new Date().toISOString(),
  },

  "drano-max-gel-drain-clog-remover": {
    slug: "drano-max-gel-drain-clog-remover",
    manufacturerSummary:
      "A caustic gel drain opener intended only for labeled drain materials and clog scenarios.",
    activeIngredients: ["sodium hydroxide and supporting agents (verify SDS)"],
    safetyWarnings: [
      "Severe eye and skin burns",
      "Deadly gas risk if mixed with acid or other cleaners",
      "Splash and fume hazards",
    ],
    incompatibilities: ["acids", "ammonia", "other drain products", "bleach"],
    expertAnalysis: [
      "Hard isolation is mandatory: if this appears outside drains + clog, the integrity check should scream.",
      "There should be no ‘similar products’ except other drain chemistry—this catalog may only have one.",
    ],
    verdictSummary:
      "Drain-only chemistry; the correct ranking story is often ‘nothing else belongs here’.",
    sources: [{ label: "Drano product information", url: "https://www.drano.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "murphy-oil-soap-wood-cleaner": {
    slug: "murphy-oil-soap-wood-cleaner",
    manufacturerSummary:
      "Oil-soap wood cleaner positioned for routine damp-mopping of sealed wood and compatible finished floors versus neutral hardwood programs.",
    activeIngredients: ["surfactants", "potassium vegetable oil soap (verify SDS)"],
    safetyWarnings: ["Slip hazard on over-wet floors", "Test unknown finishes"],
    incompatibilities: ["wax strippers unless label allows", "strong acids mixed in same step"],
    expertAnalysis: [
      "Fills the sealed-wood maintenance branch next to Bona with a distinct oil-soap chemistry story.",
      "Must stay out of mineral, drain, and disinfect leaderboards.",
    ],
    verdictSummary: "Sealed wood routine peer—not a descaler or biology tool.",
    sources: [{ label: "Murphy Oil Soap", url: "https://www.murphyoilsoap.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "rejuvenate-luxury-vinyl-floor-cleaner": {
    slug: "rejuvenate-luxury-vinyl-floor-cleaner",
    manufacturerSummary:
      "LVP/LVT-oriented floor cleaner marketed for luxury vinyl and compatible hard floors without harsh wax buildup when used as directed.",
    activeIngredients: ["surfactants", "builders per SDS"],
    safetyWarnings: ["Slip hazard when floors stay wet", "Coating compatibility varies by SKU"],
    incompatibilities: ["bleach unless label allows", "wax systems that conflict with water-based cleaners"],
    expertAnalysis: [
      "Creates a vinyl-first comparator so neutral Zep/Bona logic is not the only multi-floor answer.",
      "Should win vinyl floor residue clusters over kitchen sprays.",
    ],
    verdictSummary: "Vinyl floor maintenance anchor; isolate from carpet and drains.",
    sources: [{ label: "Rejuvenate floor care", url: "https://rejuvenateproducts.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "pine-sol-original-multi-surface-cleaner": {
    slug: "pine-sol-original-multi-surface-cleaner",
    manufacturerSummary:
      "Pine-scented multi-surface cleaner with EPA-registered disinfecting paths on qualifying Original formulas when diluted and contacted per label.",
    activeIngredients: ["cleaning agents", "fragrance", "glycolic acid or actives per SDS—verify bottle"],
    safetyWarnings: ["Never mix with bleach", "Ventilation in small rooms", "Eye and skin irritation"],
    incompatibilities: ["bleach", "ammonia", "other cleaners in the same step"],
    expertAnalysis: [
      "Broadens disinfect + odor hard-surface comparison without pretending it is CLR or oven caustic.",
      "Containment: penalize on pure mineral restoration and cooked-on carbon.",
    ],
    verdictSummary: "Utility disinfect/odor SKU—label dilution and contact time govern trust.",
    sources: [{ label: "Pine-Sol", url: "https://www.pinesol.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "easy-off-heavy-duty-oven-cleaner": {
    slug: "easy-off-heavy-duty-oven-cleaner",
    manufacturerSummary:
      "Heavy-duty caustic foam or spray oven cleaner for carbonized grease inside ovens and labeled cook surfaces.",
    activeIngredients: ["sodium hydroxide and surfactants (verify SDS)"],
    safetyWarnings: ["Severe eye/skin burns", "Strong fumes—ventilation required", "Never spray toward face"],
    incompatibilities: ["acids", "bleach", "other cleaners"],
    expertAnalysis: [
      "Mandatory hard gate: only cooked-on grease / burnt residue contexts to prevent countertop drift.",
      "Dominance reporting should flag if it appears outside oven-class scenarios.",
    ],
    verdictSummary: "Oven carbon specialist; isolation beats score chasing.",
    sources: [{ label: "Easy-Off", url: "https://www.easyoff.us/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "clorox-clean-up-cleaner-bleach": {
    slug: "clorox-clean-up-cleaner-bleach",
    manufacturerSummary:
      "Ready-to-use bleach spray cleaner for hard non-porous surfaces where Clorox markets disinfecting performance per label.",
    activeIngredients: ["sodium hypochlorite", "surfactants"],
    safetyWarnings: ["Never mix with ammonia, acids, or other products", "Fumes and ventilation"],
    incompatibilities: ["acids", "ammonia", "other cleaners"],
    expertAnalysis: [
      "Separates spray bleach mental model from wipes, toilet gels, and laundry sanitizer.",
      "Stone and colored grout need conservative ranking.",
    ],
    verdictSummary: "Hard-surface bleach spray workflow; mixing discipline is the brand risk.",
    sources: [{ label: "Clorox spray cleaners", url: "https://www.clorox.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "rocco-roxie-stain-odor-eliminator": {
    slug: "rocco-roxie-stain-odor-eliminator",
    manufacturerSummary:
      "Enzyme-based stain and odor remover commonly compared to Nature’s Miracle for pet urine and biological soils.",
    activeIngredients: ["bacterial/enzyme blend", "surfactants"],
    safetyWarnings: ["Do not mix with bleach or incompatible disinfectants same step"],
    incompatibilities: ["bleach", "many quats when used simultaneously per label"],
    expertAnalysis: [
      "Provides a second enzyme anchor for comparison tables and ‘better vs similar’ stories.",
      "Ranking should track closely with Nature’s Miracle on urine/pet odor clusters.",
    ],
    verdictSummary: "Biological odor peer; chemistry is enzyme-first.",
    sources: [{ label: "Rocco & Roxie", url: "https://www.roccoroxie.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "lysol-laundry-sanitizer": {
    slug: "lysol-laundry-sanitizer",
    manufacturerSummary:
      "Laundry additive positioned to reduce bacteria on washable fabrics during rinse or soak steps per label—not a countertop spray.",
    activeIngredients: ["quaternary ammonium compounds (verify label)"],
    safetyWarnings: ["Eye and skin irritation", "Keep out of reach of children"],
    incompatibilities: ["bleach unless label explicitly allows combination"],
    expertAnalysis: [
      "Expands disinfection into fabric-cycle logic distinct from Lysol spray and Clorox Clean-Up.",
      "Hard-surface scenarios should strongly suppress unless surface taxonomy is fabric/laundry.",
    ],
    verdictSummary: "Fabric sanitizer branch; containment is as important as chemistry.",
    sources: [{ label: "Lysol laundry", url: "https://www.lysol.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "simple-green-pro-hd": {
    slug: "simple-green-pro-hd",
    manufacturerSummary:
      "Pro-grade Simple Green concentrate marketed for heavier grease and equipment cleaning versus standard APC dilutions.",
    activeIngredients: ["alkaline builders", "surfactants (verify SDS)"],
    safetyWarnings: ["Dilution errors change safety and performance", "Aluminum and soft metal sensitivity"],
    incompatibilities: ["bleach", "acids used simultaneously"],
    expertAnalysis: [
      "Bridges Dawn/Krud Kutter toward commercial degreasing without inventing a new chemical family.",
      "Should not win mineral scale or disinfect-only leaderboards.",
    ],
    verdictSummary: "Heavy degreasing comparator; dilution and metal discipline matter.",
    sources: [{ label: "Simple Green", url: "https://simplegreen.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "liquid-plumr-clog-destroyer-plus-pipeguard": {
    slug: "liquid-plumr-clog-destroyer-plus-pipeguard",
    manufacturerSummary:
      "Caustic gel drain opener positioned as a Drano-class peer for clog-only workflows with pipe-protection marketing on qualifying SKUs.",
    activeIngredients: ["sodium hypochlorite and/or sodium hydroxide family (verify SDS)"],
    safetyWarnings: ["Never mix with other cleaners", "Severe splash and fume hazards"],
    incompatibilities: ["acids", "bleach from other bottles", "other drain products"],
    expertAnalysis: [
      "Catalog needs this as the explicit second drain anchor so comparisons stay inside drain chemistry.",
      "Isolation rules must match Drano: never rank outside drains + clog.",
    ],
    verdictSummary: "Drain peer only; containment equals trust.",
    sources: [{ label: "Liquid-Plumr", url: "https://www.liquidplumr.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "method-daily-shower-spray": {
    slug: "method-daily-shower-spray",
    manufacturerSummary:
      "Daily-use shower spray marketed for quick post-shower wipe or mist programs versus passive no-rinse maintenance SKUs.",
    activeIngredients: ["surfactants", "fragrance (SKU-dependent)"],
    safetyWarnings: ["Ventilation in enclosed showers", "Slip hazard on wet tile"],
    incompatibilities: ["bleach", "acids mixed simultaneously"],
    expertAnalysis: [
      "Balances Wet & Forget under maintain intent: slightly more ‘active upkeep’ positioning.",
      "Must crater on restore/mineral-heavy leaderboards.",
    ],
    verdictSummary: "Daily shower maintenance comparator—not a descaler.",
    sources: [{ label: "Method", url: "https://methodhome.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "pledge-multisurface-cleaner": {
    slug: "pledge-multisurface-cleaner",
    manufacturerSummary:
      "Multi-surface spray commonly used for dust and light film on cabinets, sealed wood, and appliances when labeled.",
    activeIngredients: ["surfactants", "silicone or polish agents on some variants—verify label"],
    safetyWarnings: ["Finish compatibility varies", "Floors may become slick if misapplied"],
    incompatibilities: ["wax systems that conflict", "unknown antiques without testing"],
    expertAnalysis: [
      "Creates a finished-wood/cabinet dust lane distinct from Murphy’s oil-soap floor story.",
      "Should not chase disinfect or mineral restoration scores.",
    ],
    verdictSummary: "Light film/dust peer for finished surfaces.",
    sources: [{ label: "Pledge", url: "https://www.pledge.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "weiman-gas-range-cleaner-degreaser": {
    slug: "weiman-gas-range-cleaner-degreaser",
    manufacturerSummary:
      "Range-focused degreaser for cooktops, grates, and hood exteriors where labels approve gas-range materials.",
    activeIngredients: ["alkaline builders", "surfactants (verify SDS)"],
    safetyWarnings: ["Skin and eye irritation", "Ventilation around gas appliances per label"],
    incompatibilities: ["bleach", "acids combined in same step"],
    expertAnalysis: [
      "Specialist anchor so broad degreasers do not own cooktop/range-hood slots by default.",
      "Still not oven-interior caustic chemistry.",
    ],
    verdictSummary: "Cooktop/hood grease specialist.",
    sources: [{ label: "Weiman", url: "https://weiman.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "zep-oven-and-grill-cleaner": {
    slug: "zep-oven-and-grill-cleaner",
    manufacturerSummary:
      "Heavy-duty oven and grill cleaner in the same caustic mental shelf as Easy-Off with grill-forward use cases.",
    activeIngredients: ["sodium hydroxide and surfactants (verify SDS)"],
    safetyWarnings: ["Severe burns", "Strong fumes", "Never spray toward face"],
    incompatibilities: ["acids", "bleach", "other cleaners"],
    expertAnalysis: [
      "Mandatory pairing with Easy-Off for baked-on comparisons while staying off counters and fibers.",
      "Grill surface tag should reinforce isolation from general kitchen wipes.",
    ],
    verdictSummary: "Baked-on oven/grill peer; isolation first.",
    sources: [{ label: "Zep residential", url: "https://www.zep.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "bona-hard-surface-floor-cleaner": {
    slug: "bona-hard-surface-floor-cleaner",
    manufacturerSummary:
      "Bona’s hard-surface floor line for tile, stone-tolerant finished floors, and LVT-style programs separate from hardwood-only SKUs.",
    activeIngredients: ["neutral surfactant system (verify SDS)"],
    safetyWarnings: ["Slip hazard when over-wetted"],
    incompatibilities: ["wax strippers unless label allows"],
    expertAnalysis: [
      "Third floor comparator that lets hardwood Bona, vinyl Rejuvenate, and Zep neutral each have a lane.",
      "Ranking should punish hardwood-only contexts and reward sealed hard-surface floor contexts.",
    ],
    verdictSummary: "Hard-surface floor maintenance anchor.",
    sources: [{ label: "Bona floor care", url: "https://us.bona.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "biokleen-bac-out-stain-odor-remover": {
    slug: "biokleen-bac-out-stain-odor-remover",
    manufacturerSummary:
      "Live-culture enzyme cleaner commonly sold for pet stains, biological odors, and some laundry pre-treat contexts.",
    activeIngredients: ["bacterial/enzyme blend", "surfactants"],
    safetyWarnings: ["Do not mix with incompatible disinfectants"],
    incompatibilities: ["bleach", "strong oxidizers per label"],
    expertAnalysis: [
      "Third enzyme peer spreads dominance across NM/Rocco/Bac-Out instead of one SKU always edging out.",
      "Surface-tuned boosts (tile vs fiber) should be deterministic, not random.",
    ],
    verdictSummary: "Biological odor cluster member.",
    sources: [{ label: "Biokleen", url: "https://www.biokleenhome.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "clorox-laundry-sanitizer": {
    slug: "clorox-laundry-sanitizer",
    manufacturerSummary:
      "Clorox laundry sanitizer additive positioned against Lysol laundry SKUs for fabric-cycle bacteria reduction per label.",
    activeIngredients: ["sodium hypochlorite or other actives—verify bottle"],
    safetyWarnings: ["Fabric compatibility", "Never use as a countertop spray"],
    incompatibilities: ["mixing with incompatible laundry additives"],
    expertAnalysis: [
      "Fabric disinfection lane needs two anchors; containment off hard surfaces matters as much as chemistry.",
    ],
    verdictSummary: "Laundry sanitizer peer; hard-surface suppression required.",
    sources: [{ label: "Clorox laundry", url: "https://www.clorox.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "microban-24-hour-disinfectant-sanitizing-spray": {
    slug: "microban-24-hour-disinfectant-sanitizing-spray",
    manufacturerSummary:
      "Microban-branded disinfectant spray family with EPA-listed claims on qualifying SKUs and 24-hour marketing where substantiated.",
    activeIngredients: ["quaternary ammonium or other EPA actives—verify label"],
    safetyWarnings: ["Ventilation", "Eye and skin irritation"],
    incompatibilities: ["bleach", "other cleaners in same step"],
    expertAnalysis: [
      "Separates hard-surface disinfect sprays from Pine-Sol concentrate workflows and from enzyme biology.",
      "Should compete with Lysol spray on disinfect intent without flattening OdoBan’s odor-central niche.",
    ],
    verdictSummary: "Purpose-built disinfect spray comparator.",
    sources: [{ label: "Microban", url: "https://www.microban.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "easy-off-kitchen-degreaser": {
    slug: "easy-off-kitchen-degreaser",
    manufacturerSummary:
      "Easy-Off kitchen degreaser positioned for cooktops, hoods, and nearby stainless—not the same baked-on oven chemistry as heavy oven SKUs.",
    activeIngredients: ["alkaline surfactant blend (verify SDS)"],
    safetyWarnings: ["Ventilation", "Skin and eye irritation", "Do not substitute for oven/grill carbon programs"],
    incompatibilities: ["chlorine bleach", "other strong cleaners in the same step per label"],
    expertAnalysis: [
      "Peers with Weiman gas-range style SKUs against broad degreasers when the surface is hood/cooktop-class.",
      "Should lose cleanly to dedicated oven cleaners on true baked-on oven and grill carbon.",
    ],
    verdictSummary: "Cooktop/hood grease specialist anchor.",
    sources: [{ label: "Easy-Off", url: "https://www.easyoff.us/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "weiman-stainless-steel-cleaner-polish": {
    slug: "weiman-stainless-steel-cleaner-polish",
    manufacturerSummary:
      "Weiman stainless cleaner/polish for appliance fingerprints, haze, and cosmetic film—not mineral restoration or rust chemistry.",
    activeIngredients: ["polish oils / surfactants (verify SDS)"],
    safetyWarnings: ["Test inconspicuous area on coated or specialty finishes"],
    incompatibilities: ["bleach", "strong acids on the same surface in one step"],
    expertAnalysis: [
      "Defines a stainless appearance lane separate from glass ammonia cleaners and from BKF mineral work.",
      "Ranking should punish mineral scale, rust, and heavy baked grease contexts.",
    ],
    verdictSummary: "Finished stainless appearance specialist.",
    sources: [{ label: "Weiman", url: "https://weiman.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "method-wood-for-good-daily-clean": {
    slug: "method-wood-for-good-daily-clean",
    manufacturerSummary:
      "Method daily cleaner for sealed/finished wood and cabinets—marketing emphasizes light soil and dust, not floor oil-soap programs.",
    activeIngredients: ["plant-derived surfactants (verify label)"],
    safetyWarnings: ["Over-wetting risks on raw or unsealed wood"],
    incompatibilities: ["wax strippers unless label allows"],
    expertAnalysis: [
      "Third finished-wood comparator alongside Murphy and Pledge for dust/light film, not hardwood floor oil routines.",
    ],
    verdictSummary: "Daily wood/cabinet maintenance peer.",
    sources: [{ label: "Method", url: "https://methodhome.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "tilex-daily-shower-cleaner": {
    slug: "tilex-daily-shower-cleaner",
    manufacturerSummary:
      "Tilex daily shower spray for between-clean maintenance—more active wipe/spray habit than passive no-scrub lines.",
    activeIngredients: ["surfactant system (verify SDS)"],
    safetyWarnings: ["Ventilation", "Rinse skin contact"],
    incompatibilities: ["bleach mixes", "other bathroom products per label"],
    expertAnalysis: [
      "Sits between Wet & Forget (passive) and Method daily shower (light habit) in maintain-intent clustering.",
      "Should fall on heavy mineral restore scenarios.",
    ],
    verdictSummary: "Active shower maintenance comparator.",
    sources: [{ label: "Tilex", url: "https://www.clorox.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "odoban-fabric-laundry-spray": {
    slug: "odoban-fabric-laundry-spray",
    manufacturerSummary:
      "OdoBan fabric and laundry spray for odor refresh on textiles—distinct from cycle laundry sanitizers and from hard-surface disinfect.",
    activeIngredients: ["odor-neutralizing / surfactant actives (verify label)"],
    safetyWarnings: ["Fabric spot-test", "Not a registered hard-surface disinfect default"],
    incompatibilities: ["bleach on fabrics unless label allows"],
    expertAnalysis: [
      "Gives laundry odor a non-sanitizer fabric lane next to Lysol/Clorox laundry additives.",
    ],
    verdictSummary: "Fabric odor refresh specialist.",
    sources: [{ label: "OdoBan", url: "https://www.odoban.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "oil-eater-cleaner-degreaser": {
    slug: "oil-eater-cleaner-degreaser",
    manufacturerSummary:
      "Concentrated alkaline degreaser often used on concrete, equipment, and heavy grease—dilution-dependent.",
    activeIngredients: ["alkaline builders and surfactants (verify SDS)"],
    safetyWarnings: ["Corrosive when concentrated", "Eye and skin protection", "Runoff and environmental rules outdoors"],
    incompatibilities: ["acids", "bleach"],
    expertAnalysis: [
      "Outdoor/concrete grease starter without opening full automotive or exterior bleach clusters.",
      "Should not default on interior stone or delicate finishes.",
    ],
    verdictSummary: "Heavy grease / concrete-oriented degreaser peer.",
    sources: [{ label: "Oil Eater", url: "https://www.oileater.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "un-du-adhesive-remover": {
    slug: "un-du-adhesive-remover",
    manufacturerSummary:
      "Un-Du positioned as a lighter adhesive/sticker solvent option—often highlighted for labels and plastics with label caveats.",
    activeIngredients: ["hydrocarbon / solvent blend (verify SDS)"],
    safetyWarnings: ["Flammable", "Ventilation", "Spot-test plastics and paint"],
    incompatibilities: ["heat sources", "incompatible finishes per label"],
    expertAnalysis: [
      "Adds a plastic-safe-ish ladder rung below Goof Off and 3M on heavy gum and tar cases.",
    ],
    verdictSummary: "Light adhesive / sticker lane anchor.",
    sources: [{ label: "Un-Du", url: "https://www.un-du.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "concrobium-mold-control": {
    slug: "concrobium-mold-control",
    manufacturerSummary:
      "Concrobium mold control treatment marketed for mold/mildew maintenance on label-approved surfaces with EPA-registered claims on qualifying SKUs.",
    activeIngredients: ["inorganic salt-based mold treatment (verify SDS and EPA label)"],
    safetyWarnings: ["Ventilation", "Follow EPA contact time and surface list"],
    incompatibilities: ["bleach in the same application step"],
    expertAnalysis: [
      "Mold/biofilm maintenance lane—not a generic disinfect winner, not enzyme urine biology, not acid descaling.",
    ],
    verdictSummary: "Mold-control maintenance specialist.",
    sources: [{ label: "Concrobium", url: "https://www.concrobium.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "purple-power-industrial-strength-cleaner-degreaser": {
    slug: "purple-power-industrial-strength-cleaner-degreaser",
    manufacturerSummary:
      "Purple Power industrial cleaner/degreaser sold heavily into automotive and shop channels but commonly used diluted on concrete and equipment grease.",
    activeIngredients: ["alkaline builders and surfactants (verify SDS)"],
    safetyWarnings: ["Concentrate can be corrosive", "Eye/skin protection", "Outdoor runoff awareness"],
    incompatibilities: ["acids", "bleach"],
    expertAnalysis: [
      "Pairs with Oil Eater so Pro HD is not the only ‘purple industrial’ mental model in the catalog.",
      "Should lose on cooktop cosmetic and stone-default scenarios.",
    ],
    verdictSummary: "Concrete/industrial grease peer SKU.",
    sources: [{ label: "Purple Power", url: "https://www.purplepower.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "therapy-stainless-steel-cleaner-polish": {
    slug: "therapy-stainless-steel-cleaner-polish",
    manufacturerSummary:
      "Therapy-branded stainless cleaner/polish marketed for appliance cosmetics and fingerprint control.",
    activeIngredients: ["oils / surfactants (verify SDS)"],
    safetyWarnings: ["Spot-test specialty coatings"],
    incompatibilities: ["strong acids on same step"],
    expertAnalysis: [
      "Stabilizes stainless_polish as a two-SKU branch with Weiman rather than one anchor.",
    ],
    verdictSummary: "Stainless appearance peer.",
    sources: [{ label: "Therapy Clean", url: "https://www.therapyclean.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "mold-armor-rapid-clean-remediation": {
    slug: "mold-armor-rapid-clean-remediation",
    manufacturerSummary:
      "Mold Armor rapid remediation line positioned for visible mold/mildew cleanup on label surfaces, often with stronger marketing than ‘control-only’ products.",
    activeIngredients: ["EPA-registered actives (verify label and SDS)"],
    safetyWarnings: ["Ventilation", "PPE per label", "Do not treat as fabric refresher"],
    incompatibilities: ["bleach mixes per label"],
    expertAnalysis: [
      "Lets Concrobium stay mild-control while Mold Armor carries more remediation tone on staining and mildew growth.",
    ],
    verdictSummary: "Mold remediation peer in mold_control class.",
    sources: [{ label: "Mold Armor", url: "https://www.moldarmor.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "scrubbing-bubbles-daily-shower-cleaner": {
    slug: "scrubbing-bubbles-daily-shower-cleaner",
    manufacturerSummary:
      "SC Johnson daily shower spray under Scrubbing Bubbles aimed at soap film between deeper cleans.",
    activeIngredients: ["surfactant system (verify SDS)"],
    safetyWarnings: ["Slip hazard on wet tile"],
    incompatibilities: ["bleach in same step unless label allows"],
    expertAnalysis: [
      "Completes a four-way maintain cluster with Wet & Forget, Method, and Tilex for habit splitting.",
    ],
    verdictSummary: "Daily shower maintenance SKU.",
    sources: [{ label: "Scrubbing Bubbles", url: "https://www.scjohnson.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "pledge-everyday-clean-multisurface": {
    slug: "pledge-everyday-clean-multisurface",
    manufacturerSummary:
      "Pledge Everyday Clean variant for multisurface dusting and light soil—parallel shelf to classic multisurface positioning.",
    activeIngredients: ["surfactants and solvents (verify SDS)"],
    safetyWarnings: ["Over-saturation on raw wood"],
    incompatibilities: ["wax systems unless compatible"],
    expertAnalysis: [
      "Spreads Pledge-style cabinet care so Murphy/Method are not the only dust-light-film anchors.",
    ],
    verdictSummary: "Cabinet/dust multisurface peer.",
    sources: [{ label: "Pledge", url: "https://www.pledge.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "krud-kutter-kitchen-degreaser": {
    slug: "krud-kutter-kitchen-degreaser",
    manufacturerSummary:
      "Krud Kutter kitchen-formula degreaser aimed at range, hood, and stovetop grease—not the same SKU as the original concentrate.",
    activeIngredients: ["alkaline surfactant blend (verify SDS)"],
    safetyWarnings: ["Ventilation", "Skin/eye irritation"],
    incompatibilities: ["oven carbon programs—use oven cleaners"],
    expertAnalysis: [
      "Third hood/cooktop specialist to push broad concentrates down in exact kitchen lanes.",
    ],
    verdictSummary: "Kitchen surface degreaser peer.",
    sources: [{ label: "Krud Kutter", url: "https://www.krudkutter.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "febreze-fabric-refresher-antimicrobial": {
    slug: "febreze-fabric-refresher-antimicrobial",
    manufacturerSummary:
      "Febreze fabric spray with antimicrobial marketing—positioned for soft-surface odor refresh rather than wash-cycle disinfection.",
    activeIngredients: ["odor actives / surfactants (verify label)"],
    safetyWarnings: ["Fabric spot-test", "Not a hard-surface disinfect default"],
    incompatibilities: ["bleach on fabrics unless label allows"],
    expertAnalysis: [
      "Separates musty/refresh fabric needs from Lysol/Clorox laundry sanitizer logic.",
    ],
    verdictSummary: "Fabric refresh / musty odor peer.",
    sources: [{ label: "Febreze", url: "https://febreze.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "goo-gone-spray-gel": {
    slug: "goo-gone-spray-gel",
    manufacturerSummary:
      "Goo Gone gel spray format marketed for vertical surfaces and cling on sticky residues.",
    activeIngredients: ["citrus / petroleum solvent blend (verify SDS)"],
    safetyWarnings: ["Flammable", "Ventilation", "Finish testing"],
    incompatibilities: ["heat", "incompatible plastics per label"],
    expertAnalysis: [
      "Refines adhesive ladder between Un-Du, liquid Goo Gone, and heavy 3M/Goof Off cases.",
    ],
    verdictSummary: "Gel adhesive remover variant.",
    sources: [{ label: "Goo Gone", url: "https://googone.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "zero-odor-eliminator-spray": {
    slug: "zero-odor-eliminator-spray",
    manufacturerSummary:
      "Zero Odor positioned as molecular/neutral odor elimination versus perfume-forward fabric refresh marketing.",
    activeIngredients: ["proprietary neutralizers (verify label)"],
    safetyWarnings: ["Ventilation in small rooms"],
    incompatibilities: ["mixing with incompatible chemistries per label"],
    expertAnalysis: [
      "Pairs with Fresh Wave and Febreze so musty is not a single-SKU or single-style branch.",
    ],
    verdictSummary: "Musty / neutral-odor specialist peer.",
    sources: [{ label: "Zero Odor", url: "https://www.zeroodor.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "fresh-wave-odor-removing-spray": {
    slug: "fresh-wave-odor-removing-spray",
    manufacturerSummary:
      "Fresh Wave plant-oil style odor sprays for soft surfaces and rooms—distinct from enzymes and cycle sanitizers.",
    activeIngredients: ["plant extracts / surfactants (verify SDS)"],
    safetyWarnings: ["Spot-test delicate fabrics"],
    incompatibilities: ["bleach unless label allows"],
    expertAnalysis: [
      "Completes a four-lane odor mental model: enzyme, disinfect, fragrance refresh, neutralizer.",
    ],
    verdictSummary: "Soft-surface deodorizing peer.",
    sources: [{ label: "Fresh Wave", url: "https://www.freshwave.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "cerama-bryte-cooktop-cleaner": {
    slug: "cerama-bryte-cooktop-cleaner",
    manufacturerSummary:
      "Cerama Bryte cleaner/pad system for glass-ceramic cooktops—cosmetic and light soil, not oven caustic work.",
    activeIngredients: ["mild abrasive / surfactant (verify SDS)"],
    safetyWarnings: ["Use only on approved smooth cooktops"],
    incompatibilities: ["coated or textured cooktops if label forbids"],
    expertAnalysis: [
      "Separates delicate cooktop finish care from hood degreasers and industrial concentrates.",
    ],
    verdictSummary: "Cooktop precision cleaner anchor.",
    sources: [{ label: "Cerama Bryte", url: "https://www.ceramabryte.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },

  "sprayway-stainless-steel-cleaner": {
    slug: "sprayway-stainless-steel-cleaner",
    manufacturerSummary:
      "Sprayway aerosol stainless cleaner for appliance cosmetics—shelf neighbor to other stainless polishes.",
    activeIngredients: ["hydrocarbon propellant / oils / surfactants (verify SDS)"],
    safetyWarnings: ["Flammable aerosol", "Ventilation"],
    incompatibilities: ["heat sources"],
    expertAnalysis: [
      "Third stainless_polish cluster member to stop degreasers from owning all steel appearance rows.",
    ],
    verdictSummary: "Stainless appearance aerosol peer.",
    sources: [{ label: "Sprayway", url: "https://www.spraywayinc.com/", type: "manufacturer" }],
    lastReviewed: new Date().toISOString(),
  },
};
