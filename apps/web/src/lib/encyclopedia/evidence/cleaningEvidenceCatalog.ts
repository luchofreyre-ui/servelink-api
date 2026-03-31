import type { EvidenceRecord } from "./evidenceTypes";

/**
 * Canonical (surface, problem) keys only. Synonyms resolve via evidenceResolver aliases.
 */
export const CLEANING_EVIDENCE_CATALOG: EvidenceRecord[] = [
  {
    surface: "masonry",
    problem: "general soil",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline masonry-safe cleaner (dilutable)",
        chemistry: "alkaline",
        surfaces: ["masonry"],
        avoids: ["acid-sensitive adjacent materials without protection"],
        reason:
          "Alkaline chemistry helps release general soil from porous mineral substrates without relying on acid etching",
      },
    ],
    method: {
      tools: ["stiff nylon brush", "low-pressure rinse", "microfiber for detail wipe"],
      dwell:
        "Apply diluted alkaline cleaner; keep the surface damp for controlled dwell (do not let it dry).",
      agitation:
        "Agitate with a stiff nylon brush to lift soil from pores and texture without grinding grit into the face.",
      rinse:
        "Rinse thoroughly with low pressure to flush loosened soil out of voids (avoid blasting water into joints).",
      dry:
        "Allow full dry-down before judging color; porous masonry darkens when wet and can mask remaining soil.",
    },
    whyItWorks:
      "Porous mineral surfaces trap soil within surface voids; alkaline cleaners plus agitation and thorough rinse lift and flush soil without relying on aggressive acid action.",
    whyItHappens:
      "Masonry accumulates soil as particles lodge into pores and textured faces; incomplete rinsing and repeated exposure layers contamination over time.",
    mistakes: [
      "Over-saturating porous masonry and driving moisture deeper into the substrate",
      "Using high pressure that erodes joints or forces water behind the surface",
      "Letting alkaline cleaner dry on the surface, which can leave residue films",
    ],
    benchmarks: [
      "Soil should lift visibly during brush agitation and rinse rather than smearing",
      "True results are best judged after full dry-down, because wet masonry reads uniformly darker",
    ],
    professionalInsights: [
      "Pre-wet porous masonry to control absorption and prevent cleaner from flashing off too fast",
      "Work small sections and rinse fully before moving on to avoid redeposit",
    ],
    sources: ["Field masonry-cleaning workflow notes (internal)"],
  },
  {
    surface: "grout",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "MAPEI UltraCare Acidic Tile & Grout Cleaner",
        chemistry: "acidic",
        surfaces: ["grout", "tile"],
        avoids: ["natural stone"],
        reason:
          "Dissolves mineral film and hardness in cementitious joints when stone nearby is protected or absent",
      },
    ],
    method: {
      tools: ["narrow grout brush", "microfiber", "rinse water"],
      dwell: "Dwell 2–5 minutes or per label; do not let acid dry on colored grout untested",
      agitation: "Short strokes along joints; avoid sawing across grout crowns",
      rinse: "Flood-rinse until water runs clean",
      dry: "Towel or fan grout lines to limit redeposit",
    },
    whyItWorks:
      "Acidic chemistry solubilizes calcium and hardness ions trapped in porous grout",
    whyItHappens:
      "Evaporation concentrates hardness in low joints before the tile field shows equivalent film",
    mistakes: [
      "Using high-pH cleaners that never attack mineral bonds",
      "Spreading dissolved minerals into untested stone thresholds",
      "Skipping rinse so salts recrystallize overnight",
    ],
    benchmarks: [
      "Joint color often normalizes after full dry",
      "Deeply etched or missing grout may need repair not chemistry",
    ],
    professionalInsights: [
      "Second pass on joints after tile face clears is normal",
      "Sealer belongs on clean, dry grout only",
    ],
    sources: ["MAPEI technical literature", "Tile industry grout care summaries"],
  },
  {
    surface: "grout",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Cementitious-safe acidic grout cleaner",
        chemistry: "acidic",
        surfaces: ["grout"],
        avoids: ["acid-sensitive stone without barrier"],
        reason: "Targets carbonate and hardness scale wicking into grout pores",
      },
    ],
    method: {
      tools: ["grout brush", "sponge", "wet vac optional"],
      dwell: "Controlled; refresh rinse water often",
      agitation: "Focus joints; minimize dwell on face of acid-sensitive trim",
      rinse: "Volume rinse to stop acid action",
      dry: "Inspect dry—wet grout hides residue",
    },
    whyItWorks: "Scale in grout is acid-soluble; mechanical work increases solution contact",
    whyItHappens: "Water paths drain minerals into joints where evaporation is slowest",
    mistakes: [
      "Assuming the same acid strength is safe on all nearby materials",
      "Sealing over scale",
    ],
    benchmarks: ["Scale should feel smoother after success, not grittier"],
    professionalInsights: ["Water chemistry at the source beats endless acid cycles"],
    sources: ["Manufacturer SDS context", "Field grout restoration notes"],
  },
  {
    surface: "grout",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic bath cleaner rated for grout",
        chemistry: "acidic",
        surfaces: ["grout", "ceramic"],
        avoids: ["uncoated stone"],
        reason: "Breaks soap–mineral complexes that alkaline wipes smear",
      },
    ],
    method: {
      tools: ["brush", "microfiber"],
      dwell: "Brief; acids should not dry",
      agitation: "Scrub joints where body products concentrate",
      rinse: "Rinse surfactant away completely",
      dry: "Dry to judge true joint color",
    },
    whyItWorks: "Soap scum is fatty acid salts bound to mineral phase; acid frees the bond",
    whyItHappens: "Hard water plus surfactants precipitate in grout before the tile reads dull",
    mistakes: [
      "Layering wax or oil soap that rebuilds grip for new scum",
      "Using only glass cleaner on grout-heavy showers",
    ],
    benchmarks: ["Squeaky clean feel when wet after rinse"],
    professionalInsights: ["Squeegee habit reduces scum formation more than monthly acid"],
    sources: ["Soap chemistry overviews", "Bath cleaner labels"],
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
        avoids: ["unfinished wood trim without protection"],
        reason: "Removes organic film so disinfectant contact time is meaningful",
      },
    ],
    method: {
      tools: ["nylon brush", "PPE per label"],
      dwell: "Disinfectant wet time as directed",
      agitation: "Corners, curbs, niches first",
      rinse: "Rinse thoroughly before next shower use",
      dry: "Ventilate; towel low spots",
    },
    whyItWorks: "Physical removal plus labeled kill step addresses biomass in porous cement",
    whyItHappens: "Humidity, organics, and slow-dry joints sustain mold in grout",
    mistakes: [
      "Painting over growth",
      "Bleach-only without soil removal",
    ],
    benchmarks: ["Visible clearance plus odor reduction after dry-down"],
    professionalInsights: ["Ventilation CFM matters as much as product choice"],
    sources: ["EPA label guidance", "IICRC health references (overview)"],
  },
  {
    surface: "grout",
    problem: "mildew stains",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline mildew treatment with surfactants",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["wax-finished floors"],
        reason: "Lifts pigmented hyphae staining common on cementitious grout",
      },
    ],
    method: {
      tools: ["soft brush", "microfiber"],
      dwell: "Per label for stain lift",
      agitation: "Work perimeter grout before field",
      rinse: "Complete rinse",
      dry: "Dry within hours to slow return",
    },
    whyItWorks: "Surfactants carry pigments; antimicrobial claims must match label use site",
    whyItHappens: "Chronic damp plus body soils deposit food for mildew at joints",
    mistakes: [
      "Sealing over stained grout without cleaning",
      "Mixing chlorine with acids",
    ],
    benchmarks: ["Stain lightens in stages across multiple dry cycles"],
    professionalInsights: ["If stains return in 48h, fix moisture before chemistry"],
    sources: ["Manufacturer use sites", "Moisture control primers"],
  },
  {
    surface: "grout",
    problem: "biofilm",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Biofilm-penetrating alkaline cleaner (label-rated)",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["aluminum trim without test"],
        reason: "Disrupts extracellular matrix before disinfection per workflow",
      },
    ],
    method: {
      tools: ["brush", "low-pressure rinse"],
      dwell: "Follow label sequence for clean-then-disinfect if required",
      agitation: "Agitate slime sheen until rinse runs clear",
      rinse: "Heavy rinse",
      dry: "Airflow",
    },
    whyItWorks: "Matrix disruption exposes organisms to approved downstream steps",
    whyItHappens: "Slime forms where nutrients, moisture, and low shear meet",
    mistakes: [
      "Treating pink slime as purely mineral",
      "Ignoring fixture gaskets that reseed film",
    ],
    benchmarks: ["Slippery sheen gone; surface feels clean dry"],
    professionalInsights: ["Chlorinated supplies sometimes accelerate certain biofilms—read label"],
    sources: ["Healthcare environmental cleaning overviews", "Label claims"],
  },
  {
    surface: "glass",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic hard water stain remover for glass",
        chemistry: "acidic",
        surfaces: ["glass"],
        avoids: ["etched or damaged coatings"],
        reason: "Dissolves mineral film that alkaline glass cleaners cannot",
      },
    ],
    method: {
      tools: ["non-scratch pad", "squeegee", "microfiber"],
      dwell: "Brief; keep mist off adjacent acid-sensitive materials",
      agitation: "Light pressure; vertical passes on showers",
      rinse: "Flood rinse; wipe hardware",
      dry: "Squeegee or towel immediately",
    },
    whyItWorks: "Mineral film is acid-soluble; mechanical work speeds contact",
    whyItHappens: "Evaporation plates hardness on glass faster than on vertical tile",
    mistakes: [
      "Confusing etch with mineral film",
      "Dry powders that frost soft coatings",
    ],
    benchmarks: ["Clarity improves immediately when film not etched"],
    professionalInsights: ["Coatings change compatible chemistry—verify"],
    sources: ["Glass restoration trade practices", "Coating warranties"],
  },
  {
    surface: "glass",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic bathroom cleaner safe for glass",
        chemistry: "acidic",
        surfaces: ["glass", "chrome"],
        avoids: ["natural stone without protection"],
        reason: "Cuts soap–mineral complex on glass and brightwork",
      },
    ],
    method: {
      tools: ["non-scratch pad", "squeegee"],
      dwell: "Per label",
      agitation: "Lower glass and door tracks first",
      rinse: "Generous rinse downward",
      dry: "Squeegee habit post-shower",
    },
    whyItWorks: "Frees surfactant film by attacking mineral backbone of scum",
    whyItHappens: "Surfactants + hardness + heat cure a bonded film",
    mistakes: [
      "Only using alkaline soap that adds layers",
      "Ignoring stone thresholds during rinse",
    ],
    benchmarks: ["Water sheets evenly when mineral–soap matrix is gone"],
    professionalInsights: ["Weekly squeegee beats monthly restoration"],
    sources: ["Surfactant–hardness interaction primers", "Fixture care PDFs"],
  },
  {
    surface: "glass",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "pH-neutral glass cleaner with distilled rinse option",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["ammonia on coated glass if prohibited"],
        reason: "Removes polar residues and salts that cause drag marks after wipe",
      },
    ],
    method: {
      tools: ["clean microfiber", "second dry microfiber"],
      dwell: "Minimal; work cool glass",
      agitation: "Straight overlaps; flip cloth to clean face",
      rinse: "Optional distilled final wipe in ultra-hard water",
      dry: "Buff dry—streaks are often drying pattern not soil",
    },
    whyItWorks: "Removes dried salts and surfactant tails that refract light unevenly",
    whyItHappens: "Hard water drying plus oily fingerprints leaves uneven film",
    mistakes: [
      "Cleaning hot sun-facing glass",
      "Reusing a loaded rag across the whole pane",
    ],
    benchmarks: ["Uniform reflection at oblique angle"],
    professionalInsights: ["Two-cloth method beats more chemistry"],
    sources: ["Professional window cleaning basics", "DI water use notes"],
  },
  {
    surface: "tile",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic tile cleaner for glazed porcelain or ceramic",
        chemistry: "acidic",
        surfaces: ["tile"],
        avoids: ["stone insets without test"],
        reason: "Removes mineral haze on glaze when grout and stone are protected",
      },
    ],
    method: {
      tools: ["flat mop", "soft brush"],
      dwell: "Controlled; do not dry on surface",
      agitation: "Texture lows and grout perimeters",
      rinse: "Volume rinse",
      dry: "Inspect dry",
    },
    whyItWorks: "Glazed tile holds mineral film on micro-texture; acid releases bond",
    whyItHappens: "Mopping spreads minerals; low spots dry last",
    mistakes: [
      "Using same acid on unknown stone accents",
      "Waxing over minerals",
    ],
    benchmarks: ["Tile wets uniformly without patchy beading"],
    professionalInsights: ["Large format needs rinse volume not hero scrubbing"],
    sources: ["TCNA care bulletins", "Chemical supplier guidance"],
  },
  {
    surface: "tile",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic descaler for ceramic or porcelain",
        chemistry: "acidic",
        surfaces: ["tile", "grout"],
        avoids: ["acid-sensitive grout dye—spot test"],
        reason: "Attacks carbonate scale on field tile and joint lines",
      },
    ],
    method: {
      tools: ["nylon brush", "sponge"],
      dwell: "Until activity slows; within label max",
      agitation: "Circular on scale patches; linear on glaze",
      rinse: "Stop reaction with water",
      dry: "Feel for remaining grit",
    },
    whyItWorks: "Carbonate scale dissolves in appropriate acid with rinse control",
    whyItHappens: "Evaporative cycling plates scale especially near water sources",
    mistakes: [
      "Assuming all bathroom stone shares tile tolerance",
      "Sealing over scale",
    ],
    benchmarks: ["Scale dulls audibly when lightly scraped post-clean (plastic tool)"],
    professionalInsights: ["Water softening changes maintenance more than stronger acid"],
    sources: ["Water chemistry references", "Tile cleaning standards context"],
  },
  {
    surface: "tile",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic bath tile cleaner",
        chemistry: "acidic",
        surfaces: ["tile", "porcelain"],
        avoids: ["marble thresholds"],
        reason: "Removes soap–mineral haze on low-porosity tile fields",
      },
    ],
    method: {
      tools: ["mop", "brush"],
      dwell: "Short cycles",
      agitation: "Work from high to low toward drain",
      rinse: "Flood",
      dry: "Verify grout after dry",
    },
    whyItWorks: "Splits soap film from mineral anchor on glaze",
    whyItHappens: "Body products plus hardness cure on texture",
    mistakes: [
      "Oil soaps that rebuild soil affinity",
      "Ignoring drain slope leaving scum rings",
    ],
    benchmarks: ["Sheen returns evenly on glaze"],
    professionalInsights: ["Matte tile hides scum longer—inspect at low angle"],
    sources: ["Bath cleaner labels", "Surfactant references"],
  },
  {
    surface: "tile",
    problem: "grease buildup",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Alkaline degreaser for sealed tile floors",
        chemistry: "alkaline",
        surfaces: ["tile"],
        avoids: ["wax finishes not rated for alkaline"],
        reason: "Emulsifies tracked kitchen grease on hard tile",
      },
    ],
    method: {
      tools: ["microfiber mop", "detail brush"],
      dwell: "Several minutes on cool tile",
      agitation: "Perimeter and grout lines near kitchen entries",
      rinse: "Mop-rinse until slip is normal for finish",
      dry: "Air dry",
    },
    whyItWorks: "Alkaline surfactants hydrolyze and lift oxidized oils",
    whyItHappens: "Foot traffic moves oils from cook areas to hard floors",
    mistakes: [
      "Leaving alkaline residue that attracts soil",
      "Using kitchen degreaser on unsealed stone in same room without test",
    ],
    benchmarks: ["No tack when walking barefoot after dry"],
    professionalInsights: ["Entry mats reduce grease migration more than chemistry"],
    sources: ["Commercial kitchen soil science summaries", "Floor care guides"],
  },
  {
    surface: "tile",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Disinfectant cleaner rated for porcelain/acrylic surrounds",
        chemistry: "alkaline",
        surfaces: ["tile", "tub surrounds"],
        avoids: ["mixing with bleach against label"],
        reason: "Cleans soil then supports labeled disinfection on wet-wall tile",
      },
    ],
    method: {
      tools: ["brush", "sponge"],
      dwell: "Contact time per disinfectant label",
      agitation: "Caulk lines and texture",
      rinse: "Complete",
      dry: "Ventilation on",
    },
    whyItWorks: "Removes organic matrix so biocide reaches organisms",
    whyItHappens: "Porcelain fields stay wet at caulk and shelf cuts",
    mistakes: [
      "Cosmetic caulk over live growth",
      "Skipping rinse on slip risk",
    ],
    benchmarks: ["Visual and odor improvement after full cure dry"],
    professionalInsights: ["Fan runtime after shower beats stronger smell"],
    sources: ["EPA guidance", "Tub surround manufacturer care"],
  },
  {
    surface: "stainless steel",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Weak acidic stainless descaler",
        chemistry: "acidic",
        surfaces: ["stainless steel"],
        avoids: ["unknown coatings"],
        reason: "Removes mineral spotting without aggressive abrasion if rinsed fast",
      },
    ],
    method: {
      tools: ["microfiber", "soft sponge"],
      dwell: "Seconds to a minute; never dry on metal",
      agitation: "With the grain",
      rinse: "Immediate",
      dry: "Towel dry—chlorides left behind spot again",
    },
    whyItWorks: "Spots are surface mineral above passive layer when plating is sound",
    whyItHappens: "Horizontal rails and sink rims dry water last",
    mistakes: [
      "Steel wool",
      "Bleach baths on welds",
    ],
    benchmarks: ["Water sheets evenly post-clean"],
    professionalInsights: ["Pitting is metal loss—not mineral—if it persists"],
    sources: ["SSINA cleaning guides", "Appliance care"],
  },
  {
    surface: "stainless steel",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Citric-based or labeled stainless mineral remover",
        chemistry: "acidic",
        surfaces: ["stainless steel", "chrome"],
        avoids: ["brushed nickel without spot test"],
        reason: "Targets hardness on plated and SS surfaces with controlled dwell",
      },
    ],
    method: {
      tools: ["soft toothbrush", "microfiber"],
      dwell: "Very short on decorative plating",
      agitation: "Detail aerators and flanges",
      rinse: "Flood",
      dry: "Immediate buff",
    },
    whyItWorks: "Mineral is above metal when finish is intact",
    whyItHappens: "Droplet drying on fixtures and rails",
    mistakes: [
      "Abrasive powders on soft plating",
      "Acid drying on mixed-metal assemblies",
    ],
    benchmarks: ["Reflectivity uniform under raking light"],
    professionalInsights: ["If color changes after acid, stop—plating damage"],
    sources: ["Fixture manufacturer sheets", "Metal finishing references"],
  },
  {
    surface: "stainless steel",
    problem: "grease buildup",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Surfactant-rich alkaline degreaser (kitchen-safe)",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["hot surfaces"],
        reason: "Emulsifies heat-set oils on appliance-grade stainless",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush"],
      dwell: "On cool metal 5–10 minutes for polymerized grease",
      agitation: "With grain; refresh solution as it loads",
      rinse: "Hot rinse carries emulsion away",
      dry: "Buff to limit new water spots",
    },
    whyItWorks: "Alkaline surfactants break ester-rich cooking soils",
    whyItHappens: "Aerosolized oils resettle and oxidize on verticals and hoods",
    mistakes: [
      "Cleaning while hot—product flashes and streaks",
      "Chlorine with acidic residues",
    ],
    benchmarks: ["No tack after dry wipe"],
    professionalInsights: ["Filters need soak separate from shell wipe"],
    sources: ["Kitchen ventilation maintenance", "Metal care handbooks"],
  },
  {
    surface: "stainless steel",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "pH-neutral stainless polish or cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["silicone oils if manufacturer forbids"],
        reason: "Removes polar films and salts without attacking grain",
      },
    ],
    method: {
      tools: ["two microfibers", "grain-direction only"],
      dwell: "Minimal",
      agitation: "Single-direction passes",
      rinse: "Optional light water then dry",
      dry: "Second cloth until uniform sheen",
    },
    whyItWorks: "Streaks are often uneven residue, not lack of steel",
    whyItHappens: "Cleaner drying pattern plus hard water salts",
    mistakes: [
      "Circular scrubbing that catches light wrong",
      "Oil film that attracts dust",
    ],
    benchmarks: ["Uniform sheen along full panel"],
    professionalInsights: ["First cloth cleans; second only dries"],
    sources: ["Appliance OEM care", "SSINA"],
  },
  {
    surface: "stainless steel",
    problem: "rust stains",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Oxalic or specialty rust spot treatment (label-rated for SS)",
        chemistry: "acidic",
        surfaces: ["stainless steel"],
        avoids: ["prolonged dwell"],
        reason: "Addresses ferrous staining from external particles when passive layer intact",
      },
    ],
    method: {
      tools: ["soft cloth", "plastic pick for crevice lint"],
      dwell: "Per label only",
      agitation: "Localized to spot",
      rinse: "Thoroughly",
      dry: "Immediate",
    },
    whyItWorks: "Surface rust particles differ from base metal corrosion—test small area",
    whyItHappens: "Carbon steel wool or iron-rich water leaves nuclei",
    mistakes: [
      "Assuming all orange marks are the same mechanism",
      "Scrubbing through passive layer",
    ],
    benchmarks: ["Spot lightens without rainbow heat tint"],
    professionalInsights: ["True pitting needs metallurgical assessment"],
    sources: ["Stainless fabrication guides", "Specialty rust product labels"],
  },
  {
    surface: "natural stone",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral stone cleaner with surfactants",
        chemistry: "neutral",
        surfaces: ["sealed stone"],
        avoids: ["strong acids on calcareous stone"],
        reason: "Lifts topical mineral film without etching acid-sensitive stone",
      },
    ],
    method: {
      tools: ["stone-safe white pad", "microfiber"],
      dwell: "Short; blot don’t flood",
      agitation: "Gentle; keep liquid on stone only",
      rinse: "Plenty of water; control runoff",
      dry: "Buff to reduce new spotting from tap water",
    },
    whyItWorks: "Chelation and surfactants reduce mineral adhesion in safe pH band",
    whyItHappens: "Evaporation at edges and low spots plates minerals on sealer wear",
    mistakes: [
      "Vinegar or CLR on unknown stone",
      "Sealing over minerals",
    ],
    benchmarks: ["Even sheen dry; no new rings after 48h if water fixed"],
    professionalInsights: ["Confirm stone family before any acid trial"],
    sources: ["Natural Stone Institute bulletins", "Sealer manufacturer guidance"],
  },
  {
    surface: "natural stone",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Stone-safe poultice base or neutral heavy cleaner",
        chemistry: "neutral",
        surfaces: ["natural stone"],
        avoids: ["random acids"],
        reason: "Prepares or supports poultice workflows for subsurface mineral without guessing pH",
      },
    ],
    method: {
      tools: ["plastic scraper", "microfiber", "breathable poultice if used"],
      dwell: "Per poultice or product system",
      agitation: "Minimize abrasion on polish",
      rinse: "Controlled; protect cabinets",
      dry: "Long dry before seal decisions",
    },
    whyItWorks: "Many deposits need time-release chemistry; blind acid risks etch",
    whyItHappens: "Pores wick minerals below the wipe line",
    mistakes: [
      "Acid guessing on marble or limestone",
      "Sealing damp stone",
    ],
    benchmarks: ["Depth of spot changes slowly—judge at dry intervals"],
    professionalInsights: ["Fabricator input for mixed assemblies"],
    sources: ["NSI technical guides", "Poultice manufacturer instructions"],
  },
  {
    surface: "natural stone",
    problem: "discoloration",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral stone cleaner",
        chemistry: "neutral",
        surfaces: ["natural stone"],
        avoids: ["dye-heavy products on light stone"],
        reason: "Removes topical films that mimic permanent stain",
      },
    ],
    method: {
      tools: ["white pad", "microfiber"],
      dwell: "Short cycles",
      agitation: "Test homogenous motion",
      rinse: "Clean water",
      dry: "Assess at multiple angles and lighting",
    },
    whyItWorks: "Separates removable film from true alteration or absorption",
    whyItHappens: "Oils, dyes, and metals migrate into pores or sit on sealer",
    mistakes: [
      "Aggressive acid chasing color",
      "Wax that yellows in UV",
    ],
    benchmarks: ["If no change after controlled cycles, assume absorbed or structural"],
    professionalInsights: ["Document before/after photos for customer expectations"],
    sources: ["Stone inspection references", "Sealer TDS"],
  },
  {
    surface: "laminate",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "pH-neutral laminate-safe cleaner",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["acetone unless label allows"],
        reason: "Lifts adhesives and sugars without attacking melamine edge",
      },
    ],
    method: {
      tools: ["microfiber", "plastic scraper for gum-like spots"],
      dwell: "Damp towel on spot; keep liquid out of seams",
      agitation: "Pat-lift not saw",
      rinse: "Damp wipe plain water",
      dry: "Immediate at seams",
    },
    whyItWorks: "Neutral surfactants solubilize polar goo without swelling binders",
    whyItHappens: "Spills polymerize at joints; wrong cleaners leave tack",
    mistakes: [
      "Soaking sink rims",
      "Ammonia on decorative laminate",
    ],
    benchmarks: ["Dry hand slides clean without drag"],
    professionalInsights: ["Joint swelling is moisture—fix seal before aesthetics"],
    sources: ["Laminate manufacturer care", "Adhesive compatibility charts"],
  },
  {
    surface: "laminate",
    problem: "grease buildup",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Mild alkaline degreaser for laminate counters",
        chemistry: "alkaline",
        surfaces: ["laminate"],
        avoids: ["flooding seams"],
        reason: "Emulsifies cooking film on vertical laminate backsplashes and counters",
      },
    ],
    method: {
      tools: ["two microfibers"],
      dwell: "Short near seams",
      agitation: "Top-down",
      rinse: "Damp clear",
      dry: "Edges and backsplash joint",
    },
    whyItWorks: "Surfactants lift heat-set oils when moisture is controlled",
    whyItHappens: "Splatter and hands deposit oils low on laminate panels",
    mistakes: [
      "Letting alkaline dry on joint tape",
      "Scotchbrite on gloss laminate",
    ],
    benchmarks: ["No yellow on white towel after final wipe"],
    professionalInsights: ["Silicone joints fail from grease—clean before reseal"],
    sources: ["Cabinet and laminate care PDFs", "Kitchen ventilation context"],
  },
  {
    surface: "painted surfaces",
    problem: "grease buildup",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Mild alkaline wall/trim degreaser",
        chemistry: "alkaline",
        surfaces: ["painted drywall", "trim"],
        avoids: ["flat paint without test"],
        reason: "Cuts cooking film on satin or semi-gloss paint systems",
      },
    ],
    method: {
      tools: ["soft sponge", "two towels"],
      dwell: "Minimal; keep drips off floor",
      agitation: "Small sections; turn sponge",
      rinse: "Damp clear",
      dry: "Pat dry",
    },
    whyItWorks: "Surfactants emulsify oils bound to latex or alkyd films",
    whyItHappens: "Steam and plumes deposit fine oil near cook zones",
    mistakes: [
      "Scrubbing through sheen",
      "Soaking outlets",
    ],
    benchmarks: ["Sheen uniform; no tack"],
    professionalInsights: ["Test sheen in closet corner first"],
    sources: ["Paint manufacturer washability ratings", "Ventilation codes context"],
  },
  {
    surface: "painted surfaces",
    problem: "discoloration",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral wall cleaner",
        chemistry: "neutral",
        surfaces: ["painted surfaces"],
        avoids: ["bleach on unknown pigments"],
        reason: "Removes soil that reads as discoloration before assuming repaint",
      },
    ],
    method: {
      tools: ["soft sponge", "microfiber"],
      dwell: "Brief",
      agitation: "Bottom-to-top on walls to control streaks",
      rinse: "Clean sponge water",
      dry: "Assess wet vs dry color shift",
    },
    whyItWorks: "Many ‘stains’ are film; true fade needs coating analysis",
    whyItHappens: "UV, smoke, and oils shift appearance unevenly",
    mistakes: [
      "Bleach on tannins without testing",
      "Over-wetting tape seams",
    ],
    benchmarks: ["If no lift after cycles, plan touch-up or recoat"],
    professionalInsights: ["Document lighting temperature when comparing"],
    sources: ["Paint TDS", "Residential maintenance guides"],
  },
  {
    surface: "hardwood",
    problem: "scuff marks",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Manufacturer-approved hardwood floor cleaner",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["wax if incompatible with finish"],
        reason: "Lifts heel marks and scuffs that sit above intact finish",
      },
    ],
    method: {
      tools: ["microfiber mop", "white eraser-type pad if finish allows"],
      dwell: "Minimal moisture",
      agitation: "With grain only",
      rinse: "Damp—not wet—pass",
      dry: "Towel buff",
    },
    whyItWorks: "Many scuffs are transfer film; finish dictates aggressiveness",
    whyItHappens: "Rubber soles and grit abrade sheen unevenly",
    mistakes: [
      "Steam mop on unknown finish",
      "Oil soaps that haze polyurethane",
    ],
    benchmarks: ["Scuff dullness reduces without gloss loss"],
    professionalInsights: ["Through-finish damage needs refinish not cleaner"],
    sources: ["NWFA maintenance summaries", "Finish manufacturer care"],
  },
  {
    surface: "hardwood",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Manufacturer-approved hardwood cleaner (neutral)",
        chemistry: "neutral",
        surfaces: ["sealed wood", "butcher block with compatible finish"],
        avoids: ["soaking end grain", "acetone on unknown finish"],
        reason:
          "Lifts adhesive, tape, and sugar films with minimal moisture on intact finish",
      },
    ],
    method: {
      tools: ["microfiber", "plastic scraper at low angle if finish allows"],
      dwell: "Damp cloth on spot only; keep liquid off open grain",
      agitation: "With grain; blot lifts",
      rinse: "Barely damp wipe then dry",
      dry: "Immediate buff along grain",
    },
    whyItWorks:
      "Neutral surfactants reduce tack without swelling seams or stripping oil where used",
    whyItHappens:
      "Spills and labels leave polar films that catch dust on horizontal wood",
    mistakes: [
      "Aggressive solvents on factory finish",
      "Standing water on seams or butcher block",
    ],
    benchmarks: [
      "Dry hand slides clean; no new haze after 24h",
      "Repeat light passes beat one soaked application on sealed wood",
    ],
    professionalInsights: ["Unsealed butcher block may need food-safe oil after tack is gone"],
    sources: ["NWFA care", "Countertop finish manufacturer guidance"],
  },
  {
    surface: "hardwood",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Neutral hardwood cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["excess liquid"],
        reason: "Removes cleaner residue and salts that streak on dry-down",
      },
    ],
    method: {
      tools: ["flat mop", "dry microfiber"],
      dwell: "Spray-to-mist only if finish allows",
      agitation: "Overlapping passes with clean pad face",
      rinse: "Second pass plain water if product requires",
      dry: "Immediate buff",
    },
    whyItWorks: "Streaks are uneven residue distribution on micro-scratched wear layer",
    whyItHappens: "Too much product, dirty mop water, or hard water drying last",
    mistakes: [
      "Wet mopping bevels",
      "Walking before dry",
    ],
    benchmarks: ["Uniform reflection in raking daylight"],
    professionalInsights: ["Two-bucket method beats stronger chemistry"],
    sources: ["Floor finish care", "Hardwood cleaner labels"],
  },
  {
    surface: "general household surfaces",
    problem: "biofilm",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered disinfectant cleaner for non-porous utility surfaces",
        chemistry: "alkaline",
        surfaces: ["plastic", "metal utility"],
        avoids: ["food contact surfaces without rinse per label"],
        reason: "Cleans organic film on cans and utility bins before disinfection",
      },
    ],
    method: {
      tools: ["brush", "hose or utility sink"],
      dwell: "Label contact time",
      agitation: "Interior corners and lid seals",
      rinse: "As directed for contact surfaces",
      dry: "Air dry inverted",
    },
    whyItWorks: "Soil removal plus labeled disinfection addresses odor and slime",
    whyItHappens: "Residual organics plus moisture in enclosed bins",
    mistakes: [
      "Skipping rinse on surfaces that touch food waste hands",
      "Mixing chemistry blindly",
    ],
    benchmarks: ["Odor reduction after dry"],
    professionalInsights: ["Bag fit and lid seal matter more than scent"],
    sources: ["EPA label language", "Waste container OEM care"],
  },
  {
    surface: "painted surfaces",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Dry microfiber dusting system or neutral wall wash",
        chemistry: "neutral",
        surfaces: ["painted drywall", "trim"],
        avoids: ["over-wetting flat paint"],
        reason: "Removes particulate without embedding grit into paint film",
      },
    ],
    method: {
      tools: ["microfiber duster", "vacuum with soft brush", "low-lint cloth"],
      dwell: "None for dry dusting; damp wall wash only as label allows",
      agitation: "Top-to-bottom strokes; turn cloth to clean face often",
      rinse: "Damp clear water if washable paint",
      dry: "Pat dry to avoid streak surfactant",
    },
    whyItWorks:
      "Dry removal first lifts dust without mudding it into sheen; neutral wet work only when paint allows",
    whyItHappens:
      "Air currents deposit lint and fine dust on verticals; electrostatic trim attracts more than open wall",
    mistakes: [
      "Dry dusting with dirty rags that scratch low-sheen paint",
      "Furniture polish on walls that builds tacky film",
    ],
    benchmarks: [
      "Cloth stays relatively clean on final pass",
      "Sheen looks even under raking light after dry-down",
    ],
    professionalInsights: [
      "HVAC and pet areas change dust loading more than cleaner choice",
    ],
    sources: ["Paint washability ratings", "Residential maintenance summaries"],
  },
  {
    surface: "stainless steel",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral stainless cleaner or dry microfiber system",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["chlorinated wipes on unknown welds"],
        reason: "Removes lint and dust without leaving chloride residues that spot later",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush for grilles"],
      dwell: "Minimal moisture on horizontal rails",
      agitation: "With grain on brushed finishes",
      rinse: "Plain water if product requires",
      dry: "Immediate towel—hard water spots form on last water film",
    },
    whyItWorks:
      "Dust lifts with low friction; neutral chemistry avoids attacking passive layer while salts rinse away",
    whyItHappens:
      "Kitchen aerosols and HVAC lint settle on horizontal runs and behind pulls where airflow is low",
    mistakes: [
      "Steel wool that embeds particles",
      "Bleach films that nucleate new spots",
    ],
    benchmarks: [
      "Finger drag feels clean on dry metal",
      "No new spots after 24h if water quality is controlled",
    ],
    professionalInsights: ["Grain direction consistency hides micro-scratching on brushed SS"],
    sources: ["SSINA care summaries", "Appliance OEM guidance"],
  },
  {
    surface: "stainless steel",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Neutral surfactant rinse for stainless and plated trim",
        chemistry: "neutral",
        surfaces: ["stainless steel", "chrome"],
        avoids: ["acid on unknown plating"],
        reason: "Cuts soap film without leaving alkaline builders that streak on rinse",
      },
    ],
    method: {
      tools: ["two microfibers", "detail brush for edges"],
      dwell: "Short; do not let product dry",
      agitation: "With grain; refresh solution as it loads",
      rinse: "Hot water carries emulsion off",
      dry: "Second cloth until uniform",
    },
    whyItWorks:
      "Soap film is polar oils and salts; neutral surfactants lift without etching metal",
    whyItHappens:
      "Dish and hand soaps dry on rails and behind faucets where rinse is incomplete",
    mistakes: [
      "Acid chasing soap on decorative plating",
      "Abrasive pads that frost grain",
    ],
    benchmarks: [
      "Water sheets evenly after success",
      "No rainbow heat tint after drying",
    ],
    professionalInsights: ["First cloth removes soil; second is dry-only"],
    sources: ["Fixture manufacturer care", "Metal finishing references"],
  },
  {
    surface: "tile",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Neutral hard-floor cleaner for sealed tile",
        chemistry: "neutral",
        surfaces: ["tile", "grout"],
        avoids: ["wax incompatible with sealer"],
        reason: "Suspends dust and grit without etching glaze or light grout",
      },
    ],
    method: {
      tools: ["microfiber flat mop", "vacuum first on textured tile"],
      dwell: "Per label on soil load",
      agitation: "Figure-eight on lows; grout lines last",
      rinse: "Mop-rinse until water stays clearer",
      dry: "Air dry; inspect grout after",
    },
    whyItWorks:
      "Mechanical removal plus surfactant keeps dust from grinding into texture",
    whyItHappens:
      "Foot traffic drives dust into grout lows and texture before it reads on glaze",
    mistakes: [
      "Skipping vacuum on heavy texture",
      "Oil soaps that attract new dust",
    ],
    benchmarks: [
      "Rinse water lightens by the third pass",
      "Grout color consistent when fully dry",
    ],
    professionalInsights: ["Entry mats cut dust loading more than stronger chemistry"],
    sources: ["TCNA maintenance context", "Floor care bulletins"],
  },
  {
    surface: "grout",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral grout-safe cleaner with surfactants",
        chemistry: "neutral",
        surfaces: ["grout", "tile"],
        avoids: ["wax on grout unless specified"],
        reason: "Lifts particulate from cementitious pores without opening acid attack on color",
      },
    ],
    method: {
      tools: ["narrow grout brush", "microfiber", "vacuum edge"],
      dwell: "Brief; keep liquid on joints only",
      agitation: "Along joints; avoid spreading slurry across stone thresholds",
      rinse: "Volume rinse",
      dry: "Towel joints",
    },
    whyItWorks:
      "Surfactants carry fines out of pores; vacuum reduces mud formation",
    whyItHappens:
      "Joints are lower than tile face; dust settles and stays damp longer",
    mistakes: [
      "Sealing over dusty joints",
      "Acid before testing adjacent stone",
    ],
    benchmarks: [
      "Joint color matches field after dry",
      "Brush rinses cleaner on second pass",
    ],
    professionalInsights: ["Dry dusting first prevents grout mud on textured tile"],
    sources: ["Grout manufacturer care", "Field maintenance notes"],
  },
  {
    surface: "general household surfaces",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "All-purpose neutral cleaner for plastic and painted utility",
        chemistry: "neutral",
        surfaces: ["plastic", "painted metal"],
        avoids: ["ammonia on unknown films"],
        reason: "Removes settled dust on mixed utility items without attacking print or coating",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush for textures"],
      dwell: "Minimal",
      agitation: "Lift dust before wetting when possible",
      rinse: "Damp wipe then dry",
      dry: "Air dry or towel",
    },
    whyItWorks:
      "Neutral surfactants suspend dust without leaving sticky builders",
    whyItHappens:
      "Static and shelf edges collect lint in kitchens and laundry zones",
    mistakes: [
      "Silicone polishes that attract new dust",
      "Soaking labels and electronics",
    ],
    benchmarks: [
      "White towel stays light on final wipe",
      "Odor neutral after dry when organics were present",
    ],
    professionalInsights: ["Source control beats heavier chemistry on bins"],
    sources: ["General cleaning references", "Label guidance"],
  },
  {
    surface: "laminate",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Mild acidic cleaner safe for laminate and sealed edges",
        chemistry: "acidic",
        surfaces: ["laminate"],
        avoids: ["flooding seams", "unknown stone insets"],
        reason: "Dissolves mineral film on melamine without long dwell at joints",
      },
    ],
    method: {
      tools: ["microfiber", "plastic scraper only if finish allows"],
      dwell: "Short; keep liquid out of seams",
      agitation: "Pat-lift; work cool surface",
      rinse: "Damp clear",
      dry: "Immediate at edges",
    },
    whyItWorks:
      "Mineral film is acid-soluble; controlled application protects seam tape",
    whyItHappens:
      "Evaporation on horizontal laminate near sinks plates hardness before wood trim shows it",
    mistakes: [
      "Soaking sink rims",
      "Strong acid on decorative edges without test",
    ],
    benchmarks: [
      "Sheeting water without patchy beading",
      "No new joint swelling after 48h",
    ],
    professionalInsights: ["Edge seal integrity matters more than face chemistry"],
    sources: ["Laminate manufacturer care", "Water chemistry primers"],
  },
  {
    surface: "laminate",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Neutral laminate-safe surfactant cleaner",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["acetone unless label allows"],
        reason: "Cuts soap and hand films without swelling melamine",
      },
    ],
    method: {
      tools: ["two microfibers"],
      dwell: "Brief near seams",
      agitation: "Top-down on backsplashes",
      rinse: "Damp clear",
      dry: "Edges and caulk joint",
    },
    whyItWorks:
      "Neutral surfactants solubilize fatty residues without aggressive pH swings",
    whyItHappens:
      "Dish and hand soaps dry on vertical laminate behind faucets",
    mistakes: [
      "Oil soaps that rebuild soil affinity",
      "Scotchbrite on gloss laminate",
    ],
    benchmarks: [
      "Towel stays cleaner on final pass",
      "No tack after dry",
    ],
    professionalInsights: ["Reduce soap volume at source before chasing with stronger chemistry"],
    sources: ["Laminate care PDFs", "Kitchen ventilation context"],
  },
  {
    surface: "painted surfaces",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "pH-neutral wall wash rated for kitchen films",
        chemistry: "neutral",
        surfaces: ["painted drywall", "trim"],
        avoids: ["flat paint without washability test"],
        reason: "Removes surfactant films that read as uneven sheen",
      },
    ],
    method: {
      tools: ["soft sponge", "two towels"],
      dwell: "Minimal",
      agitation: "Small sections; turn sponge",
      rinse: "Damp clear",
      dry: "Pat dry; assess at angles",
    },
    whyItWorks:
      "Surfactants lift dried soap without stripping stable paint systems",
    whyItHappens:
      "Hand and dish aerosols settle on satin or semi-gloss near sinks",
    mistakes: [
      "Scrubbing through sheen",
      "Bleach on unknown pigments",
    ],
    benchmarks: [
      "Sheen returns uniform across the band",
      "No tack after dry wipe",
    ],
    professionalInsights: ["Test washability in closet corner before open kitchen walls"],
    sources: ["Paint manufacturer TDS", "Residential maintenance"],
  },
  {
    surface: "natural stone",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Stone-safe neutral cleaner with surfactants",
        chemistry: "neutral",
        surfaces: ["sealed stone"],
        avoids: ["chlorine on acid-sensitive stone without guidance"],
        reason: "Removes organic films that harbor odor before seal or poultice steps",
      },
    ],
    method: {
      tools: ["stone-safe pad", "microfiber", "extract if available"],
      dwell: "Short cycles; blot don’t flood",
      agitation: "Gentle; keep liquid on stone only",
      rinse: "Plenty of water; control runoff",
      dry: "Long dry before judging odor",
    },
    whyItWorks:
      "Many odors are removable organics in pores and sealant wear zones; surfactants reduce adhesion",
    whyItHappens:
      "Porous stone and grout can wick oils and spills that reread after surface looks clean",
    mistakes: [
      "Sealing over organics",
      "Guessing acid on calcareous stone",
    ],
    benchmarks: [
      "Odor reduces after full dry cycle",
      "If odor returns wet only, suspect absorbed material",
    ],
    professionalInsights: ["Document moisture paths before promising odor removal"],
    sources: ["NSI technical references", "Sealer manufacturer guidance"],
  },
  {
    surface: "natural stone",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral stone cleaner for topical films",
        chemistry: "neutral",
        surfaces: ["natural stone"],
        avoids: ["random solvents on unknown finish"],
        reason: "Prepares surface for optional poultice without etch risk",
      },
    ],
    method: {
      tools: ["plastic scraper", "white pad", "microfiber"],
      dwell: "Controlled; keep seam dams in place",
      agitation: "Test homogenous motion on polish",
      rinse: "Clean water; protect cabinets",
      dry: "Long dry intervals",
    },
    whyItWorks:
      "Neutral surfactants reduce tack from sugars and adhesives without opening pore structure blindly",
    whyItHappens:
      "Spills polymerize in pores; wrong chemistry drives oils deeper",
    mistakes: [
      "Aggressive solvent without spot test",
      "Sealing over tacky stone",
    ],
    benchmarks: [
      "Dry hand slides without drag",
      "If tack persists, assume absorbed not topical",
    ],
    professionalInsights: ["Identify food vs construction adhesive before chemistry escalation"],
    sources: ["NSI care", "Poultice system labels"],
  },
  {
    surface: "hardwood",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral hardwood cleaner with chelating surfactants",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["standing liquid", "wax incompatible with finish"],
        reason: "Reduces mineral tack on wear layer without acid exposure",
      },
    ],
    method: {
      tools: ["barely damp microfiber mop", "dry pad"],
      dwell: "Mist only if finish allows",
      agitation: "With grain; single pass per wet side",
      rinse: "Second pass plain water if needed",
      dry: "Immediate buff",
    },
    whyItWorks:
      "Topical mineral film often responds to neutral chelation and mechanical lift without etching wood",
    whyItHappens:
      "Plant watering, pets, and mop buckets leave hardness on horizontal wood near edges",
    mistakes: [
      "Wet mopping bevels",
      "Vinegar on unknown finish",
    ],
    benchmarks: [
      "Sheen even in raking light",
      "No cupping after 72h if moisture controlled",
    ],
    professionalInsights: ["If clouding returns only near glass, fix the water source"],
    sources: ["NWFA maintenance", "Finish manufacturer care"],
  },
  {
    surface: "hardwood",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Manufacturer-approved wood cleaner for topical soils",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["enzyme products not rated for coating"],
        reason: "Removes organic films that harbor odor on intact finish",
      },
    ],
    method: {
      tools: ["microfiber mop", "soft brush at gaps"],
      dwell: "Minimal moisture overall",
      agitation: "With grain",
      rinse: "Barely damp only",
      dry: "Towel and airflow",
    },
    whyItWorks:
      "Many odors are removable surface organics; intact finish keeps moisture out of wood",
    whyItHappens:
      "Pet accidents and food films can linger in grain texture and bevels",
    mistakes: [
      "Sealing over odor without soil removal",
      "Steam on unknown finish",
    ],
    benchmarks: [
      "Odor improves after full dry",
      "If odor tracks with humidity, assume deeper absorption",
    ],
    professionalInsights: ["Through-finish contamination may need refinish not cleaner"],
    sources: ["NWFA odor guidance summaries", "Finish OEM notes"],
  },
  {
    surface: "natural stone",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral stone cleaner with surfactants for bath and kitchen films",
        chemistry: "neutral",
        surfaces: ["sealed stone"],
        avoids: ["unknown acid on calcareous stone"],
        reason:
          "Breaks soap and body-product films without etching acid-sensitive stone when pH stays in safe band",
      },
    ],
    method: {
      tools: ["stone-safe white pad", "microfiber"],
      dwell: "Short cycles; blot excess",
      agitation: "Gentle; keep liquid on stone only",
      rinse: "Volume rinse; control runoff to adjacent cabinets",
      dry: "Buff to reduce new spotting from tap water",
    },
    whyItWorks:
      "Surfactants lift fatty and mineral-bound soap films; neutral pH avoids uncontrolled etch on marble or limestone",
    whyItHappens:
      "Hard water binds surfactants to polish and pores; body products concentrate at edges and low spots",
    mistakes: [
      "Vinegar or acidic bath products on unidentified stone",
      "Sealing over scum",
    ],
    benchmarks: [
      "Sheen evens out dry",
      "No new rings after 48h if rinse water is controlled",
    ],
    professionalInsights: [
      "Confirm stone family before any acid trial; many ‘soap’ issues are mineral-soap complex",
    ],
    sources: ["NSI care bulletins", "Sealer manufacturer TDS"],
  },
  {
    surface: "natural stone",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Dry microfiber system or neutral stone-safe dust treatment",
        chemistry: "neutral",
        surfaces: ["natural stone"],
        avoids: ["oil dusters that build film"],
        reason: "Removes particulate from texture and grout without driving grit into polish",
      },
    ],
    method: {
      tools: ["microfiber mop", "soft brush", "vacuum with felt wand"],
      dwell: "Minimal moisture on damp mopping passes",
      agitation: "Homogenous motion on polish",
      rinse: "Only if damp-mopping per finish",
      dry: "Long dry before judging color",
    },
    whyItWorks:
      "Dry and low-moisture removal keeps dust from mudding into pores and wear patterns",
    whyItHappens:
      "Traffic and HVAC move lint and grit onto horizontal stone and grout lows first",
    mistakes: [
      "Abrasive powders on honed finishes",
      "Wax that yellows in UV",
    ],
    benchmarks: [
      "Rinse water stays clearer by the third pass when damp mopping",
      "Texture feels smooth dry without drag",
    ],
    professionalInsights: ["Entry mats and pet routes change dust loading more than chemistry"],
    sources: ["NSI maintenance summaries", "Stone fabricator field notes"],
  },
  {
    surface: "natural stone",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Stone-safe alkaline cleaner before EPA-registered disinfectant per label",
        chemistry: "alkaline",
        surfaces: ["natural stone"],
        avoids: ["mixing incompatible actives"],
        reason: "Removes organic matrix so labeled biocide contact time is effective on stone",
      },
    ],
    method: {
      tools: ["nylon brush", "PPE per label"],
      dwell: "Clean first; disinfect wet time as directed",
      agitation: "Corners, caulk, and stone–wall transitions",
      rinse: "Thoroughly before reoccupying wet areas",
      dry: "Ventilation and towel low spots",
    },
    whyItWorks:
      "Soil removal plus labeled disinfection addresses visible growth in grout and texture",
    whyItHappens:
      "Chronic moisture plus organics in showers and food-prep zones sustains mold on stone",
    mistakes: [
      "Painting over growth",
      "Bleach-only without soil removal",
    ],
    benchmarks: [
      "Visible reduction after full dry cycle",
      "Odor drops when biomass is removed",
    ],
    professionalInsights: ["Fix ventilation and leaks before promising permanent clearance"],
    sources: ["EPA label language", "IICRC overview references"],
  },
  {
    surface: "natural stone",
    problem: "grease buildup",
    soilClass: "grease",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Stone-safe degreasing gel or neutral heavy cleaner rated for kitchen stone",
        chemistry: "neutral",
        surfaces: ["natural stone"],
        avoids: ["flooding seams on undermount sinks"],
        reason: "Emulsifies cooking oils without guessing acid on calcareous stone",
      },
    ],
    method: {
      tools: ["plastic scraper", "stone-safe pad", "microfiber"],
      dwell: "Controlled; keep dams on edges",
      agitation: "Work from spill edge toward drain",
      rinse: "Plenty of water; protect cabinetry",
      dry: "Long dry before seal touch-up decisions",
    },
    whyItWorks:
      "Neutral surfactants lift heat-set oils when dwell and rinse volume are controlled",
    whyItHappens:
      "Splatter and aerosolized oils migrate to porous edges and grout near cook zones",
    mistakes: [
      "Degreasing acid on unknown marble or limestone",
      "Sealing over greasy stone",
    ],
    benchmarks: [
      "Towel stays lighter on final wipe",
      "No tack dry on horizontal runs",
    ],
    professionalInsights: ["Source capture at cook surface beats stronger chemistry at stone"],
    sources: ["NSI technical guides", "Kitchen ventilation context"],
  },
  {
    surface: "glass",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "pH-neutral glass cleaner or dry microfiber system",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["dry powders on soft coatings"],
        reason: "Removes lint and dust without leaving salts that spot on next rinse",
      },
    ],
    method: {
      tools: ["clean microfiber", "squeegee optional"],
      dwell: "Minimal",
      agitation: "Straight passes; flip cloth often",
      rinse: "Optional distilled final wipe in hard water",
      dry: "Buff dry immediately",
    },
    whyItWorks:
      "Dry removal first prevents mudding; neutral chemistry avoids filming builders on glass",
    whyItHappens:
      "Bath and kitchen aerosols combine with HVAC dust on vertical glass and tracks",
    mistakes: [
      "Cleaning hot sun-facing panes",
      "Reusing a loaded cloth across the whole surface",
    ],
    benchmarks: [
      "Clarity uniform at oblique angles",
      "Second dry cloth stays clean on final pass",
    ],
    professionalInsights: ["Tracks and hardware collect dust first—detail before field"],
    sources: ["Professional window cleaning basics", "Coating warranty notes"],
  },
  {
    surface: "glass",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral surfactant cleaner then optional odor-neutralizing product rated for glass",
        chemistry: "neutral",
        surfaces: ["glass"],
        avoids: ["ammonia on coated glass if prohibited"],
        reason: "Removes organic films that harbor odor before judging coating or seal issues",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush for frame and track"],
      dwell: "Brief; keep liquid out of weep holes if labeled",
      agitation: "Lower edge and track first",
      rinse: "Generous rinse downward",
      dry: "Squeegee or towel",
    },
    whyItWorks:
      "Many shower odors are removable organics on glass and gaskets; surfactants lift film",
    whyItHappens:
      "Body soils, hair products, and biofilm precursors dry into tracks and silicone",
    mistakes: [
      "Sealing over unclean frames",
      "Ignoring gasket mold that reseeds glass",
    ],
    benchmarks: [
      "Odor improves after full dry",
      "If odor returns only when wet, inspect drains and gaskets",
    ],
    professionalInsights: ["Persistent sewer or drain odor is not a glass chemistry fix"],
    sources: ["Fixture OEM care", "Ventilation best-practice summaries"],
  },
  {
    surface: "laminate",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Neutral laminate-safe cleaner with surfactants for organic films",
        chemistry: "neutral",
        surfaces: ["laminate"],
        avoids: ["flooding sink rims and seams"],
        reason: "Removes food and pet films that harbor odor without swelling melamine edges",
      },
    ],
    method: {
      tools: ["two microfibers", "soft brush at gaps"],
      dwell: "Short near seams",
      agitation: "Top-down on backsplashes",
      rinse: "Damp clear",
      dry: "Immediate at edges and caulk",
    },
    whyItWorks:
      "Odor often sits in topical films and joint gaps; neutral surfactants lift without harsh solvent",
    whyItHappens:
      "Splatter and hands deposit organics low on laminate near sinks and waste zones",
    mistakes: [
      "Bleach films that pit unknown edge tape",
      "Soaking particleboard cores through seams",
    ],
    benchmarks: [
      "Odor reduces after dry-down",
      "Towel stays cleaner on final pass",
    ],
    professionalInsights: ["If odor tracks with sink trap, fix plumbing before laminate"],
    sources: ["Laminate manufacturer care", "Residential kitchen maintenance"],
  },
  {
    surface: "painted surfaces",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "pH-neutral wall wash for washable paint systems",
        chemistry: "neutral",
        surfaces: ["painted drywall", "trim"],
        avoids: ["flat paint without washability test"],
        reason: "Removes topical organics that hold odor without stripping stable coatings",
      },
    ],
    method: {
      tools: ["soft sponge", "two towels"],
      dwell: "Minimal; small sections",
      agitation: "Bottom-to-top on walls to control streaks",
      rinse: "Clean sponge water",
      dry: "Pat dry; assess when fully dry",
    },
    whyItWorks:
      "Many wall odors are film-bound; neutral wash lifts without bleaching unknown pigments",
    whyItHappens:
      "Cooking aerosols, smoke, and pets deposit organics that reemit on humidity swings",
    mistakes: [
      "Bleach on tannins without testing",
      "Over-wetting taped seams",
    ],
    benchmarks: [
      "Odor improves after full cure dry",
      "If no lift after controlled cycles, assume absorption or hidden mold",
    ],
    professionalInsights: ["Persistent musty odor with no surface film needs moisture investigation"],
    sources: ["Paint manufacturer washability ratings", "IICRC moisture references (overview)"],
  },
  {
    surface: "painted surfaces",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered disinfectant cleaner rated for painted surfaces when label allows",
        chemistry: "alkaline",
        surfaces: ["painted walls", "trim"],
        avoids: ["sheen damage on untested paint"],
        reason: "Soil removal plus labeled kill step for visible growth on paint film",
      },
    ],
    method: {
      tools: ["soft brush", "PPE per label"],
      dwell: "Wet contact time as directed after soil removal",
      agitation: "Corners and ceiling lines first",
      rinse: "Damp clear per label",
      dry: "Airflow; verify dry-down",
    },
    whyItWorks:
      "Removes organic matrix so biocide reaches organisms; paint must tolerate moisture regime",
    whyItHappens:
      "Condensation, leaks, or poor ventilation sustain mold on cool painted surfaces",
    mistakes: [
      "Painting over active growth",
      "Skipping dry-down verification",
    ],
    benchmarks: [
      "Visible clearance after dry",
      "If growth returns in 48h, assume moisture path not chemistry",
    ],
    professionalInsights: ["Document extent before promising cosmetic paint-only fixes"],
    sources: ["EPA guidance", "Paint system technical data"],
  },
  {
    surface: "painted surfaces",
    problem: "mildew stains",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline mildew treatment compatible with washable coatings",
        chemistry: "alkaline",
        surfaces: ["painted surfaces"],
        avoids: ["unknown compatibility with historic coatings"],
        reason: "Lifts pigmented staining common on bath and laundry paints",
      },
    ],
    method: {
      tools: ["soft sponge", "microfiber"],
      dwell: "Per label for stain lift",
      agitation: "Small areas; turn sponge",
      rinse: "Complete rinse",
      dry: "Assess at multiple angles after dry",
    },
    whyItWorks:
      "Surfactants carry pigments; follow label for organism claims on painted substrates",
    whyItHappens:
      "Chronic humidity plus body and lint soils feed mildew at paint–caulk transitions",
    mistakes: [
      "High-chlorine products without ventilation",
      "Scrubbing through sheen",
    ],
    benchmarks: [
      "Stain lightens across multiple dry cycles",
      "Sheen remains uniform if paint system tolerates process",
    ],
    professionalInsights: ["If stains track grout or wall cavity, open investigation"],
    sources: ["Manufacturer stain guides", "Ventilation code context"],
  },
  {
    surface: "stainless steel",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline degreaser or enzymatic cleaner rated for appliance-grade stainless",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["hot surfaces during application"],
        reason: "Removes organic films in seams and gaskets that harbor odor",
      },
    ],
    method: {
      tools: ["soft brush", "microfiber", "detail for gaskets"],
      dwell: "Cool metal; follow label",
      agitation: "With grain on brushed faces",
      rinse: "Hot rinse to carry emulsion",
      dry: "Towel and air dry doors open where safe",
    },
    whyItWorks:
      "Most appliance odors are removable food and biofilm in handles, gaskets, and drains—not the metal itself",
    whyItHappens:
      "Spills and condensate dry in crevices where airflow is lowest",
    mistakes: [
      "Bleach baths on unknown welds",
      "Ignoring drain and filter paths",
    ],
    benchmarks: [
      "Odor improves after full dry with doors open",
      "If odor persists, inspect drain and filter not panel wipe",
    ],
    professionalInsights: ["Odor that tracks only on compressor run is seldom a wipe fix"],
    sources: ["Appliance OEM cleaning guides", "Commercial kitchen hygiene summaries"],
  },
  {
    surface: "stainless steel",
    problem: "scuff marks",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral stainless cleaner with fine non-abrasive pad if label allows",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["steel wool", "sandpaper"],
        reason: "Lifts transfer scuffs sitting above intact grain without attacking passive layer",
      },
    ],
    method: {
      tools: ["microfiber", "grain-direction passes only"],
      dwell: "Minimal",
      agitation: "Light pressure with grain",
      rinse: "Plain water",
      dry: "Buff uniform sheen",
    },
    whyItWorks:
      "Many scuffs are polymer or rubber transfer; neutral chemistry and grain alignment minimize new scratches",
    whyItHappens:
      "Pots, tools, and packaging abrade and transfer on brushed faces and horizontal rails",
    mistakes: [
      "Circular scrubbing that catches raking light wrong",
      "Abrasive pads on decorative plating",
    ],
    benchmarks: [
      "Scuff dullness reduces without rainbow heat tint",
      "Sheen reads uniform along full panel",
    ],
    professionalInsights: ["Through-grain damage needs refinishing not stronger chemistry"],
    sources: ["SSINA", "Appliance care handbooks"],
  },
  {
    surface: "tile",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline tile cleaner with surfactants before disinfectant per workflow",
        chemistry: "alkaline",
        surfaces: ["tile", "grout"],
        avoids: ["mixing incompatible actives"],
        reason: "Removes organic matrix holding odor in grout and texture",
      },
    ],
    method: {
      tools: ["brush", "microfiber mop"],
      dwell: "Per label on soil load",
      agitation: "Grout and perimeter first",
      rinse: "Flood rinse toward drain",
      dry: "Ventilation on",
    },
    whyItWorks:
      "Odor in tile rooms usually ties to grout organics, drains, and caulks—not glaze alone",
    whyItHappens:
      "Slow-dry grout lines and niche shelves accumulate body and food films",
    mistakes: [
      "Sealing over organics",
      "Ignoring floor drain or pan liner issues",
    ],
    benchmarks: [
      "Odor drops after full dry",
      "If odor returns wet-only, inspect drainage",
    ],
    professionalInsights: ["Shower pan liner failures need construction fix"],
    sources: ["TCNA care context", "EPA disinfectant label language"],
  },
  {
    surface: "tile",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Mild alkaline tile cleaner for sugar and adhesive films",
        chemistry: "alkaline",
        surfaces: ["tile"],
        avoids: ["wax-incompatible finishes"],
        reason: "Emulsifies polar tack without aggressive solvent on unknown sealers",
      },
    ],
    method: {
      tools: ["microfiber", "plastic scraper at low angle"],
      dwell: "Cool tile; short cycles",
      agitation: "Texture lows and grout",
      rinse: "Flood",
      dry: "Inspect grout dry",
    },
    whyItWorks:
      "Alkaline surfactants cut sugars and many adhesives; rinse carries emulsion away",
    whyItHappens:
      "Spills polymerize in texture; wrong cleaners leave tack",
    mistakes: [
      "Solvent guessing on unknown stone insets",
      "Leaving alkaline residue that attracts soil",
    ],
    benchmarks: [
      "No tack barefoot after dry",
      "Rinse water clears by third pass",
    ],
    professionalInsights: ["Identify food vs tape residue before escalating solvent"],
    sources: ["Floor care guides", "Adhesive compatibility charts"],
  },
  {
    surface: "tile",
    problem: "scuff marks",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral tile cleaner; melamine-style pad only if glaze allows",
        chemistry: "neutral",
        surfaces: ["glazed tile"],
        avoids: ["abrasion on soft glaze without test"],
        reason: "Addresses transfer scuffs on glaze when abrasion is controlled",
      },
    ],
    method: {
      tools: ["dry microfiber", "soft white pad"],
      dwell: "Minimal moisture",
      agitation: "Small circles on marks; field last",
      rinse: "Damp clear",
      dry: "Air dry",
    },
    whyItWorks:
      "Many scuffs are heel and rubber transfer above intact glaze; mechanical lift with neutral aid",
    whyItHappens:
      "Grit under shoes abrades sheen unevenly on matte and satin glaze",
    mistakes: [
      "Steel wool on glaze",
      "Acid chasing scuffs that are mechanical",
    ],
    benchmarks: [
      "Mark dullness reduces under raking light",
      "If glaze is visibly cut, stop—repair not cleaner",
    ],
    professionalInsights: ["Distinguish transfer from etched glaze before aggressive pad work"],
    sources: ["TCNA", "Tile manufacturer abrasion guidance"],
  },
  {
    surface: "grout",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline grout cleaner with surfactants; disinfectant per label if needed",
        chemistry: "alkaline",
        surfaces: ["grout"],
        avoids: ["mixing chlorine with acids"],
        reason: "Removes organic odor precursors in cementitious pores",
      },
    ],
    method: {
      tools: ["grout brush", "wet vac optional"],
      dwell: "Soil removal first; biocide contact per label",
      agitation: "Joints and curbs before field tile",
      rinse: "Volume rinse",
      dry: "Ventilate; towel lows",
    },
    whyItWorks:
      "Odor often comes from organic load in joints and failed seal paths—not the tile glaze alone",
    whyItHappens:
      "Slow-dry joints wick body soils and organics; drains can reintroduce moisture",
    mistakes: [
      "Bleach-only without soil removal",
      "Sealing over damp stained grout",
    ],
    benchmarks: [
      "Odor improves after dry-down",
      "If odor tracks drain use, inspect plumbing",
    ],
    professionalInsights: ["Chronic rewet grout may indicate pan or curb failure"],
    sources: ["Grout manufacturer care", "EPA label references"],
  },
  {
    surface: "grout",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Mild alkaline cleaner for cementitious grout joints",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["unknown acid-sensitive stone without protection"],
        reason: "Lifts sugars and tack without aggressive solvent migration to stone",
      },
    ],
    method: {
      tools: ["joint brush", "sponge"],
      dwell: "Brief; refresh solution",
      agitation: "Along joints; minimize spread to acid-sensitive thresholds",
      rinse: "Flood",
      dry: "Towel joints",
    },
    whyItWorks:
      "Surfactants emulsify polar tack; volume rinse stops residue resettling in pores",
    whyItHappens:
      "Spills drain into joints; low joints stay damp longest",
    mistakes: [
      "Solvent chasing tack onto unknown stone",
      "Leaving alkaline film that attracts soil",
    ],
    benchmarks: [
      "Joint feels clean dry",
      "Brush rinses cleaner on second pass",
    ],
    professionalInsights: ["Sticky near stone threshold needs substrate ID before solvent"],
    sources: ["Field grout maintenance notes", "Adhesive TDS context"],
  },
  {
    surface: "grout",
    problem: "scuff marks",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral grout cleaner; narrow brush only—no harsh abrasive on color grout",
        chemistry: "neutral",
        surfaces: ["grout"],
        avoids: ["sandpaper on joints"],
        reason: "Addresses transfer and shallow abrasion without opening new pores blindly",
      },
    ],
    method: {
      tools: ["narrow grout brush", "microfiber"],
      dwell: "Minimal",
      agitation: "Along joint line only",
      rinse: "Flood",
      dry: "Inspect color dry",
    },
    whyItWorks:
      "Many joint marks are surface transfer; controlled mechanical work limits crown damage",
    whyItHappens:
      "Footwear and tools drag rubber and grit across low joints",
    mistakes: [
      "Power tools on grout crowns",
      "Acid on colored grout without test",
    ],
    benchmarks: [
      "Mark lightens without joint profile change",
      "If color is removed, stop—repair not chemistry",
    ],
    professionalInsights: ["Missing or low grout needs repair not abrasion"],
    sources: ["Tile industry grout care summaries", "Manufacturer color grout guidance"],
  },
  {
    surface: "hardwood",
    problem: "dust buildup",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Dry microfiber system or manufacturer-approved dust treatment",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["oil dusters incompatible with finish"],
        reason: "Removes particulate from wear layer without embedding grit in micro-scratches",
      },
    ],
    method: {
      tools: ["microfiber mop", "vacuum with bare floor wand"],
      dwell: "Dry dusting first",
      agitation: "With grain only",
      rinse: "Damp only if finish allows",
      dry: "Immediate",
    },
    whyItWorks:
      "Dry removal prevents mudding; minimal moisture protects seams and bevels",
    whyItHappens:
      "Foot traffic drives dust into grain and texture; pets accelerate loading",
    mistakes: [
      "Wet mopping for dust control",
      "Steam on unknown finish",
    ],
    benchmarks: [
      "Mop pad stays lighter on final dry pass",
      "Sheen even in raking daylight",
    ],
    professionalInsights: ["Entry mats beat oil soaps for dust control"],
    sources: ["NWFA maintenance", "Finish OEM care"],
  },
  {
    surface: "hardwood",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Neutral hardwood cleaner for surfactant films",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["excess liquid", "incompatible oil soaps"],
        reason: "Removes hand and cleaner films without harsh pH on coating",
      },
    ],
    method: {
      tools: ["barely damp microfiber", "dry pad"],
      dwell: "Mist if allowed",
      agitation: "With grain; one wet side per section",
      rinse: "Second pass plain water if needed",
      dry: "Immediate buff",
    },
    whyItWorks:
      "Neutral surfactants lift dried soap without swelling seams or hazing polyurethane",
    whyItHappens:
      "Spray cleaners and mopping leave polar films that read as haze and tack",
    mistakes: [
      "Vinegar or strong alkaline on unknown finish",
      "Walking before dry",
    ],
    benchmarks: [
      "No tack dry",
      "Uniform sheen after buff",
    ],
    professionalInsights: ["Reduce cleaner volume at source before chasing haze"],
    sources: ["NWFA", "Hardwood cleaner labels"],
  },
  {
    surface: "general household surfaces",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "All-purpose neutral cleaner for plastic, painted metal, and utility surfaces",
        chemistry: "neutral",
        surfaces: ["plastic", "painted metal"],
        avoids: ["unknown coatings"],
        reason: "Cuts surfactant films on mixed utility items without aggressive solvent",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush"],
      dwell: "Brief",
      agitation: "Lift dust before wetting when possible",
      rinse: "Damp clear",
      dry: "Towel or air dry",
    },
    whyItWorks:
      "Neutral surfactants solubilize soap and cleaner tails on non-porous and semi-porous utility",
    whyItHappens:
      "Hand soaps and all-purpose cleaners dry on bins, rails, and painted metal",
    mistakes: [
      "Soaking labels and electronics",
      "Ammonia on unknown prints",
    ],
    benchmarks: [
      "Towel runs clean on final wipe",
      "No tack after dry",
    ],
    professionalInsights: ["Separate food-contact rinse per label"],
    sources: ["General cleaning references", "Label guidance"],
  },
  {
    surface: "general household surfaces",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline utility cleaner before disinfectant per label on non-food plastics",
        chemistry: "alkaline",
        surfaces: ["plastic utility"],
        avoids: ["food contact without rinse per label"],
        reason: "Removes organic films that harbor odor in bins and utility tubs",
      },
    ],
    method: {
      tools: ["brush", "hose or utility sink"],
      dwell: "Soil removal then biocide contact as directed",
      agitation: "Corners and lid seals",
      rinse: "As label requires",
      dry: "Inverted air dry",
    },
    whyItWorks:
      "Odor in utility items usually ties to organics and moisture in seams—not the plastic alone",
    whyItHappens:
      "Residual food and moisture in enclosed bins sustains odor precursors",
    mistakes: [
      "Fragrance cover without soil removal",
      "Mixing chemistry blindly",
    ],
    benchmarks: [
      "Odor drops after dry",
      "If odor returns on reuse, improve bag fit and rinse",
    ],
    professionalInsights: ["Persistent sour odor may be drain-adjacent not bin wall"],
    sources: ["EPA label language", "Waste container OEM care"],
  },
  {
    surface: "general household surfaces",
    problem: "grease buildup",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Mild alkaline degreaser for painted metal and plastic utility",
        chemistry: "alkaline",
        surfaces: ["utility surfaces"],
        avoids: ["hot surfaces"],
        reason: "Emulsifies cooking and garage oils on mixed materials when rinse is controlled",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush"],
      dwell: "Cool surface; short cycles",
      agitation: "Work drips top-down",
      rinse: "Damp clear",
      dry: "Edges and handles",
    },
    whyItWorks:
      "Alkaline surfactants hydrolyze and lift oxidized oils when residue is rinsed away",
    whyItHappens:
      "Aerosols and hand contact deposit oils on bins, rails, and appliance sides",
    mistakes: [
      "Leaving alkaline film that attracts dust",
      "Degreaser on hot surfaces that flash",
    ],
    benchmarks: [
      "No tack after dry wipe",
      "Towel stays light on final pass",
    ],
    professionalInsights: ["Source ventilation near cook areas reduces redeposit on utility"],
    sources: ["Commercial kitchen soil summaries", "Label guidance"],
  },

  // ==============================
  // HIGH-YIELD COVERAGE DROP (canonical rows)
  // The 30 conceptual variants in the brief (yellowing, yellow stains, grease film, etc.)
  // map to these canonical problems via evidenceResolver PROBLEM_ALIASES — do not duplicate
  // per-synonym rows or they would never match resolveEvidence().
  // ==============================

  {
    surface: "stainless steel",
    problem: "discoloration",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Alkaline degreaser for appliance-grade stainless",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["hot surfaces during application"],
        reason:
          "Breaks polymerized cooking oils and organic films that read as yellow, brown, or blotchy before any acid step",
      },
      {
        name: "Mild acidic stainless descaler or citric-based mineral film remover",
        chemistry: "acidic",
        surfaces: ["stainless steel", "chrome"],
        avoids: ["prolonged dwell", "decorative plating without spot test"],
        reason:
          "Dissolves iron-bearing spots and mineral oxidation after organic film is removed; short dwell protects passive layer",
      },
      {
        name: "pH-neutral stainless polish or grain-aligning protectant",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["silicone oils if manufacturer forbids"],
        reason:
          "Restores uniform sheen so heat rainbow vs removable film is visible under raking light",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush", "plastic scraper for lifted residue only"],
      dwell:
        "Step 1—Identify: heat tint / rainbow vs residue vs iron vs grease. Step 2—Cool metal; degreaser dwell per label if organic film suspected. Step 3—Rinse or wipe clean before acid. Step 4—Acid only if minerals or iron remain: seconds to short minutes, never let acid dry on metal.",
      agitation:
        "Step 5—Wipe strictly with grain on brushed finishes; spot work stains without crossing grain. Step 6—Polish buff for uniformity; reassess before repeating acid.",
      rinse: "Flood-rinse between chemistry changes; hot rinse helps carry oils off horizontals",
      dry: "Immediate towel dry and second dry-only cloth to limit chloride water spots",
    },
    whyItWorks:
      "Degreasers emulsify oxidized organic films that masquerade as permanent stains. Mild acids attack surface mineral and iron deposits when the passive chromium oxide layer is intact and contact time is controlled. Neutral polish evens micro-scratch appearance so true heat-tint oxide thickness changes are not mistaken for soil.",
    whyItHappens:
      "Cooking aerosols, iron in water, tool transfer, and high heat alter reflectivity off the oxide layer or leave bonded films that read as uneven color, rainbow, or embedded staining.",
    mistakes: [
      "Abrasive pads or steel wool that destroy grain and embed rust nuclei",
      "Chlorine or bleach films that initiate pitting and darkening",
      "Applying acid through heavy grease—film buffers contact and risks uneven attack",
      "Skipping identification between heat tint, iron transfer, and organic film",
      "Over-scrubbing across grain leaving permanent directional scratch",
    ],
    benchmarks: [
      "Tone moves toward uniform under raking light after organic then mineral passes",
      "Deep stable rainbow heat tint may remain—document limits before promising full reversal",
    ],
    professionalInsights: [
      "If orange or brown returns within 48h after cleaning, suspect external iron in water, pads, or adjacent carbon steel before repeating acid cycles",
    ],
    sources: ["SSINA stainless care", "Appliance OEM cleaning guides", "Metal finishing references"],
  },
  {
    surface: "stainless steel",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Mild alkaline degreaser for appliance surfaces",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["hot metal during application"],
        reason: "Emulsifies sugars, oils, cleaner buildup, and layered polar films before rinse",
      },
      {
        name: "Label-rated adhesive or label remover for stainless (rinse thoroughly)",
        chemistry: "solvent",
        surfaces: ["stainless steel"],
        avoids: ["unknown coatings", "decorative plating without test"],
        reason: "Cuts adhesive and some waxes when alkaline alone leaves tack; follow with neutral wipe",
      },
      {
        name: "pH-neutral rinse wipe or stainless-safe detail spray",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["excess pooling at seams"],
        reason: "Removes surfactant tail and prevents new streak-tack after alkaline or solvent step",
      },
    ],
    method: {
      tools: ["microfiber", "plastic scraper at low angle for gum-like spots", "detail brush"],
      dwell:
        "Step 1—Classify: food film vs adhesive vs wax vs cleaner buildup. Step 2—Alkaline dwell on cool metal; refresh as solution loads. Step 3—Solvent spot only if label allows and plating is known safe. Step 4—Neutral rinse wipe.",
      agitation: "Always with grain on brushed faces; edges and handles first; flip cloth to clean face",
      rinse: "Hot water rinse or damp neutral wipe between chemistry types",
      dry: "Second microfiber dry-only until drag-free",
    },
    whyItWorks:
      "Alkaline surfactants hydrolyze and lift most kitchen tack and product buildup. Targeted solvent steps address adhesive polymers alkaline leaves behind. Neutral final wipe strips polar tails that would read as new streaks or tack.",
    whyItHappens:
      "Spills, labels, polishes, and stacked cleaners dry as films on verticals, rails, and handles where rinse is incomplete.",
    mistakes: [
      "Layering products without rinsing between—builds cleaner buildup alias chain",
      "Aggressive solvent on unknown decorative plating",
      "Scraping with metal tools across grain",
      "Leaving alkaline residue that attracts dust and feels tacky dry",
    ],
    benchmarks: [
      "Dry hand slides without drag on full panel",
      "Final white towel stays light after buff",
    ],
    professionalInsights: [
      "If tack returns only near dishwasher vent or cook zone, fix redeposit path before stronger chemistry",
    ],
    sources: ["Metal care handbooks", "Adhesive manufacturer SDS context", "Appliance care PDFs"],
  },
  {
    surface: "stainless steel",
    problem: "biofilm",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline surfactant cleaner for biofilm disruption on stainless",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["mixing with incompatible actives"],
        reason: "Breaks extracellular matrix so organisms are reachable by rinse and downstream disinfection",
      },
      {
        name: "EPA-registered disinfectant cleaner rated for sink or food-zone stainless",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["bleach with acid residues"],
        reason: "Labeled kill step after soil removal per clean-then-disinfect workflow",
      },
    ],
    method: {
      tools: ["soft brush", "toothbrush for gaskets", "PPE per label"],
      dwell:
        "Step 1—Physical agitation of slime on rails, seams, and drain edges. Step 2—Alkaline clean dwell per label. Step 3—Rinse. Step 4—Disinfectant wet contact time as label requires.",
      agitation: "Work from drain and gasket outward; disassemble aerator or strainer if safe",
      rinse: "Thorough flood; verify no cleaner trapped in overlaps",
      dry: "Towel and airflow; leave doors open on appliances where safe",
    },
    whyItWorks:
      "Biofilm is a hydrated matrix; surfactant alkaline cleaning strips the slime layer so EPA-registered disinfection meets labeled organism reduction on wet-contact sites.",
    whyItHappens:
      "Moisture, organics, and low airflow in drains, gaskets, and seams reseed pink or slimy films on stainless.",
    mistakes: [
      "Fragrance-only cover without soil removal",
      "Ignoring drain tailpiece and stopper as primary reservoir",
      "Mixing chlorine with acidic residues",
      "Stopping at color change without full label wet time",
    ],
    benchmarks: [
      "Slippery sheen gone; surface feels clean when dry",
      "Odor improves after dry if source was biomass not sewer gas",
    ],
    professionalInsights: [
      "Persistent sewer smell after full clean points to trap or vent, not stainless chemistry",
    ],
    sources: ["EPA label language", "Healthcare environmental cleaning overviews", "Plumbing maintenance context"],
  },
  {
    surface: "tile",
    problem: "discoloration",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Alkaline tile and grout cleaner for organic yellowing",
        chemistry: "alkaline",
        surfaces: ["tile", "grout"],
        avoids: ["wax incompatible with sealer"],
        reason: "Lifts soap-body films and organic color shift on glaze and cementitious joints",
      },
      {
        name: "Acidic grout cleaner rated for ceramic only—protect stone insets",
        chemistry: "acidic",
        surfaces: ["grout", "glazed tile"],
        avoids: ["natural stone thresholds without barrier", "colored grout without test"],
        reason: "Addresses iron or mineral-induced grout darkening after alkaline pass when field is acid-tolerant",
      },
    ],
    method: {
      tools: ["microfiber mop", "grout brush", "white pad for glaze test area"],
      dwell:
        "Step 1—Alkaline cycle on field and grout; short dwell, refresh water. Step 2—Rinse until water lightens. Step 3—If grout-only stain remains and stone is protected, acidic joint treatment per label. Step 4—Flood rinse.",
      agitation: "Texture lows and grout first; keep acid off acid-sensitive accents",
      rinse: "Mop-rinse toward drain; change water when loading",
      dry: "Air dry; judge color only when grout is fully dry",
    },
    whyItWorks:
      "Most apparent tile discoloration is organic or soap-bound soil on glaze and porous grout. Alkaline surfactants remove the bulk; controlled acid hits cementitious mineral staining only when the assembly tolerates it.",
    whyItHappens:
      "Grease, body products, and iron-bearing water concentrate on backsplashes, shower floors, and traffic paths; grout stays damp longer than glaze.",
    mistakes: [
      "Sealing over stained grout or film",
      "Broadcast acid across unknown stone insets",
      "Assuming all brown is mold without moisture check",
      "Waxing over residue that locks in uneven color",
    ],
    benchmarks: [
      "Brightness improves after full dry-down",
      "If glaze is physically etched or worn, color will not normalize—stop for repair assessment",
    ],
    professionalInsights: [
      "Iron bacteria in water can mimic mildew—verify supply and filter context on repeat jobs",
    ],
    sources: ["TCNA care bulletins", "Grout manufacturer guidance", "Water quality references"],
  },
  {
    surface: "tile",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "pH-neutral tile cleaner for maintenance pass",
        chemistry: "neutral",
        surfaces: ["tile"],
        avoids: ["incompatible floor finish"],
        reason: "Lifts polar residue without dumping more alkaline builder into mop water",
      },
      {
        name: "Plain water or very mild acidic rinse aid for final rinse in extreme hardness",
        chemistry: "acidic",
        surfaces: ["tile"],
        avoids: ["stone in same room without test"],
        reason: "Optional final pass to solubilize dried mineral salts causing wipe streaks when neutral alone fails",
      },
    ],
    method: {
      tools: ["flat mop", "two buckets (wash / rinse)", "clean and dry microfiber pads"],
      dwell:
        "Step 1—Vacuum or dry dust textured tile. Step 2—Wash bucket: minimal neutral product. Step 3—Rinse bucket: change when cloudy. Step 4—Final dry pad or optional mild acid rinse only if label and adjacency allow.",
      agitation: "Figure-eight on lows; flip pad every ~40–60 ft²; never reuse a loaded face for final wipe",
      rinse: "Dedicated rinse water; third bucket optional for ultra-hard water",
      dry: "Immediate dry pad on gloss tile; air dry acceptable on matte when rinse is clean",
    },
    whyItWorks:
      "Mop streaks, smears, and post-clean haze are usually uneven dried surfactant and hardness salts—not a missing strong acid on the whole field. Neutral maintenance plus clean rinse water removes the film; optional mild acid rinse targets salt drag marks only where safe.",
    whyItHappens:
      "Dirty mop water, too much product, and hard water evaporation leave bands and wipe marks as the last liquid dries.",
    mistakes: [
      "Adding more alkaline cleaner instead of changing rinse water",
      "Circular buffing on gloss tile that shows every arc",
      "Acid final on assemblies with acid-sensitive stone without isolation",
      "Walking traffic across tile before rinse water dries",
    ],
    benchmarks: [
      "Uniform appearance under raking or window light",
      "Rinse water stays measurably clearer by the third dump",
    ],
    professionalInsights: [
      "Two-bucket (or three-bucket) method routinely outperforms stronger chemistry on large tile fields",
    ],
    sources: ["ISSA floor care primers", "Chemical supplier dilution charts", "TCNA maintenance context"],
  },
  {
    surface: "painted surfaces",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "pH-neutral wall wash with chelating surfactants",
        chemistry: "neutral",
        surfaces: ["painted drywall", "trim"],
        avoids: ["flat paint without washability test"],
        reason: "Primary removal of mineral film, drip marks, and drying marks on washable coatings",
      },
      {
        name: "Very mild acidic bathroom cleaner on trim only when paint is rated and tested",
        chemistry: "acidic",
        surfaces: ["semi-gloss trim"],
        avoids: ["flat walls", "unknown vintage coatings"],
        reason: "Optional second pass for stubborn hardness when neutral chelation plateaus and label allows",
      },
    ],
    method: {
      tools: ["soft sponge", "two microfibers", "low-absorbency towel for edges"],
      dwell:
        "Step 1—Test hidden corner for washability and sheen change. Step 2—Neutral wash small sections top-to-bottom. Step 3—Damp clear rinse. Step 4—Optional mild acid on trim only if step 2 plateaus and paint tolerates.",
      agitation: "Light pressure; turn sponge; protect floor and outlets",
      rinse: "Damp clear between sections; no standing liquid at tape seams",
      dry: "Pat dry; assess at multiple angles after full cure dry",
    },
    whyItWorks:
      "Chelating neutral surfactants reduce calcium and hardness adhesion without the etch risk of whole-wall acid. A controlled acidic trim pass can clear residual spotting only where the coating system is verified compatible.",
    whyItHappens:
      "Splashes, drip marks, and evaporation plate minerals on satin or semi-gloss near sinks, switches, and backsplashes.",
    mistakes: [
      "Vinegar or strong acid on unknown finish",
      "Over-wetting taped seams and corners",
      "Scrubbing through sheen chasing spots",
      "Skipping washability test on repainted rental stock",
    ],
    benchmarks: [
      "Spots and haze fade after dry without gloss mottle",
      "If minerals return in 48h, fixture water path needs correction not stronger wall acid",
    ],
    professionalInsights: [
      "Document sheen before/after on touch-up zones—customers see raking light defects before cleaners do",
    ],
    sources: ["Paint manufacturer washability ratings", "Residential maintenance guides", "Water chemistry primers"],
  },
  {
    surface: "painted surfaces",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Neutral heavy-duty wall wash for topical scale softening",
        chemistry: "neutral",
        surfaces: ["painted surfaces"],
        avoids: ["incompatible coatings"],
        reason: "First-line softening when full-strength acid is unsafe on the paint film",
      },
      {
        name: "Mild acidic scale remover labeled for washable trim or enamel",
        chemistry: "acidic",
        surfaces: ["trim", "semi-gloss paint"],
        avoids: ["flat paint", "acid without spot test"],
        reason: "Dissolves chalky and calcium crust at edges after neutral pass when coating tolerates low pH",
      },
    ],
    method: {
      tools: ["soft sponge", "detail brush", "plastic scraper at paint-safe angle only"],
      dwell:
        "Step 1—Identify scale vs damaged paint. Step 2—Neutral dwell on crust with light agitation. Step 3—Rinse. Step 4—Acid on trim or small test patch only if neutral plateaus. Step 5—Rinse and assess dry.",
      agitation: "Controlled; protect carpet and hardwood below splash line",
      rinse: "Damp clear; blot low spots",
      dry: "Full dry before deciding on repaint",
    },
    whyItWorks:
      "Topical mineral crust on paint yields to mechanical lift after surfactant softening; mild acid dissolves carbonate scale only where the coating system can tolerate brief contact without chalking.",
    whyItHappens:
      "Repeated hard water splash, slow evaporation, and vertical runs build chalky residue and crust at edges and behind faucets.",
    mistakes: [
      "Metal scraper through paint film",
      "Full-wall acid without washability data",
      "Sealing over scale with ‘paint and primer’ products",
      "Ignoring recurrence from failed caulk or grout behind escutcheon",
    ],
    benchmarks: [
      "Crust powders gently with plastic edge after cycles without exposing bare substrate",
      "If scale is under failing paint, plan scrape and recoat not stronger acid",
    ],
    professionalInsights: [
      "Recurrence control at the faucet often matters more than aggressiveness on the wall plane",
    ],
    sources: ["Paint TDS", "Water chemistry references", "Restoration contractor field notes"],
  },
  {
    surface: "painted surfaces",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent", "acidic"],
    products: [
      {
        name: "pH-neutral cleaner for painted finishes",
        chemistry: "neutral",
        surfaces: ["painted surfaces", "trim", "cabinets"],
        avoids: ["flat paint without washability test"],
        reason: "Remove light residue without softening or dulling paint",
      },
      {
        name: "Mild alkaline cleaner for durable painted surfaces",
        chemistry: "alkaline",
        surfaces: ["semi-gloss paint", "enamel trim"],
        avoids: ["unknown vintage coatings", "flat chalky paint"],
        reason:
          "Break down hand oils, light kitchen film, and patchy residue on more durable painted surfaces",
      },
    ],
    method: {
      tools: ["dry duster", "two microfiber cloths", "low-moisture sponge optional"],
      dwell:
        "Dry-dust first; test cleaner in an inconspicuous area; neutral or mild alkaline on cloth only—never flood the film",
      agitation:
        "Overlapping passes with consistent pressure; wipe in one direction per section; do not scrub only visible bad spots",
      rinse: "Follow immediately with a second clean damp microfiber to remove cleaner residue",
      dry: "Dry with a fresh microfiber to prevent patchy evaporation marks; assess at raking light after full dry",
    },
    whyItWorks:
      "Uneven finish on painted surfaces is commonly caused by uneven residue loading, over-wetting, partial cleaner removal, or localized abrasion. A controlled low-moisture two-cloth method removes residue without creating new lap marks or softening the painted film.",
    whyItHappens:
      "Residue loads unevenly when wiping pressure, cleaner dosage, or drying speed varies across the plane, and paint sheen exaggerates small film differences under raking light.",
    mistakes: [
      "Using too much liquid, which can leave drying marks, soften some paint films, or create new uneven patches.",
      "Scrubbing only the visible bad spots, which creates contrast between cleaned and less-cleaned areas.",
      "Using strong solvent or harsh degreaser on paint, which can change sheen or damage the coating.",
      "Letting cleaner dry on the surface, which leaves patchy residue and visible edge lines.",
      "Using dirty towels, which redistributes residue and creates smudged or shiny patches.",
    ],
    benchmarks: [
      "Light residue-related unevenness should improve substantially after one controlled pass.",
      "Patchiness caused by paint burnishing, abrasion, or coating damage may only improve partially.",
      "If sheen differences remain after residue removal, the issue is likely finish damage rather than cleanable soil.",
    ],
    professionalInsights: [
      "Document sheen under raking light before and after—customers often see mottle cleaners miss in flat ambient light.",
    ],
    sources: [
      "surface-safe residue leveling practices for painted household finishes",
      "low-moisture maintenance guidance for coated interior surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel", "appliance fronts"],
        avoids: ["hot metal without flash-off plan"],
        reason: "Remove light residue and cleaner haze without creating new smears",
      },
      {
        name: "Mild alkaline degreaser for fingerprint and oil film",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["mixed-metal assemblies without rinse discipline"],
        reason: "Break down patchy oily film and fingerprint loading",
      },
      {
        name: "Stainless steel polish (finishing pass)",
        chemistry: "neutral",
        surfaces: ["stainless steel", "brushed grain finishes"],
        avoids: ["excess product that attracts dust"],
        reason: "Restore a more uniform visual finish after residue removal when needed",
      },
    ],
    method: {
      tools: ["microfiber cloths", "soft brush", "separate buff towel"],
      dwell:
        "Identify residue vs heat tint vs scratch; alkaline on cool metal for oil; neutral to clear haze; polish only after film removal",
      agitation: "Always wipe and buff with the grain; refresh cloth faces as they load",
      rinse: "Damp-clear surfactants after alkaline work; no standing cleaner on welds or grooves",
      dry: "Immediate buff dry; final pass with clean microfiber so no excess polish remains",
    },
    whyItWorks:
      "Uneven finish on stainless steel is often visual, not structural. Patchy oils, cleaner residue, and inconsistent polish leave sections reflecting light differently. Removing the film and finishing with the grain restores a more uniform appearance without adding scratches.",
    whyItHappens:
      "Oils, fingerprints, and cleaner films deposit preferentially on horizontal spans and handles while vertical fields stay cleaner, producing patchy reflectivity that reads as finish problems.",
    mistakes: [
      "Wiping across the grain, which makes the finish look more chaotic and highlights streaks.",
      "Using abrasive pads, which permanently alter reflectivity and create true finish damage.",
      "Over-applying polish, which creates fresh patchiness and attracts more residue.",
      "Using degreaser when the problem is actually cleaner haze, which can worsen the look.",
      "Trying to spot-fix only the most visible patch, which often leaves the surrounding area mismatched.",
      "Chlorinated cleaners on stainless—chloride residues accelerate pitting on some grades if left to concentrate.",
    ],
    benchmarks: [
      "Residue-related uneven finish should improve quickly once the correct chemistry is used.",
      "Minor polish imbalance usually evens out after a full-surface re-wipe and buff.",
      "Scratch-driven or heat-driven finish variation may remain even after proper cleaning.",
    ],
    professionalInsights: [
      "Full-field retreatment beats spot buffing when reflectivity mismatch is residue-driven.",
    ],
    sources: [
      "stainless steel maintenance practices for residue control and finish uniformity",
      "professional wiping and polishing guidance for directional metal finishes",
    ],
  },
  {
    surface: "hardwood",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "solvent", "alkaline"],
    products: [
      {
        name: "Hardwood-safe neutral cleaner",
        chemistry: "neutral",
        surfaces: ["finished hardwood", "sealed wood floors"],
        avoids: ["wax-over-oil systems without manufacturer direction"],
        reason: "Remove light residue without stressing the floor finish",
      },
    ],
    method: {
      tools: ["microfiber mop pad", "dry microfiber towels", "spray bottle optional"],
      dwell:
        "Apply cleaner to the cloth or pad, not directly to the floor; work small sections; evaluate only after full dry",
      agitation:
        "Consistent overlapping passes; no aggressive spot-scrubbing on dull traffic lanes until soil vs wear is confirmed",
      rinse: "Minimal moisture; second dry pass removes remaining dampness and levels sheen",
      dry: "Immediate dry microfiber follow-up; fans acceptable in humid conditions",
    },
    whyItWorks:
      "Uneven finish on hardwood is frequently caused by residue layering, over-wet cleaning, incompatible cleaners, or differential wear in the coating. Neutral low-moisture maintenance removes removable film without driving water into seams or worsening the finish.",
    whyItHappens:
      "Foot traffic, mop routing, and sun paths wear coating differentially while residue films stack heavier in recesses and along walls, so gloss reads uneven even when soil is light.",
    mistakes: [
      "Using too much water, which can swell seams, create patchy drying, and stress the finish.",
      "Using vinegar or strong DIY solutions, which can dull some floor finishes over time.",
      "Applying cleaner directly to the floor, which creates concentrated patches and uneven evaporation.",
      "Spot-scrubbing dull areas aggressively, which can abrade the coating and create permanent contrast.",
      "Assuming all gloss differences are soil, when some are wear patterns or finish loss.",
    ],
    benchmarks: [
      "Residue-related patchiness should improve after controlled neutral cleaning.",
      "Traffic-lane dulling and worn finish usually remain after cleaning and indicate coating wear.",
      "If the floor still looks uneven once dry, the issue may be maintenance-film plus finish-age variation rather than active soil.",
    ],
    professionalInsights: [
      "Traffic-lane wear versus residue film is a fork—wear will not improve with more wet passes.",
    ],
    sources: [
      "manufacturer-aligned hardwood maintenance practices",
      "low-moisture residue removal guidance for finished wood floors",
    ],
  },
  {
    surface: "general household surfaces",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "solvent", "alkaline"],
    products: [
      {
        name: "General neutral cleaner for mixed finishes",
        chemistry: "neutral",
        surfaces: ["mixed household finishes", "unknown coatings"],
        avoids: ["assumed washability without spot test"],
        reason: "Remove light mixed residue on unknown or mixed-finish surfaces with lowest risk",
      },
    ],
    method: {
      tools: ["microfiber cloths", "dry towel", "detail swab optional"],
      dwell:
        "Dry-remove loose soil; spot test; neutral cleaner lightly loaded; full-field wipe before escalating anything",
      agitation: "Even pressure across the entire affected area—not just the worst patch",
      rinse: "Clean damp cloth pass if residue remains; never let product air-dry on the surface",
      dry: "Immediate dry microfiber; reassess once equilibrated",
    },
    whyItWorks:
      "Uneven finish on general household surfaces is often created by partial residue removal, cleaner overload, incompatible product layering, or uneven drying. Neutral low-moisture cleaning is the safest first pass when the exact surface and finish are not yet fully identified.",
    whyItHappens:
      "Mixed surfaces receive inconsistent previous products and wiping habits, so film thickness and evaporation marks never uniformize without a deliberate full-field neutral pass.",
    mistakes: [
      "Escalating chemistry too early on an unknown surface.",
      "Using one dirty cloth for the whole process, which spreads residue instead of leveling it.",
      "Cleaning only the most visible patch, which leaves contrast lines.",
      "Leaving cleaner to air-dry, which creates new haze and patchiness.",
      "Assuming shine differences always mean dirt rather than finish wear or surface damage.",
    ],
    benchmarks: [
      "Light residue-based unevenness often improves on the first careful pass.",
      "Unknown-surface finish damage will not clean away and should not be chased aggressively.",
      "If patchiness persists after safe neutral cleaning, the next step is better surface identification, not stronger random chemistry.",
    ],
    professionalInsights: [
      "Identification before escalation prevents one patch from becoming a permanent testimonial of wrong chemistry.",
    ],
    sources: [
      "general low-risk maintenance guidance for mixed household surfaces",
      "residue-leveling practices for unknown-finish cleaning scenarios",
    ],
  },
  {
    surface: "hardwood",
    problem: "discoloration",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "solvent", "alkaline"],
    products: [
      {
        name: "Hardwood-safe neutral cleaner",
        chemistry: "neutral",
        surfaces: ["finished hardwood", "sealed wood"],
        avoids: ["flooding seams", "wax-incompatible systems without direction"],
        reason: "Remove light soil and maintenance film without stressing the floor finish",
      },
      {
        name: "Manufacturer-approved hardwood spot cleaner",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["using without label dwell and rinse guidance"],
        reason:
          "Target localized residue-based discoloration that remains after neutral cleaning",
      },
    ],
    method: {
      tools: ["microfiber mop pad", "microfiber cloths", "dry towels"],
      dwell:
        "Inspect in dry light for residue vs moisture darkening vs finish wear vs wood staining; dry-remove grit; apply neutral cleaner to pad/cloth only; overlapping passes, minimal moisture; dry microfiber immediately; manufacturer spot cleaner only if discoloration still reads residue-based; stop if finish wear, sun fade, water intrusion, or permanent wood staining",
      agitation:
        "Controlled overlapping passes; separate removable residue discoloration from finish loss before aggressive work",
      rinse: "Minimal moisture; follow with dry pass to level sheen",
      dry: "Immediate dry microfiber; judge only when fully dry",
    },
    whyItHappens:
      "Hardwood discoloration often comes from tracked-in soil, maintenance-film buildup, moisture exposure, UV fade, or wear in the protective finish. Not all color change is removable soil.",
    whyItWorks:
      "Low-moisture neutral cleaning removes removable soil and maintenance film without driving water into seams or worsening finish imbalance. Specialty wood-floor spot chemistry can help on residue-based darkening that survives the first pass.",
    mistakes: [
      "Using excessive water, which can worsen darkening, swell edges, and stress the floor finish.",
      "Using vinegar or strong DIY acids, which may dull or prematurely age some finishes.",
      "Spot-scrubbing aggressively, which can abrade the coating and create permanent contrast.",
      "Applying cleaner directly to the floor, which causes uneven evaporation and patchiness.",
      "Assuming all discoloration is cleanable when some is sun fade, finish wear, or wood staining.",
    ],
    benchmarks: [
      "Surface soil and maintenance-film discoloration should improve noticeably after controlled neutral cleaning.",
      "Traffic-lane dulling, water-blackened wood, and finish-loss patterns usually remain after cleaning.",
      "If the floor still looks discolored when fully dry, the issue is likely coating damage or wood-level staining rather than removable residue.",
    ],
    professionalInsights: [
      "Traffic-lane darkening often contains both removable residue and permanent finish wear.",
      "Water-blackened wood and sun-faded zones usually do not clean back evenly.",
      "Hardwood should always be judged fully dry before deciding whether the issue is soil or damage.",
    ],
    sources: [
      "manufacturer-aligned maintenance guidance for finished hardwood floors",
      "low-moisture cleaning practices for residue-related discoloration on wood flooring",
    ],
  },
  {
    surface: "grout",
    problem: "discoloration",
    soilClass: "mineral",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Alkaline grout cleaner",
        chemistry: "alkaline",
        surfaces: ["grout", "cementitious joints"],
        avoids: ["acid-sensitive stone without protection"],
        reason: "Break down embedded soil, oils, and general dinginess",
      },
      {
        name: "Mild acidic descaler for grout",
        chemistry: "acidic",
        surfaces: ["grout", "ceramic surrounds"],
        avoids: ["weak or cracked grout", "uncoated acid-sensitive stone"],
        reason:
          "Remove mineral staining and hard-water-related discoloration where grout condition allows",
      },
    ],
    method: {
      tools: ["grout brush", "vacuum", "sponge", "wet microfiber"],
      dwell:
        "Dry-remove grit; alkaline clean with brush dwell per label when soil-heavy; rinse or extract; test mild acid in inconspicuous joint only if mineral stain remains; full rinse; judge color only when fully dry; stop if pigment loss or sealer failure",
      agitation: "Along joints; refresh solution; avoid metal tools",
      rinse: "Volume rinse until water runs clean after each chemistry phase",
      dry: "Allow full dry before judging true joint color",
    },
    whyItHappens:
      "Grout discolors because it is porous and traps soil, oils, minerals, and microbial contamination more easily than smoother tile surfaces. Some old staining also becomes permanent.",
    whyItWorks:
      "Alkaline chemistry attacks embedded oily soil and general dinginess, while mild acids dissolve mineral-based discoloration when the grout is stable enough to tolerate them.",
    mistakes: [
      "Using acid first on every grout problem, which can be unnecessary and may stress weakened grout.",
      "Failing to rinse fully, which leaves residue that attracts new soil.",
      "Using metal tools or overly aggressive abrasion, which damages grout lines.",
      "Judging results while the grout is still wet, which hides the true color.",
      "Treating permanent staining as active soil and overworking the surface.",
    ],
    benchmarks: [
      "Soil-driven discoloration often improves substantially with alkaline cleaning and agitation.",
      "Mineral-related discoloration may require a second chemistry pass with a mild acid.",
      "Old staining, pigment loss, or deep-set discoloration may remain even after proper cleaning.",
    ],
    professionalInsights: [
      "Wet grout always looks darker, so dry-down judgment matters.",
      "Mineral staining and soil staining often overlap in shower grout and entry grout.",
      "Weak, sandy, or previously damaged grout should not be pushed aggressively with acid.",
    ],
    sources: [
      "professional grout-cleaning workflows for embedded soil and mineral staining",
      "surface restoration guidance for porous cementitious grout lines",
    ],
  },
  {
    surface: "painted surfaces",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent", "acidic"],
    products: [
      {
        name: "pH-neutral cleaner for painted finishes",
        chemistry: "neutral",
        surfaces: ["painted walls", "trim", "cabinets"],
        avoids: ["flat paint without washability confirmation"],
        reason: "Remove light residue without overloading or softening paint",
      },
    ],
    method: {
      tools: ["dry duster", "two microfiber cloths"],
      dwell:
        "Dry-dust; cleaner on cloth not surface; full affected zone in overlapping passes; second damp cloth to clear residue; immediate dry; reassess when fully dry",
      agitation: "Consistent direction per section; avoid spot-rubbing only the visible streak",
      rinse: "Second lightly damp microfiber as rinse pass",
      dry: "Clean dry microfiber immediately to prevent edge lines",
    },
    whyItHappens:
      "Painted surfaces streak when cleaner is applied unevenly, moisture is overused, residue is only partially removed, or wipe direction is inconsistent. Some sheen distortion can also mimic streaking.",
    whyItWorks:
      "A controlled two-cloth, low-moisture process removes residue evenly and reduces the contrast created by lap marks, drying lines, and patchy wipe patterns.",
    mistakes: [
      "Spraying cleaner directly onto the surface, which causes drip lines and uneven drying.",
      "Over-wetting painted finishes, which can soften some coatings and create visible wipe marks.",
      "Spot-rubbing only the bad streak, which makes the surrounding area look different.",
      "Using dirty towels, which smear residue instead of removing it.",
      "Using strong degreasers or solvents on paint, which can alter sheen.",
    ],
    benchmarks: [
      "Residue-based streaking should improve quickly with a full-area low-moisture reset.",
      "Sheen differences from abrasion or paint burnishing may remain after proper cleaning.",
      "If streaking only appears at certain viewing angles after cleaning, the issue may be finish distortion rather than active residue.",
    ],
    professionalInsights: [
      "Many painted-surface streaks are residue problems, not dirt problems.",
      "Spot-fixing a single visible streak often makes the contrast worse.",
      "If the streak only shows at certain angles after cleaning, the issue may be sheen distortion rather than active residue.",
    ],
    sources: [
      "low-moisture cleaning guidance for interior painted finishes",
      "residue-leveling practices for streaked coated household surfaces",
    ],
  },
  {
    surface: "natural stone",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline", "solvent"],
    products: [
      {
        name: "Stone-safe neutral cleaner",
        chemistry: "neutral",
        surfaces: ["natural stone", "polished and honed stone"],
        avoids: ["excess concentration without dilution label"],
        reason: "Remove residue without etching acid-sensitive stone",
      },
    ],
    method: {
      tools: ["microfiber", "dry buff towel"],
      dwell:
        "Dry-remove grit; dilute neutral cleaner per label; overlapping passes with lightly loaded microfiber; do not allow cleaner to air-dry; damp-clear if needed; buff dry; stop if pattern is etching or true finish variation",
      agitation: "Even pressure; rotate to clean cloth faces",
      rinse: "Clean damp microfiber to clear surfactant if film persists",
      dry: "Separate microfiber buff to level reflectivity",
    },
    whyItHappens:
      "Natural stone often streaks because of cleaner overuse, hard-water residue, or uneven drying. On polished stone, even small residue loads become visible under light.",
    whyItWorks:
      "Neutral stone-safe cleaning removes film without risking acid etching on sensitive stones, while a dry buff evens reflectivity and exposes whether the remaining issue is residue or permanent finish change.",
    mistakes: [
      "Using acidic cleaners on stone, which can etch and permanently change reflectivity.",
      "Using too much product, which leaves film and haze.",
      "Allowing cleaner to dry on the surface, which creates visible lines.",
      "Using one dirty cloth for the whole job, which redistributes residue.",
      "Confusing etching or honed/polished variation with removable streaking.",
    ],
    benchmarks: [
      "Film-based streaking should improve noticeably after a neutral reset and dry buff.",
      "Hard-water effects may improve only partially if mineral residue is heavy and the stone is acid-sensitive.",
      "Etching, wear paths, and finish inconsistency will not clean away.",
    ],
    professionalInsights: [
      "Acid-sensitive stone can be permanently damaged by the wrong chemistry even when the original issue was only cleaner film.",
      "Polished stone exaggerates residue lines and dirty-cloth drag marks.",
      "Etching and finish variation are commonly mistaken for removable streaking.",
    ],
    sources: [
      "stone-safe maintenance guidance for polished and honed natural stone",
      "professional residue-control practices for streaked stone surfaces",
    ],
  },
  {
    surface: "painted surfaces",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent", "acidic"],
    products: [
      {
        name: "Neutral cleaner for painted finishes",
        chemistry: "neutral",
        surfaces: ["painted surfaces"],
        avoids: ["unknown washability"],
        reason: "Remove light tacky film with the lowest surface risk",
      },
      {
        name: "Mild alkaline cleaner for durable paint",
        chemistry: "alkaline",
        surfaces: ["semi-gloss paint", "enamel trim"],
        avoids: ["flat or chalk paint without test"],
        reason: "Break down oily sticky residue on more durable painted surfaces",
      },
    ],
    method: {
      tools: ["microfiber cloths", "spray bottle optional"],
      dwell:
        "Spot test; neutral on cloth for light tack; mild alkaline on cloth only for durable paint when needed; overlapping passes; minimal saturation; damp-clear; immediate dry",
      agitation: "Controlled wipes; escalate chemistry only after paint tolerance is confirmed",
      rinse: "Clean damp microfiber to remove loosened residue and cleaner",
      dry: "Fresh microfiber dry-down right away",
    },
    whyItHappens:
      "Sticky residue on painted surfaces usually comes from hand oils, sugars, aerosol product overspray, kitchen film, adhesive traces, or partially removed cleaners that dry tacky.",
    whyItWorks:
      "Low-moisture neutral cleaning removes light tackiness with minimal risk, while mild alkaline chemistry helps break down oily sticky residue on more durable painted surfaces without resorting to high-risk solvents.",
    mistakes: [
      "Using solvent or adhesive remover casually on paint, which can damage or dull the coating.",
      "Over-wetting the surface, which can create new marks and weaken some paint films.",
      "Scrubbing only the tacky spot, which leaves a visible cleaned patch around it.",
      "Using dirty cloths that smear the residue around.",
      "Letting alkaline cleaner sit too long on painted surfaces.",
    ],
    benchmarks: [
      "Light sticky film should improve quickly with controlled neutral or mild alkaline cleaning.",
      "Adhesive-heavy residues may only improve partially if the paint limits chemistry options.",
      "If the area remains visually different after the tackiness is gone, the paint sheen may already be altered.",
    ],
    professionalInsights: [
      "The tack may come off while a sheen difference remains if the paint was already altered.",
      "Sticky paint in kitchens often contains both hand oils and airborne cooking film.",
      "Adhesive-heavy residues are limited more by paint sensitivity than by cleaner strength.",
    ],
    sources: [
      "surface-safe residue removal guidance for painted household finishes",
      "low-moisture cleaning methods for tacky coated surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "burnt residue",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline degreaser for cook soil",
        chemistry: "alkaline",
        surfaces: ["stainless steel", "appliance surfaces"],
        avoids: ["hot metal without flash control"],
        reason: "Break down cooked-on fats and carbonized food residue",
      },
      {
        name: "Non-abrasive stainless specialty cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["steel wool", "excess pressure on directional grain"],
        reason: "Assist with stubborn bonded residue without damaging the finish",
      },
    ],
    method: {
      tools: ["microfiber", "non-scratch pad", "soft brush"],
      dwell:
        "Confirm burnt soil vs heat tint; alkaline dwell per label to soften carbonized soil; agitate with non-scratch pad with the grain; wipe lift; repeat before escalating tools; optional neutral specialty pass; finish dry buff",
      agitation: "With the grain; refresh pads as they load carbon",
      rinse: "Damp-clear degreaser so salts do not dry on welds",
      dry: "Immediate buff following grain",
    },
    whyItWorks:
      "Burnt residue on stainless is usually carbonized food soil and polymerized oils bonded by heat. Alkaline chemistry softens and breaks down the organic load, while controlled agitation removes it with less risk than aggressive scraping.",
    whyItHappens:
      "Heat polymerizes oils and sugars onto the oxide layer; thin films read as rainbows or brown crust until chemistry and dwell break the bond.",
    mistakes: [
      "Using steel wool or harsh abrasives, which permanently scratch the surface.",
      "Confusing heat tint with removable burnt residue and overworking the metal.",
      "Skipping dwell time and trying to brute-force the residue off.",
      "Scraping against the grain, which leaves obvious damage.",
      "Chlorinated cleaners on stainless—chloride residues can accelerate pitting on some grades if concentrated.",
    ],
    benchmarks: [
      "Burnt residue usually improves in stages rather than in one pass.",
      "Thin carbonized buildup may clear fully with proper dwell and agitation.",
      "Heat-driven color change in the metal may remain even after all removable residue is gone.",
    ],
    professionalInsights: [
      "Stage removal beats one heroic scrape on directional stainless.",
    ],
    sources: [
      "professional removal workflows for carbonized food residue on stainless steel",
      "directional-finish-safe cleaning methods for high-heat stainless surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "oil stains",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline degreaser",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["mixed metals without rinse plan"],
        reason: "Break down oil-based staining and greasy residue",
      },
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["leaving surfactant to air-dry"],
        reason: "Remove remaining cleaner film and normalize appearance",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Apply degreaser per label; brief dwell to break oil film; wipe with grain; repeat on oxidized patches; neutral follow-up; dry buff",
      agitation: "Overlapping passes; swap to clean cloth faces",
      rinse: "Damp-clear after alkaline work",
      dry: "Clean dry microfiber buff with the grain",
    },
    whyItHappens:
      "Oil stains on stainless are usually cooking oils, hand oils, or oxidized oily residues that reflect light unevenly and can darken over time.",
    whyItWorks:
      "Alkaline degreasers break down oily residues efficiently, while a neutral follow-up prevents the surface from looking patchy or smeared after the degreasing step.",
    mistakes: [
      "Dry-wiping oily stainless, which smears the film around.",
      "Using too much polish before degreasing, which locks in residue visually.",
      "Wiping across the grain, which makes patchiness more visible.",
      "Under-rinsing or under-wiping the degreaser, which leaves new film.",
      "Using abrasive scrubbers that create permanent finish damage.",
    ],
    benchmarks: [
      "Fresh oil stains usually improve quickly with the correct degreaser.",
      "Older oxidized oil may require repeated controlled passes.",
      "If color difference remains after degreasing, the surface may also have heat or chemical discoloration.",
    ],
    professionalInsights: [
      "Fresh oil and oxidized oil behave differently; older staining often needs repeated passes.",
      "Many shiny stainless issues are oil distribution problems, not metal damage problems.",
      "Dry-wiping oily stainless almost always spreads the film instead of removing it.",
    ],
    sources: [
      "professional degreasing practices for stainless appliance and kitchen surfaces",
      "finish-safe residue removal guidance for oil-marked directional metal surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "food residue",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline cleaner for kitchen stainless",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["abrasive powders"],
        reason: "Break down stuck food residues, fats, and organic film",
      },
    ],
    method: {
      tools: ["non-scratch scrubber", "microfiber"],
      dwell:
        "Apply alkaline cleaner; dwell per label and soil thickness; agitate with non-scratch tool with grain; wipe lift; repeat; dry and distinguish remaining soil from heat discoloration",
      agitation: "With grain; avoid metal scrapers on cosmetic finishes",
      rinse: "Damp-clear cleaner",
      dry: "Buff dry to prevent secondary water marks",
    },
    whyItHappens:
      "Food residue on stainless comes from dried organic matter, fats, proteins, and repeated low-level cooking splatter that is not fully removed.",
    whyItWorks:
      "Alkaline chemistry softens and breaks down organic soils, reducing the need for scraping and lowering the risk of directional-finish damage.",
    mistakes: [
      "Letting food residue bake on repeatedly, which makes removal harder.",
      "Using metal scrapers carelessly, which can gouge the surface.",
      "Skipping dwell time and relying only on force.",
      "Using the wrong pad and scratching the finish.",
      "Failing to dry the surface after cleaning, which can leave secondary marks.",
    ],
    benchmarks: [
      "Fresh residue should lift relatively quickly.",
      "Older or heat-bonded residue may need multiple passes.",
      "Remaining darkening after soil removal may indicate burnt residue or heat discoloration rather than active food soil.",
    ],
    professionalInsights: [
      "Fresh food residue is far easier to remove than residue that has gone through repeated heat cycles.",
      "Once the soil is gone, some remaining darkening may turn out to be burnt residue or heat discoloration.",
      "The safest workflow is repeated controlled passes, not force.",
    ],
    sources: [
      "organic residue removal workflows for stainless kitchen surfaces",
      "non-damaging agitation practices for directional stainless finishes",
    ],
  },
  {
    surface: "stainless steel",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Cleaner-disinfectant labeled for non-porous hard surfaces",
        chemistry: "alkaline",
        surfaces: ["stainless steel", "non-porous metal"],
        avoids: ["skipping label dwell for disinfection claims"],
        reason: "Remove microbial growth and sanitize the affected stainless area",
      },
    ],
    method: {
      tools: ["disposable towels", "dedicated microfiber", "gloves"],
      dwell:
        "Correct moisture source where possible; remove visible growth; apply disinfectant per label including full disinfection dwell; wipe clean; dry thoroughly; monitor seams and gaskets",
      agitation: "Mechanical lift of biomass before chemical hold time as label directs",
      rinse: "If label requires rinse after dwell",
      dry: "Complete dry-down—residual dampness invites recurrence",
    },
    whyItHappens:
      "Mold on stainless is typically driven by recurring moisture, trapped organic residue, poor drying, or low-airflow conditions rather than by the metal itself.",
    whyItWorks:
      "Because stainless is non-porous, visible growth can be removed and the surface can be effectively disinfected when the correct product and dwell time are used and the area is dried afterward.",
    mistakes: [
      "Cleaning visible growth without correcting the moisture source.",
      "Skipping dwell time on the disinfectant.",
      "Using dirty towels that spread contamination.",
      "Assuming stainless itself is the cause instead of the damp environment.",
      "Leaving the area wet after cleaning.",
    ],
    benchmarks: [
      "Surface growth on non-porous stainless should remove effectively when caught early.",
      "Recurring growth points to unresolved moisture, residue, or airflow issues.",
      "Staining beneath long-term growth may remain after biological material is removed.",
    ],
    professionalInsights: [
      "The visible growth is only part of the problem; unresolved moisture is what brings it back.",
      "Long-term growth can leave shadow staining after the biology is removed.",
      "Gaskets, seams, and splash zones are usually the real recurrence points.",
    ],
    sources: [
      "non-porous hard-surface microbial cleanup guidance",
      "moisture-control best practices for mold-prone household metal surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "etching",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["aggressive scrub on suspected damage"],
        reason: "Remove residue without worsening the damaged surface",
      },
      {
        name: "Stainless steel polish (contrast reduction)",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["heavy buildup of polish in grooves"],
        reason: "Reduce visual contrast where minor surface variation allows",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Neutral clean first to rule out residue mimic; inspect under angled light with grain; minor polish sparingly if appropriate; gentle buff with grain; stop if defect unchanged after residue removal",
      agitation: "Light pressure only; no abrasive pads on etched zones",
      rinse: "Damp-clear if cleaner residue remains",
      dry: "Buff dry with clean microfiber along grain",
    },
    whyItHappens:
      "True etching on stainless is surface damage from chemical attack, abrasive misuse, or other finish-altering contact. It is not removable soil.",
    whyItWorks:
      "Gentle cleaning removes residue look-alikes, while limited polishing can reduce visual contrast on very minor damage. More aggressive correction usually enlarges or highlights the damaged area.",
    mistakes: [
      "Treating etching like dirt and repeatedly scrubbing it.",
      "Using abrasive pads that enlarge the damaged zone.",
      "Applying harsh chemicals in hopes of dissolving permanent damage.",
      "Polishing too aggressively and creating uneven reflectivity.",
      "Confusing cleaner haze or mineral film with true etching before testing.",
    ],
    benchmarks: [
      "Residue look-alikes may disappear once the surface is properly cleaned.",
      "Minor visual softening may be possible with careful polishing.",
      "True etching is usually permanent and should not be chased indefinitely.",
    ],
    professionalInsights: [
      "Many supposed etch marks are actually cleaner haze or mineral film until proven otherwise.",
      "True finish damage should be confirmed before any corrective effort escalates.",
      "Directional stainless makes even small damaged zones look larger under light.",
    ],
    sources: [
      "finish-preservation guidance for damaged stainless surfaces",
      "professional differentiation of removable residue versus permanent metal surface damage",
    ],
  },
  {
    surface: "stainless steel",
    problem: "protein residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline degreaser for protein-based kitchen residue",
        chemistry: "alkaline",
        surfaces: ["stainless steel", "appliance surfaces"],
        avoids: ["skipping dwell on bonded protein soil"],
        reason: "Break down protein-based food residue and bonded kitchen soil",
      },
      {
        name: "Non-scratch pad and microfiber for with-the-grain wiping",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["steel wool", "scrubbing across the grain"],
        reason: "Lift loosened protein soil with controlled agitation without scratching directional finishes",
      },
    ],
    method: {
      tools: ["microfiber cloths", "non-scratch pad"],
      dwell:
        "Identify whether the mark is protein soil versus heat damage; apply alkaline cleaner with dwell per label; agitate with non-scratch pad or microfiber; wipe with the grain; repeat controlled passes; dry fully and reassess",
      agitation:
        "Non-scratch pad or microfiber suited to stainless; wipe with the grain to lift loosened residue",
      rinse: "Damp-clear cleaner so salts do not dry on welds",
      dry: "Dry fully and reassess for residue versus permanent heat or finish change",
    },
    whyItHappens:
      "Protein residue comes from egg, dairy, meat, and other food soils drying and bonding to stainless, especially near cooking zones.",
    whyItWorks:
      "Alkaline chemistry breaks down protein-based organic residue and lowers the need for force, which protects the directional finish.",
    mistakes: [
      "Skipping dwell time.",
      "Scraping dry.",
      "Using abrasive tools.",
      "Confusing protein residue with heat damage.",
      "Scrubbing across the grain.",
    ],
    benchmarks: [
      "Fresh protein residue should improve quickly.",
      "Older bonded residue may need multiple passes.",
      "Remaining color change may indicate heat damage.",
    ],
    professionalInsights: [
      "Protein soils get much harder after repeated heat cycles.",
      "Dark protein marks are often part residue and part heat effect.",
      "Repeated controlled passes are safer than aggressive single-pass removal.",
    ],
    sources: [
      "professional removal guidance for protein-based kitchen residue on stainless steel",
      "finish-safe organic soil removal practices for directional stainless surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "tannin stains",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["leaving surfactant to air-dry"],
        reason: "Remove loose film and reset the surface before targeting beverage staining",
      },
      {
        name: "Mild follow-up cleaner for organic beverage residue",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["over-wetting or harsh pads on directional finish"],
        reason: "Second controlled pass on remaining organic beverage residue without overworking the finish",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Remove loose film first; use neutral cleaner to reset the surface; if needed, second controlled pass on the stain; wipe with the grain; dry-buff with clean microfiber; stop if the remaining mark appears finish-related",
      agitation: "Wipe with the grain; avoid abrading the stain",
      rinse: "Clean damp microfiber if residue remains",
      dry: "Dry-buff with clean microfiber",
    },
    whyItHappens:
      "Tannin stains come from tea, coffee, and other dark beverages drying repeatedly on stainless.",
    whyItWorks:
      "Neutral residue removal often reduces the apparent stain first; controlled follow-up cleaning loosens remaining organic staining without overworking the finish.",
    mistakes: [
      "Abrading the stain aggressively.",
      "Skipping the residue-removal step.",
      "Using harsh pads.",
      "Over-applying cleaner.",
      "Cleaning only the center of the mark.",
    ],
    benchmarks: [
      "Light beverage staining should improve.",
      "Older layered staining may need repeated gentle passes.",
      "Remaining brown cast may include finish or heat change.",
    ],
    professionalInsights: [
      "Brown beverage marks often look worse when mixed with kitchen film.",
      "Splash zones commonly have layered stain plus residue.",
      "Some brown cast may be finish change, not active stain.",
    ],
    sources: [
      "organic beverage stain removal practices for stainless household surfaces",
      "finish-preserving treatment of light brown staining on directional stainless steel",
    ],
  },
  {
    surface: "stainless steel",
    problem: "mildew stains",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Cleaner-disinfectant suitable for non-porous surfaces",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["skipping label dwell for disinfection claims"],
        reason: "Remove mildew-related residue and sanitize non-porous stainless surfaces",
      },
    ],
    method: {
      tools: ["dedicated microfiber", "disposable towels", "gloves"],
      dwell:
        "Address the moisture source; remove visible residue first; apply cleaner-disinfectant with full dwell per label; wipe clean; dry thoroughly; monitor recurrence zones",
      agitation: "Mechanical lift of residue before chemical hold time as label directs",
      rinse: "If label requires rinse after dwell",
      dry: "Complete dry-down—residual dampness invites recurrence",
    },
    whyItHappens:
      "Mildew-related staining develops where moisture persists and light organic residue remains on the surface.",
    whyItWorks:
      "Stainless is non-porous, so contamination can be physically removed and the surface sanitized effectively when dwell time and drying are handled correctly.",
    mistakes: [
      "Ignoring the moisture source.",
      "Skipping dwell time.",
      "Using dirty towels.",
      "Leaving the area damp.",
      "Assuming all dark marks are removable contamination.",
    ],
    benchmarks: [
      "Active contamination should improve substantially.",
      "Stain shadows may remain.",
      "Recurrence points to unresolved moisture.",
    ],
    professionalInsights: [
      "Shadow staining may remain after active contamination is gone.",
      "Recurrence usually means moisture control is unresolved.",
      "Seams and damp edges are the usual repeat locations.",
    ],
    sources: [
      "non-porous hard-surface mildew cleanup guidance",
      "moisture-control practices for mildew-prone household metal surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "bacteria buildup",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Cleaner-disinfectant suitable for non-porous surfaces",
        chemistry: "alkaline",
        surfaces: ["stainless steel"],
        avoids: ["spray-and-wipe without dwell when label requires contact time"],
        reason: "Remove bacterial film and sanitize the stainless surface",
      },
    ],
    method: {
      tools: ["microfiber", "disposable towels"],
      dwell:
        "Correct dampness or residue source; remove visible film physically; apply cleaner-disinfectant with dwell per label; wipe clean; dry completely; monitor splash-prone edges and seams",
      agitation: "Lift film before disinfectant hold time as label directs",
      rinse: "If label requires rinse after dwell",
      dry: "Dry completely after cleaning",
    },
    whyItHappens:
      "Bacteria buildup appears where moisture, residue, and poor drying create a recurring microbial film.",
    whyItWorks:
      "Physical film removal plus correct disinfectant dwell lowers the biological load on non-porous stainless.",
    mistakes: [
      "Relying on spray-and-wipe only.",
      "Skipping dwell time.",
      "Ignoring moisture source.",
      "Reusing contaminated cloths.",
      "Leaving the surface wet.",
    ],
    benchmarks: [
      "Light surface buildup should remove effectively.",
      "Recurring film indicates unresolved moisture.",
      "Faint staining may remain.",
    ],
    professionalInsights: [
      "Microbial film is usually an environment problem, not a metal problem.",
      "Wet recurrence zones will keep rebuilding.",
      "Drain-adjacent seams and undersides are common hotspots.",
    ],
    sources: [
      "non-porous surface microbial-film removal guidance",
      "sanitizing best practices for damp household stainless surfaces",
    ],
  },
  {
    surface: "stainless steel",
    problem: "oxidation",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["assuming dull marks are removable without cleaning first"],
        reason: "Remove residue so oxidation is not confused with removable film",
      },
      {
        name: "Stainless steel polish",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["excess polish in grooves", "aggressive buffing"],
        reason: "Stainless-safe polishing step for minor visual reduction of oxidation-related dulling",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Clean the area first; inspect under angled light; distinguish residue from oxidation; if minor, reduce contrast with limited polishing; buff with the grain; stop if finish remains altered",
      agitation: "Light pressure with grain; no abrasive pads",
      rinse: "Damp-clear if cleaner residue remains",
      dry: "Buff dry with clean microfiber along grain",
    },
    whyItHappens:
      "Oxidation-related marks follow chemical exposure, neglected residue, or environmental conditions that alter the finish appearance over time.",
    whyItWorks:
      "Cleaning removes residue look-alikes first, and limited polishing can reduce visual contrast on minor oxidation-related dulling.",
    mistakes: [
      "Assuming every dull mark is oxidation.",
      "Using abrasive tools.",
      "Escalating chemistry too early.",
      "Over-polishing.",
      "Working across the grain.",
    ],
    benchmarks: [
      "Residue look-alikes may disappear.",
      "Minor oxidation-related dulling may soften.",
      "True surface change may remain permanent.",
    ],
    professionalInsights: [
      "Many supposed oxidation marks are residue until proven otherwise.",
      "The goal is often visual reduction, not full reversal.",
      "Directional stainless exaggerates subtle finish change.",
    ],
    sources: [
      "finish-preservation guidance for altered stainless steel surfaces",
      "professional differentiation of residue versus oxidation-related finish change",
    ],
  },
  {
    surface: "stainless steel",
    problem: "corrosion",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["aggressive chemistry on pitted or rough zones"],
        reason: "Clean the surface without accelerating damage or confusing residue with corrosion",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Clean to expose the actual defect; inspect for pitting and roughness; wipe gently with the grain; dry thoroughly; stop once the defect is clearly exposed; move to repair or replacement decision if needed",
      agitation: "Gentle with-grain wipes only",
      rinse: "Damp-clear if needed",
      dry: "Dry thoroughly",
    },
    whyItHappens:
      "Corrosion usually follows finish damage, chloride exposure, prolonged neglect, or harsh environmental conditions.",
    whyItWorks:
      "Neutral cleaning clarifies the condition without adding more chemical stress. True corrosion is typically not reversible by cleaning.",
    mistakes: [
      "Treating corrosion like dirt.",
      "Using aggressive acids or abrasives.",
      "Ignoring chloride or moisture source.",
      "Overworking the surrounding finish.",
      "Assuming color alone confirms corrosion.",
    ],
    benchmarks: [
      "Transfer stains may improve.",
      "Visible pitting usually means permanent damage.",
      "Cleaning should clarify, not restore.",
    ],
    professionalInsights: [
      "Differentiate corrosion from transferable rust or residue first.",
      "Pitting and texture matter more than color alone.",
      "Aggressive correction often enlarges the damaged area.",
    ],
    sources: [
      "stainless surface-damage assessment guidance",
      "professional differentiation of transferable staining versus true corrosion",
    ],
  },
  {
    surface: "stainless steel",
    problem: "tarnish",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["polishing before residue is removed"],
        reason: "Remove film and reveal the actual extent of the finish change",
      },
      {
        name: "Stainless steel polish",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["excess product buildup"],
        reason: "Reduce dullness and improve visual uniformity where possible",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Clean away residue first; inspect under good light; apply small amount of polish only if improvement seems possible; buff with the grain; reassess; stop if the finish change remains embedded",
      agitation: "Light buff with grain; stop if change remains embedded in finish",
      rinse: "Damp-clear if polish or cleaner residue remains",
      dry: "Buff dry with clean microfiber",
    },
    whyItHappens:
      "Tarnish-like appearance on stainless is usually finish change, residue neglect, environmental exposure, or mild surface alteration.",
    whyItWorks:
      "Cleaning removes film first, and limited polishing can improve superficial dullness or uneven reflectivity.",
    mistakes: [
      "Assuming all dullness is removable with more polish.",
      "Polishing before cleaning.",
      "Using abrasive pads.",
      "Over-applying polish.",
      "Working across the grain.",
    ],
    benchmarks: [
      "Superficial dulling may improve.",
      "Embedded finish change may remain.",
      "Persistent uneven reflectivity points to deeper damage.",
    ],
    professionalInsights: [
      "Many tarnish complaints are residue, oxidation, or heat-related appearance change.",
      "Improvement usually means better uniformity, not perfect restoration.",
      "Too much polish often makes the result patchier.",
    ],
    sources: [
      "visual-finish restoration practices for stainless household surfaces",
      "professional differentiation of superficial dulling versus permanent finish change",
    ],
  },
  {
    surface: "stainless steel",
    problem: "heat damage",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral stainless-safe cleaner",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["skipping residue removal before judging heat marks"],
        reason: "Remove residue so thermal damage is not confused with removable soil",
      },
      {
        name: "Stainless steel polish",
        chemistry: "neutral",
        surfaces: ["stainless steel"],
        avoids: ["heavy polishing on severe heat zones"],
        reason: "Limited polish for visual softening only where minor heat-related finish change allows",
      },
    ],
    method: {
      tools: ["microfiber cloths"],
      dwell:
        "Remove residue first; separate burnt residue from thermal finish change; use limited polishing only if minor; buff with the grain; stop when removable residue is gone; escalate only to refinishing or replacement decision",
      agitation: "Light with-grain buffing only",
      rinse: "Damp-clear cleaner or polish residue",
      dry: "Buff dry with grain",
    },
    whyItHappens:
      "Heat damage comes from thermal exposure that changes surface appearance or reflectivity near burners or repeated hot spots.",
    whyItWorks:
      "Cleaning removes residue that mimics heat damage; limited polishing may soften minor contrast. Permanent thermal change usually remains.",
    mistakes: [
      "Treating heat damage like dirt.",
      "Using aggressive abrasion.",
      "Skipping residue removal first.",
      "Polishing too hard.",
      "Working across the grain.",
    ],
    benchmarks: [
      "Residue look-alikes may disappear.",
      "Minor visual softening may be possible.",
      "True heat damage usually remains partially visible.",
    ],
    professionalInsights: [
      "Many marks are part residue and part heat effect.",
      "Differentiation comes before correction.",
      "Directional stainless makes thermal change more visible.",
    ],
    sources: [
      "high-heat stainless surface assessment guidance",
      "professional differentiation of burnt residue versus thermal finish damage",
    ],
  },
  {
    surface: "glass",
    problem: "discoloration",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Glass-safe neutral cleaner",
        chemistry: "neutral",
        surfaces: ["glass", "mirrors", "shower doors"],
        avoids: ["abrasive pads"],
        reason: "Clean general film before testing or descaling",
      },
      {
        name: "Mild glass-safe descaler",
        chemistry: "acidic",
        surfaces: ["glass"],
        avoids: ["uncoated metal trim without protection", "etched glass"],
        reason: "Dissolve removable mineral-driven discoloration where appropriate",
      },
    ],
    method: {
      tools: ["microfiber suited for glass", "squeegee optional"],
      dwell:
        "Clean general film first; inspect under direct and angled light; if mineral-driven, test mild descaler in an inconspicuous area; wipe in controlled overlapping passes; remove all residue; stop if the issue appears etched or permanently changed",
      agitation: "Controlled overlapping passes; stop if etching or permanent change suspected",
      rinse: "Clear acidic product thoroughly per label",
      dry: "Dry fully before final judgment",
    },
    whyItHappens:
      "Glass discoloration commonly comes from hard-water minerals, cleaner residue, environmental film, or permanent etching.",
    whyItWorks:
      "Neutral cleaning removes general film first, while mild descaling can dissolve removable mineral discoloration.",
    mistakes: [
      "Using abrasive pads.",
      "Assuming every cloudy area is removable.",
      "Leaving cleaner residue behind.",
      "Overworking one small patch.",
      "Skipping an inconspicuous test before acid.",
    ],
    benchmarks: [
      "Removable film and mineral discoloration should improve.",
      "Etched glass will not clean away.",
      "Persistent cloudiness may be permanent damage.",
    ],
    professionalInsights: [
      "Etching is often mistaken for removable discoloration.",
      "Layered film can exaggerate the problem.",
      "Lighting angle matters when judging the result.",
    ],
    sources: [
      "glass restoration and mineral-film removal guidance",
      "professional differentiation of removable glass residue versus permanent etching",
    ],
  },
  {
    surface: "laminate",
    problem: "discoloration",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "solvent", "alkaline"],
    products: [
      {
        name: "Laminate-safe neutral cleaner",
        chemistry: "neutral",
        surfaces: ["laminate", "laminate counters"],
        avoids: ["flooding seams and edges"],
        reason: "Remove residue, light staining, and maintenance film without stressing the laminate finish",
      },
    ],
    method: {
      tools: ["microfiber cloths", "dry towels"],
      dwell:
        "Dry-remove dust first; apply cleaner to cloth, not surface; clean the full affected zone evenly; follow with clean damp microfiber if needed; dry immediately; stop if color change appears heat-, UV-, or finish-related",
      agitation: "Even pressure; avoid abrasive tools",
      rinse: "Clean damp microfiber if needed",
      dry: "Separate dry microfiber immediately",
    },
    whyItHappens:
      "Laminate discoloration often comes from residue buildup, light staining, heat exposure, UV exposure, or finish-layer wear.",
    whyItWorks:
      "Neutral low-moisture cleaning removes removable film and light residue while minimizing seam swelling and finish risk.",
    mistakes: [
      "Using too much water.",
      "Using abrasive tools.",
      "Escalating chemistry too early.",
      "Cleaning only the center of the mark.",
      "Assuming all discoloration is removable.",
    ],
    benchmarks: [
      "Residue-based discoloration should improve.",
      "Light staining may improve partially.",
      "Heat, UV, and finish damage usually remain.",
    ],
    professionalInsights: [
      "Layered residue often looks like staining on laminate.",
      "Edges and seams are more vulnerable than field areas.",
      "Heat and UV damage do not clean back like residue.",
    ],
    sources: [
      "laminate maintenance guidance for residue and light staining",
      "low-moisture finish-preserving cleaning practices for household laminate surfaces",
    ],
  },
  {
    surface: "tile",
    problem: "burnt residue",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Alkaline degreaser for cook soil on tile",
        chemistry: "alkaline",
        surfaces: ["tile", "backsplashes", "porcelain", "ceramic"],
        avoids: ["pads that scratch glossy glaze"],
        reason: "Soften carbonized greasy organic soil so it lifts with less force",
      },
      {
        name: "Non-scratch scrub pad rated for glazed tile",
        chemistry: "neutral",
        surfaces: ["tile"],
        avoids: ["metal scrapers", "steel wool"],
        reason: "Agitate bonded residue without scratching glossy tile",
      },
    ],
    method: {
      tools: ["non-scratch scrub pad", "tile brush", "microfiber"],
      dwell:
        "Confirm bonded residue versus permanent scorching; apply alkaline cleaner with dwell per label; agitate with non-scratch pad or brush; rinse or wipe away loosened soil; repeat controlled passes; stop if the remaining mark appears damage or absorbed staining",
      agitation: "Short overlapping strokes; refresh rinse water",
      rinse: "Volume rinse or damp-wipe until cleaner is cleared",
      dry: "Towel-dry to judge true color",
    },
    whyItHappens:
      "Tile burnt residue comes from cooked-on food, grease, and carbonized splash bonding to the surface, especially around cooktops and backsplashes.",
    whyItWorks:
      "Alkaline chemistry softens carbonized greasy organic soil so it can be lifted with less force.",
    mistakes: [
      "Scraping aggressively with metal tools.",
      "Skipping dwell time.",
      "Using pads that scratch glossy tile.",
      "Cleaning only the center of the mark.",
      "Confusing surface damage with removable residue.",
    ],
    benchmarks: [
      "Light carbonized residue should improve with proper dwell.",
      "Heavy baked-on soil may need repeated passes.",
      "Permanent darkening may remain if the surface is damaged or stained.",
    ],
    professionalInsights: [
      "Burnt residue often removes in layers.",
      "Grout lines and textured tile hold carbonized soil longer.",
      "Some darkening may be stain or damage after residue is removed.",
    ],
    sources: [
      "professional removal workflows for carbonized food residue on glazed tile",
      "backsplash and cooktop-adjacent tile cleaning practices",
    ],
  },
  {
    surface: "tile",
    problem: "biofilm",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Cleaner-disinfectant suitable for the tile area",
        chemistry: "alkaline",
        surfaces: ["tile", "grout", "shower surrounds"],
        avoids: ["skipping label dwell"],
        reason: "Disrupt biofilm and reduce biological load when dwell time is respected",
      },
      {
        name: "Grout brush or narrow detail tool",
        chemistry: "neutral",
        surfaces: ["tile", "grout"],
        avoids: ["metal wire on soft grout"],
        reason: "Agitate seams, corners, and textured zones where film hides",
      },
    ],
    method: {
      tools: ["microfiber", "grout brush", "disposable towels"],
      dwell:
        "Remove visible slime or film first; apply cleaner-disinfectant with dwell per label; agitate textured zones, grout edges, and corners; rinse or wipe clean; dry thoroughly; correct the moisture source",
      agitation: "Focus corners, low spots, and grout shoulders",
      rinse: "Flood-rinse or wipe until residue clears",
      dry: "Dry thoroughly to slow recurrence",
    },
    whyItHappens:
      "Tile biofilm builds where moisture, soap residue, and poor drying create a recurring slimy layer.",
    whyItWorks:
      "Physical removal disrupts the film, and correctly used chemistry reduces the remaining biological load.",
    mistakes: [
      "Spray-and-wipe without removing the film.",
      "Skipping dwell time.",
      "Ignoring the moisture source.",
      "Reusing contaminated cloths.",
      "Leaving the area wet.",
    ],
    benchmarks: [
      "Active film should improve substantially.",
      "Recurrence means the environment is still feeding it.",
      "Stain shadows may remain.",
    ],
    professionalInsights: [
      "Biofilm returns quickly if moisture and residue stay in place.",
      "Corners, drain paths, and grout edges are common recurrence zones.",
      "Pink, orange slime and clear slippery film are often the same problem at different stages.",
    ],
    sources: [
      "shower and wet-area biofilm control guidance",
      "professional film removal on tile and grout",
    ],
  },
  {
    surface: "hardwood",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "solvent", "alkaline"],
    products: [
      {
        name: "Hardwood-safe neutral cleaner",
        chemistry: "neutral",
        surfaces: ["finished hardwood", "sealed wood"],
        avoids: ["flooding seams", "acid on wood finish"],
        reason: "Safest first pass to remove light mineral residue on top of the finish",
      },
    ],
    method: {
      tools: ["microfiber mop pad", "dry towels"],
      dwell:
        "Dry-remove dust first; inspect to confirm the mark is on the finish, not damaged wood; clean gently with low moisture; wipe evenly with microfiber; dry immediately; stop if the deposit appears bonded into finish damage or water-damaged wood",
      agitation: "Light pressure; no aggressive scrubbing",
      rinse: "Minimal moisture; follow with dry pass",
      dry: "Immediate dry microfiber",
    },
    whyItHappens:
      "Hardwood mineral deposits usually follow splash exposure, tracked-in hard water, or repeated wet cleaning that dries on the finish.",
    whyItWorks:
      "Low-moisture neutral cleaning is the safest first pass on finished wood and may remove light mineral residue on top of the finish without stressing seams or coating.",
    mistakes: [
      "Using acid on wood floors.",
      "Over-wetting the surface.",
      "Scrubbing aggressively.",
      "Assuming white marks are always removable mineral deposits.",
      "Chasing the mark after the finish has already changed.",
    ],
    benchmarks: [
      "Light residue on top of the finish may improve.",
      "Heavier marks may remain if the finish was already damaged.",
      "Water-related whitening or darkening often indicates finish or wood damage.",
    ],
    professionalInsights: [
      "Hardwood is chemistry-limited compared with tile or glass.",
      "Many supposed mineral marks on wood are actually finish damage from moisture.",
      "The safe move is clarification first, not aggressive removal.",
    ],
    sources: [
      "manufacturer-aligned maintenance for finished hardwood",
      "low-moisture cleaning for residue on wood flooring",
    ],
  },
  {
    surface: "grout",
    problem: "streaking",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "pH-neutral cleaner for grout and tile",
        chemistry: "neutral",
        surfaces: ["grout", "tile"],
        avoids: ["letting product dry in joints untested"],
        reason: "Reset residue streaking without jumping to aggressive chemistry",
      },
      {
        name: "Grout brush or microfiber detail tool",
        chemistry: "neutral",
        surfaces: ["grout"],
        avoids: ["metal tools on grout crowns"],
        reason: "Agitate visible residue in joints with controlled contact",
      },
    ],
    method: {
      tools: ["grout brush", "microfiber", "clean rinse water"],
      dwell:
        "Dry-remove loose soil first; apply neutral cleaner evenly; agitate lightly if residue is visible; remove cleaner thoroughly; allow grout to dry fully before judging; repeat only if dry grout still shows residue lines",
      agitation: "Along joints; refresh solution",
      rinse: "Volume rinse or clean damp wipes until water runs clean",
      dry: "Fan or towel grout lines; judge only when fully dry",
    },
    whyItHappens:
      "Grout streaking usually comes from partial residue removal, dirty rinse water, cleaner left behind, or uneven drying after cleaning.",
    whyItWorks:
      "Neutral cleaning resets the surface without overreacting chemically, and full dry-down reveals whether the problem is residue or true discoloration.",
    mistakes: [
      "Judging grout while wet.",
      "Leaving cleaner in the grout line.",
      "Using dirty rinse water.",
      "Overusing product.",
      "Escalating to acid when the problem is simple residue.",
    ],
    benchmarks: [
      "Residue-based streaking should improve after a proper reset.",
      "Persistent line differences may reflect embedded staining or sealer issues.",
      "Always judge only after full dry-down.",
    ],
    professionalInsights: [
      "Wet grout hides its real appearance.",
      "Many grout streaks are residue pattern problems, not embedded staining.",
      "Dirty mop or rinse water commonly causes recurring streak lines.",
    ],
    sources: [
      "professional grout rinsing and residue-control workflows",
      "neutral reset practices for streaked cementitious joints",
    ],
  },
];
