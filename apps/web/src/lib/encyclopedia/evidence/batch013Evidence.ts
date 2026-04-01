import type { EvidenceRecord } from "./evidenceTypes";

/**
 * Encyclopedia seed-batch-013 — hardwood oil/food/protein + mold/mildew;
 * grout oil/food/protein + rust/tannin + mold/mildew.
 */
export const BATCH_013_EVIDENCE: EvidenceRecord[] = [
  {
    surface: "hardwood",
    problem: "oil stains",
    soilClass: "grease",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent", "acidic"],
    products: [
      {
        name: "Neutral wood-safe cleaner with light surfactant",
        chemistry: "neutral",
        surfaces: ["hardwood", "sealed wood"],
        avoids: ["flooding seams", "petroleum solvents on unknown finish"],
        reason: "Lifts surface oils and hand films without stripping polyurethane or penetrating oil systems.",
      },
    ],
    method: {
      tools: ["microfiber", "spray onto cloth not floor"],
      dwell: "Minimal; keep liquid out of open joints",
      agitation: "With-grain light wipes; change cloth face as it loads",
      rinse: "Optional barely-damp clear water pass",
      dry: "Immediate dry buff in direction of grain",
    },
    whyItHappens:
      "Cooking aerosols and skin oils plate onto finish texture and darken where traffic polishes the film.",
    whyItWorks:
      "Neutral surfactants reduce oil adhesion so residue transfers into the cloth instead of smearing across sheen.",
    mistakes: ["Over-wetting that raises grain.", "Solvent wipes that soften alkyd or wax-modified finishes."],
    benchmarks: ["Surface oil sheen should reduce after dry-down; deep absorption may remain."],
    professionalInsights: ["Test sheen in a closet return before treating visible field areas."],
    sources: ["NWFA maintenance summaries", "finish manufacturer washability notes"],
  },
  {
    surface: "hardwood",
    problem: "food residue",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "pH-neutral hardwood floor cleaner",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["steam on unknown finish"],
        reason: "Breaks carbohydrate and fat films without aggressive pH that clouds finish.",
      },
    ],
    method: {
      tools: ["microfiber mop or hand cloth"],
      dwell: "Brief spot only",
      agitation: "With grain; no circular grinding",
      rinse: "Damp—not wet—pass if cleaner residue drags",
      dry: "Towel or dry pad immediately",
    },
    whyItHappens:
      "Dried food and drink sugars bond to the wear layer and read as tacky or dull patches in traffic lanes.",
    whyItWorks:
      "Neutral surfactants solubilize polar organics so they release without etching the coating.",
    mistakes: ["Excess water volume near board edges.", "Oil soaps that build incompatible films."],
    benchmarks: ["Residue should lift within one or two light cycles when finish is intact."],
    professionalInsights: ["Sweet spills need prompt blotting; aged polymerized spots need patience."],
    sources: ["manufacturer hardwood care PDFs"],
  },
  {
    surface: "hardwood",
    problem: "protein residue",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral cleaner; enzyme spot system if finish label allows",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["hot water flash on wax finishes"],
        reason: "Lifts denatured protein films with minimal moisture and controlled chemistry.",
      },
    ],
    method: {
      tools: ["soft cloth", "plastic scraper at low angle for crust only if finish allows"],
      dwell: "Cool short dwell on cloth",
      agitation: "Pat-lift; avoid sawing motion",
      rinse: "Damp wipe",
      dry: "Dry immediately",
    },
    whyItHappens:
      "Egg, dairy, and pet accidents denature into a tacky protein film that grips finish microtexture.",
    whyItWorks:
      "Controlled neutral cleaning plus optional labeled enzyme step cleaves or lifts protein without heat setting.",
    mistakes: ["Hot water or aggressive scrub that sets protein.", "Bleach that damages color."],
    benchmarks: ["Protein drag should decrease after cool cycles and thorough dry."],
    professionalInsights: ["If odor persists, assess whether fluid reached seams or subfloor."],
    sources: ["field protein spot notes on finished wood"],
  },
  {
    surface: "hardwood",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Wood-safe cleaner followed by EPA-registered surface disinfectant if label allows finished wood",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["soaking", "chlorine gas risk from mixing"],
        reason: "Removes surface soil so any labeled antimicrobial step can contact the film.",
      },
    ],
    method: {
      tools: ["microfiber", "PPE per disinfectant label"],
      dwell: "Cleaner first; disinfectant wet time only as labeled on wood",
      agitation: "Light with grain",
      rinse: "Per disinfectant label",
      dry: "Fan and towel; verify moisture source",
    },
    whyItHappens:
      "Chronic humidity, rug occlusion, or exterior water tracks sustain surface mold on finish or grain openings.",
    whyItWorks:
      "Physical removal of surface biomass plus labeled products reduces visible growth when moisture is controlled.",
    mistakes: ["Bleach-only without soil removal.", "Soaking boards which raises grain and feeds return."],
    benchmarks: ["Visible growth should reduce; recurrence means moisture path still active."],
    professionalInsights: ["Fix ventilation or leak before chasing chemistry on wood."],
    sources: ["EPA surface disinfectant label guidance", "IICRC moisture overview context"],
  },
  {
    surface: "hardwood",
    problem: "mildew stains",
    soilClass: "biofilm",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral wood-safe cleaner with optional mildew-rated follow-up per label",
        chemistry: "neutral",
        surfaces: ["hardwood", "trim"],
        avoids: ["over-wetting tongue-and-groove"],
        reason: "Lifts pigmented mildew film from finish without unnecessary acid exposure.",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush for grout-adjacent wood only if sealed"],
      dwell: "Brief",
      agitation: "With grain",
      rinse: "Damp wipe",
      dry: "Immediate dry; increase airflow",
    },
    whyItHappens:
      "Bath and exterior door zones cycle humidity so mildew pigments anchor in finish low spots.",
    whyItWorks:
      "Surfactant cleaning removes surface hyphae and soil; compatible mildew treatments address pigment when labeled.",
    mistakes: ["Over-wetting baseboards that wick into drywall.", "Wax that traps moisture."],
    benchmarks: ["Stain should lighten across dry cycles when film not absorbed into raw wood."],
    professionalInsights: ["If stain is under failed finish, recoating beats stronger chemistry."],
    sources: ["manufacturer bath-adjacent wood care"],
  },

  {
    surface: "grout",
    problem: "oil stains",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline degreaser rated for tile and grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["acid-sensitive stone thresholds without barrier"],
        reason: "Emulsifies cooking and skin oils wicked into cementitious pores.",
      },
    ],
    method: {
      tools: ["grout brush", "microfiber", "fresh rinse water"],
      dwell: "Short near cook zones; refresh before drying",
      agitation: "Stroke along joints; lift oils out of texture",
      rinse: "Flood rinse to carry emulsified oil away",
      dry: "Inspect dry joint color",
    },
    whyItHappens:
      "Oils drain into the lowest texture—the grout line—where evaporation is slowest.",
    whyItWorks:
      "Alkaline surfactants reduce oil surface tension so agitation and rinse flush pores.",
    mistakes: ["Skipping agitation expecting spray-and-rinse magic.", "Spreading oil into stone with one dirty mop."],
    benchmarks: ["Joint color should normalize when oil not permanently stained into cement."],
    professionalInsights: ["Mat at transition reduces oil migration from kitchens."],
    sources: ["professional backsplash grout cleaning notes"],
  },
  {
    surface: "grout",
    problem: "food residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline tile and grout cleaner",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["wax-incompatible systems"],
        reason: "Releases dried food polymers from grout relief.",
      },
    ],
    method: {
      tools: ["grout brush", "sponge"],
      dwell: "Per label; keep joints damp",
      agitation: "Corners and coves first",
      rinse: "Volume rinse",
      dry: "Airflow",
    },
    whyItHappens:
      "Splatter dries into grout texture where mechanical wiping skips low points.",
    whyItWorks:
      "Alkaline surfactants saponify and lift fatty food films with brush contact.",
    mistakes: ["Insufficient dwell on polymerized spots.", "Cold grout slows chemistry."],
    benchmarks: ["Residue should lift with visible soil in rinse water."],
    professionalInsights: ["Second pass after tile face clears is normal."],
    sources: ["tile industry grout care summaries"],
  },
  {
    surface: "grout",
    problem: "protein residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline cleaner with surfactant package for kitchen grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["mixing with acid"],
        reason: "Hydrolyzes and lifts protein films trapped in pores.",
      },
    ],
    method: {
      tools: ["grout brush"],
      dwell: "Controlled; do not dry on colored grout untested",
      agitation: "Along joint crowns",
      rinse: "Heavy rinse",
      dry: "Inspect",
    },
    whyItHappens:
      "Egg and dairy films cure in joints near prep areas and pet zones.",
    whyItWorks:
      "Alkaline conditions help break protein adhesion so brushing moves soil into suspension.",
    mistakes: ["No rinse leaving alkaline salt haze.", "Acid immediately after alkaline without rinse."],
    benchmarks: ["Protein tack should drop after complete rinse and dry."],
    professionalInsights: ["Cool dwell beats hot shock on some sealers."],
    sources: ["commercial kitchen grout maintenance primers"],
  },
  {
    surface: "grout",
    problem: "rust stains",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic grout rust treatment rated for cementitious joints",
        chemistry: "acidic",
        surfaces: ["grout"],
        avoids: ["natural stone without mask", "bleach"],
        reason: "Dissolves iron oxide phases lodged in grout pores when neighbors tolerate acid.",
      },
    ],
    method: {
      tools: ["grout brush", "barrier for stone"],
      dwell: "Spot; short",
      agitation: "Targeted along stained joints",
      rinse: "Neutralize per label; flood rinse",
      dry: "Judge dry color",
    },
    whyItHappens:
      "Fastener bleed, fertilizer track-in, and metal furniture feet plate iron into porous grout.",
    whyItWorks:
      "Compatible acid chemistry reduces visible iron staining when cement and adjacent materials allow.",
    mistakes: ["Overuse acid weakening colored grout.", "Acid on marble saddle without protection."],
    benchmarks: ["Stain should lighten in stages; some iron may be permanent below surface."],
    professionalInsights: ["Identify metal source or stain returns."],
    sources: ["manufacturer acidic grout cleaner guidance"],
  },
  {
    surface: "grout",
    problem: "tannin stains",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline surfactant cleaner; oxygen bleach system if label allows grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["chlorine mixed with acid"],
        reason: "Lifts polyphenol films and supports controlled oxidative lightening when approved.",
      },
    ],
    method: {
      tools: ["grout brush", "PPE"],
      dwell: "Per oxygen system label if used",
      agitation: "Work stained joints evenly",
      rinse: "Thorough rinse",
      dry: "Ventilate",
    },
    whyItHappens:
      "Coffee, tea, and wine wick along joints and leave brown chromophores in cement pores.",
    whyItWorks:
      "Alkaline surfactants carry tannins; compatible oxygen chemistry can lighten remaining pigment.",
    mistakes: ["Under-dwell on oxidizer steps.", "Bleach cocktails with acid."],
    benchmarks: ["Stain should fade across multiple dry evaluations."],
    professionalInsights: ["Old tannins may need poultice or color seal consult."],
    sources: ["stain chemistry primers", "oxygen bleach label use sites"],
  },
  {
    surface: "grout",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered disinfectant cleaner for tile and grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["skipping label wet time"],
        reason: "Removes soil so disinfectant contact time is meaningful in porous joints.",
      },
    ],
    method: {
      tools: ["nylon brush", "PPE"],
      dwell: "Disinfectant wet time as directed on cleaned surface",
      agitation: "Corners and curbs first",
      rinse: "Rinse before next shower use",
      dry: "Ventilate",
    },
    whyItHappens:
      "Humidity, body soils, and slow-dry corners sustain mold biomass in cement pores.",
    whyItWorks:
      "Mechanical removal plus labeled antimicrobial steps reduce visible growth when moisture is managed.",
    mistakes: ["Painting over growth.", "Bleach-only without soil removal."],
    benchmarks: ["Growth clears visually after dry cycles when humidity is controlled."],
    professionalInsights: ["CFM and squeegee habit beat stronger chemistry long term."],
    sources: ["EPA label guidance", "tile industry mold remediation overviews"],
  },
  {
    surface: "grout",
    problem: "mildew stains",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline mildew treatment with surfactants for grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["sealing over stained grout"],
        reason: "Lifts pigmented hyphae staining common on cementitious joints.",
      },
    ],
    method: {
      tools: ["soft brush", "microfiber"],
      dwell: "Per label for stain lift",
      agitation: "Perimeter grout before field",
      rinse: "Complete rinse",
      dry: "Dry within hours",
    },
    whyItHappens:
      "Chronic damp plus body soils deposit food for mildew pigments along joints.",
    whyItWorks:
      "Surfactants carry pigments; antimicrobial claims must match label use site.",
    mistakes: ["Short dwell.", "Mixing chlorine with acids."],
    benchmarks: ["Stain lightens in stages across multiple dry cycles."],
    professionalInsights: ["If stains return in 48h, fix moisture before chemistry."],
    sources: ["manufacturer mildew cleaner labels", "moisture control primers"],
  },
];
