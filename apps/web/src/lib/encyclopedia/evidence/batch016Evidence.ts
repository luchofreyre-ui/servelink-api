import type { ChemistryClass, CleaningMethod, CleaningProduct, EvidenceRecord, SoilClass } from "./evidenceTypes";

/** Surfaces that share the same 15-problem closure matrix (batch-016 seed triple). */
const TRIPLE_SURFACES = ["toilets", "mirrors", "vinyl"] as const;

type TripleProblemDef = {
  problem: string;
  soilClass: SoilClass;
  recommendedChemistry: ChemistryClass;
  avoidChemistry: ChemistryClass[];
  product: Omit<CleaningProduct, "surfaces">;
  method: CleaningMethod;
  mistakes: string[];
  benchmark: string;
  professionalInsight: string;
  sources: string[];
  /** Surface-specific clause (toilets | mirrors | vinyl) */
  happens: (s: (typeof TRIPLE_SURFACES)[number]) => string;
  works: (s: (typeof TRIPLE_SURFACES)[number]) => string;
};

function tripleRows(def: TripleProblemDef): EvidenceRecord[] {
  return TRIPLE_SURFACES.map((surface) => {
    const product: CleaningProduct = {
      ...def.product,
      surfaces: [surface],
    };
    return {
      surface,
      problem: def.problem,
      soilClass: def.soilClass,
      recommendedChemistry: def.recommendedChemistry,
      avoidChemistry: def.avoidChemistry,
      products: [product],
      method: def.method,
      whyItHappens: def.happens(surface),
      whyItWorks: def.works(surface),
      mistakes: def.mistakes,
      benchmarks: [def.benchmark],
      professionalInsights: [def.professionalInsight],
      sources: def.sources,
    };
  });
}

