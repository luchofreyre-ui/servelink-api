import type { AuthoritySurfaceSlug } from "@/authority/data/authorityTaxonomy";
import type { AuthoritySurfaceScienceProfile } from "@/authority/types/authoritySurfaceScienceTypes";

function science(profile: AuthoritySurfaceScienceProfile): AuthoritySurfaceScienceProfile {
  return profile;
}

export const AUTHORITY_SURFACE_SCIENCE_PROFILES: Record<AuthoritySurfaceSlug, AuthoritySurfaceScienceProfile> = {
  "shower-glass": science({
    material: {
      family: "glass",
      identity: "Tempered or treated glass exposed to repeated wet-room mineral and soap cycles.",
      behavior: "The glass body is non-porous, but deposits bond visually and mechanically as water evaporates.",
    },
    finish: {
      families: ["gloss", "coated"],
      identity: "Gloss glass with possible factory or aftermarket protective coating.",
      behavior: "Gloss reveals streaking immediately, while coatings can be damaged by acids, blades, or heavy pads.",
    },
    porosity: {
      level: "non-porous",
      behavior: "Soil sits on the surface rather than absorbing into the glass.",
      absorptionRisk: "Low absorption risk, high bonding risk from minerals, soap film, and neglected droplets.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Edge hardware corrosion", "Recurring mineral rings", "Coating breakdown from repeated wet/dry cycles"],
      controlStrategy: "Remove deposits by soil type, then rinse, squeegee, and dry to interrupt the mineral cycle.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Grit scratches", "Blade marks", "Coating haze from restoration pads"],
      controlStrategy: "Use clean microfiber and glass-safe pads only after confirming coating status and deposit type.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Strong acids near metal or stone", "Alkaline residue", "Solvents on unknown coatings"],
      controlStrategy: "Separate glass cleaning from descaling and protect adjacent stone, metal, caulk, and frames.",
    },
    coatingSealer: {
      state: "possible",
      risks: ["Invisible coating removal", "Patchy hydrophobic behavior", "Warrantied surface damage"],
      controlStrategy: "Assume a coating may be present until water behavior, records, or manufacturer guidance says otherwise.",
    },
    restorationBoundary: {
      restorableConditions: ["Soap film", "Light mineral spotting", "Cleaner haze"],
      limits: ["True glass etching", "Scratched coating", "Failed aftermarket treatment"],
      escalationSignals: ["Cloudiness that does not move after correct descaling", "Visible scratches", "Unknown coated glass"],
    },
    prevention: {
      strategies: ["Squeegee after use", "Dry edges and hardware", "Treat deposits before they layer"],
      inspectionCues: ["Round spots", "Cloudy lower panels", "Water beading changes"],
    },
  }),
  glass: science({
    material: {
      family: "glass",
      identity: "Dense silica-based clear or decorative glass.",
      behavior: "It does not absorb soil, but it exposes residue, lint, mineral deposits, and scratches under light.",
    },
    finish: {
      families: ["gloss", "coated"],
      identity: "Gloss, tinted, etched, decorative, or coated glass depending on installation.",
      behavior: "Untreated glass tolerates routine low-residue cleaning; specialty finishes narrow chemical and abrasion options.",
    },
    porosity: {
      level: "non-porous",
      behavior: "Contamination remains on the surface and is often visible as directional film.",
      absorptionRisk: "Low absorption risk, high appearance risk from residue and minerals.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Water spotting", "Edge seal stress", "Frame or adjacent material damage"],
      controlStrategy: "Use controlled moisture and dry finishing, especially near frames and mixed-material assemblies.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Fine scratching from grit", "Blade scratches", "Decorative coating damage"],
      controlStrategy: "Remove grit before polishing and reserve scraping or restoration pads for verified compatible glass.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["High-residue cleaners", "Aggressive acids near adjacent materials", "Solvents on coatings"],
      controlStrategy: "Use low-residue glass chemistry and match stronger treatment to confirmed mineral or adhesive soil.",
    },
    coatingSealer: {
      state: "possible",
      risks: ["Coating haze", "Patchy sheen", "Loss of water-shedding behavior"],
      controlStrategy: "Treat tint, coating, film, or etched finishes as finish-sensitive until identified.",
    },
    restorationBoundary: {
      restorableConditions: ["Fingerprints", "Cleaner film", "Light water spots"],
      limits: ["Etching", "Deep scratches", "Damaged tint or decorative film"],
      escalationSignals: ["Haze that remains after residue removal", "Scratch patterns", "Unknown specialty glass"],
    },
    prevention: {
      strategies: ["Rotate clean towels", "Dry finish after wet cleaning", "Keep abrasive grit off glass tools"],
      inspectionCues: ["Directional streaks", "Round mineral spots", "Cloudiness that does not shift"],
    },
  }),
  mirrors: science({
    material: {
      family: "glass",
      identity: "Reflective glass with a backing layer and vulnerable edges.",
      behavior: "The face behaves like glass, while backing and edges can fail when moisture or chemistry migrates behind them.",
    },
    finish: {
      families: ["gloss", "coated"],
      identity: "Gloss reflective face over a silvered or protected backing.",
      behavior: "Residue shows as haze, and edge wetting can create backing deterioration that cleaning cannot reverse.",
    },
    porosity: {
      level: "non-porous",
      behavior: "Face contamination stays on top, but edges can admit moisture behind the reflective layer.",
      absorptionRisk: "Low face absorption risk, moderate edge intrusion risk.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Black edge creep", "Backing deterioration", "Drips into frame channels"],
      controlStrategy: "Apply cleaner to cloth instead of spraying the mirror and dry edges immediately.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Fine scratching", "Haze from dirty cloths", "Backing exposure at damaged edges"],
      controlStrategy: "Lift specks before polishing and use clean microfiber with light pressure.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Ammonia near backing defects", "Solvents at edges", "High-residue sprays"],
      controlStrategy: "Use low-residue mirror-safe cleaner with minimal liquid load.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Backing attack", "Edge corrosion", "Patchy reflectivity"],
      controlStrategy: "Protect the reflective backing by controlling chemistry and moisture at edges.",
    },
    restorationBoundary: {
      restorableConditions: ["Toothpaste specks", "Hairspray film", "Fingerprints"],
      limits: ["Backing loss", "Black edge creep", "Deep scratches"],
      escalationSignals: ["Dark edge stains", "Clouding behind the glass", "Flaking backing"],
    },
    prevention: {
      strategies: ["Spray cloth instead of surface", "Dry edges", "Vent humid rooms"],
      inspectionCues: ["Edge darkening", "Repeated lower-edge haze", "Drip marks from overspray"],
    },
  }),
  tile: science({
    material: {
      family: "ceramic",
      identity: "Ceramic or porcelain tile faces with grout, caulk, and edge details in the same assembly.",
      behavior: "The tile face may resist moisture while joints and damaged glaze absorb soil and chemistry differently.",
    },
    finish: {
      families: ["gloss", "matte", "coated"],
      identity: "Glazed, textured, matte, polished, or coated tile finish.",
      behavior: "Gloss shows residue, matte texture holds soil, and damaged glaze behaves more porous than intact tile.",
    },
    porosity: {
      level: "low",
      behavior: "Most soil remains on intact tile faces while texture and grout retain more contamination.",
      absorptionRisk: "Low tile-face absorption risk, higher joint and chip absorption risk.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Grout saturation", "Caulk failure", "Substrate intrusion through cracks"],
      controlStrategy: "Clean the tile face while controlling dwell and recovery at joints and damaged areas.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Glaze scratching", "Matte burnishing", "Grout erosion"],
      controlStrategy: "Match brush and pad stiffness to glaze condition and soil depth.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Acids on grout or stone-adjacent installations", "Strong alkalis on coatings", "Residue-heavy cleaners"],
      controlStrategy: "Choose chemistry by soil type and protect grout, caulk, and nearby stone.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Topical coating haze", "Sealer stripping", "Uneven sheen"],
      controlStrategy: "Identify whether protection is on tile, grout, both, or neither before stronger cleaning.",
    },
    restorationBoundary: {
      restorableConditions: ["Soap film", "Kitchen grease", "Surface residue"],
      limits: ["Cracked tile", "Glaze loss", "Failed grout or caulk"],
      escalationSignals: ["Loose tile", "Water intrusion", "Permanent glaze dulling"],
    },
    prevention: {
      strategies: ["Rinse residue", "Dry wet zones", "Maintain grout and caulk"],
      inspectionCues: ["Texture darkening", "White mineral edges", "Cracks or hollow sound"],
    },
  }),
  "porcelain-tile": science({
    material: {
      family: "ceramic",
      identity: "Dense fired porcelain tile.",
      behavior: "Dense body limits absorption, so appearance failures usually come from texture, finish film, grout, or surface residue.",
    },
    finish: {
      families: ["polished", "matte", "gloss"],
      identity: "Polished, matte, textured, or glazed porcelain.",
      behavior: "Polished porcelain shows haze and scratches; matte porcelain holds residue in microtexture.",
    },
    porosity: {
      level: "low",
      behavior: "Dense porcelain absorbs little through intact faces.",
      absorptionRisk: "Low absorption risk except at grout, cracks, unglazed edges, or textured soil pockets.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Grout saturation", "Residue drying in texture", "Moisture reaching substrate through failures"],
      controlStrategy: "Recover dirty solution thoroughly and dry textured or jointed areas.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Polished-surface scratching", "Matte burnishing", "Embedded grit wear"],
      controlStrategy: "Remove grit before wet cleaning and use non-scratch agitation matched to finish.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Acid-sensitive grout", "High-pH residue", "Coating incompatibility"],
      controlStrategy: "Use neutral maintenance first and escalate only for identified mineral, grease, or film.",
    },
    coatingSealer: {
      state: "possible",
      risks: ["Unneeded sealer haze", "Polish residue", "Patchy topical coating"],
      controlStrategy: "Do not assume porcelain needs sealing; verify finish and grout needs separately.",
    },
    restorationBoundary: {
      restorableConditions: ["Mop haze", "Surface grease", "Light mineral film"],
      limits: ["Polish wear", "Deep scratches", "Cracked tile"],
      escalationSignals: ["Persistent dull lanes", "Lippage damage", "Loose or cracked areas"],
    },
    prevention: {
      strategies: ["Control grit", "Use clean rinse water", "Dry texture and grout"],
      inspectionCues: ["Traffic-lane dullness", "Texture darkening", "Residue that grabs footprints"],
    },
  }),
  "ceramic-tile": science({
    material: {
      family: "ceramic",
      identity: "Glazed or unglazed ceramic tile with a more absorbent body than porcelain.",
      behavior: "The glaze may be durable, but chips, crazing, unglazed faces, and grout can absorb moisture and soil.",
    },
    finish: {
      families: ["gloss", "matte", "unsealed"],
      identity: "Glazed, handmade, matte, gloss, or unglazed ceramic.",
      behavior: "Glaze health controls cleanability; compromised glaze behaves like a porous surface.",
    },
    porosity: {
      level: "moderate",
      behavior: "Intact glaze is low-porosity, while unglazed or damaged ceramic can absorb.",
      absorptionRisk: "Moderate risk at chips, crazing, grout, and unglazed tile.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Crazing absorption", "Grout saturation", "Substrate intrusion"],
      controlStrategy: "Limit dwell on compromised glaze and recover moisture from joints.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Glaze scratches", "Crazing expansion", "Matte finish burnishing"],
      controlStrategy: "Use soft to medium agitation only after confirming glaze condition.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Acid on grout", "Strong alkali on decorative glaze", "Bleach residue on colored grout"],
      controlStrategy: "Treat decorative, handmade, or damaged ceramic as finish-sensitive.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Sealer haze", "Unglazed tile darkening", "Grout sealer failure"],
      controlStrategy: "Separate tile-face needs from grout protection needs.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface soap film", "Kitchen grease", "Light residue"],
      limits: ["Glaze loss", "Crazing stains", "Cracked tile"],
      escalationSignals: ["Dark cracks", "Chipped absorbent body", "Loose tile"],
    },
    prevention: {
      strategies: ["Keep grout sealed where appropriate", "Avoid harsh pads", "Dry damaged areas"],
      inspectionCues: ["Crazing lines", "Chips that darken when wet", "Uneven glaze sheen"],
    },
  }),
  grout: science({
    material: {
      family: "composite",
      identity: "Cementitious, epoxy, or urethane joint material between tile or stone.",
      behavior: "Cement grout absorbs and holds soil; epoxy and urethane are denser but can still film or discolor.",
    },
    finish: {
      families: ["matte", "sealed", "unsealed"],
      identity: "Matte joint surface that may be sealed or unsealed.",
      behavior: "Texture and pores trap suspended soil, so cleaning must lift and recover contamination instead of spreading it.",
    },
    porosity: {
      level: "high",
      behavior: "Cement grout absorbs moisture and soil quickly when unsealed or worn.",
      absorptionRisk: "High absorption risk for dirty water, oils, mildew residues, and colored soils.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Deep soil migration", "Mildew-supporting dampness", "Efflorescence or mineral movement"],
      controlStrategy: "Use controlled dwell, brush safely, extract or wipe soil, then dry thoroughly.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Joint erosion", "Sand release", "Scrub-line widening"],
      controlStrategy: "Use grout-safe brushes and avoid aggressive pads that undercut edges.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Uncontrolled acids", "High-pH residue", "Bleach overuse on colored grout"],
      controlStrategy: "Match chemistry to organic, mineral, or oily soil and neutralize or rinse appropriately.",
    },
    coatingSealer: {
      state: "possible",
      risks: ["Sealer stripping", "Sealing over soil", "Patchy absorption"],
      controlStrategy: "Clean and dry before evaluating whether resealing is appropriate.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface soil", "Soap scum", "Light mildew staining"],
      limits: ["Missing grout", "Permanent pigment loss", "Deep contamination below joint surface"],
      escalationSignals: ["Cracked or loose joints", "Persistent odor", "Water moving behind tile"],
    },
    prevention: {
      strategies: ["Dry wet areas", "Ventilate", "Reseal cement grout when absorption returns"],
      inspectionCues: ["Fast darkening when wet", "Soft or sandy joints", "Recurring mildew lines"],
    },
  }),
  "stainless-steel": science({
    material: {
      family: "metal",
      identity: "Stainless alloy with a passive oxide layer and directional grain or brushed finish.",
      behavior: "The surface resists corrosion when the passive layer is intact, but oils, minerals, chlorides, and abrasion disrupt appearance.",
    },
    finish: {
      families: ["matte", "gloss", "coated"],
      identity: "Brushed, polished, fingerprint-resistant coated, or appliance-grade stainless.",
      behavior: "Grain direction controls visible wiping marks; coatings reduce fingerprints but narrow chemistry choices.",
    },
    porosity: {
      level: "non-porous",
      behavior: "Soils sit on the metal or coating, often following grain and touch patterns.",
      absorptionRisk: "Low absorption risk, moderate corrosion or staining risk under residues.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Water spotting", "Chloride pitting", "Residue around seams and controls"],
      controlStrategy: "Clean with the grain, rinse or wipe residue, and dry finish.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Cross-grain scratches", "Bright spots on brushed finish", "Coating removal"],
      controlStrategy: "Use soft cloths with grain direction and avoid abrasive pads unless restoring unfinished commercial metal.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Chlorides", "Strong acids", "High-alkaline residue"],
      controlStrategy: "Use compatible degreasing or neutral maintenance and remove residues promptly.",
    },
    coatingSealer: {
      state: "possible",
      risks: ["Fingerprint-resistant coating damage", "Patchy polish film", "Uneven sheen"],
      controlStrategy: "Identify coated appliance finishes before polishing or solvent cleaning.",
    },
    restorationBoundary: {
      restorableConditions: ["Fingerprints", "Grease film", "Water spots"],
      limits: ["Deep scratches", "Pitting", "Failed coating"],
      escalationSignals: ["Rust-colored spots that return", "Scratches across grain", "Control-panel markings lifting"],
    },
    prevention: {
      strategies: ["Wipe with grain", "Dry after wet cleaning", "Keep chloride residue off metal"],
      inspectionCues: ["Grain-direction streaks", "Brown pinpoints", "Patchy polish buildup"],
    },
  }),
  "quartz-countertops": science({
    material: {
      family: "composite",
      identity: "Engineered stone aggregate bound with resin.",
      behavior: "Quartz resists many daily soils, but the resin binder controls heat, solvent, and abrasion limits.",
    },
    finish: {
      families: ["polished", "matte", "honed"],
      identity: "Factory-finished polished, matte, or honed resin-bound surface.",
      behavior: "Polished quartz shows film and scratches; matte quartz can hold oils and burnish under friction.",
    },
    porosity: {
      level: "low",
      behavior: "The surface is dense and does not need stone sealer, but oils and dyes can linger on textured finishes.",
      absorptionRisk: "Low absorption risk, moderate discoloration risk from heat, dye, or solvent contact.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Seam swelling or staining at joints", "Residue around sink cutouts", "Water spotting from minerals"],
      controlStrategy: "Use controlled moisture, clean seams carefully, and dry mineral-prone areas.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Micro-scratches", "Matte burnishing", "Resin haze from aggressive pads"],
      controlStrategy: "Lift residue with dwell-and-wipe methods rather than scouring the resin finish.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Strong solvents", "High heat", "Highly alkaline or acidic prolonged dwell"],
      controlStrategy: "Use neutral cleaning or mild compatible degreasing with short dwell and full residue removal.",
    },
    coatingSealer: {
      state: "not-applicable",
      risks: ["Sealer haze", "False stone-care assumptions", "Topical film buildup"],
      controlStrategy: "Do not seal quartz; manage the factory finish and resin compatibility instead.",
    },
    restorationBoundary: {
      restorableConditions: ["Cleaner film", "Light grease", "Dried food residue"],
      limits: ["Heat discoloration", "Deep scratches", "Resin damage or dye migration"],
      escalationSignals: ["Yellowing near heat", "Permanent dull spots", "Cracks at seams or cutouts"],
    },
    prevention: {
      strategies: ["Use trivets", "Avoid harsh pads", "Remove dye and oil spills quickly"],
      inspectionCues: ["Matte shiny patches", "Heat halos", "Film that returns after wiping"],
    },
  }),
  "granite-countertops": science({
    material: {
      family: "stone",
      identity: "Natural igneous stone typically used with a polished or honed finish and penetrating sealer.",
      behavior: "Granite is generally durable, but mineral composition, finish, fissures, and sealer condition determine cleaning risk.",
    },
    finish: {
      families: ["polished", "honed", "sealed"],
      identity: "Polished or honed natural stone with possible impregnating sealer.",
      behavior: "The stone may tolerate routine cleaning, while worn sealer allows darkening, oil uptake, or uneven appearance.",
    },
    porosity: {
      level: "low",
      behavior: "Many granite installations absorb slowly, but fissures, unsealed edges, and worn areas can take in moisture or oils.",
      absorptionRisk: "Low to moderate absorption risk depending on stone variety and sealer condition.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Darkening near seams", "Mineral spotting", "Sealer wear around sinks"],
      controlStrategy: "Use stone-safe cleaning, short dwell, and dry finishing around water-prone zones.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Polish dulling", "Sealer abrasion", "Grit scratches on dark polished stone"],
      controlStrategy: "Remove grit first and avoid abrasive powders or pads on polished stone.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Acids on calcite-containing stones", "Strong alkaline degreasers", "Solvents that affect sealers"],
      controlStrategy: "Treat unknown granite as stone-sensitive and use pH-neutral stone maintenance unless testing supports escalation.",
    },
    coatingSealer: {
      state: "sealed",
      risks: ["Sealer stripping", "Sealing over residue", "False confidence against acids or oils"],
      controlStrategy: "Evaluate absorption after cleaning and drying, then reseal only when the stone is ready.",
    },
    restorationBoundary: {
      restorableConditions: ["Residue film", "Light water spots", "Surface grease"],
      limits: ["Deep oil staining", "Cracks or fissure movement", "Polish damage requiring stone work"],
      escalationSignals: ["Dark spots that persist after drying", "Etch-like dullness", "Loose seams or cracks"],
    },
    prevention: {
      strategies: ["Use stone-safe daily cleaning", "Dry sink areas", "Maintain sealer based on absorption"],
      inspectionCues: ["Water darkening", "Dull high-use zones", "Oil shadows near cooking areas"],
    },
  }),
  marble: science({
    material: {
      family: "stone",
      identity: "Calcium-carbonate natural stone.",
      behavior: "Marble reacts with acids, absorbs through pores and fissures, and shows finish damage as etching or dullness.",
    },
    finish: {
      families: ["polished", "honed", "sealed"],
      identity: "Polished or honed stone, usually protected with penetrating sealer.",
      behavior: "Polished marble reveals etching sharply; honed marble hides glare but still reacts chemically.",
    },
    porosity: {
      level: "moderate",
      behavior: "Marble can absorb oils, dyes, and moisture even when sealed, especially through worn or honed finishes.",
      absorptionRisk: "Moderate absorption risk with high acid-etching risk.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Darkening", "Mineral movement", "Sealer wear at wet zones"],
      controlStrategy: "Use minimal dwell, stone-safe moisture control, and prompt drying.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Polish scratching", "Honed finish burnishing", "Powder abrasion"],
      controlStrategy: "Use soft tools and treat finish correction as stone restoration, not routine cleaning.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Acids", "Vinegar or citrus residues", "Strong alkalis and solvent-heavy products"],
      controlStrategy: "Use pH-neutral stone-safe chemistry and avoid descaling acids even for nearby mineral deposits.",
    },
    coatingSealer: {
      state: "sealed",
      risks: ["Believing sealer prevents etching", "Sealing in stains", "Uneven absorption after wear"],
      controlStrategy: "Use sealer as stain resistance only; it does not make marble acid-proof.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface residue", "Light soil", "Some fresh stains after diagnosis"],
      limits: ["Acid etching", "Deep stains", "Lost polish"],
      escalationSignals: ["Dull rings from acids", "Dark absorbed spots", "Widespread polish loss"],
    },
    prevention: {
      strategies: ["Keep acids off marble", "Blot spills quickly", "Use stone-safe maintenance only"],
      inspectionCues: ["Dull splash marks", "Water darkening", "Honed areas turning glossy from wear"],
    },
  }),
  "natural-stone": science({
    material: {
      family: "stone",
      identity: "Broad natural stone category including carbonate, silicate, slate, travertine, limestone, marble, and granite.",
      behavior: "Stone behavior changes by mineral chemistry, pore structure, fissures, finish, and sealer condition.",
    },
    finish: {
      families: ["polished", "honed", "matte", "sealed", "unsealed"],
      identity: "Polished, honed, textured, sealed, or unsealed natural stone.",
      behavior: "Finish changes apparent porosity, scratch visibility, etching visibility, and residue retention.",
    },
    porosity: {
      level: "moderate",
      behavior: "Absorption ranges from low to high; unknown stone must be treated as absorbent and chemistry-sensitive.",
      absorptionRisk: "Variable absorption risk requiring identification before stain, acid, or sealer decisions.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Darkening", "Efflorescence", "Sealer failure", "Moisture movement through fissures"],
      controlStrategy: "Use minimal dwell, controlled rinse or wipe recovery, and complete drying before judging results.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Polish loss", "Texture erosion", "Scratches in softer stones"],
      controlStrategy: "Scale agitation to stone hardness and finish, not just visible soil severity.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Acids on carbonate stones", "Strong alkalis on sealers", "Solvents on unknown coatings"],
      controlStrategy: "Identify stone type before descaling, degreasing, stain treatment, or sealer work.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Sealer mismatch", "Trapped moisture", "Topical coating haze"],
      controlStrategy: "Confirm whether the stone has penetrating sealer, topical coating, or no protection before treatment.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface residue", "Light mineral film on compatible stone", "Fresh stains after diagnosis"],
      limits: ["Etching", "Deep staining", "Spalling", "Failed coating or structural cracks"],
      escalationSignals: ["Unknown stone identity", "Acid reaction", "Persistent darkening or powdering"],
    },
    prevention: {
      strategies: ["Identify stone before cleaning", "Maintain suitable sealer", "Dry moisture-prone areas"],
      inspectionCues: ["Water absorption speed", "Etch marks", "Flaking or powdering edges"],
    },
  }),
  laminate: science({
    material: {
      family: "composite",
      identity: "Decorative wear layer bonded to a moisture-sensitive core or backing.",
      behavior: "The surface film resists many soils, while seams and edges can swell when moisture gets below the layer.",
    },
    finish: {
      families: ["matte", "gloss", "coated"],
      identity: "Factory wear layer in matte, gloss, textured, or printed finish.",
      behavior: "The wear layer can scratch, dull, or delaminate even when the top appears water-resistant.",
    },
    porosity: {
      level: "low",
      behavior: "The face is low-porosity, but seams and damaged edges can absorb rapidly.",
      absorptionRisk: "Low face absorption risk, high seam and edge swelling risk.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Seam swelling", "Edge lifting", "Core darkening"],
      controlStrategy: "Use short dwell, controlled moisture, and immediate drying at seams.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Wear-layer scratching", "Gloss dulling", "Texture burnishing"],
      controlStrategy: "Remove grit before wiping and avoid abrasive pads or powders.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Strong solvents", "Harsh alkalis", "Residue-building polishes"],
      controlStrategy: "Use neutral cleaning or mild compatible degreasing and remove residue fully.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Wear-layer damage", "Topical buildup", "Delamination at edges"],
      controlStrategy: "Protect the factory coating rather than adding sealer.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface grease", "Sticky residue", "Light scuffs"],
      limits: ["Swollen seams", "Burn marks", "Worn-through print layer"],
      escalationSignals: ["Raised edges", "Soft core", "Color layer exposure"],
    },
    prevention: {
      strategies: ["Dry seams", "Use pads under abrasive objects", "Avoid standing water"],
      inspectionCues: ["Edge lift", "Raised seams", "Dull traffic rubs"],
    },
  }),
  "finished-wood": science({
    material: {
      family: "wood",
      identity: "Wood substrate protected by a film finish, oil finish, stain, or factory coating.",
      behavior: "Routine cleaning mostly touches the finish; moisture or abrasion becomes wood damage when protection is compromised.",
    },
    finish: {
      families: ["sealed", "coated", "matte", "gloss"],
      identity: "Polyurethane, lacquer, varnish, oil, wax, or factory finish.",
      behavior: "Finish type determines water tolerance, solvent tolerance, sheen change, and whether polishing creates buildup.",
    },
    porosity: {
      level: "moderate",
      behavior: "Intact film finish is low-porosity, but worn edges, scratches, and end grain absorb quickly.",
      absorptionRisk: "Moderate risk when finish is thin, cracked, oil-finished, or worn.",
    },
    moistureTolerance: {
      level: "low",
      risks: ["Swelling", "White haze", "Finish lifting"],
      controlStrategy: "Use low-moisture cleaning, dry dust first, and dry the finish immediately.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Sheen loss", "Finish scratches", "Burnishing"],
      controlStrategy: "Use soft cloths and avoid scrubbing unless refinishing is part of the scope.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Ammonia", "Strong degreasers", "Solvents", "Wax or oil incompatibility"],
      controlStrategy: "Match chemistry to known finish and avoid buildup products on unknown coatings.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Finish softening", "Wax buildup", "Uneven sheen"],
      controlStrategy: "Protect the existing finish and separate cleaning from refinishing.",
    },
    restorationBoundary: {
      restorableConditions: ["Dust", "Fingerprints", "Light product buildup"],
      limits: ["Worn-through finish", "Water rings in finish", "Raised grain or veneer damage"],
      escalationSignals: ["Tacky finish", "White moisture haze", "Raw wood exposure"],
    },
    prevention: {
      strategies: ["Dry dust frequently", "Use minimal liquid", "Remove oily fingerprints before buildup forms"],
      inspectionCues: ["Sheen changes", "Edge darkening", "Raised grain"],
    },
  }),
  hardwood: science({
    material: {
      family: "wood",
      identity: "Solid or engineered wood flooring protected by site-applied or factory finish.",
      behavior: "The finish carries daily wear; seams, scratches, and worn lanes expose wood to moisture and grit.",
    },
    finish: {
      families: ["sealed", "coated", "matte", "gloss"],
      identity: "Floor finish such as polyurethane, aluminum oxide, oil, wax, or site-applied coating.",
      behavior: "Finish chemistry determines whether water-based cleaner, polish, or restoration is compatible.",
    },
    porosity: {
      level: "moderate",
      behavior: "Intact floor finish resists absorption, but seams and scratches can admit moisture.",
      absorptionRisk: "Moderate risk at seams, worn finish, bevels, and damaged boards.",
    },
    moistureTolerance: {
      level: "low",
      risks: ["Cupping", "Swelling", "Finish haze", "Board darkening"],
      controlStrategy: "Dry soil first, use lightly damp pads, and never leave solution standing.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Grit scratches", "Traffic-lane dullness", "Pad burnishing"],
      controlStrategy: "Control grit at entries and use floor-safe microfiber rather than abrasive correction.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Steam", "High-pH cleaners", "Ammonia", "Incompatible polish"],
      controlStrategy: "Use finish-approved floor cleaner and avoid mixing polish systems.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Polish incompatibility", "Recoating adhesion failure", "Finish softening"],
      controlStrategy: "Identify finish system before polish, screen-and-recoat, or stronger cleaning.",
    },
    restorationBoundary: {
      restorableConditions: ["Light soil", "Dust film", "Some surface scuffs"],
      limits: ["Worn-through finish", "Deep scratches", "Moisture-damaged boards"],
      escalationSignals: ["Black seams", "Cupping", "Bare wood in traffic lanes"],
    },
    prevention: {
      strategies: ["Use walk-off mats", "Keep grit off floors", "Wipe spills quickly"],
      inspectionCues: ["Dull lanes", "Open seams", "Dark board edges"],
    },
  }),
  "vinyl-flooring": science({
    material: {
      family: "polymer",
      identity: "Resilient vinyl wear layer over backing, plank, tile, or sheet construction.",
      behavior: "The polymer face resists water, while seams, finish film, and plasticizer interactions create failures.",
    },
    finish: {
      families: ["matte", "gloss", "coated"],
      identity: "Factory urethane wear layer, matte texture, gloss finish, or maintained coating.",
      behavior: "Wear layers can scratch, haze, yellow, or hold residue depending on traffic and chemistry.",
    },
    porosity: {
      level: "low",
      behavior: "The face is low-porosity, but seams and damaged edges can admit moisture.",
      absorptionRisk: "Low face absorption risk, moderate seam and adhesive risk.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Seam intrusion", "Adhesive issues", "Dirty solution drying as film"],
      controlStrategy: "Use controlled solution, clean recovery, and dry areas that stay tacky.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Wear-layer scratches", "Gloss dulling", "Embedded grit wear"],
      controlStrategy: "Remove grit before wet cleaning and avoid harsh pads outside approved maintenance programs.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Solvents", "High-pH residue", "Rubber dye transfer"],
      controlStrategy: "Use neutral floor cleaning and avoid incompatible polish or solvent spot treatment.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Finish buildup", "Stripping mismatch", "Patchy sheen"],
      controlStrategy: "Determine whether the floor is factory-finished or maintained with topical finish.",
    },
    restorationBoundary: {
      restorableConditions: ["Mop residue", "Light scuffs", "Surface grime"],
      limits: ["Wear-through", "Yellowing", "Seam damage"],
      escalationSignals: ["Curling edges", "Persistent tackiness", "Pattern layer exposure"],
    },
    prevention: {
      strategies: ["Control grit", "Use correct dilution", "Rinse or change pads before residue builds"],
      inspectionCues: ["Footprint film", "Scuff concentration", "Raised seams"],
    },
  }),
  "commercial-flooring": science({
    material: {
      family: "composite",
      identity: "Commercial resilient, coated, concrete, tile, or specialty flooring maintained as a system.",
      behavior: "Performance depends on substrate, finish program, traffic load, soil type, and maintenance interval.",
    },
    finish: {
      families: ["matte", "gloss", "coated", "sealed"],
      identity: "Factory wear layer, topical floor finish, sealer, polish, or unfinished service surface.",
      behavior: "The maintained finish often fails before the underlying floor does.",
    },
    porosity: {
      level: "moderate",
      behavior: "Porosity varies by flooring type and coating status.",
      absorptionRisk: "Moderate variable risk until material and coating system are identified.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Slip film", "Seam intrusion", "Coating whitening", "Substrate moisture issues"],
      controlStrategy: "Use measured solution, recovery, and drying matched to traffic reopening needs.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Traffic-lane wear", "Pad damage", "Finish removal"],
      controlStrategy: "Use machine pads only within the known floor-maintenance program.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Wrong stripper", "High-residue neutralizer", "Unapproved degreasers"],
      controlStrategy: "Match chemistry to the floor system and the coating life-cycle stage.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Finish incompatibility", "Recoating failure", "Uneven gloss"],
      controlStrategy: "Identify finish history before deep cleaning, stripping, recoating, or burnishing.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface soil", "Finish haze", "Light scuffing"],
      limits: ["Worn-through flooring", "Adhesive failure", "Moisture-damaged substrate"],
      escalationSignals: ["Persistent slip film", "Bare traffic lanes", "Lifting seams"],
    },
    prevention: {
      strategies: ["Entry matting", "Correct dilution", "Scheduled finish maintenance"],
      inspectionCues: ["Traffic-lane gloss loss", "Sticky film", "Edge lifting"],
    },
  }),
  "painted-walls": science({
    material: {
      family: "painted",
      identity: "Paint film over drywall, plaster, or another wall substrate.",
      behavior: "Cleanability depends on paint sheen, cure, color, film thickness, and underlying wall condition.",
    },
    finish: {
      families: ["matte", "gloss", "coated"],
      identity: "Flat, eggshell, satin, semi-gloss, gloss, or specialty washable paint.",
      behavior: "Lower sheen paints mark and burnish easily; higher sheen paints show residue and wiping halos.",
    },
    porosity: {
      level: "moderate",
      behavior: "Paint film may absorb or soften when uncured, low-sheen, or worn.",
      absorptionRisk: "Moderate risk for pigment lift, flashing, and moisture intrusion through damaged paint.",
    },
    moistureTolerance: {
      level: "low",
      risks: ["Paint softening", "Streaking", "Drywall swelling"],
      controlStrategy: "Use lightly damp spot cleaning, feather edges, and dry quickly.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Burnishing", "Pigment lift", "Sheen change"],
      controlStrategy: "Use low pressure and stop when soil behaves like paint damage.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Strong degreasers", "Solvents", "Abrasive erasers on flat paint"],
      controlStrategy: "Use mild neutral cleaner only after dry dusting and test low-visibility areas.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Paint film dulling", "Flashing", "Softening uncured paint"],
      controlStrategy: "Treat paint as the functional coating and protect sheen consistency.",
    },
    restorationBoundary: {
      restorableConditions: ["Dust", "Light fingerprints", "Some fresh scuffs"],
      limits: ["Paint loss", "Permanent flashing", "Water-stained drywall"],
      escalationSignals: ["Color transfer to cloth", "Sheen halo", "Bubbling paint"],
    },
    prevention: {
      strategies: ["Dust before wet cleaning", "Clean touchpoints early", "Avoid soaking walls"],
      inspectionCues: ["Cloth color transfer", "Burnished spots", "Water marks"],
    },
  }),
  "painted-surfaces": science({
    material: {
      family: "painted",
      identity: "Painted trim, doors, cabinetry, rails, or panels over varied substrates.",
      behavior: "The paint film is the cleanable surface; substrate, cure age, and edge wear define failure risk.",
    },
    finish: {
      families: ["matte", "gloss", "coated"],
      identity: "Painted finish in matte, satin, semi-gloss, gloss, enamel, or specialty coating.",
      behavior: "Higher contact painted surfaces accumulate oils and can dull, soften, or chip when over-cleaned.",
    },
    porosity: {
      level: "moderate",
      behavior: "Intact paint resists light soil, but chips, worn edges, and uncured paint absorb or lift.",
      absorptionRisk: "Moderate risk at edges, chips, and low-sheen or uncured coatings.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Edge swelling", "Paint softening", "Substrate intrusion"],
      controlStrategy: "Use controlled spot cleaning and dry seams, edges, and hardware areas.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Sheen burnishing", "Paint removal", "Edge chipping"],
      controlStrategy: "Reduce pressure before increasing chemistry or dwell.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Strong degreasers", "Solvents", "Ammonia on some coatings"],
      controlStrategy: "Use mild chemistry and verify washability before treating greasy zones.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Paint film damage", "Uneven sheen", "Adhesion failure on older paint"],
      controlStrategy: "Treat paint as a coating system rather than a raw material.",
    },
    restorationBoundary: {
      restorableConditions: ["Fingerprints", "Light grime", "Fresh scuffs"],
      limits: ["Chipped paint", "Grease embedded into failed coating", "Substrate swelling"],
      escalationSignals: ["Paint transfer", "Tacky finish", "Edges lifting"],
    },
    prevention: {
      strategies: ["Clean handles and rails before oils cure", "Dry edges", "Avoid abrasive erasers as routine"],
      inspectionCues: ["Dull hand-contact areas", "Chips", "Soft or tacky paint"],
    },
  }),
  baseboards: science({
    material: {
      family: "painted",
      identity: "Painted or finished trim near floor soil and mop splash.",
      behavior: "Baseboards combine wall-like paint sensitivity with floor-adjacent abrasion and moisture exposure.",
    },
    finish: {
      families: ["matte", "gloss", "coated"],
      identity: "Painted, stained, sealed, or laminate trim finish.",
      behavior: "Profiles collect dust and edges chip or swell when moisture is left at the floor line.",
    },
    porosity: {
      level: "moderate",
      behavior: "Finished faces resist light soil, while seams, caulk gaps, MDF edges, and chips absorb quickly.",
      absorptionRisk: "Moderate edge and seam absorption risk.",
    },
    moistureTolerance: {
      level: "low",
      risks: ["MDF swelling", "Paint peeling", "Caulk staining"],
      controlStrategy: "Dry dust first and use low-moisture wiping at the floor edge.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Paint burnishing", "Profile edge wear", "Scuff removal becoming paint removal"],
      controlStrategy: "Treat scuffs locally with low pressure and stop when paint transfers.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Strong degreasers", "Solvents", "Floor cleaner residue"],
      controlStrategy: "Use mild neutral cleaning and separate trim cleaning from floor chemistry.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Paint damage", "Edge swelling", "Uneven sheen"],
      controlStrategy: "Protect the paint or finish layer and avoid soaking trim.",
    },
    restorationBoundary: {
      restorableConditions: ["Dust ledges", "Mop splash residue", "Light scuffs"],
      limits: ["Chipped paint", "Swollen MDF", "Failed caulk"],
      escalationSignals: ["Soft edges", "Paint peeling", "Gaps at floor line"],
    },
    prevention: {
      strategies: ["Vacuum dust ledges", "Control mop splash", "Dry floor-line edges"],
      inspectionCues: ["Edge swelling", "Scuff clusters", "Caulk gaps"],
    },
  }),
  cabinets: science({
    material: {
      family: "composite",
      identity: "Painted, stained, laminate, thermofoil, or wood cabinet assemblies.",
      behavior: "Faces, edges, pulls, seams, and hinges each have different oil, moisture, and abrasion tolerance.",
    },
    finish: {
      families: ["matte", "gloss", "coated", "sealed"],
      identity: "Paint, clear coat, stain, laminate, thermofoil, or factory finish.",
      behavior: "Grease and fingerprints attack the finish first; edges and profiles fail when over-wetted or over-scrubbed.",
    },
    porosity: {
      level: "moderate",
      behavior: "Finished faces are lower porosity, while wood edges, seams, and damaged coatings absorb.",
      absorptionRisk: "Moderate risk at seams, profiles, damaged paint, and unfinished interiors.",
    },
    moistureTolerance: {
      level: "low",
      risks: ["Edge swelling", "Thermofoil lifting", "Finish whitening"],
      controlStrategy: "Use controlled degreasing, wipe clean, and dry seams and hardware immediately.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Sheen change", "Paint rub-through", "Profile edge wear"],
      controlStrategy: "Let compatible chemistry dwell briefly instead of increasing scrubbing pressure.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Strong degreasers", "Solvents", "Ammonia on some finishes"],
      controlStrategy: "Match degreasing strength to finish washability and test high-risk painted or matte fronts.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Finish softening", "Clear-coat haze", "Thermofoil delamination"],
      controlStrategy: "Preserve the cabinet finish and avoid letting cleaner sit in joints or pulls.",
    },
    restorationBoundary: {
      restorableConditions: ["Fresh grease film", "Fingerprints", "Dust"],
      limits: ["Delamination", "Rub-through", "Swollen substrate"],
      escalationSignals: ["Tacky finish", "Lifted edges", "Color transfer"],
    },
    prevention: {
      strategies: ["Clean cooking oils before they oxidize", "Dry around pulls", "Avoid abrasive sponges"],
      inspectionCues: ["Sticky upper cabinets", "Matte shiny hand zones", "Edges lifting"],
    },
  }),
  countertops: science({
    material: {
      family: "composite",
      identity: "Mixed countertop category including stone, engineered stone, laminate, solid surface, wood, and sealed materials.",
      behavior: "Cleaning risk changes radically by material, sealer, heat history, and food-contact contamination.",
    },
    finish: {
      families: ["polished", "honed", "matte", "sealed", "coated"],
      identity: "Material-dependent finish from polished stone to resin, laminate, or sealant.",
      behavior: "The finish determines stain resistance, heat limits, scratch visibility, and compatible chemistry.",
    },
    porosity: {
      level: "moderate",
      behavior: "Porosity varies from non-porous resin surfaces to absorbent stone or wood.",
      absorptionRisk: "Moderate variable absorption risk until material is identified.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Seam swelling", "Sink-edge darkening", "Sealer wear"],
      controlStrategy: "Identify material first, then use controlled moisture and dry high-risk seams.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Polish scratching", "Matte burnishing", "Laminate wear-layer damage"],
      controlStrategy: "Use dwell-and-lift cleaning before abrasive correction.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Acids on stone", "Solvents on resin or laminate", "Strong alkalis on sealers"],
      controlStrategy: "Select chemistry by material and contamination rather than by the word countertop.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Wrong sealer", "Topical haze", "Sealing over food residue"],
      controlStrategy: "Confirm whether protection is factory finish, penetrating sealer, oil, wax, or none.",
    },
    restorationBoundary: {
      restorableConditions: ["Food residue", "Light grease", "Surface film"],
      limits: ["Heat damage", "Etching", "Deep staining", "Swollen seams"],
      escalationSignals: ["Unknown material", "Dark sink edges", "Permanent dull spots"],
    },
    prevention: {
      strategies: ["Use trivets and cutting boards", "Wipe spills promptly", "Maintain material-specific protection"],
      inspectionCues: ["Water darkening", "Heat halos", "Seam movement"],
    },
  }),
  sinks: science({
    material: {
      family: "composite",
      identity: "Sink category spanning stainless, porcelain, enamel, composite, stone, and solid surface basins.",
      behavior: "Constant water, minerals, soap, food residue, and abrasion interact with the basin material and surrounding counter.",
    },
    finish: {
      families: ["gloss", "matte", "coated", "sealed"],
      identity: "Material-dependent basin finish such as porcelain glaze, stainless grain, composite matte, or sealed stone.",
      behavior: "Finish controls whether deposits can be safely dissolved, scrubbed, or only gently lifted.",
    },
    porosity: {
      level: "low",
      behavior: "Most sink faces are low-porosity, but composite, stone, chips, and seams can absorb or stain.",
      absorptionRisk: "Low to moderate risk depending on basin material and damage.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Mineral buildup", "Rust transfer", "Seam or caulk failure"],
      controlStrategy: "Remove deposits without attacking finish and dry rims, fixtures, and counter edges.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Glaze scratching", "Stainless grain damage", "Composite whitening"],
      controlStrategy: "Use non-scratch tools unless the material specifically tolerates stronger agitation.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Acids on stone or enamel damage", "Chlorides on stainless", "Bleach on some composites"],
      controlStrategy: "Match descaling and sanitizing chemistry to basin material and surrounding surfaces.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Glaze damage", "Stone sealer wear", "Composite discoloration"],
      controlStrategy: "Treat sink finish and counter interface as separate materials.",
    },
    restorationBoundary: {
      restorableConditions: ["Soap film", "Food residue", "Light mineral rings"],
      limits: ["Chipped enamel", "Pitting", "Deep composite stains"],
      escalationSignals: ["Rust that returns", "Cracked basin", "Stains below the surface"],
    },
    prevention: {
      strategies: ["Rinse after soil load", "Dry mineral-prone areas", "Avoid abrasive daily scrubbing"],
      inspectionCues: ["Ring stains", "Dull basin floor", "Rust or chip points"],
    },
  }),
  fixtures: science({
    material: {
      family: "metal",
      identity: "Plated, coated, lacquered, or stainless fixture finish over metal or plastic components.",
      behavior: "The visible finish is often thinner and more sensitive than the metal underneath.",
    },
    finish: {
      families: ["polished", "matte", "gloss", "coated"],
      identity: "Chrome, brushed nickel, brass, matte black, stainless, or specialty plated/coated finish.",
      behavior: "Minerals bond to wet zones while acids, abrasion, and harsh dwell can strip or discolor coatings.",
    },
    porosity: {
      level: "non-porous",
      behavior: "Soil remains on the finish, but damaged plating exposes reactive layers.",
      absorptionRisk: "Low absorption risk, high finish-loss risk when coating is breached.",
    },
    moistureTolerance: {
      level: "high",
      risks: ["Water spots", "Mineral crust", "Corrosion at seams"],
      controlStrategy: "Use short contact times, wipe deposits carefully, and dry finish after cleaning.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Plating scratches", "Matte finish polishing", "Coating removal"],
      controlStrategy: "Use soft microfiber and avoid abrasive descaling unless manufacturer-approved.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Strong acids", "Bleach", "Ammonia on some finishes"],
      controlStrategy: "Use finish-safe chemistry and keep descalers off vulnerable plating and nearby stone.",
    },
    coatingSealer: {
      state: "coated",
      risks: ["Plating loss", "Matte coating sheen change", "Lacquer failure"],
      controlStrategy: "Assume the visible finish is a coating with limited restoration tolerance.",
    },
    restorationBoundary: {
      restorableConditions: ["Fingerprints", "Fresh water spots", "Light soap film"],
      limits: ["Pitted plating", "Worn color finish", "Corroded seams"],
      escalationSignals: ["Flaking chrome", "Finish color change", "Rough mineral crust over damaged finish"],
    },
    prevention: {
      strategies: ["Dry after wet use", "Remove minerals early", "Avoid abrasive pads"],
      inspectionCues: ["White crust at bases", "Color loss", "Matte finish shiny rub marks"],
    },
  }),
  appliances: science({
    material: {
      family: "composite",
      identity: "Appliance assemblies combining metal, glass, enamel, plastic, rubber, labels, and electronics.",
      behavior: "Each zone behaves differently, so one cleaner can be safe on the door and risky on controls, gaskets, or trim.",
    },
    finish: {
      families: ["gloss", "matte", "coated"],
      identity: "Stainless, enamel, glass, painted, plastic, or coated appliance finish.",
      behavior: "Grease, fingerprints, heat, and labels make finish compatibility more important than appliance category.",
    },
    porosity: {
      level: "low",
      behavior: "Most faces are low-porosity, while gaskets, labels, vents, and damaged coatings retain soil.",
      absorptionRisk: "Low face absorption risk, moderate gasket and seam retention risk.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Control intrusion", "Label lifting", "Seam residue"],
      controlStrategy: "Clean by zone and keep moisture away from controls, vents, seals, and electronics.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Stainless scratches", "Enamel dulling", "Plastic haze"],
      controlStrategy: "Match tools to each material and avoid transferring oven-level abrasion to exterior finishes.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Solvents on plastics", "Strong degreasers on labels", "Chlorides on stainless"],
      controlStrategy: "Use targeted chemistry for grease while protecting labels, controls, gaskets, and coated faces.",
    },
    coatingSealer: {
      state: "finish-dependent",
      risks: ["Fingerprint coating damage", "Label removal", "Plastic whitening"],
      controlStrategy: "Identify appliance surface zones before polishing, degreasing, or descaling.",
    },
    restorationBoundary: {
      restorableConditions: ["Fingerprints", "Grease film", "Food residue"],
      limits: ["Damaged control markings", "Melted plastic", "Scratched stainless or glass"],
      escalationSignals: ["Loose labels", "Hazy plastics", "Corrosion around seams"],
    },
    prevention: {
      strategies: ["Wipe grease before it cures", "Dry handles and controls", "Use zone-specific tools"],
      inspectionCues: ["Sticky control edges", "Grain scratches", "Gasket soil retention"],
    },
  }),
  "sealed-surfaces": science({
    material: {
      family: "composite",
      identity: "Any substrate whose performance depends on a sealer or protective treatment.",
      behavior: "The sealer mediates moisture, stain, and chemical exposure but can wear, strip, or fail unevenly.",
    },
    finish: {
      families: ["sealed", "coated", "matte", "gloss"],
      identity: "Penetrating sealer, topical coating, finish coat, or factory-applied protection.",
      behavior: "Protection changes cleanability until it becomes worn, contaminated, or incompatible with chemistry.",
    },
    porosity: {
      level: "moderate",
      behavior: "The protected surface may behave low-porosity until sealer failure reopens absorption paths.",
      absorptionRisk: "Moderate risk because substrate porosity can reappear when sealer is weak.",
    },
    moistureTolerance: {
      level: "moderate",
      risks: ["Trapped moisture", "Whitening", "Patchy absorption"],
      controlStrategy: "Clean and dry before judging whether the sealer is intact or ready for maintenance.",
    },
    abrasionTolerance: {
      level: "moderate",
      risks: ["Sealer wear", "Topical coating scratches", "Uneven gloss"],
      controlStrategy: "Avoid aggressive pads unless coating removal or restoration is intentional.",
    },
    chemicalSensitivity: {
      level: "moderate",
      sensitiveTo: ["Solvents", "Strong alkalis", "Acids on protected stone or grout"],
      controlStrategy: "Choose chemistry that protects both sealer and substrate.",
    },
    coatingSealer: {
      state: "sealed",
      risks: ["Stripping", "Sealing over soil", "Wrong recoat product"],
      controlStrategy: "Identify sealer type before cleaning escalation, stripping, or reapplication.",
    },
    restorationBoundary: {
      restorableConditions: ["Surface residue", "Light film", "Some uneven wetting after cleaning"],
      limits: ["Failed topical coating", "Deep substrate staining", "Trapped moisture"],
      escalationSignals: ["Patchy water darkening", "Peeling coating", "Milky sealer haze"],
    },
    prevention: {
      strategies: ["Use compatible cleaners", "Monitor absorption", "Maintain sealer only after clean dry prep"],
      inspectionCues: ["Water no longer beads", "Patchy sheen", "Soil darkening into pores"],
    },
  }),
  "unsealed-surfaces": science({
    material: {
      family: "composite",
      identity: "Absorbent or unfinished substrate without reliable protective sealer.",
      behavior: "Liquid, soil, oils, and chemistry can move into pores rather than staying available for wiping.",
    },
    finish: {
      families: ["unsealed", "unfinished", "matte"],
      identity: "Open, unfinished, or unsealed surface.",
      behavior: "Cleaning can drive contamination deeper or create tide marks if moisture is uncontrolled.",
    },
    porosity: {
      level: "high",
      behavior: "Open pores absorb quickly and release slowly.",
      absorptionRisk: "High absorption risk for dirty water, oils, dyes, odor, and residues.",
    },
    moistureTolerance: {
      level: "low",
      risks: ["Tide lines", "Deep staining", "Odor retention", "Slow drying"],
      controlStrategy: "Use minimal liquid, rapid recovery, and full drying before repeat treatment.",
    },
    abrasionTolerance: {
      level: "low",
      risks: ["Texture damage", "Fiber or mineral loss", "Uneven appearance"],
      controlStrategy: "Avoid aggressive scrubbing that changes the surface profile.",
    },
    chemicalSensitivity: {
      level: "low",
      sensitiveTo: ["Strong acids", "Strong alkalis", "Oxidizers or solvents without material ID"],
      controlStrategy: "Identify material and soil before choosing stain treatment or sealing.",
    },
    coatingSealer: {
      state: "not-applicable",
      risks: ["Sealing over moisture", "Trapping contamination", "Wrong sealer darkening"],
      controlStrategy: "Do not seal until the surface is clean, dry, compatible, and ready.",
    },
    restorationBoundary: {
      restorableConditions: ["Fresh spills", "Surface dust", "Light removable soil"],
      limits: ["Deep absorbed stains", "Odor in pores", "Material breakdown"],
      escalationSignals: ["Fast darkening", "Persistent odor", "Powdering or softening"],
    },
    prevention: {
      strategies: ["Respond to spills quickly", "Keep moisture low", "Consider compatible protection after cleaning"],
      inspectionCues: ["Immediate wet darkening", "Tide marks", "Soil that reappears after drying"],
    },
  }),
};

export function getSurfaceScienceProfile(surfaceSlug: AuthoritySurfaceSlug): AuthoritySurfaceScienceProfile {
  return AUTHORITY_SURFACE_SCIENCE_PROFILES[surfaceSlug];
}
