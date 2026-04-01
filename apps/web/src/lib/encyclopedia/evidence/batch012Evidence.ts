import type { EvidenceRecord } from "./evidenceTypes";

/**
 * Encyclopedia seed-batch-012 — hardwood + grout utility rows (canonical keys may
 * supersede earlier catalog entries via resolver index last-write order).
 */
export const BATCH_012_EVIDENCE: EvidenceRecord[] = [
  {
    surface: "hardwood",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["alkaline", "acidic"],
    products: [
      {
        name: "Neutral pH wood-safe cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood", "sealed wood"],
        avoids: ["flooding seams", "abrasive pads"],
        reason: "Lifts soap films without over-wetting or dulling factory or site-applied finishes.",
      },
    ],
    method: {
      tools: ["microfiber", "second dry microfiber"],
      dwell: "Minimal moisture only",
      agitation: "Lightly damp wipe with the grain; flip cloth often",
      rinse: "Damp clear-water pass if needed",
      dry: "Immediate dry buff; fan if humidity is high",
    },
    whyItHappens:
      "Surfactants from mopping, cleaners, and pets bond to polyurethane or oil-modified films and read as a dull haze.",
    whyItWorks:
      "Neutral wood-safe cleaners lift soap films without alkaline stripping or acidic etching of the finish layer.",
    mistakes: [
      "Heavy water and puddles that raise grain or swell seams.",
      "Strong alkalis or acids that frost the finish.",
      "Abrasive pads that scratch sheen.",
    ],
    benchmarks: ["Film should reduce with repeated light cleaning; older buildup may need multiple passes."],
    professionalInsights: ["Judge results after full dry-down; wet wood always looks darker."],
    sources: ["NWFA routine maintenance summaries", "finish manufacturer care PDFs"],
  },
  {
    surface: "hardwood",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent", "acidic"],
    products: [
      {
        name: "Wood-safe residue-removing surface cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood", "finished wood"],
        avoids: ["soaking", "steam mops on unknown finish"],
        reason: "Controlled surfactant action loosens tacky films without saturating the wood system.",
      },
    ],
    method: {
      tools: ["spray bottle (onto cloth)", "microfiber"],
      dwell: "Mist on cloth only; short contact on spot",
      agitation: "Pat-lift; with-grain wipes",
      rinse: "Damp plain-water cloth",
      dry: "Dry immediately with fresh microfiber",
    },
    whyItHappens:
      "Adhesive, sugar, and skin oils polymerize on traffic lanes and near kitchen openings.",
    whyItWorks:
      "Controlled moisture and surfactant action loosen tacky films without wicking deep into seams.",
    mistakes: [
      "Soaking seams or using razor scrapers.",
      "Aggressive solvents that cloud the finish.",
      "Steam on failing or waxed finishes.",
    ],
    benchmarks: ["Sticky spots should soften and release progressively with short dwell and gentle wiping."],
    professionalInsights: ["If tack returns in one spot, check for finish failure vs removable residue."],
    sources: ["wood floor spot-treatment field notes", "manufacturer spot-clean guidance"],
  },
  {
    surface: "hardwood",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Wood-safe maintenance cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["vinegar or descalers on finish without approval"],
        reason: "Finish-sensitive approach removes topical haze without acid descaling the coating.",
      },
    ],
    method: {
      tools: ["barely damp microfiber", "dry microfiber"],
      dwell: "Minimal",
      agitation: "With-grain light passes",
      rinse: "Optional second barely-damp pass",
      dry: "Thorough immediate buff",
    },
    whyItHappens:
      "Evaporation at patio doors and pet bowls plates hardness on the finish surface, not only on glass.",
    whyItWorks:
      "Hardwood stays finish-sensitive, so the safest path is controlled film removal without acidic descaling.",
    mistakes: [
      "Vinegar or strong mineral removers that frost polyurethane.",
      "Excess water volume near bevels.",
    ],
    benchmarks: ["Only surface haze should improve; etched or damaged finish may not fully recover."],
    professionalInsights: ["If whitening persists dry, suspect finish damage not removable film."],
    sources: ["NWFA moisture and maintenance primers"],
  },
  {
    surface: "hardwood",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Wood-safe maintenance cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["acid descalers"],
        reason: "Targets loose surface deposit residue without attacking the finish chemistry.",
      },
    ],
    method: {
      tools: ["white pad test spot", "microfiber"],
      dwell: "Brief on cloth, not on floor pool",
      agitation: "Gentle; refresh face of pad",
      rinse: "Damp wipe",
      dry: "Immediate",
    },
    whyItHappens:
      "Tracked hardness and pet bowl splash can leave spotty mineral crust on the wear layer.",
    whyItWorks:
      "Safest handling removes loose surface deposits mechanically and with neutral chemistry before considering escalation.",
    mistakes: [
      "Acid descalers that etch or frost finish.",
      "Oversaturation and aggressive scrubbing.",
    ],
    benchmarks: ["Loose deposit residue may improve; severe exposure may leave whitening."],
    professionalInsights: ["Fabricator input before any acid trial on site-finished floors."],
    sources: ["field hardwood mineral spot notes"],
  },
  {
    surface: "hardwood",
    problem: "burnt residue",
    soilClass: "grease",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "solvent"],
    products: [
      {
        name: "Wood-safe surface cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["melamine erasers without finish approval"],
        reason: "Gentle removal of loose soot or transfer without abrading the finish.",
      },
    ],
    method: {
      tools: ["dry microfiber first", "slightly damp microfiber"],
      dwell: "Minimal",
      agitation: "Very light with-grain only",
      rinse: "Damp wipe",
      dry: "Buff",
    },
    whyItHappens:
      "Heat events near hearths or candles deposit pyrolyzed film that bonds to finish texture.",
    whyItWorks:
      "Removable soot or transfer lifts carefully; true burnt damage to wood or finish is often permanent.",
    mistakes: [
      "Abrasives, melamine, scraping tools, and heavy wet cleaning.",
      "Strong solvents that dull sheen.",
    ],
    benchmarks: ["Transfer residue may lift; scorch or charring usually will not fully clean away."],
    professionalInsights: ["Photograph before promising color return near heat sources."],
    sources: ["wood finish assessment workflows"],
  },
  {
    surface: "hardwood",
    problem: "scuff marks",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Wood-safe maintenance cleaner",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["grit-impregnated pads"],
        reason: "Many scuffs are heel or rubber transfer that releases with mild friction and safe chemistry.",
      },
    ],
    method: {
      tools: ["microfiber", "finish-approved white pad if tested"],
      dwell: "Minimal",
      agitation: "Small circular or with-grain buff on spot",
      rinse: "Damp wipe",
      dry: "Buff dry",
    },
    whyItHappens:
      "Rubber soles and furniture feet leave polymer transfer that reads darker than true finish damage.",
    whyItWorks:
      "Mild cleaner plus microfiber friction lifts transfer sitting above intact finish.",
    mistakes: ["Melamine erasers and gritty pads that abrade gloss.", "Wax that builds uneven sheen."],
    benchmarks: ["Light scuffs should improve quickly; deeper finish damage may remain visible."],
    professionalInsights: ["Raking light reveals true depth of damage vs transfer."],
    sources: ["NWFA scuff and heel mark guidance"],
  },

  {
    surface: "grout",
    problem: "soap residue",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Soap-scum removing alkaline bathroom cleaner",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["acid-sensitive stone without barrier"],
        reason: "Breaks fatty acid salts bound to mineral phase in cementitious joints.",
      },
    ],
    method: {
      tools: ["grout brush", "microfiber", "volume rinse"],
      dwell: "Per label; do not let dry on colored grout untested",
      agitation: "Along joints; refresh rinse water",
      rinse: "Flood rinse until water runs clear",
      dry: "Towel low spots",
    },
    whyItHappens:
      "Body products plus hardness precipitate in texture-rich grout before the tile field reads equally dull.",
    whyItWorks:
      "Alkaline detergency plus mechanical work breaks soap–mineral complexes trapped in pores.",
    mistakes: ["Under-rinsing that leaves salt film.", "Strong acid on same pass near unprotected stone."],
    benchmarks: ["Residue should break up with agitation; heavy lines may need repeat cycles."],
    professionalInsights: ["Second pass on joints after tile face clears is common."],
    sources: ["bath cleaner label context", "tile industry grout care summaries"],
  },
  {
    surface: "grout",
    problem: "sticky residue",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Residue-cutting alkaline cleaner",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["wax rebuild on grout"],
        reason: "Emulsifies polar tack caught in grout relief.",
      },
    ],
    method: {
      tools: ["narrow brush", "wet vac optional"],
      dwell: "Short; keep active",
      agitation: "Work perimeter grout first",
      rinse: "Heavy rinse or extract",
      dry: "Airflow",
    },
    whyItHappens:
      "Spills and tape adhesives wick into joints where evaporation is slowest.",
    whyItWorks:
      "Alkaline detergency helps emulsify films so rinse water can flush them from texture.",
    mistakes: ["Leaving alkaline film behind.", "Harsh solvents in unventilated baths."],
    benchmarks: ["Tackiness should drop after agitation and complete rinse."],
    professionalInsights: ["If tack returns, suspect silicone or coating failure."],
    sources: ["field grout residue removal notes"],
  },
  {
    surface: "grout",
    problem: "hard water film",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Bathroom descaler safe for grout context",
        chemistry: "acidic",
        surfaces: ["grout", "ceramic"],
        avoids: ["natural stone without protection"],
        reason: "Dissolves thin hardness haze that alkaline wipes smear in joints.",
      },
    ],
    method: {
      tools: ["grout brush", "sponge"],
      dwell: "Short; vertical control of runoff",
      agitation: "Along joints; protect stone thresholds",
      rinse: "Volume rinse",
      dry: "Inspect dry joint color",
    },
    whyItHappens:
      "Splash and evaporation concentrate hardness in grout texture and low corners.",
    whyItWorks:
      "Mild acid solubilizes carbonate film when surrounding materials are protected or tolerant.",
    mistakes: [
      "Excessive dwell that challenges grout colorants or sealers.",
      "Acid on acid-sensitive stone.",
    ],
    benchmarks: ["Film should release gradually; heavy buildup may need repeat treatment."],
    professionalInsights: ["Water chemistry at the source beats endless acid cycling."],
    sources: ["manufacturer acidic grout cleaner SDS context"],
  },
  {
    surface: "grout",
    problem: "mineral deposits",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Scale-removing descaler rated for grout",
        chemistry: "acidic",
        surfaces: ["grout"],
        avoids: ["acid-sensitive stone"],
        reason: "Attacks calcium scale lodged in cementitious pores.",
      },
    ],
    method: {
      tools: ["grout brush", "wet sponge"],
      dwell: "Controlled; refresh rinse",
      agitation: "Target crowns and corners",
      rinse: "Complete rinse to stop acid action",
      dry: "Judge dry",
    },
    whyItHappens:
      "Water paths drain minerals into joints where evaporation is slowest.",
    whyItWorks:
      "Acid chemistry dissolves carbonate scale when substrate and neighbors tolerate the pH.",
    mistakes: ["Mixing acid with bleach.", "Acid contact with polished marble saddles."],
    benchmarks: ["Deposits should soften across controlled cycles."],
    professionalInsights: ["Deeply missing grout may need repair not stronger acid."],
    sources: ["MAPEI technical literature", "field grout restoration notes"],
  },
  {
    surface: "grout",
    problem: "burnt residue",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Degreasing alkaline cleaner for tile and grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["metal gouging tools"],
        reason: "Softens carbonized organic soil in porous joints.",
      },
    ],
    method: {
      tools: ["grout brush", "microfiber"],
      dwell: "Per label near cook zones",
      agitation: "Along joint lines",
      rinse: "Flood rinse",
      dry: "Inspect color dry",
    },
    whyItHappens:
      "Cooking mist plates carbon in grout before the tile face shows equivalent soil.",
    whyItWorks:
      "If residue is organic or greasy transfer, alkaline chemistry helps break bonds in cement pores.",
    mistakes: ["Aggressive scraping that gouges soft grout."],
    benchmarks: ["Transfer residue may improve; heat discoloration may remain."],
    professionalInsights: ["Backsplash corners hold carbon longest."],
    sources: ["professional cook zone grout cleaning workflows"],
  },
  {
    surface: "grout",
    problem: "scuff marks",
    soilClass: "damage",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["solvent"],
    products: [
      {
        name: "Tile-and-grout alkaline cleaner",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["dirty rinse water"],
        reason: "Lifts transfer scuffs caught in grout texture.",
      },
    ],
    method: {
      tools: ["grout brush", "clean rinse bucket"],
      dwell: "Brief",
      agitation: "Spot along affected joints",
      rinse: "Change water when cloudy",
      dry: "Towel",
    },
    whyItHappens:
      "Footwear and tool contact leaves rubber or polymer transfer in low joints.",
    whyItWorks:
      "Mechanical work plus compatible cleaner frees transfer without sanding the joint face.",
    mistakes: ["Reusing loaded rinse water across the whole floor."],
    benchmarks: ["Surface transfer should reduce; embedded stain may need repeats."],
    professionalInsights: ["Mat zones reduce re-transfer more than stronger chemistry."],
    sources: ["resilient and tile entryway maintenance notes"],
  },
  {
    surface: "grout",
    problem: "odor retention",
    soilClass: "organic",
    recommendedChemistry: "enzymatic",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Odor-targeting enzymatic cleaner labeled for hard surfaces",
        chemistry: "enzymatic",
        surfaces: ["grout", "tile"],
        avoids: ["mixing with bleach"],
        reason: "Targets organic residues that harbor odor in porous cement.",
      },
    ],
    method: {
      tools: ["brush", "wet extraction optional"],
      dwell: "Per label for biological soil",
      agitation: "Perimeter and curb lines first",
      rinse: "Rinse per label before next shower use",
      dry: "Ventilate",
    },
    whyItHappens:
      "Body soils and biofilms wick into grout pores and rehydrate with humidity.",
    whyItWorks:
      "Enzymatic systems break down reachable organic odor sources when dwell and rinse follow label design.",
    mistakes: ["Fragrance masking without soil removal.", "Skipping ventilation."],
    benchmarks: ["Odor should drop when organic source was reachable; deep contamination may repeat."],
    professionalInsights: ["Chronic odor with clean joints suggests moisture path failure."],
    sources: ["manufacturer enzymatic cleaner use sites", "IICRC moisture overview references"],
  },
];