const TRIPLE_MATRIX: TripleProblemDef[] = [
  {
    problem: "odor retention",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    product: {
      name: "Alkaline bathroom cleaner followed by EPA-registered disinfectant where label allows",
      chemistry: "alkaline",
      avoids: ["masking sprays as only fix", "mixing bleach with acid"],
      reason: "Alkaline surfactants lift organic soil so disinfectant contact time works on the cleaned surface.",
    },
    method: {
      tools: ["bowl brush or microfiber", "PPE", "grout brush near base"],
      dwell: "Preclean; then disinfectant wet time per label",
      agitation: "Focus rim, hinge pockets, and caulk lines",
      rinse: "Rinse where label requires before reuse",
      dry: "Ventilate; fix chronic moisture",
    },
    mistakes: ["Spray-and-wipe under disinfectant contact time.", "Ignoring trapped urine scale under bolts."],
    benchmark: "Odor should improve when soil and moisture sources are both addressed.",
    professionalInsight: "Persistent sewer smell needs wax ring inspection—not chemistry alone.",
    sources: ["EPA disinfectant label guidance", "bathroom odor maintenance notes"],
    happens: (s) =>
      s === "toilets"
        ? "Urine films dry into porous grout and hinge pockets while bowl water line hides bacterial biofilm that vents odor."
        : s === "mirrors"
          ? "Aerosols and skin soil film mirror glass and frame tracks, holding microbial odor in humid baths."
          : "Vinyl seams and embossing trap mop water and pet soils that sour when drying is slow.",
    works: (s) =>
      s === "toilets"
        ? "Alkaline preclean plus labeled disinfectant reduces bioload on porcelain and nearby washable plastics when dry cycles return."
        : s === "mirrors"
          ? "Removing soil from glass and tracks allows disinfectant or maintainer steps to contact true odor sources."
          : "Surfactant lift plus drying discipline removes odor-holding film from wear-layer texture.",
  },
  {
    problem: "burnt residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    product: {
      name: "Alkaline degreasing bathroom or surface cleaner rated for the substrate",
      chemistry: "alkaline",
      avoids: ["abrasives on glossy porcelain", "chlorine gas risk from mixing"],
      reason: "Burnt organics saponify under mild alkaline detergency when the soil is still removable char, not glaze damage.",
    },
    method: {
      tools: ["non-scratch pad if label allows", "plastic scraper at low angle on flat porcelain only"],
      dwell: "Short; keep damp not drying",
      agitation: "Controlled passes; avoid sawing at caulk",
      rinse: "Volume rinse",
      dry: "Inspect when fully dry",
    },
    mistakes: ["Assuming all dark marks are soil when glaze is heat damaged.", "Metal scrapers on toilet glaze."],
    benchmark: "Loose char should lift; permanent brown fire polish on ceramic will remain.",
    professionalInsight: "Candle smoke on mirror frames needs different dwell than bowl char.",
    sources: ["porcelain maintenance references", "field char removal notes"],
    happens: (s) =>
      s === "toilets"
        ? "Heat tools, candles, or chemical misuse carbonize films on porcelain rims and seats that read as burnt-on residue."
        : s === "mirrors"
          ? "Heat plumes deposit soot on glass near vanities while hair tools scorch product buildup on frames."
          : "Hot items or friction burns can carbonize tracked oils on vinyl near kitchen transitions.",
    works: (s) =>
      s === "toilets"
        ? "Alkaline detergency softens removable char while rinse carries particulate before it re-bonds."
        : s === "mirrors"
          ? "Alkaline cleaner lifts soot films from glass when not etched; frames need label-checked chemistry."
          : "Controlled alkaline cleaning removes surface char from wear layer when melting has not occurred.",
  },
  {
    problem: "scuff marks",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "Neutral pH cleaner with light surfactant for the surface class",
      chemistry: "neutral",
      avoids: ["melamine on glossy porcelain or coated vinyl", "dry dust grinding"],
      reason: "Many scuffs are transfer from shoes and tools; neutral surfactant and microfiber release them without etching.",
    },
    method: {
      tools: ["clean microfiber", "optional white eraser-type pad only if substrate label allows"],
      dwell: "Brief",
      agitation: "Light buff along grain or straight paths on vinyl",
      rinse: "Damp wipe",
      dry: "Buff dry",
    },
    mistakes: ["Scotch-Brite on toilet glaze.", "Circular grinding that new-scuffs mirrors."],
    benchmark: "Transfer scuffs should fade; deep gouges in vinyl or cracked glaze remain.",
    professionalInsight: "Black shoe marks on vinyl often lift with neutral chemistry alone.",
    sources: ["manufacturer scuff guidance", "field transfer mark notes"],
    happens: (s) =>
      s === "toilets"
        ? "Shoe contact and cleaning tools leave dark polymer transfer on porcelain bases and lids."
        : s === "mirrors"
          ? "Jewelry, tools, and bottle contact leave dark transfer on mirror glass that is not true scratching."
          : "Furniture feet and shoe rubber deposit transfer into vinyl embossing that reads as scuffs.",
    works: (s) =>
      s === "toilets"
        ? "Neutral surfactant reduces adhesion of transfer polymers so they wipe into the cloth."
        : s === "mirrors"
          ? "Gentle neutral cleaning lifts shoe and metal transfer without attacking silvering edges."
          : "Neutral cleaner and directional wiping pull rubber and plastic transfer off the wear layer.",
  },
  {
    problem: "oil stains",
    soilClass: "grease",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    product: {
      name: "Mild alkaline degreaser labeled for bathroom porcelain, glass, or vinyl respectively",
      chemistry: "alkaline",
      avoids: ["solvent flooding on unknown plastics", "alkaline pooling in vinyl seams"],
      reason: "Alkaline surfactants emulsify skin and hair oils that bond to glossy and textured surfaces.",
    },
    method: {
      tools: ["microfiber", "small brush at grout lines"],
      dwell: "Short",
      agitation: "Straight passes",
      rinse: "Clear water wipe",
      dry: "Towel",
    },
    mistakes: ["Degreaser drying on mirror frames without rinse.", "Over-wetting toilet paper holders."],
    benchmark: "Oil sheen should drop after dry inspection.",
    professionalInsight: "Hair oil fingerprints on mirrors need edge detailing.",
    sources: ["bathroom degreasing primers"],
    happens: (s) =>
      s === "toilets"
        ? "Skin and hair oils plate onto porcelain and plastic seats near cleaning neglect zones."
        : s === "mirrors"
          ? "Styling products aerosolize and bond to mirror glass in fogged baths."
          : "Kitchen-adjacent vinyl collects tracked cooking oils in texture.",
    works: (s) =>
      s === "toilets"
        ? "Mild alkaline cleaner cuts oils on washable vitreous and plastic trim."
        : s === "mirrors"
          ? "Surfactant package lifts silicone and oil films when followed by rinse and dry buff."
          : "Controlled alkaline work emulsifies oil without long puddle dwell on seams.",
  },
  {
    problem: "food residue",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "Neutral bathroom or multi-surface cleaner",
      chemistry: "neutral",
      avoids: ["bleach on protein without preclean"],
      reason: "Neutral surfactants release carbohydrate and fat films without aggressive pH on mixed bath materials.",
    },
    method: {
      tools: ["microfiber sponge"],
      dwell: "Brief on dried spots",
      agitation: "Even pressure",
      rinse: "Damp wipe",
      dry: "Dry rims and tracks",
    },
    mistakes: ["Letting sugary drinks dry on toilet tanks near eat-in baths.", "Cross-contaminating kitchen sponges."],
    benchmark: "Tacky food films should release within one or two cycles.",
    professionalInsight: "Brush under toilet bolt caps where kids hide crumbs humorously but truly.",
    sources: ["residential bath cleaning guides"],
    happens: (s) =>
      s === "toilets"
        ? "Snacks and bath drinks splash onto nearby porcelain and floors, drying into sticky patches."
        : s === "mirrors"
          ? "Toothpaste and rinse splatter carries food dyes onto mirror fields."
          : "Pet bowls and high-chair zones near vinyl leave sugar films in seams.",
    works: (s) =>
      s === "toilets"
        ? "Neutral cleaner solubilizes polar food soils on glazed and plastic surfaces."
        : s === "mirrors"
          ? "Surfactant lift plus rinse clears dried splatter without etching glass."
          : "Neutral wiping removes food films from wear layer when not yet polymerized.",
  },
  {
    problem: "protein residue",
    soilClass: "organic",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    product: {
      name: "Cool alkaline cleaner or labeled enzyme bathroom treatment",
      chemistry: "alkaline",
      avoids: ["hot water setting protein on delicate coatings"],
      reason: "Alkaline or enzyme steps loosen denatured protein from porcelain, glass, and vinyl when dwell is controlled.",
    },
    method: {
      tools: ["microfiber", "soft brush"],
      dwell: "Cool short dwell",
      agitation: "Pat-lift on spots",
      rinse: "Thorough",
      dry: "Immediate on metal hinges",
    },
    mistakes: ["Steam on cold mirrors.", "Bleach without soil removal."],
    benchmark: "Protein drag should decrease after complete rinse.",
    professionalInsight: "Pet accidents on vinyl baseboards need enzyme label check for color stability.",
    sources: ["protein soil bathroom notes"],
    happens: (s) =>
      s === "toilets"
        ? "Vomit, spit, and biofilms leave protein films on bowls and seats that tack when dry."
        : s === "mirrors"
          ? "Toothpaste proteins and skincare films bond to glass in hard water areas."
          : "Egg or dairy track-in denatures in vinyl texture near kitchens.",
    works: (s) =>
      s === "toilets"
        ? "Cool alkaline or enzyme cycles cleave protein adhesion on washable surfaces."
        : s === "mirrors"
          ? "Controlled alkaline surfactancy lifts dried paste residues after softening."
          : "Alkaline cleaner releases protein from embossing with brush contact.",
  },
  {
    problem: "rust stains",
    soilClass: "mineral",
    recommendedChemistry: "acidic",
    avoidChemistry: ["alkaline"],
    product: {
      name: "Acidic rust spot treatment labeled for porcelain, glass, or vinyl test area",
      chemistry: "acidic",
      avoids: ["acid on marble saddles", "bleach mixes"],
      reason: "Targeted acid dissolves iron oxide transfer from hardware and fertilizers on tolerant surfaces.",
    },
    method: {
      tools: ["cotton swab", "timer", "barrier towels"],
      dwell: "Spot; shortest effective",
      agitation: "Minimal",
      rinse: "Flood rinse",
      dry: "Inspect",
    },
    mistakes: ["Acid on stainless hinges without rinse.", "Treating rust that is bleeding from corroded seat bolts."],
    benchmark: "Surface rust transfer should lighten; active bolt bleed needs hardware replacement.",
    professionalInsight: "Mirror clip rust often re-deposits until clips are replaced.",
    sources: ["acidic spot cleaner labels"],
    happens: (s) =>
      s === "toilets"
        ? "Tank bolts and seat hardware bleed iron onto porcelain when gaskets fail."
        : s === "mirrors"
          ? "Frame fasteners and shelf brackets plate rust onto mirror edges."
          : "Metal furniture feet and track-in leave iron marks on vinyl.",
    works: (s) =>
      s === "toilets"
        ? "Tested acidic gel reduces topical iron oxide on glaze when not structural corrosion."
        : s === "mirrors"
          ? "Controlled acid lifts iron from glass when backing seal is intact."
          : "Spot acid with immediate rinse can fade iron transfer on vinyl when label allows.",
  },
  {
    problem: "tannin stains",
    soilClass: "organic",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "Oxygen bleach or peroxide system tested on hidden area for glass, porcelain, or vinyl",
      chemistry: "neutral",
      avoids: ["chlorine mixed with acid"],
      reason: "Controlled oxidation lightens some organic brown films from beverages on washable surfaces.",
    },
    method: {
      tools: ["PPE", "microfiber"],
      dwell: "Per label spot test",
      agitation: "Light",
      rinse: "Complete",
      dry: "Inspect print or glaze",
    },
    mistakes: ["Over-dwell bleaching adjacent caulk colors.", "Using wood-only brighteners on plastic."],
    benchmark: "Brown films should step down when stain is removable organics.",
    professionalInsight: "If tannin wicks under toilet label, replace label rather than stronger chemistry.",
    sources: ["oxygen cleaner use-site labels"],
    happens: (s) =>
      s === "toilets"
        ? "Coffee and tea splash onto tanks and nearby floors, leaving chromophores on porous grout edges."
        : s === "mirrors"
          ? "Hair dye and tea rinses spatter mirror fields with brown haze."
          : "Wine and plant tannins track onto vinyl near dining zones.",
    works: (s) =>
      s === "toilets"
        ? "Oxygen systems can lighten topical tannin on porcelain and sealed adjacent materials when tested."
        : s === "mirrors"
          ? "Peroxide-class steps reduce some dye films on glass after preclean."
          : "Tested oxidizer may fade tannin on vinyl wear layer without long dwell.",
  },
  {
    problem: "bacteria buildup",
    soilClass: "biofilm",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "EPA-registered disinfectant after alkaline or neutral preclean per substrate label",
      chemistry: "neutral",
      avoids: ["quat inactivated by cotton soap residue"],
      reason: "Preclean exposes bacteria to disinfectant; proper wet time reduces counts on hard surfaces.",
    },
    method: {
      tools: ["microfiber", "PPE"],
      dwell: "Full label wet time on cleaned surface",
      agitation: "Even",
      rinse: "Per label",
      dry: "Ventilate",
    },
    mistakes: ["Disinfecting over heavy soap film.", "Mixing chemistry blindly."],
    benchmark: "High-touch fields should feel less slippery when biofilm was the cause.",
    professionalInsight: "Phone-clean vanity mirrors need the same contact time as bowls.",
    sources: ["EPA surface disinfectant guidance"],
    happens: (s) =>
      s === "toilets"
        ? "Flush aerosols and hand contact deposit bacterial films on seats, handles, and nearby walls."
        : s === "mirrors"
          ? "Skin contact and sneeze spray inoculate mirror fields in shared baths."
          : "Pet paws and mop bacteria deposit into vinyl texture when rinse water is dirty.",
    works: (s) =>
      s === "toilets"
        ? "Preclean plus disinfectant at labeled wet time reduces surface bioload on non-porous areas."
        : s === "mirrors"
          ? "Glass disinfection works when soil is removed first and streak rinse completes."
          : "Fresh mop water and disinfectant maintenance reduce bacterial film on vinyl.",
  },
  {
    problem: "etching",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    product: {
      name: "Neutral cleaner for hygiene only; referral for reglaze or replacement if damage confirmed",
      chemistry: "neutral",
      avoids: ["stronger acid to even gloss"],
      reason: "Etching is material loss; chemistry cannot rebuild glaze, glass, or vinyl wear layer.",
    },
    method: {
      tools: ["bright light assessment", "microfiber for loose soil only"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "If testing removable haze",
      dry: "Compare to untouched area",
    },
    mistakes: ["HF-containing products near glass mirrors.", "Aggressive pads on etched vinyl."],
    benchmark: "If haze survives neutral wipe, plan repair or replace.",
    professionalInsight: "Toilet bowl acid over-spill etches neighboring vinyl—map splash zone.",
    sources: ["substrate damage assessment notes"],
    happens: (s) =>
      s === "toilets"
        ? "Strong bowl acids and pumice misuse cloud porcelain glaze in patches."
        : s === "mirrors"
          ? "Tile acid overspray or wrong cleaner frosts mirror glass permanently."
          : "Wrong stripper chemistry dulls vinyl embossing by removing wear layer gloss.",
    works: (s) =>
      s === "toilets"
        ? "Neutral cleaning confirms damage versus removable film before reglaze decisions."
        : s === "mirrors"
          ? "Assessment distinguishes etch from silicone haze; only replacement fixes true etch."
          : "Neutral wipe proves whether dullness is residue or wear-layer damage.",
  },
  {
    problem: "oxidation",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "Neutral maintainer; replace yellowed seat or buffer strip vinyl if material aged",
      chemistry: "neutral",
      avoids: ["bleach whitening plastic unpredictably"],
      reason: "UV and cleaner aging yellows plastics and dulls surfaces; cleaners remove soil not polymer oxidation.",
    },
    method: {
      tools: ["microfiber"],
      dwell: "Brief",
      agitation: "Gentle",
      rinse: "Damp wipe",
      dry: "Compare hidden vs exposed",
    },
    mistakes: ["Expecting peroxide to reverse UV yellow on all toilet seats.", "Wax on oxidized vinyl."],
    benchmark: "Soil clears but yellowing remains when polymer is aged.",
    professionalInsight: "White vinyl cove yellows faster near UV windows—blinds help more than chemistry.",
    sources: ["polymer aging maintenance context"],
    happens: (s) =>
      s === "toilets"
        ? "UV and ammonia cleaners yellow plastic seats and handles over years."
        : s === "mirrors"
          ? "Frame plastics oxidize while glass itself stays clear unless coated."
          : "Vinyl near sliders yellows from UV even when floor looks clean.",
    works: (s) =>
      s === "toilets"
        ? "Neutral cleaning removes surface grime so true color shift is visible for replace decisions."
        : s === "mirrors"
          ? "Glass stays neutral; frame oxidation needs part replacement or paint prep."
          : "Cleaning proves whether dullness is soil or UV breakdown of wear layer.",
  },
  {
    problem: "corrosion",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    product: {
      name: "Neutral rinse after stopping chemical source; replace corroded hardware or vinyl if pitted",
      chemistry: "neutral",
      avoids: ["continued salt or chloride exposure"],
      reason: "Corrosion is metal loss or coating failure; neutral flush limits spread until parts swap.",
    },
    method: {
      tools: ["towels", "wrench for bolt inspection"],
      dwell: "N/A until leak stopped",
      agitation: "Gentle wipe of loose oxide dust",
      rinse: "Multiple clear water passes",
      dry: "Fan",
    },
    mistakes: ["Painting over active rust on tank bolts.", "Ignoring chloride from urine scale."],
    benchmark: "Active flaking should stop after source control; pitting remains.",
    professionalInsight: "Mirror side clips corrode from bath salts—swap stainless rated parts.",
    sources: ["bathroom hardware corrosion notes"],
    happens: (s) =>
      s === "toilets"
        ? "Chlorides and galvanic couples pit brass bolts and stain porcelain around hardware."
        : s === "mirrors"
          ? "Frame metals corrode and drip oxide onto glass edges."
          : "Chair glides and metal legs rust onto vinyl when mopping stays wet.",
    works: (s) =>
      s === "toilets"
        ? "Stopping leaks and neutral rinsing halts active corrosion before seat and bolt replacement."
        : s === "mirrors"
          ? "Removing oxide dust and replacing clips stops recurring glass edge staining."
          : "Dry maintenance and felt feet stop rust transfer to vinyl.",
  },
  {
    problem: "tarnish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "Neutral cleaner or labeled metal polish for chrome fixtures; glass cleaner for mirrors",
      chemistry: "neutral",
      avoids: ["abrasive chrome polish on PVD finishes"],
      reason: "Tarnish is often soap film on chrome or glass; neutral surfactants restore reflectivity when intact.",
    },
    method: {
      tools: ["microfiber", "detail brush"],
      dwell: "Brief",
      agitation: "Straight buff on metal and glass",
      rinse: "If product builds",
      dry: "Buff dry",
    },
    mistakes: ["Acid on brushed nickel.", "Same cloth for toilet then mirror."],
    benchmark: "Reflectivity should return when tarnish was film not plating loss.",
    professionalInsight: "Pitting chrome needs replacement—not more polish.",
    sources: ["fixture care manufacturer sheets"],
    happens: (s) =>
      s === "toilets"
        ? "Soap and hard water dry into smoky films on chrome handles and flush plates."
        : s === "mirrors"
          ? "Hair product haze dulls mirror reflectivity evenly."
          : "Floor finish buildup dulls vinyl sheen unevenly.",
    works: (s) =>
      s === "toilets"
        ? "Neutral surfactants lift film from plated metal without attacking thin chrome."
        : s === "mirrors"
          ? "Glass cleaner chemistry returns specular clarity when coating intact."
          : "Neutral strip of bad wax or soap returns uniform vinyl appearance.",
  },
  {
    problem: "heat damage",
    soilClass: "damage",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic", "alkaline"],
    product: {
      name: "Neutral wipe for soot only; replace warped seat or vinyl plank if distorted",
      chemistry: "neutral",
      avoids: ["cold water shock on hot porcelain"],
      reason: "Heat shock crazes glaze or warps plastic and vinyl; cleaning addresses loose char only.",
    },
    method: {
      tools: ["soft brush", "vacuum loose ash"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "Cool damp if safe temperature",
      dry: "Inspect cracks",
    },
    mistakes: ["Assuming all brown is soil when plastic melted.", "Scraping warped vinyl flat."],
    benchmark: "Loose soot lifts; melt deformation remains.",
    professionalInsight: "Hair tools scorch vinyl bath mats—separate from floor vinyl care.",
    sources: ["heat damage inspection primers"],
    happens: (s) =>
      s === "toilets"
        ? "Candles, heat guns, or chemical exotherms distort seats and cloud glaze locally."
        : s === "mirrors"
          ? "Heat lamps or tool contact shock mirror edges or damage silvering."
          : "Hot pans or heat registers warp vinyl planks and seam lips.",
    works: (s) =>
      s === "toilets"
        ? "Neutral cleaning removes char dust; structural heat damage needs part replacement."
        : s === "mirrors"
          ? "Loose soot wipes away; silvering burn requires new mirror."
          : "Cool assessment; replace planks with delamination or seam peaking.",
  },
  {
    problem: "uneven finish",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    product: {
      name: "Neutral cleaner with even wipe or squeegee technique per surface",
      chemistry: "neutral",
      avoids: ["spot-only wax on vinyl", "inconsistent spray volume"],
      reason: "Uneven gloss is often differential residue; uniform neutral clean evens refractive appearance.",
    },
    method: {
      tools: ["fresh microfiber per zone", "squeegee on mirrors optional"],
      dwell: "Brief",
      agitation: "Consistent direction full field",
      rinse: "Even water volume",
      dry: "Uniform buff pressure",
    },
    mistakes: ["Circular wiping on large mirrors.", "Heavy cleaner only on traffic lanes on vinyl."],
    benchmark: "Raking light should read uniform when issue was residue layering.",
    professionalInsight: "Toilet tank lids show streak ghosts from partial spray—full-field wipe fixes.",
    sources: ["even-wipe technique references"],
    happens: (s) =>
      s === "toilets"
        ? "Partial sprays and drip drying leave high-low gloss on porcelain lids and bases."
        : s === "mirrors"
          ? "Inconsistent cleaner volume causes banded evaporation marks on glass."
          : "Mop streaks and uneven finish restorer application stripe vinyl fields.",
    works: (s) =>
      s === "toilets"
        ? "Strip residue with neutral cleaner and even passes to match gloss across porcelain."
        : s === "mirrors"
          ? "Controlled product volume and squeegee path remove banding."
          : "Full-room neutral clean resets vinyl sheen before any approved dressing.",
  },
];

