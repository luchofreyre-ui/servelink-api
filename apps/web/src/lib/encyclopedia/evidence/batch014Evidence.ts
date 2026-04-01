import type { EvidenceRecord } from "./evidenceTypes";

/**
 * Encyclopedia seed-batch-014 — structural / high-density collapse for hardwood + grout:
 * rust, tannin, bacteria, etching, oxidation, corrosion, tarnish, heat damage, uneven grout finish.
 */
export const BATCH_014_EVIDENCE: EvidenceRecord[] = [
  {
    surface: "hardwood",
    problem: "rust stains",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic iron-rust treatment labeled for finished wood spot use",
        chemistry: "acidic",
        surfaces: ["finished hardwood", "sealed wood"],
        avoids: ["flooding seams", "acid on bare wood", "unknown wax or oil systems without testing"],
        reason:
          "Targeted acid can reduce visible iron oxide on or just above the wear layer when the finish still protects the fiber.",
      },
    ],
    method: {
      tools: ["plastic scraper for crust only if finish allows", "cotton swabs or small cloth patches", "barrier towels"],
      dwell: "Spot-only per label; never sheet the floor",
      agitation: "Pat and lift; no circular scrub across field",
      rinse: "Neutralizing or clear water pass exactly as label requires",
      dry: "Immediate dry buff; verify no raised grain before next step",
    },
    whyItHappens:
      "Fastener bleed, metal furniture feet, and tracked iron-rich water plate iron oxides that read as orange-brown spots on or in finish texture.",
    whyItWorks:
      "Compatible acidic chemistry dissolves iron oxide phases that sit on the coating or in open grain while tight moisture control limits wood swelling.",
    mistakes: ["Wetting the whole board edge to chase one spot.", "Strong acid on wax or oil-modified finishes without a closet test."],
    benchmarks: ["Rust tone should lighten in stages; fiber-black water staining is not the same as surface rust."],
    professionalInsights: ["If rust returns from below the finish, the fix is mechanical or recoat after moisture control."],
    sources: ["wood-floor spot-treatment references", "acidic rust remover labels with wood cautions"],
  },
  {
    surface: "hardwood",
    problem: "tannin stains",
    soilClass: "organic",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Oxalic-acid or wood bleach system labeled for tannin darkening on finished wood",
        chemistry: "acidic",
        surfaces: ["hardwood", "sealed wood"],
        avoids: ["mixing with chlorine", "guessing species sensitivity"],
        reason:
          "Oxalic-class treatments are the common professional path for dark tannin mobilization when finish and species allow.",
      },
    ],
    method: {
      tools: ["gloves", "synthetic applicator", "clean rinse water", "dry pads"],
      dwell: "Per manufacturer tannin protocol; even application on affected field only",
      agitation: "Light if label allows; mostly controlled chemical time",
      rinse: "Thorough rinse per label to remove acid residue",
      dry: "Fast dry-down; inspect at multiple angles",
    },
    whyItHappens:
      "Moisture events pull polyphenols from oak and similar species, or transfer tannins from plant debris and beverages into grain openings.",
    whyItWorks:
      "Labeled oxalic-class steps reduce certain tannin chromophores and can even out dark patches when the issue is chemical not physical crush.",
    mistakes: ["Treating sun-fade or finish wear as tannin.", "Over-applying and bleaching surrounding field."],
    benchmarks: ["Color should shift across repeated controlled cycles; deep gray water stain may need recoat decision."],
    professionalInsights: ["Always distinguish tannin from iron; wrong chemistry wastes cycles and risks the floor."],
    sources: ["NWFA water-damage and tannin notes", "manufacturer wood bleach guidance"],
  },
  {
    surface: "hardwood",
    problem: "bacteria buildup",
    soilClass: "biofilm",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered disinfectant approved for finished wood when label matches the site",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["soaking", "mixing cleaners"],
        reason:
          "Surface bioload is addressed with labeled antimicrobial contact time after soil removal, not aggressive pH on the coating.",
      },
    ],
    method: {
      tools: ["microfiber", "PPE per disinfectant label", "second dry cloth"],
      dwell: "Cleaner first pass; then disinfectant wet time exactly as labeled",
      agitation: "Light with grain after visible soil is removed",
      rinse: "If label requires rinse on wood, follow it",
      dry: "Towel and airflow; fix humidity source",
    },
    whyItHappens:
      "Chronic damp from leaks, pets, or bath-adjacent tracking sustains bacterial films in finish low spots and open grain.",
    whyItWorks:
      "Removing soil then applying a wood-allowed disinfectant at proper wet time reduces measurable bioload without flooding the system.",
    mistakes: ["Bleach cocktails or acid chasing odor.", "Skipping dry-down so moisture feeds return."],
    benchmarks: ["Odor and tack should improve when moisture is controlled; damaged finish may still read microbial."],
    professionalInsights: ["Persistent gram-negative odor after dry often means fluid reached subfloor or pad."],
    sources: ["EPA surface disinfectant label language", "IICRC moisture context summaries"],
  },
  {
    surface: "hardwood",
    problem: "etching",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Manufacturer touch-up or screening/recoat kit when damage is coating-level",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["aggressive polishing compounds on factory UV finishes without guidance"],
        reason:
          "Etching is missing or altered coating; chemistry cannot rebuild film thickness—only controlled refinish or spot repair can.",
      },
    ],
    method: {
      tools: ["bright raking light", "microfiber for residue check only", "referral notes for sand/screen crew"],
      dwell: "N/A for cleaning; assessment dwell only",
      agitation: "None beyond gentle residue removal to confirm damage vs soil",
      rinse: "Barely damp wipe if testing for removable haze",
      dry: "Immediate",
    },
    whyItHappens:
      "Acidic spills, wrong maintenance chemistry, or pet accidents strip or cloud the urethane or oil layer in discrete patches.",
    whyItWorks:
      "Once etched, the remedy is mechanical evening or recoating; neutral cleaning only confirms the defect is not removable haze.",
    mistakes: ["Stronger acid to even sheen.", "Wax that traps moisture in damaged coating."],
    benchmarks: ["If haze survives dry neutral wipe, plan refinish scope with wear-layer limits in mind."],
    professionalInsights: ["Document patch boundaries; localized screen-and-coat beats whole-house when isolated."],
    sources: ["finish manufacturer repair matrices", "field etch assessment workflows"],
  },
  {
    surface: "hardwood",
    problem: "oxidation",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral cleaner for prep; UV-cured or waterborne recoat materials per manufacturer",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["bleach as color fix"],
        reason:
          "Photo-oxidation and ambering live in the coating or very top wood cells; restoration is refinish or accept patina.",
      },
    ],
    method: {
      tools: ["cleaning for prep only", "sanding equipment per pro scope"],
      dwell: "Minimal moisture during assessment",
      agitation: "Prep sanding only in controlled refinish sequence",
      rinse: "N/A except prep wipe",
      dry: "Full dry before any coat work",
    },
    whyItHappens:
      "UV, heat, and oxygen alter binders and extractives so the field yellows or dulls unevenly compared with rug lines.",
    whyItWorks:
      "Removing aged nanometers of coating or switching sheen evens appearance; cleaners only remove soil masquerading as fade.",
    mistakes: ["Expecting citrus or peroxide to reverse UV shift on oil-modified urethane.", "Recoating over contaminated film."],
    benchmarks: ["After thorough neutral clean, remaining color shift is finish aging not soil."],
    professionalInsights: ["Rug-shadow lines often need abrade-and-coat, not chemistry."],
    sources: ["coating UV aging primers", "NWFA recoat decision notes"],
  },
  {
    surface: "hardwood",
    problem: "corrosion",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral wood cleaner; felt pads or coasters; finish repair after metal source removal",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["leaving wet metal on wood"],
        reason:
          "Corrosion here is usually metal staining or finish breakdown at contact points; stop the galvanic/wet source then address coating.",
      },
    ],
    method: {
      tools: ["lift metal items", "dry towels", "microfiber for residue"],
      dwell: "Dry-remove oxidation dust first",
      agitation: "Gentle if lifting surface transfer only",
      rinse: "Damp wipe if needed",
      dry: "Immediate",
    },
    whyItHappens:
      "Wet ferrous hardware, planter saucers, or furniture glides leave oxide rings and can soften finish under the contact patch.",
    whyItWorks:
      "Eliminating moisture and metal contact halts spread; neutral cleaning lifts loose oxide; deep stain needs recolor or recoat.",
    mistakes: ["Polishing compound spirals that heat the finish.", "Ignoring HVAC condensation at registers."],
    benchmarks: ["Active rust flecks should stop appearing after source control and dry maintenance."],
    professionalInsights: ["Black ring under a pot is often finish failure plus moisture—not a cleaner-only job."],
    sources: ["field metal-contact wood care notes"],
  },
  {
    surface: "hardwood",
    problem: "tarnish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Manufacturer-approved wood polish or maintainer for the installed finish type",
        chemistry: "neutral",
        surfaces: ["finished hardwood"],
        avoids: ["silicone-heavy furniture polish on urethane if manufacturer forbids"],
        reason:
          "Dulling from oils and particulate reads as tarnish; compatible maintainer can restore uniform sheen without etching.",
      },
    ],
    method: {
      tools: ["dry dust mop", "microfiber", "small amount of product on cloth not floor"],
      dwell: "Brief",
      agitation: "With-grain even passes",
      rinse: "Usually none; second dry buff",
      dry: "Buff to uniform sheen",
    },
    whyItHappens:
      "Traffic films, cleaner buildup, and microscopic abrasion scatter light so the floor looks smoky or tarnished though intact.",
    whyItWorks:
      "Controlled removal of maintenance film and even application of approved maintainer realigns specular reflection.",
    mistakes: ["Wax on incompatible systems.", "High-speed burnishers in residential finish."],
    benchmarks: ["Sheen should unify in raking light when issue is film; bare wear still looks matte."],
    professionalInsights: ["If tarnish is only in dog paths, check for urine edge wicking before cosmetic polish."],
    sources: ["finish manufacturer maintenance lines"],
  },
  {
    surface: "hardwood",
    problem: "heat damage",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral cleaner for char/soot lift only; board replacement or refinish for white heat line",
        chemistry: "neutral",
        surfaces: ["hardwood"],
        avoids: ["sanding through wear layer DIY"],
        reason:
          "Heat shock clouds coating or chars fibers; cleaning addresses loose char, not structural whitening or cupping.",
      },
    ],
    method: {
      tools: ["soft brush for loose char", "HEPA vacuum", "microfiber"],
      dwell: "Minimal",
      agitation: "Gentle",
      rinse: "Damp wipe if cleaner used",
      dry: "Immediate",
    },
    whyItHappens:
      "Heat guns, fireplace pops, or hot items contact the wear layer and underlying wood, whitening urethane or scorching fiber.",
    whyItWorks:
      "Loose carbon and smoke film lift with neutral care; chemical cleaners cannot reverse polymer heat shock or fiber crush.",
    mistakes: ["Bleach on white heat line expecting stain removal.", "Aggressive scrape through finish."],
    benchmarks: ["Soot should reduce; white heat halo usually means recoat or board swap."],
    professionalInsights: ["Map extent; insurance photos before any attempt to even appearance."],
    sources: ["wood heat-mark assessment references"],
  },

  {
    surface: "grout",
    problem: "bacteria buildup",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered disinfectant cleaner rated for tile and grout",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["skipping wet time", "mixing with acid"],
        reason:
          "Porous cementitious joints hold body soil; alkaline surfactants lift film so disinfectant contact time is effective.",
      },
    ],
    method: {
      tools: ["nylon grout brush", "microfiber", "PPE"],
      dwell: "Preclean then full disinfectant wet time on cleaned joints",
      agitation: "Corners and coves first",
      rinse: "Volume rinse before next shower use",
      dry: "Ventilate",
    },
    whyItHappens:
      "Slow-dry corners, organic soil, and humidity let bacterial biofilms establish below the visual soap scum line.",
    whyItWorks:
      "Mechanical disruption plus labeled antimicrobial steps reduce bioload in pores when chemistry is given time to work.",
    mistakes: ["Spray-and-wipe with no brush contact.", "Acid same day without thorough rinse."],
    benchmarks: ["Odor and slimy drag should drop when humidity and rinse discipline improve."],
    professionalInsights: ["Persistent pink or gray film may need grout condition audit before sealing."],
    sources: ["EPA disinfectant use-site labels", "tile industry shower maintenance summaries"],
  },
  {
    surface: "grout",
    problem: "etching",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "pH-neutral grout cleaner for maintenance; color seal or regrout consult for severe acid damage",
        chemistry: "neutral",
        surfaces: ["grout", "tile"],
        avoids: ["repeated acid on same joints"],
        reason:
          "Etched grout is missing cement paste and micro-roughness; stop acid, clean neutrally, then seal or repair structurally.",
      },
    ],
    method: {
      tools: ["soft brush", "plenty of rinse water"],
      dwell: "Brief maintenance only",
      agitation: "Light—avoid grinding sanded aggregate through",
      rinse: "Flood rinse",
      dry: "Inspect dry joint for pitting vs soil shadowing",
    },
    whyItHappens:
      "Aggressive or prolonged acid on cementitious grout dissolves paste and exposes aggregate, reading as rough light joints.",
    whyItWorks:
      "Neutral care halts further loss; cosmetic color seal or grout removal replaces what cleaning cannot rebuild.",
    mistakes: ["Stronger acid to even color.", "Sealing over unclean etched pores."],
    benchmarks: ["Joint should not get rougher across maintenance cycles if acid is removed from routine."],
    professionalInsights: ["Document tile type; some stones force acid habits that punish adjacent grout."],
    sources: ["grout manufacturer acid exposure warnings"],
  },
  {
    surface: "grout",
    problem: "oxidation",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    products: [
      {
        name: "Acidic restoration cleaner or sulfamic-based grout detailer labeled for cement grout",
        chemistry: "acidic",
        surfaces: ["grout"],
        avoids: ["marble thresholds without mask", "bleach mixes"],
        reason:
          "Some darkening is iron or manganese oxidation in pores; short acidic contact can lighten when stone neighbors allow.",
      },
    ],
    method: {
      tools: ["grout brush", "barrier for acid-sensitive stone", "rinse bucket"],
      dwell: "Short; keep joints wet",
      agitation: "Targeted along discolored runs",
      rinse: "Heavy neutralizing rinse per label",
      dry: "Judge color dry",
    },
    whyItHappens:
      "Groundwater minerals, fertilizer track-in, and cleaner residues oxidize in pores and shift joint color unevenly.",
    whyItWorks:
      "Compatible acid steps dissolve certain oxide phases and surfactants carry pigment out with rinse volume.",
    mistakes: ["Treating uniform sealer wear as mineral oxidation.", "Letting acid dry on joint."],
    benchmarks: ["Color should step lighter across passes; no change means dye or physical wear."],
    professionalInsights: ["Confirm adjacent stone acid tolerance before any perimeter work on stained joints."],
    sources: ["acidic grout cleaner manufacturer sheets"],
  },
  {
    surface: "grout",
    problem: "corrosion",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral pH grout and tile cleaner for ongoing care after chemical event stop",
        chemistry: "neutral",
        surfaces: ["grout", "tile"],
        avoids: ["industrial degreaser as daily rinse"],
        reason:
          "Chemical corrosion here means binder damage; halt harsh chemistry, flush neutrally, then repair or regrout as needed.",
      },
    ],
    method: {
      tools: ["grout brush", "fresh mop water"],
      dwell: "Short",
      agitation: "Even strokes",
      rinse: "Multiple clear rinses to remove alkaline or acid residues from prior programs",
      dry: "Ventilate",
    },
    whyItHappens:
      "Strong alkalis, unknown toilet bowl products, or mixed chemistry strips paste and leaves friable joints.",
    whyItWorks:
      "Neutral flushing stops the attack vector; mechanical integrity assessment decides grout repair versus seal.",
    mistakes: ["Another strong product to even sheen.", "Sealing powdery joint."],
    benchmarks: ["Joint should not shed more paste after neutral maintenance; if it does, replace joint."],
    professionalInsights: ["Photo chalking after rinse—document before customer seals over damage."],
    sources: ["grout maintenance after chemical exposure notes"],
  },
  {
    surface: "grout",
    problem: "tarnish",
    soilClass: "residue",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline tile and grout cleaner with surfactant package",
        chemistry: "alkaline",
        surfaces: ["grout", "tile"],
        avoids: ["wax systems incompatible with alkaline"],
        reason:
          "Dull tarnished appearance is often polymerized oil and soap film in texture; alkaline surfactants release it with agitation.",
      },
    ],
    method: {
      tools: ["grout brush", "microfiber", "fresh rinse"],
      dwell: "Per label on kitchen or bath film",
      agitation: "Work joints then tile face",
      rinse: "Carry soil away with volume",
      dry: "Inspect at raking light",
    },
    whyItHappens:
      "Body oils, rinse aids, and old sealers oxidize in joint relief so grout reads smoky though structurally sound.",
    whyItWorks:
      "Alkaline cleaners cut fatty films and lift particulate so rinse water restores true joint color when not etched.",
    mistakes: ["Water-only mopping that redeposits film.", "Acid chasing dullness and etching grout."],
    benchmarks: ["Joint should brighten relative to control tile after full dry."],
    professionalInsights: ["If tarnish returns in 72h, check mop chemistry and dryer vent moisture."],
    sources: ["professional grout film removal workflows"],
  },
  {
    surface: "grout",
    problem: "heat damage",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    products: [
      {
        name: "Neutral cleaner for loose debris only; grout saw and replacement for cracked or crumbled joints",
        chemistry: "neutral",
        surfaces: ["grout", "tile"],
        avoids: ["expecting chemistry to heal cracks"],
        reason:
          "Heat shock crazes grout or debonds from tile; cleaning is hygiene only until mechanical repair.",
      },
    ],
    method: {
      tools: ["soft brush", "vacuum cracks if stable", "repair kit per manufacturer"],
      dwell: "Minimal",
      agitation: "Gentle",
      rinse: "If cleaner used",
      dry: "Before any seal or repair product",
    },
    whyItHappens:
      "Heat guns, fireplace proximity, or hot pan rests transfer energy that micro-fractures cementitious grout or darkens resin sealers.",
    whyItWorks:
      "Removing loose grains prepares joints for removal and repack; chemistry cannot re-fuse cracked mineral matrix.",
    mistakes: ["Heavy acid in cracked joint attacking mortar bed.", "Sealing over char or crumble."],
    benchmarks: ["Loose material should vacuum out; stable cracks need professional evaluation before seal."],
    professionalInsights: ["Map heat source; otherwise new grout fails the same way."],
    sources: ["tile industry heat-damage inspection notes"],
  },
  {
    surface: "grout",
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Neutral grout residue remover; penetrating grout sealer applied evenly per label",
        chemistry: "neutral",
        surfaces: ["grout"],
        avoids: ["spotty flood on unmasked porous stone"],
        reason:
          "Uneven sheen is often sealer build, cleaner residue, or missed rinse; strip residue neutrally then seal uniformly.",
      },
    ],
    method: {
      tools: ["white pad", "grout brush", "lint-free towels", "foam applicator for sealer"],
      dwell: "Per residue remover label",
      agitation: "Even pressure across field",
      rinse: "Complete rinse before sealing",
      dry: "Bone dry before sealer; buff haze per sealer instructions",
    },
    whyItHappens:
      "Wiper drift, uneven sealer coats, and partial acid exposure leave high-low gloss and patchy water behavior on joints.",
    whyItWorks:
      "Neutral residue removal evens the starting surface; consistent sealer application locks uniform appearance and protection.",
    mistakes: ["Spot sealing only high-traffic lanes.", "Sealing over damp joints after shower use."],
    benchmarks: ["Water should bead similarly across treated field when sealer type matches porosity."],
    professionalInsights: ["Test sealer on spare tile; some darken grout—customer sign-off matters."],
    sources: ["grout sealer manufacturer application guides"],
  },
];
