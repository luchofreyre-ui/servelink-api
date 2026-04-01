import type { EvidenceRecord } from "./evidenceTypes";

/**
 * Encyclopedia seed-batch-015 — glass + laminate full collapse (canonical keys;
 * shower glass / doors / laminate counters resolve here via aliases).
 */
export const BATCH_015_EVIDENCE: EvidenceRecord[] = [
  {
    surface: "glass",
    problem: "oil stains",
    soilClass: "grease",
    recommendedChemistry: "solvent",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Isopropyl-alcohol or labeled glass degreasing cleaner",
        chemistry: "solvent",
        surfaces: ["glass", "shower glass", "mirrors"],
        avoids: ["ammonia mixes near damaged film coatings", "excess solvent on adjacent caulking"],
        reason: "Alcohol-class solvents cut hydrocarbon films and flash off without heavy residue on non-porous glass.",
      },
    ],
    method: {
      tools: ["lint-free microfiber", "spray on cloth first near edges"],
      dwell: "Brief; keep runs vertical in showers",
      agitation: "Straight overlaps; flip cloth to clean face",
      rinse: "Optional distilled water mist if cleaner leaves streak salts",
      dry: "Dry buff with clean microfiber",
    },
    whyItHappens:
      "Skin oils, hair products, and cooking aerosols plate onto glass and polymerize into a slippery haze that smears when wet-wiped.",
    whyItWorks:
      "Compatible solvents reduce oil surface tension so film transfers into the cloth instead of spreading into a rainbow sheen.",
    mistakes: ["Paper towels that shed lint and abrade soft coatings.", "Soaking frames and silicone with solvent overspray."],
    benchmarks: ["Oil drag should drop in raking light after dry buff."],
    professionalInsights: ["On coated low-iron shower glass, confirm solvent allowance on the coating datasheet."],
    sources: ["glass cleaner manufacturer guidance", "shower glass maintenance summaries"],
  },
  {
    surface: "glass",
    problem: "food residue",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral dish detergent diluted for glass",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["undiluted concentrate that leaves soap film"],
        reason: "Mild surfactants lift polar food soils without etching glass or attacking nearby stone thresholds.",
      },
    ],
    method: {
      tools: ["microfiber sponge", "second rinse cloth"],
      dwell: "Short on dried-on spots",
      agitation: "Straight strokes; edges and corners first",
      rinse: "Plenty of clean water to remove detergent",
      dry: "Squeegee or dry microfiber to prevent streak salts",
    },
    whyItHappens:
      "Sugars and proteins dry onto glass near prep areas and splatter zones, bonding through evaporation and humidity cycles.",
    whyItWorks:
      "Neutral surfactants solubilize organics so rinse water carries them off the non-porous surface efficiently.",
    mistakes: ["Skipping rinse so detergent becomes the new haze.", "Hot water flash on cold glass in winter installs."],
    benchmarks: ["Residue should release with visible soil in rinse water."],
    professionalInsights: ["Backsplash glass often needs edge tooling where silicone meets tile."],
    sources: ["kitchen glass care primers"],
  },
  {
    surface: "glass",
    problem: "protein residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Mild alkaline glass-safe cleaner or labeled bath protein spotter",
        chemistry: "alkaline",
        surfaces: ["glass", "shower doors"],
        avoids: ["chlorine mixed with acid", "strong caustic on coated glass"],
        reason: "Alkaline conditions help hydrolyze denatured protein films that resist neutral detergents alone.",
      },
    ],
    method: {
      tools: ["non-scratch pad if label allows", "microfiber"],
      dwell: "Cool short dwell per label",
      agitation: "Pat-lift on spots; vertical passes on fields",
      rinse: "Thorough rinse",
      dry: "Dry immediately",
    },
    whyItHappens:
      "Egg, dairy, and pet saliva denature into tacky protein films on shower and patio glass where rinse is incomplete.",
    whyItWorks:
      "Controlled alkaline surfactancy breaks protein adhesion so mechanical wiping removes the film without acid risk.",
    mistakes: ["Hot water that sets some protein complexes.", "Acid chasing haze and risking etched spatter nearby."],
    benchmarks: ["Protein tack should fall after complete rinse and dry."],
    professionalInsights: ["If odor persists, check weep holes and track drains for biofilm below the panel."],
    sources: ["bath glass protein spot notes"],
  },
  {
    surface: "glass",
    problem: "rust stains",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic bathroom rust spot treatment labeled for glass",
        chemistry: "acidic",
        surfaces: ["glass"],
        avoids: ["natural stone saddles without mask", "bleach"],
        reason: "Targeted acid dissolves iron oxide films that plate from hardware and fertilizer overspray.",
      },
    ],
    method: {
      tools: ["cotton swab or small cloth patch", "masking for stone"],
      dwell: "Spot-only; short",
      agitation: "Minimal; let chemistry work",
      rinse: "Flood rinse per label",
      dry: "Inspect dry",
    },
    whyItHappens:
      "Ferrous hardware, lawn care track-in, and metal scouring pads leave iron oxides that bond to damp glass.",
    whyItWorks:
      "Compatible acid reduces visible iron staining on the glass surface when neighbors tolerate rinse control.",
    mistakes: ["Sheet treating entire door with acid.", "Drying acid on silicone or stone."],
    benchmarks: ["Orange-brown tone should step down across controlled passes."],
    professionalInsights: ["If rust returns from frame weep paths, replace failing hardware or treat source."],
    sources: ["acidic rust remover labels for glass context"],
  },
  {
    surface: "glass",
    problem: "tannin stains",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Hydrogen peroxide–based glass-safe spot treatment or oxygen bleach system per label",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["mixing with acid", "coated glass without approval"],
        reason: "Controlled oxidation can lighten organic chromophores from beverages and plant material on glass.",
      },
    ],
    method: {
      tools: ["microfiber", "PPE"],
      dwell: "Per oxidizer label on small area test",
      agitation: "Light if allowed",
      rinse: "Complete rinse",
      dry: "Buff",
    },
    whyItHappens:
      "Coffee, tea, and wine splatter dries onto glass and leaves brown films that read as permanent in hard water areas.",
    whyItWorks:
      "Oxygen chemistry attacks some tannin pigments while glass itself remains non-reactive to mild peroxide systems.",
    mistakes: ["Under-dwell on oxidizer steps.", "Using bleach acid cocktails."],
    benchmarks: ["Brown haze should fade across evaluations when stain is organic film."],
    professionalInsights: ["If stain is between panes, cleaning cannot reach it—seal failure service applies."],
    sources: ["oxygen bleach use labels", "tannin stain chemistry overviews"],
  },
  {
    surface: "glass",
    problem: "bacteria buildup",
    soilClass: "biofilm",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered disinfectant labeled for glass non-food contact",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["skipping label wet time"],
        reason: "Removes soil first conceptually; disinfectant at proper contact time addresses surface bioload on glass.",
      },
    ],
    method: {
      tools: ["microfiber", "PPE"],
      dwell: "Preclean film; then disinfectant wet time as labeled",
      agitation: "Even wipes",
      rinse: "If label requires before pet/child contact",
      dry: "Airflow",
    },
    whyItHappens:
      "High-touch sliders, vanities, and shower doors accumulate skin soil and moisture that support bacterial films.",
    whyItWorks:
      "Soil removal plus labeled antimicrobial contact reduces measurable bioload on the impervious surface.",
    mistakes: ["Spray-and-wipe under contact time.", "Mixing quat with anionic soap residue."],
    benchmarks: ["Slippery biofilm drag should improve when maintenance is consistent."],
    professionalInsights: ["Track channels often harbor more biomass than the field—detail those separately."],
    sources: ["EPA disinfectant label guidance"],
  },
  {
    surface: "glass",
    problem: "etching",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Cerium-oxide glass polish kit or professional referral for severe damage",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["aggressive abrasives on soft coatings"],
        reason: "True etch is missing glass; mild polish can improve appearance on some monolithic glass when labeled.",
      },
    ],
    method: {
      tools: ["low-speed applicator if trained", "bright light assessment"],
      dwell: "Per polish kit",
      agitation: "Controlled small area tests",
      rinse: "Remove polish residue completely",
      dry: "Inspect at angles",
    },
    whyItHappens:
      "Hydrofluoric-class exposure, harsh tile acid overspray, or hard water bake cycles can frost or pit glass permanently.",
    whyItWorks:
      "Light mechanical polish may reduce apparent frost; deep etch or coating damage may require panel replacement.",
    mistakes: ["Stronger acid to clear frost.", "Wax that traps moisture in pits."],
    benchmarks: ["Clarity may improve slightly; rainbow permanent haze often means replace."],
    professionalInsights: ["Document before/after photos for warranty discussions on new installs."],
    sources: ["glass polish manufacturer instructions"],
  },
  {
    surface: "glass",
    problem: "oxidation",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Fine glass polish or manufacturer renewal treatment for exposed hardware films",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["steel wool on tempered glass"],
        reason: "Surface fog from environmental exposure or coating aging sometimes responds to approved polish before replace.",
      },
    ],
    method: {
      tools: ["foam pad", "clean water"],
      dwell: "Per kit",
      agitation: "Low pressure even passes",
      rinse: "Remove all compound",
      dry: "Inspect",
    },
    whyItHappens:
      "Long UV and pollutant exposure dulls exterior glass or degrades some aftermarket coatings unevenly.",
    whyItWorks:
      "Polish removes a microscopic layer of weathered surface or compound fills micro-roughness per product claims.",
    mistakes: ["Assuming all clouding is soil when it is failed low-E seal."],
    benchmarks: ["If polish does not change fog, suspect insulated unit seal failure."],
    professionalInsights: ["IGU cloud between panes is never fixable with surface polish."],
    sources: ["exterior glass renewal product sheets"],
  },
  {
    surface: "glass",
    problem: "corrosion",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral pH glass cleaner for assessment; replace if pitting confirmed",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["chloride-heavy sprays on aluminum frames wicking to glass"],
        reason: "Corrosion on glass is rare—often it is etched or coated failure; neutral clean confirms removable vs damage.",
      },
    ],
    method: {
      tools: ["microfiber", "magnifier optional"],
      dwell: "Minimal",
      agitation: "Gentle",
      rinse: "Distilled water optional test",
      dry: "Inspect pitting with raking light",
    },
    whyItHappens:
      "Alkaline concrete wash overspray, pool chemistry mist, or coastal salt films can attack glass edges or spandrel coatings.",
    whyItWorks:
      "Stopping exposure and neutral rinsing halts progression; pitted glass needs replacement not stronger chemistry.",
    mistakes: ["Acid to shine pitted glass.", "Ignoring frame weeps that wick chlorides."],
    benchmarks: ["Active crystal growth or pitting should not worsen after neutral care and source control."],
    professionalInsights: ["Differentiate spandrel ceramic frit wear from true glass corrosion."],
    sources: ["architectural glass maintenance advisories"],
  },
  {
    surface: "glass",
    problem: "tarnish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Ammonia-free or labeled shower glass cleaner",
        chemistry: "neutral",
        surfaces: ["glass", "mirrors"],
        avoids: ["dirty rinse bucket"],
        reason: "Smoky tarnish is often polymerized soap and mineral film; neutral surfactants lift it without etching.",
      },
    ],
    method: {
      tools: ["two-towel method", "squeegee optional"],
      dwell: "Brief",
      agitation: "Vertical then horizontal passes",
      rinse: "If product builds",
      dry: "Second dry towel",
    },
    whyItHappens:
      "Cleaner buildup, rinse aids, and hard water dry in layers so glass looks dull though structurally sound.",
    whyItWorks:
      "Proper surfactant and mechanical removal restores specular clarity when no permanent etch is present.",
    mistakes: ["Circular wiping that recenters residue.", "Using same damp cloth for whole house."],
    benchmarks: ["Raking light should show uniform reflection after dry."],
    professionalInsights: ["First clean with plain water test—sometimes only product buildup is the issue."],
    sources: ["professional glass cleaning workflows"],
  },
  {
    surface: "glass",
    problem: "heat damage",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral cleaner for soot only; replace tempered glass if white haze or crack stars appear",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["cold water on hot glass"],
        reason: "Thermal shock and resin smoke can craze or haze glass; cleaning only addresses loose deposits.",
      },
    ],
    method: {
      tools: ["soft brush for loose soot", "HEPA vacuum"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "Damp wipe if safe temperature",
      dry: "Inspect for crack propagation",
    },
    whyItHappens:
      "Cooktop blow-back, candle soot, or wildfire ash deposits heat and particulate that stress or haze the pane.",
    whyItWorks:
      "Loose char lifts gently; white heat bloom or crack pattern means glass safety replacement not chemistry.",
    mistakes: ["Scraping tempered surface with metal.", "Ignoring spider cracks as cosmetic."],
    benchmarks: ["Soot reduces; structural haze remains until panel swap."],
    professionalInsights: ["Tempered damage can be delayed failure—document and advise replacement."],
    sources: ["fire restoration glass assessment notes"],
  },
  {
    surface: "glass",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Distilled water final rinse or neutral glass cleaner with consistent squeegee technique",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["too much product"],
        reason: "Streak unevenness is usually technique and mineral in water; even wipe and quality rinse fix appearance.",
      },
    ],
    method: {
      tools: ["squeegee with fresh rubber", "lint-free towels", "distilled water for final pass optional"],
      dwell: "Minimal",
      agitation: "Top-down overlaps with consistent pressure",
      rinse: "Low mineral water if available",
      dry: "Detail edges with dry towel",
    },
    whyItHappens:
      "Inconsistent product volume, hard water, and circular wiping leave high-low detergent bands that read as uneven sheen.",
    whyItWorks:
      "Uniform tool path and controlled chemistry volume produce even evaporation and specular match across the pane.",
    mistakes: ["Sun-facing rush that flashes streaks before inspection.", "Fabric softener residue in towels."],
    benchmarks: ["Field should look uniform in cross-light after full dry."],
    professionalInsights: ["Change squeegee rubber seasonally; nicked rubber causes exactly this pattern."],
    sources: ["window cleaning trade technique summaries"],
  },

  {
    surface: "laminate",
    problem: "oil stains",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Mild alkaline degreaser labeled for laminate countertops",
        chemistry: "alkaline",
        surfaces: ["laminate", "laminate counters"],
        avoids: ["flooding seams", "chlorine on prolonged dwell"],
        reason: "Alkaline surfactants emulsify kitchen oils on melamine wear layers without the risks of strong solvents.",
      },
    ],
    method: {
      tools: ["microfiber", "plastic scraper at low angle for crust if allowed"],
      dwell: "Short near cook zones",
      agitation: "Straight passes; avoid sawing corners",
      rinse: "Damp wipe to remove alkaline residue",
      dry: "Towel",
    },
    whyItHappens:
      "Aerosolized cooking oils and hand films plate onto laminate texture and polymerize into tacky dark lanes.",
    whyItWorks:
      "Controlled alkaline detergency lifts oils while keeping liquid out of core seams better than flooding with water alone.",
    mistakes: ["Scotch-Brite that micro-scuffs the wear layer.", "Undiluted degreaser left to dry."],
    benchmarks: ["Oil sheen should drop after dry inspection."],
    professionalInsights: ["Backsplash laminate near stoves often needs more frequent light passes than distant fields."],
    sources: ["laminate manufacturer kitchen care PDFs"],
  },
  {
    surface: "laminate",
    problem: "food residue",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral pH laminate-safe surface cleaner",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["wax incompatible with future seals"],
        reason: "Neutral surfactants release dried food films without swelling edges common to particleboard cores.",
      },
    ],
    method: {
      tools: ["microfiber sponge"],
      dwell: "Brief on dried spots",
      agitation: "Even pressure",
      rinse: "Damp wipe",
      dry: "Immediate on seams",
    },
    whyItHappens:
      "Sugars and starches cure on horizontal laminate and bond in low spots of texture after repeated damp wiping.",
    whyItWorks:
      "Surfactants reduce adhesion energy so residue transfers into the cloth without harsh pH on the print layer.",
    mistakes: ["Letting juice pools sit into seams overnight.", "Steam saturation on budget laminate."],
    benchmarks: ["Tack and visual film should improve within one or two cycles."],
    professionalInsights: ["Lift crumbs before wetting to avoid scratching with grit."],
    sources: ["laminate care guides"],
  },
  {
    surface: "laminate",
    problem: "protein residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Mild alkaline cleaner labeled for laminate",
        chemistry: "alkaline",
        surfaces: ["laminate", "laminate counters"],
        avoids: ["hot shock on delaminated edges"],
        reason: "Alkaline conditions help lift denatured protein from wear surface without aggressive acid.",
      },
    ],
    method: {
      tools: ["microfiber", "cool water precondition"],
      dwell: "Cool short dwell",
      agitation: "Pat on spots",
      rinse: "Damp wipe",
      dry: "Edge dry priority",
    },
    whyItHappens:
      "Egg, dairy, and pet mess denature into films that grip laminate microtexture near prep zones.",
    whyItWorks:
      "Controlled alkaline cleaning hydrolyzes protein adhesion enough for mechanical removal with minimal moisture.",
    mistakes: ["Heat setting protein.", "Bleach that prints decorative layer."],
    benchmarks: ["Protein drag should decrease after thorough dry."],
    professionalInsights: ["If swelling appears at seams, stop moisture and assess core exposure."],
    sources: ["residential laminate spot guides"],
  },
  {
    surface: "laminate",
    problem: "rust stains",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic rust spot gel rated for laminate when tested in hidden area",
        chemistry: "acidic",
        surfaces: ["laminate"],
        avoids: ["prolonged dwell", "acid on exposed core"],
        reason: "Short acidic contact can reduce iron staining on the wear layer when seams are intact and tested.",
      },
    ],
    method: {
      tools: ["cotton swab", "timer", "neutralizing damp wipe per label"],
      dwell: "Spot; shortest effective",
      agitation: "Minimal",
      rinse: "Several clear wipes",
      dry: "Immediate",
    },
    whyItHappens:
      "Wet cans, cast iron, and track-in from garages plate iron oxides that concentrate on laminate near sinks.",
    whyItWorks:
      "Targeted acid dissolves surface iron compounds while tight control limits exposure to print and edge.",
    mistakes: ["Acid flooding across a seam.", "No neutralizing rinse when label requires."],
    benchmarks: ["Orange marks should lighten in stages; no print lift in test area."],
    professionalInsights: ["If acid darkens a hidden test, stop—some prints use metal-reactive inks."],
    sources: ["acidic spot cleaner laminate cautions"],
  },
  {
    surface: "laminate",
    problem: "tannin stains",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Oxygen bleach paste or peroxide system labeled for laminate",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["chlorine mixed with acid"],
        reason: "Controlled oxidation can lighten organic brown stains on the wear surface when label allows.",
      },
    ],
    method: {
      tools: ["plastic spreader", "PPE"],
      dwell: "Per label with spot test",
      agitation: "Light",
      rinse: "Thorough",
      dry: "Inspect print integrity",
    },
    whyItHappens:
      "Coffee and wine wick into texture and leave chromophores that read permanent on light laminate patterns.",
    whyItWorks:
      "Oxygen chemistry attacks some tannin pigments while laminate resin resists mild peroxide when tested.",
    mistakes: ["Over-dwell bleaching pattern contrast.", "Scrubbing through wear layer."],
    benchmarks: ["Brown should step down; no print ghosting in test square."],
    professionalInsights: ["Dark seams mean fluid intrusion—oxidizer will not fix swollen core."],
    sources: ["oxygen stain treatment labels"],
  },
  {
    surface: "laminate",
    problem: "bacteria buildup",
    soilClass: "biofilm",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered food-contact or non-food disinfectant per site label on laminate",
        chemistry: "neutral",
        surfaces: ["laminate counters"],
        avoids: ["skipping preclean", "mixing chemistries"],
        reason: "Soil removal then labeled wet time addresses bioload on high-touch laminate without unnecessary acid.",
      },
    ],
    method: {
      tools: ["microfiber", "PPE"],
      dwell: "Preclean; disinfect per label",
      agitation: "Even",
      rinse: "Food surfaces per label",
      dry: "Air dry or towel per label",
    },
    whyItHappens:
      "Sponge reservoirs, dish mats, and pet bowls keep laminate chronically damp enough for bacterial films.",
    whyItWorks:
      "Disinfectants on cleaned surfaces reduce bacteria counts when contact time and rinse rules are followed.",
    mistakes: ["Quat binding with leftover anionic soap.", "Bleach on stainless adjacent laminate seam flood."],
    benchmarks: ["Odor and slipperiness should improve with drying habit change."],
    professionalInsights: ["Replace cellulose sponges; they are often the reservoir not the laminate."],
    sources: ["EPA label use-site tables"],
  },
  {
    surface: "laminate",
    problem: "etching",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Manufacturer seam repair or laminate filler; neutral cleaner for hygiene only",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["strong acid trying to even gloss"],
        reason: "Etching is destroyed wear layer; cleaning cannot rebuild melamine print or resin thickness.",
      },
    ],
    method: {
      tools: ["bright light", "microfiber for soil in texture only"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "If cleaner used for adjacent soil",
      dry: "Assess delamination risk",
    },
    whyItHappens:
      "Drain cleaners, toilet bowl acid splatter, and wrong descalers cloud or pit the protective laminate layer.",
    whyItWorks:
      "Stopping chemistry and patching or replacing the affected area restores function; cleaners only remove loose debris.",
    mistakes: ["Waxing over etched area to hide damage.", "Sanding through color layer."],
    benchmarks: ["Haze persists after neutral wipe—plan repair or replace."],
    professionalInsights: ["Map splash zone from nearby toilet or disposal—fix source before new top."],
    sources: ["laminate damage assessment notes"],
  },
  {
    surface: "laminate",
    problem: "oxidation",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral cleaner; UV-exposed laminate may need edge banding or top replacement",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["aggressive polish on print"],
        reason: "Yellowing and chalking often are resin aging not soil; neutral clean confirms non-removable change.",
      },
    ],
    method: {
      tools: ["microfiber"],
      dwell: "Brief",
      agitation: "Gentle",
      rinse: "Damp wipe",
      dry: "Compare to hidden area like inside cabinet door",
    },
    whyItHappens:
      "UV through windows and heat from appliances age melamine resin so the surface yellows unevenly versus protected zones.",
    whyItWorks:
      "Cleaning removes surface grime; remaining color shift needs refinishing strategy or replacement.",
    mistakes: ["Bleach to whiten aged resin.", "Oil soaps that amber further."],
    benchmarks: ["If hidden match does not return after clean, oxidation is in the material."],
    professionalInsights: ["Window film or blinds extend laminate life more than chemistry."],
    sources: ["cabinet laminate aging studies"],
  },
  {
    surface: "laminate",
    problem: "corrosion",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral laminate cleaner after stopping chemical source",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["continued strong toilet cleaner overspray"],
        reason: "Chemical attack swells or delaminates edges; neutral rinse halts progression before carpentry repair.",
      },
    ],
    method: {
      tools: ["towels for spill stop", "microfiber"],
      dwell: "N/A until source controlled",
      agitation: "Gentle wipe of loose residue",
      rinse: "Multiple damp passes to dilute trapped chemistry in seams",
      dry: "Fan",
    },
    whyItHappens:
      "Harsh bathroom products, hair dye developers, and drain openers splash onto vanity laminate and wick into joints.",
    whyItWorks:
      "Dilution and neutral maintenance limit further hydrolysis of adhesives; visible warp needs part replacement.",
    mistakes: ["Sealing over swollen seam.", "Heat gun drying that warps further."],
    benchmarks: ["Active swelling should not worsen after neutral flush and dry."],
    professionalInsights: ["Check sink caulk line—capillary wicking is common at back splash."],
    sources: ["vanity laminate failure case notes"],
  },
  {
    surface: "laminate",
    problem: "tarnish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral laminate surface cleaner or manufacturer polish if compatible",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["silicone polishes that haze over time"],
        reason: "Dulling is often cleaner film and hand oils; neutral surfactants restore even gloss on intact wear.",
      },
    ],
    method: {
      tools: ["microfiber", "second dry towel"],
      dwell: "Brief",
      agitation: "Overlapping passes",
      rinse: "Damp wipe if product builds",
      dry: "Buff",
    },
    whyItHappens:
      "Layered all-purpose sprays and dish soap residue scatter light so laminate looks smoky though unworn.",
    whyItWorks:
      "Film stripping with neutral cleaner returns specular clarity when the wear layer is intact.",
    mistakes: ["Abrasive pads marketed as magic erasers.", "Vinegar habit that risks long-term print stress."],
    benchmarks: ["Sheen should match an inside cabinet sample after clean."],
    professionalInsights: ["Strip to neutral first; many tarnish calls are product buildup."],
    sources: ["laminate manufacturer cleaning lines"],
  },
  {
    surface: "laminate",
    problem: "heat damage",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral wipe for char dust only; replace top if bubbled or delaminated",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["hot pan direct on surface"],
        reason: "Heat blisters bond lines and chars print; cleaning cannot reverse polymer separation.",
      },
    ],
    method: {
      tools: ["soft cloth", "cool surface check"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "If soot cleaner used",
      dry: "Inspect bubble progression",
    },
    whyItHappens:
      "Hot cookware, toaster heat plumes, and heat-gun misuse exceed laminate temperature limits locally.",
    whyItWorks:
      "Loose soot lifts; delamination and color change require panel replacement or professional overlay.",
    mistakes: ["Scraping bubbled area.", "Oil to hide white heat mark."],
    benchmarks: ["Flat intact areas clean normally; raised bubbles mean failure."],
    professionalInsights: ["Always use trivets; insurance may cover adjacent cabinet heat lines."],
    sources: ["countertop heat damage field notes"],
  },
  {
    surface: "laminate",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral cleaner; compatible laminate polish only if manufacturer allows",
        chemistry: "neutral",
        surfaces: ["laminate", "laminate counters"],
        avoids: ["spot-only wax buildup"],
        reason: "Uneven gloss is often differential residue and wear; uniform clean then even approved dressing if any.",
      },
    ],
    method: {
      tools: ["clean microfiber per zone", "even pressure"],
      dwell: "Brief",
      agitation: "Full-field passes same direction",
      rinse: "Damp wipe to remove cleaner",
      dry: "Consistent buff technique",
    },
    whyItHappens:
      "Spot wiping, uneven product use, and traffic polish some lanes matte while others stay glossy.",
    whyItWorks:
      "Stripping residue evenly restores a single refractive condition across the counter before any optional maintainer.",
    mistakes: ["Heavy polish in one spot creating new contrast.", "Missing seam dry causing water line dullness."],
    benchmarks: ["Raking light across full top should read uniform when dry."],
    professionalInsights: ["Photograph before—customers often misread grain variation as uneven finish."],
    sources: ["laminate field finishing technique notes"],
  },
];