const LAMINATE_TAIL: EvidenceRecord[] = [
  {
    surface: "laminate",
    problem: "dust buildup",
    soilClass: "residue",
    recommendedChemistry: "neutral",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Dry microfiber dusting then neutral laminate-safe damp mop",
        chemistry: "neutral",
        surfaces: ["laminate", "laminate counters"],
        avoids: ["oily sprays that attract dust"],
        reason: "Dust in laminate texture lifts best dry-first to avoid mud in embossing.",
      },
    ],
    method: {
      tools: ["microfiber mop", "vacuum with hard floor head"],
      dwell: "N/A dry first",
      agitation: "With plank direction",
      rinse: "Barely damp second pass",
      dry: "Airflow",
    },
    whyItHappens:
      "Static and foot traffic pack lint into laminate embossing and along bevels where vacuum skips low points.",
    whyItWorks:
      "Dry capture followed by low-moisture neutral wiping removes particulate without swelling seams.",
    mistakes: ["Wet-mopping before dust removal.", "Beater bar vacuums on floating floors."],
    benchmarks: ["Field should brighten in side light after dry-wet sequence."],
    professionalInsights: ["Change mop heads; gray streaks often mean dirty water not worn floor."],
    sources: ["laminate floor maintenance PDFs"],
  },
  {
    surface: "laminate",
    problem: "mold growth",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "EPA-registered hard-surface disinfectant labeled for laminate after preclean",
        chemistry: "alkaline",
        surfaces: ["laminate"],
        avoids: ["flooding open seams", "painting over moldy quarter round"],
        reason: "Preclean removes soil so disinfectant reaches mold on wear surface when moisture is controlled.",
      },
    ],
    method: {
      tools: ["microfiber", "soft brush at wall base", "PPE"],
      dwell: "Preclean then disinfectant wet time",
      agitation: "Perimeter first",
      rinse: "Per label",
      dry: "Dehumidify or fan",
    },
    whyItHappens:
      "Dishwasher leaks, bath humidity, and wet mopping wick into laminate edges where spores establish.",
    whyItWorks:
      "Mechanical preclean plus labeled antimicrobial steps reduce visible growth when the leak is fixed.",
    mistakes: ["Sealing over swollen edge mold.", "Bleach-only without soil removal."],
    benchmarks: ["Growth clears visually when humidity drops; recurrence means moisture path."],
    professionalInsights: ["Inspect dishwasher toe kick and fridge lines before recleaning endlessly."],
    sources: ["EPA disinfectant labels", "laminate moisture guidance"],
  },
  {
    surface: "laminate",
    problem: "mildew stains",
    soilClass: "biofilm",
    recommendedChemistry: "alkaline",
    avoidChemistry: ["acidic"],
    products: [
      {
        name: "Alkaline mildew cleaner safe for sealed laminate when tested",
        chemistry: "alkaline",
        surfaces: ["laminate", "laminate counters"],
        avoids: ["over-wetting vertical laminate backsplashes"],
        reason: "Surfactants lift pigmented mildew while ventilation stops immediate return.",
      },
    ],
    method: {
      tools: ["microfiber", "grout brush only on tolerant edges"],
      dwell: "Per label",
      agitation: "Along wall junctions",
      rinse: "Damp wipe",
      dry: "Towel and airflow",
    },
    whyItHappens:
      "Bath and kitchen humidity deposits mildew pigments on laminate cove and counter splashes.",
    whyItWorks:
      "Alkaline surfactant packages remove surface hyphae staining when core stays dry.",
    mistakes: ["Soaking vertical seams.", "Acid after alkaline without rinse."],
    benchmarks: ["Gray pigment should lighten across dry cycles."],
    professionalInsights: ["If caulk is black through-body, replace caulk not only clean laminate."],
    sources: ["mildew treatment manufacturer notes"],
  },
];

function countertopRow(
  problem: string,
  soilClass: SoilClass,
  rec: ChemistryClass,
  avoid: ChemistryClass[],
  product: CleaningProduct,
  method: CleaningMethod,
  whyH: string,
  whyW: string,
  mistakes: string[],
  bench: string,
  insight: string,
  sources: string[],
): EvidenceRecord {
  return {
    surface: "countertops",
    problem,
    soilClass,
    recommendedChemistry: rec,
    avoidChemistry: avoid,
    products: [product],
    method,
    whyItHappens: whyH,
    whyItWorks: whyW,
    mistakes,
    benchmarks: [bench],
    professionalInsights: [insight],
    sources,
  };
}

const COUNTERTOP_ROWS: EvidenceRecord[] = [
  countertopRow(
    "odor retention",
    "biofilm",
    "alkaline",
    ["acidic"],
    {
      name: "Alkaline preclean on hard tops then EPA disinfectant where label matches quartz, laminate, or sealed stone",
      chemistry: "alkaline",
      surfaces: ["countertops"],
      avoids: ["masking sprays only", "mixing bleach with acid"],
      reason: "Organic films in seams and around sinks hold odor; surfactant lift exposes bacteria for labeled wet time.",
    },
    {
      tools: ["microfiber", "soft brush for caulk", "PPE"],
      dwell: "Preclean then disinfectant contact per label",
      agitation: "Sink rim and dish mat zones first",
      rinse: "Per label for food contact",
      dry: "Towel and fix chronic wet sponges",
    },
    "Standing rinse water, drip trays, and garbage pull-outs keep counter zones humid enough that bacterial films vent odor.",
    "Alkaline soil removal plus disinfectant at proper wet time reduces bioload on non-porous tops when drying habits improve.",
    ["Disinfecting over greasy film.", "Ignoring dishwasher side leaks that wet the cabinet deck."],
    "Odor should improve when sponges dry between uses and soil is fully removed first.",
    "Replace cellulose sponges weekly in high-organic kitchens.",
    ["food-prep surface sanitization primers", "EPA disinfectant use-site labels"],
  ),
  countertopRow(
    "burnt residue",
    "organic",
    "alkaline",
    ["acidic"],
    {
      name: "Mild alkaline degreaser labeled for the installed countertop after spot test",
      chemistry: "alkaline",
      surfaces: ["countertops", "laminate counters", "quartz countertops"],
      avoids: ["metal scrapers on gloss", "chlorine gas risk from mixing"],
      reason: "Removable char and polymerized oil soften under alkaline detergency on tolerant synthetics when not true heat damage.",
    },
    {
      tools: ["non-scratch pad if label allows", "plastic scraper at low angle if allowed"],
      dwell: "Short; keep damp",
      agitation: "Even passes",
      rinse: "Clear wipe",
      dry: "Inspect when fully dry",
    },
    "Hot pans and toaster blow-back carbonize films on laminate and solid surface near breakfast zones.",
    "Alkaline cleaner lifts loose char while rinse carries particulate; white heat bloom means polymer damage not soil.",
    ["Assuming all brown marks are grease when glaze or resin is heat-shocked.", "Acid on stone neighbors."],
    "Loose soot should release; bubbled or whitened areas remain after cleaning.",
    "Always use trivets; map heat sources before aggressive chemistry.",
    ["countertop char removal field notes"],
  ),
  countertopRow(
    "scuff marks",
    "residue",
    "neutral",
    ["acidic"],
    {
      name: "Neutral countertop cleaner with microfiber for transfer scuffs",
      chemistry: "neutral",
      surfaces: ["countertops", "quartz", "laminate counters"],
      avoids: ["melamine on soft prints", "dry dust grinding grit"],
      reason: "Many dark marks are rubber or plastic transfer; neutral surfactant releases them without etching.",
    },
    {
      tools: ["clean microfiber", "optional white eraser pad only if label allows"],
      dwell: "Brief",
      agitation: "Straight full-field passes",
      rinse: "Damp wipe",
      dry: "Buff",
    },
    "Pot bases, tools, and bag hardware leave polymer transfer on quartz and laminate that reads as permanent scratches.",
    "Neutral cleaner reduces adhesion so transfer wipes into the cloth without abrasive damage to wear layers.",
    ["Scotch-Brite on gloss quartz.", "Circular grinding that adds new marks."],
    "Transfer should fade; true gouges in resin or stone need pro repair.",
    "Lift grit before wet work to avoid scratch cycles.",
    ["countertop scuff transfer notes"],
  ),
  countertopRow(
    "bacteria buildup",
    "biofilm",
    "neutral",
    ["acidic"],
    {
      name: "Food-preclean then EPA disinfectant labeled for countertop material",
      chemistry: "neutral",
      surfaces: ["countertops"],
      avoids: ["quat with leftover anionic soap"],
      reason: "Preclean exposes bacteria for disinfectant contact time on food zones.",
    },
    {
      tools: ["microfiber", "PPE"],
      dwell: "Label wet time",
      agitation: "Even",
      rinse: "If required for food contact",
      dry: "Clean towel",
    },
    "Sponges and standing rinse water inoculate counters with bacterial film in seams.",
    "Disinfectant after soil removal reduces counts when contact time and food rules are followed.",
    ["Disinfecting over greasy film.", "Cross-wiping raw then ready zones."],
    "Surface should feel less slippery if biofilm was present.",
    "Sanitize sponges or switch to disposable for high-risk prep.",
    ["food surface sanitization primers"],
  ),
  countertopRow(
    "heat damage",
    "damage",
    "neutral",
    ["acidic", "alkaline"],
    {
      name: "Neutral wipe for loose ash; replace bubbled laminate or scorched solid surface",
      chemistry: "neutral",
      surfaces: ["countertops"],
      avoids: ["scraping melted resin"],
      reason: "Heat shock delaminates or chars tops; cleaning only removes loose carbon.",
    },
    {
      tools: ["soft cloth"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "If soot cleaner used",
      dry: "Inspect delamination",
    },
    "Hot pots and heat guns create white heat lines or bubbles in laminate and solid surface.",
    "Loose soot wipes away; polymer damage needs patch or full replace.",
    ["Trying to iron flat a heat bubble.", "Bleach on heat-darkened resin."],
    "Structural whitening or bubbling remains after cleaning.",
    "Always use trivets; insurance may cover adjacent scorch from appliance.",
    ["countertop heat damage assessments"],
  ),
];

function ghRow(
  problem: string,
  soilClass: SoilClass,
  rec: ChemistryClass,
  avoid: ChemistryClass[],
  product: CleaningProduct,
  method: CleaningMethod,
  whyH: string,
  whyW: string,
  mistakes: string[],
  bench: string,
  insight: string,
  sources: string[],
): EvidenceRecord {
  return {
    surface: "general household surfaces",
    problem,
    soilClass,
    recommendedChemistry: rec,
    avoidChemistry: avoid,
    products: [product],
    method,
    whyItHappens: whyH,
    whyItWorks: whyW,
    mistakes,
    benchmarks: [bench],
    professionalInsights: [insight],
    sources,
  };
}

const GENERAL_HOUSEHOLD_ROWS: EvidenceRecord[] = [
  ghRow(
    "odor retention",
    "biofilm",
    "alkaline",
    ["acidic"],
    {
      name: "Alkaline preclean on bins then EPA disinfectant labeled for hard non-food utility plastic",
      chemistry: "alkaline",
      surfaces: ["garbage cans", "general household surfaces"],
      avoids: ["masking sprays as only fix", "mixing bleach with acid"],
      reason: "Organic soil in ribs and lids holds odor; surfactant lift allows disinfectant contact time on cleaned plastic.",
    },
    {
      tools: ["brush", "PPE", "hose"],
      dwell: "Preclean then disinfect per label",
      agitation: "Interior corners and lid gasket",
      rinse: "If label requires",
      dry: "Invert to drain fully",
    },
    "Kitchen scraps, diapers, and pet waste films sour inside plastic cans when bags leak and bins stay damp.",
    "Alkaline preclean plus labeled disinfectant reduces bioload when dry cycles return between bag changes.",
    ["Spray-and-wipe under contact time.", "Sealed lids on wet interiors."],
    "Odor should improve when soil and moisture are both controlled.",
    "Drill weep holes only if manufacturer allows.",
    ["EPA disinfectant non-food utility use", "waste container hygiene guides"],
  ),
  ghRow(
    "burnt residue",
    "organic",
    "alkaline",
    ["acidic"],
    {
      name: "Alkaline degreaser for plastic bins with grill or fireplace ash contact",
      chemistry: "alkaline",
      surfaces: ["garbage cans", "general household surfaces"],
      avoids: ["metal scrapers on thin walls"],
      reason: "Alkaline detergency softens removable char on heat-tolerant plastics.",
    },
    {
      tools: ["brush", "hose"],
      dwell: "Short",
      agitation: "Scrub interior",
      rinse: "Outdoors",
      dry: "Invert",
    },
    "Hot ash bags and grill drip cans carbonize soil on plastic interiors.",
    "Alkaline cleaner lifts loose char while heavy melt damage needs bin replacement.",
    ["Disposing embers while warm.", "Sealed lid on hot debris."],
    "Loose soot should rinse; warped plastic means replace.",
    "Use metal cans for true ash until fully cool.",
    ["ash container cleaning guidance"],
  ),
  ghRow(
    "scuff marks",
    "residue",
    "neutral",
    ["acidic"],
    {
      name: "Neutral cleaner and microfiber for transfer scuffs on bins and totes",
      chemistry: "neutral",
      surfaces: ["general household surfaces"],
      avoids: ["melamine on soft prints"],
      reason: "Many scuffs are rubber transfer that neutral surfactant releases.",
    },
    {
      tools: ["microfiber", "optional eraser test spot"],
      dwell: "Brief",
      agitation: "Buff along rib direction",
      rinse: "Damp",
      dry: "Towel",
    },
    "Wheels and shoes leave dark transfer on plastic cans along curbside routes.",
    "Neutral cleaner and friction lift polymer transfer without etching plastic.",
    ["Scotch-Brite on printed recycle logos."],
    "Transfer fades; gouges remain.",
    "Face labels away from curb impact side when possible.",
    ["plastic scuff removal notes"],
  ),
  ghRow(
    "bacteria buildup",
    "biofilm",
    "neutral",
    ["acidic"],
    {
      name: "Preclean then EPA disinfectant for garbage cans and utility plastic",
      chemistry: "neutral",
      surfaces: ["garbage cans", "general household surfaces"],
      avoids: ["quat inactivated by anionic residue"],
      reason: "Kitchen and diaper soils need soil removal before disinfectant contact time.",
    },
    {
      tools: ["brush", "PPE", "hose"],
      dwell: "Label wet time",
      agitation: "Even interior coverage",
      rinse: "If label requires",
      dry: "Air dry inverted",
    },
    "High-organic loads inoculate bin walls with bacterial film that smells when warm.",
    "Disinfectant after preclean reduces bioload on hard utility plastics.",
    ["Disinfecting over grease.", "Using kitchen-only protocols in garage without rinse."],
    "Odor bacteria counts drop when dry cycles return between bag changes.",
    "Weekly rinse beats monthly shock treatment.",
    ["sanitation for waste containers"],
  ),
  ghRow(
    "heat damage",
    "damage",
    "neutral",
    ["acidic", "alkaline"],
    {
      name: "Neutral wipe for ash dust; replace warped or melted utility plastic",
      chemistry: "neutral",
      surfaces: ["general household surfaces"],
      avoids: ["forcing warped lid straight"],
      reason: "Heat deforms plastic; cleaning removes loose carbon not structural warp.",
    },
    {
      tools: ["soft brush", "vacuum"],
      dwell: "N/A",
      agitation: "Minimal",
      rinse: "If needed",
      dry: "Inspect warp",
    },
    "Hot coals in plastic bags and heat-gun misuse warp bins and lids.",
    "Loose ash vacuums away; distortion means replace bin for safe loads.",
    ["Storing hot pans on plastic shelving."],
    "Structure should be rigid after clean; flex means retire bin.",
    "Metal liners for heat zones.",
    ["heat-deformed plastic safety notes"],
  ),
];

/** Canonical (surface, problem) pairs for batch-016 generate/intake (58 targets). */
export const BATCH_016_TARGETS = [
  ["toilets", "odor retention"],
  ["toilets", "burnt residue"],
  ["toilets", "scuff marks"],
  ["toilets", "oil stains"],
  ["toilets", "food residue"],
  ["toilets", "protein residue"],
  ["toilets", "rust stains"],
  ["toilets", "tannin stains"],
  ["toilets", "bacteria buildup"],
  ["toilets", "etching"],
  ["toilets", "oxidation"],
  ["toilets", "corrosion"],
  ["toilets", "tarnish"],
  ["toilets", "heat damage"],
  ["toilets", "uneven finish"],
  ["mirrors", "odor retention"],
  ["mirrors", "burnt residue"],
  ["mirrors", "scuff marks"],
  ["mirrors", "oil stains"],
  ["mirrors", "food residue"],
  ["mirrors", "protein residue"],
  ["mirrors", "rust stains"],
  ["mirrors", "tannin stains"],
  ["mirrors", "bacteria buildup"],
  ["mirrors", "etching"],
  ["mirrors", "oxidation"],
  ["mirrors", "corrosion"],
  ["mirrors", "tarnish"],
  ["mirrors", "heat damage"],
  ["mirrors", "uneven finish"],
  ["vinyl", "odor retention"],
  ["vinyl", "burnt residue"],
  ["vinyl", "scuff marks"],
  ["vinyl", "oil stains"],
  ["vinyl", "food residue"],
  ["vinyl", "protein residue"],
  ["vinyl", "rust stains"],
  ["vinyl", "tannin stains"],
  ["vinyl", "bacteria buildup"],
  ["vinyl", "etching"],
  ["vinyl", "oxidation"],
  ["vinyl", "corrosion"],
  ["vinyl", "tarnish"],
  ["vinyl", "heat damage"],
  ["vinyl", "uneven finish"],
  ["laminate", "dust buildup"],
  ["laminate", "mold growth"],
  ["laminate", "mildew stains"],
  ["countertops", "odor retention"],
  ["countertops", "burnt residue"],
  ["countertops", "scuff marks"],
  ["countertops", "bacteria buildup"],
  ["countertops", "heat damage"],
  ["general household surfaces", "odor retention"],
  ["general household surfaces", "burnt residue"],
  ["general household surfaces", "scuff marks"],
  ["general household surfaces", "bacteria buildup"],
  ["general household surfaces", "heat damage"],
] as const;

export const BATCH_016_EVIDENCE: EvidenceRecord[] = [
  ...TRIPLE_MATRIX.flatMap(tripleRows),
  ...LAMINATE_TAIL,
  ...COUNTERTOP_ROWS,
  ...GENERAL_HOUSEHOLD_ROWS,
];
