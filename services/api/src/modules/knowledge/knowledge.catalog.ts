import {
  KnowledgeChemicalDefinition,
  KnowledgeMethodDefinition,
  KnowledgeProblemDefinition,
  KnowledgeQuickSolveScenario,
  KnowledgeSeverity,
  KnowledgeSurfaceDefinition,
  KnowledgeToolDefinition,
  KnowledgeProblemId,
  KnowledgeSurfaceId,
  KnowledgeMethodId,
  KnowledgeToolId,
  KnowledgeChemicalId,
} from "./knowledge.types";

export const KNOWLEDGE_SURFACES: KnowledgeSurfaceDefinition[] = [
  {
    id: "glass_shower_door",
    label: "Glass Shower Door",
    shortDescription: "Transparent shower glass that often collects soap film and mineral residue.",
  },
  {
    id: "tile",
    label: "Tile",
    shortDescription: "Hard bathroom or kitchen tile surface prone to soap, residue, and film buildup.",
  },
  {
    id: "grout",
    label: "Grout",
    shortDescription: "Porous joint material that traps moisture, soil, and microbial growth.",
  },
  {
    id: "stainless_steel",
    label: "Stainless Steel",
    shortDescription: "Metal appliance or fixture surface that shows grease, streaking, and residue quickly.",
  },
  {
    id: "stovetop",
    label: "Stovetop",
    shortDescription: "High-use cooking surface with baked-on grease and food splatter risk.",
  },
  {
    id: "granite_countertop",
    label: "Granite Countertop",
    shortDescription: "Natural stone surface that requires pH-safe cleaning and controlled moisture.",
  },
  {
    id: "hardwood_floor",
    label: "Hardwood Floor",
    shortDescription: "Finished wood flooring that must be cleaned with low moisture and low residue.",
  },
  {
    id: "baseboard",
    label: "Baseboard",
    shortDescription: "Trim surface that accumulates dust and detail-line buildup.",
  },
  {
    id: "toilet_bowl",
    label: "Toilet Bowl",
    shortDescription: "Bathroom fixture prone to mineral scale and heavy sanitation needs.",
  },
  {
    id: "sink_faucet",
    label: "Sink Faucet",
    shortDescription: "Metal fixture that shows hard water spotting and residue.",
  },
  {
    id: "microwave_interior",
    label: "Microwave Interior",
    shortDescription: "Small enclosed cooking cavity with grease, food splatter, and odor retention.",
  },
];

export const KNOWLEDGE_PROBLEMS: KnowledgeProblemDefinition[] = [
  {
    id: "soap_scum",
    label: "Soap Scum",
    shortDescription: "Residue made from soap, body oils, minerals, and water deposits.",
  },
  {
    id: "mildew",
    label: "Mildew",
    shortDescription: "Surface-level fungal growth encouraged by moisture and poor airflow.",
  },
  {
    id: "grease",
    label: "Grease",
    shortDescription: "Oily cooking residue that traps particulate soil and becomes sticky.",
  },
  {
    id: "food_residue",
    label: "Food Residue",
    shortDescription: "Loose or dried food film left behind from kitchen use.",
  },
  {
    id: "dirt_buildup",
    label: "Dirt Buildup",
    shortDescription: "Accumulated tracked-in soil and fine debris from routine traffic.",
  },
  {
    id: "dust_buildup",
    label: "Dust Buildup",
    shortDescription: "Dry particulate accumulation on trim and detail surfaces.",
  },
  {
    id: "mineral_scale",
    label: "Mineral Scale",
    shortDescription: "Hard mineral deposits created by repeated water evaporation.",
  },
  {
    id: "hard_water_spots",
    label: "Hard Water Spots",
    shortDescription: "Visible mineral spotting and film left behind by water droplets.",
  },
];

export const KNOWLEDGE_METHODS: KnowledgeMethodDefinition[] = [
  {
    id: "acidic_descaling",
    label: "Acidic Descaling",
    shortWhyItWorks:
      "Acidic chemistry helps break down mineral-heavy and soap-based deposits so they can be lifted more efficiently.",
  },
  {
    id: "targeted_degreasing",
    label: "Targeted Degreasing",
    shortWhyItWorks:
      "Degreasing chemistry helps break apart oily residue so agitation and wiping can remove it cleanly.",
  },
  {
    id: "controlled_agitation",
    label: "Controlled Agitation",
    shortWhyItWorks:
      "Mechanical agitation loosens bonded residue while reducing unnecessary surface damage.",
  },
  {
    id: "gentle_food_lift",
    label: "Gentle Food Lift",
    shortWhyItWorks:
      "A pH-safe cleaner and soft wipe sequence lifts residue without over-wetting or damaging sensitive surfaces.",
  },
  {
    id: "low_moisture_detailing",
    label: "Low-Moisture Detailing",
    shortWhyItWorks:
      "Low liquid load reduces residue and moisture risk while still removing fine dry buildup.",
  },
  {
    id: "disinfecting_bowl_descaling",
    label: "Disinfecting Bowl Descaling",
    shortWhyItWorks:
      "A bathroom-safe bowl cleaner helps dissolve mineral deposits while supporting sanitation goals.",
  },
  {
    id: "spot_descaling",
    label: "Spot Descaling",
    shortWhyItWorks:
      "Localized descaling removes mineral spotting from fixtures without unnecessary saturation.",
  },
];

export const KNOWLEDGE_TOOLS: KnowledgeToolDefinition[] = [
  {
    id: "non_scratch_pad",
    label: "Non-Scratch Pad",
    purpose: "Loosens stuck residue while reducing scratch risk on suitable surfaces.",
  },
  {
    id: "grout_brush",
    label: "Grout Brush",
    purpose: "Applies focused agitation into grout lines and porous joints.",
  },
  {
    id: "detail_brush",
    label: "Detail Brush",
    purpose: "Reaches tight edges, seams, and fixture contours.",
  },
  {
    id: "microfiber_towel",
    label: "Microfiber Towel",
    purpose: "Absorbs residue and moisture while improving final surface finish.",
  },
  {
    id: "scraper_non_metal",
    label: "Non-Metal Scraper",
    purpose: "Lifts heavy stuck-on buildup without using a metal edge.",
  },
  {
    id: "toilet_bowl_brush",
    label: "Toilet Bowl Brush",
    purpose: "Applies controlled scrubbing inside the bowl safely.",
  },
  {
    id: "soft_applicator_pad",
    label: "Soft Applicator Pad",
    purpose: "Applies product evenly across delicate or finish-sensitive surfaces.",
  },
  {
    id: "vacuum_soft_brush",
    label: "Vacuum Soft Brush",
    purpose: "Removes loose dry debris before damp detailing steps.",
  },
  {
    id: "flat_mop",
    label: "Flat Mop",
    purpose: "Applies low-moisture floor cleaning with better control than a saturated mop.",
  },
];

export const KNOWLEDGE_CHEMICALS: KnowledgeChemicalDefinition[] = [
  {
    id: "acidic_scale_remover",
    label: "Acidic Scale Remover",
    category: "acidic",
    shortWhyItWorks:
      "Helps dissolve mineral and soap-related deposits that resist neutral cleaning alone.",
    safetyNotes: [
      "Do not mix with bleach or other reactive chemicals.",
      "Do not let product dry on the surface.",
      "Test first on delicate or coated surfaces.",
    ],
  },
  {
    id: "alkaline_degreaser",
    label: "Alkaline Degreaser",
    category: "alkaline",
    shortWhyItWorks:
      "Helps break down oily cooking residue so it can be lifted with agitation and wiping.",
    safetyNotes: [
      "Do not over-apply on finish-sensitive surfaces.",
      "Rinse or wipe residue fully after use.",
      "Use ventilation in confined cooking areas.",
    ],
  },
  {
    id: "neutral_surface_cleaner",
    label: "Neutral Surface Cleaner",
    category: "neutral",
    shortWhyItWorks:
      "Supports safe routine cleaning on sensitive surfaces where stronger chemistry may be excessive.",
    safetyNotes: [
      "Avoid over-wetting porous or moisture-sensitive materials.",
      "Use a clean towel to prevent residue transfer.",
    ],
  },
  {
    id: "peroxide_mildew_treatment",
    label: "Peroxide Mildew Treatment",
    category: "oxidizing",
    shortWhyItWorks:
      "Helps break down visible mildew staining on appropriate bathroom surfaces.",
    safetyNotes: [
      "Use with ventilation.",
      "Do not mix with other chemicals.",
      "Test first on color-sensitive materials.",
    ],
  },
  {
    id: "disinfecting_bathroom_cleaner",
    label: "Disinfecting Bathroom Cleaner",
    category: "bathroom_specialty",
    shortWhyItWorks:
      "Supports mineral loosening and bathroom sanitation when used with proper dwell and agitation.",
    safetyNotes: [
      "Follow dwell time instructions.",
      "Avoid splash-back during agitation.",
      "Do not mix with other cleaners.",
    ],
  },
];

export const KNOWLEDGE_SCENARIOS: KnowledgeQuickSolveScenario[] = [
  {
    id: "glass_shower_door_soap_scum_light",
    surfaceId: "glass_shower_door",
    problemId: "soap_scum",
    severity: "light",
    title: "Light soap scum on glass shower door",
    summary:
      "Use a controlled acidic descale and non-scratch agitation to remove fresh soap film without hazing the glass.",
    recommendedMethodId: "acidic_descaling",
    toolIds: ["soft_applicator_pad", "non_scratch_pad", "microfiber_towel"],
    chemicalIds: ["acidic_scale_remover"],
    steps: [
      "Apply acidic scale remover evenly with a soft applicator pad.",
      "Allow 2-3 minutes of dwell time without letting the product dry.",
      "Agitate lightly with a non-scratch pad using overlapping circular passes.",
      "Wipe residue fully with a damp microfiber towel.",
      "Buff dry with a clean microfiber towel for clarity.",
    ],
    warnings: [
      "Do not use abrasive pads or razor-style tools on coated glass.",
      "Do not let acidic product dry on the glass.",
    ],
    commonMistakes: [
      "Skipping dwell time and over-scrubbing too early.",
      "Using the same dirty towel for final buffing.",
    ],
    whenToEscalate: [
      "Escalate if spotting remains after two controlled passes.",
      "Escalate if the glass appears coated or manufacturer-treated and compatibility is unclear.",
    ],
    estimatedMinutesMin: 6,
    estimatedMinutesMax: 10,
    foNotes: [
      "Finish dry to reduce streaking callbacks.",
      "Always check edge buildup near frame lines.",
    ],
    seoSlug: "remove-soap-scum-from-glass-shower-door",
  },
  {
    id: "glass_shower_door_soap_scum_heavy",
    surfaceId: "glass_shower_door",
    problemId: "soap_scum",
    severity: "heavy",
    title: "Heavy soap scum on glass shower door",
    summary:
      "Heavy buildup needs repeated acidic descaling passes and controlled agitation instead of aggressive scratching.",
    recommendedMethodId: "acidic_descaling",
    toolIds: ["soft_applicator_pad", "non_scratch_pad", "detail_brush", "microfiber_towel"],
    chemicalIds: ["acidic_scale_remover"],
    steps: [
      "Apply acidic scale remover generously but evenly across the glass.",
      "Allow 3-4 minutes dwell time while keeping the surface visibly wet.",
      "Agitate with a non-scratch pad using overlapping passes from top to bottom.",
      "Use a detail brush at edges, tracks, and hinge-side buildup zones.",
      "Wipe away residue with a damp microfiber towel.",
      "Repeat one additional controlled pass if residue remains.",
      "Buff fully dry with a clean microfiber towel.",
    ],
    warnings: [
      "Do not jump straight to blades or highly abrasive pads.",
      "Do not use uncontrolled pressure on glass near hardware edges.",
    ],
    commonMistakes: [
      "Trying to remove all buildup in one aggressive pass.",
      "Ignoring edge and lower-panel mineral concentration.",
    ],
    whenToEscalate: [
      "Escalate if permanent etching is suspected after two passes.",
      "Escalate if residue remains bonded and surface damage risk is increasing.",
    ],
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 16,
    foNotes: [
      "Heavy lower-panel buildup often needs the second pass.",
      "Set customer expectations when etching appears permanent.",
    ],
    seoSlug: "heavy-soap-scum-on-glass-shower-door",
  },
  {
    id: "tile_soap_scum_medium",
    surfaceId: "tile",
    problemId: "soap_scum",
    severity: "medium",
    title: "Medium soap scum on tile",
    summary:
      "Tile soap film responds well to an acidic descale combined with controlled mechanical agitation.",
    recommendedMethodId: "acidic_descaling",
    toolIds: ["non_scratch_pad", "detail_brush", "microfiber_towel"],
    chemicalIds: ["acidic_scale_remover"],
    steps: [
      "Apply acidic scale remover evenly across the affected tile area.",
      "Allow 2-4 minutes dwell time.",
      "Agitate the tile face with a non-scratch pad.",
      "Use a detail brush around edges and grout transitions.",
      "Wipe residue completely and rinse with a damp towel.",
      "Dry the surface to inspect for remaining film.",
    ],
    warnings: [
      "Do not let acidic cleaner sit too long on sensitive stone-look finishes unless confirmed safe.",
      "Avoid uncontrolled runoff onto incompatible surfaces.",
    ],
    commonMistakes: [
      "Only wiping and not agitating the bonded film.",
      "Leaving product residue behind after removal.",
    ],
    whenToEscalate: [
      "Escalate if residue persists in textured tile after two passes.",
      "Escalate if surface coating appears vulnerable or unknown.",
    ],
    estimatedMinutesMin: 8,
    estimatedMinutesMax: 12,
    foNotes: [
      "Inspect texture valleys closely; they hold residue.",
    ],
    seoSlug: "clean-soap-scum-from-tile",
  },
  {
    id: "grout_mildew_medium",
    surfaceId: "grout",
    problemId: "mildew",
    severity: "medium",
    title: "Medium mildew on grout",
    summary:
      "Visible mildew on grout needs chemistry that addresses staining plus focused agitation into porous joints.",
    recommendedMethodId: "controlled_agitation",
    toolIds: ["grout_brush", "microfiber_towel", "detail_brush"],
    chemicalIds: ["peroxide_mildew_treatment"],
    steps: [
      "Apply peroxide mildew treatment directly to affected grout lines.",
      "Allow 3-5 minutes dwell time.",
      "Agitate grout lines with a grout brush using short repeated strokes.",
      "Use a detail brush in corners and transition points.",
      "Wipe residue with a damp microfiber towel.",
      "Repeat targeted treatment once if staining remains.",
    ],
    warnings: [
      "Do not oversaturate surrounding porous materials.",
      "Use ventilation during treatment.",
    ],
    commonMistakes: [
      "Only spraying and wiping without brush agitation.",
      "Using a pad that skips recessed grout lines.",
    ],
    whenToEscalate: [
      "Escalate if staining appears below the surface after repeat treatment.",
      "Escalate if caulk or sealant failure is contributing to persistent growth.",
    ],
    estimatedMinutesMin: 8,
    estimatedMinutesMax: 14,
    foNotes: [
      "Document severe recurring mildew for future maintenance recommendations.",
    ],
    seoSlug: "remove-mildew-from-grout",
  },
  {
    id: "stainless_steel_grease_medium",
    surfaceId: "stainless_steel",
    problemId: "grease",
    severity: "medium",
    title: "Medium grease on stainless steel",
    summary:
      "Use targeted degreasing with grain-aware wiping to break oily buildup without dulling the finish.",
    recommendedMethodId: "targeted_degreasing",
    toolIds: ["soft_applicator_pad", "microfiber_towel", "detail_brush"],
    chemicalIds: ["alkaline_degreaser"],
    steps: [
      "Apply alkaline degreaser to a towel or applicator pad rather than flooding the surface.",
      "Allow 1-2 minutes dwell time on heavier spots.",
      "Wipe with the grain using controlled pressure.",
      "Use a detail brush around handles, seams, and edges.",
      "Follow with a clean damp towel to remove residue.",
      "Dry fully with a clean microfiber towel.",
    ],
    warnings: [
      "Do not use abrasive pads that can scratch the finish.",
      "Do not leave degreaser residue on the surface.",
    ],
    commonMistakes: [
      "Wiping across the grain and causing a patchy appearance.",
      "Applying too much product and leaving smear residue.",
    ],
    whenToEscalate: [
      "Escalate if buildup is carbonized or heat-bonded.",
      "Escalate if finish damage pre-exists and requires customer note documentation.",
    ],
    estimatedMinutesMin: 6,
    estimatedMinutesMax: 10,
    foNotes: [
      "Dry finish matters on stainless; final towel quality affects perceived result.",
    ],
    seoSlug: "remove-grease-from-stainless-steel",
  },
  {
    id: "stovetop_grease_heavy",
    surfaceId: "stovetop",
    problemId: "grease",
    severity: "heavy",
    title: "Heavy grease on stovetop",
    summary:
      "Heavy stovetop grease requires dwell, degreasing, and controlled lifting of bonded buildup instead of rushed wiping.",
    recommendedMethodId: "targeted_degreasing",
    toolIds: ["scraper_non_metal", "non_scratch_pad", "microfiber_towel", "detail_brush"],
    chemicalIds: ["alkaline_degreaser"],
    steps: [
      "Apply alkaline degreaser to the cool stovetop surface.",
      "Allow 3-5 minutes dwell time on the heaviest buildup.",
      "Use a non-metal scraper to lift softened bonded residue where safe.",
      "Agitate remaining buildup with a non-scratch pad.",
      "Use a detail brush around burner edges and seams.",
      "Wipe residue completely with microfiber towels.",
      "Perform a final damp wipe and dry inspection pass.",
    ],
    warnings: [
      "Never work on a hot cooking surface.",
      "Do not use metal scraping tools on finish-sensitive tops.",
    ],
    commonMistakes: [
      "Rushing dwell time on heavy grease.",
      "Smearing loosened grease instead of changing towels frequently.",
    ],
    whenToEscalate: [
      "Escalate if carbonized residue remains bonded after two controlled attempts.",
      "Escalate if manufacturer finish limitations restrict safe agitation.",
    ],
    estimatedMinutesMin: 12,
    estimatedMinutesMax: 18,
    foNotes: [
      "Heaviest buildup is usually around control zones and rear splash areas.",
    ],
    seoSlug: "clean-heavy-grease-from-stovetop",
  },
  {
    id: "granite_countertop_food_residue_light",
    surfaceId: "granite_countertop",
    problemId: "food_residue",
    severity: "light",
    title: "Light food residue on granite countertop",
    summary:
      "Granite needs a gentle residue lift using pH-safe chemistry and controlled moisture.",
    recommendedMethodId: "gentle_food_lift",
    toolIds: ["soft_applicator_pad", "microfiber_towel"],
    chemicalIds: ["neutral_surface_cleaner"],
    steps: [
      "Apply neutral surface cleaner to a towel or soft applicator pad.",
      "Wipe the residue area with light overlapping passes.",
      "Allow a brief 30-60 second contact time for dried spots.",
      "Lift residue with a clean microfiber towel.",
      "Dry the surface completely to avoid dull film.",
    ],
    warnings: [
      "Do not use acidic or high-alkaline products on natural stone unless specifically approved.",
      "Do not over-wet seams or edges.",
    ],
    commonMistakes: [
      "Using the wrong chemistry on sealed stone.",
      "Leaving moisture or cleaner residue behind.",
    ],
    whenToEscalate: [
      "Escalate if residue appears etched or if seal failure is suspected.",
    ],
    estimatedMinutesMin: 3,
    estimatedMinutesMax: 6,
    foNotes: [
      "Granite appearance depends heavily on a dry final wipe.",
    ],
    seoSlug: "remove-food-residue-from-granite-countertop",
  },
  {
    id: "hardwood_floor_dirt_buildup_medium",
    surfaceId: "hardwood_floor",
    problemId: "dirt_buildup",
    severity: "medium",
    title: "Medium dirt buildup on hardwood floor",
    summary:
      "Hardwood floor cleaning should prioritize dry soil removal first, then a low-moisture detailing pass.",
    recommendedMethodId: "low_moisture_detailing",
    toolIds: ["vacuum_soft_brush", "flat_mop", "microfiber_towel"],
    chemicalIds: ["neutral_surface_cleaner"],
    steps: [
      "Vacuum or remove loose soil using a soft-brush floor-safe attachment.",
      "Lightly apply neutral cleaner to a flat mop pad rather than saturating the floor.",
      "Work in controlled sections with minimal moisture.",
      "Use a microfiber towel for edges or heavier traffic marks.",
      "Allow the floor to dry quickly and inspect for streaks.",
    ],
    warnings: [
      "Do not over-wet hardwood flooring.",
      "Do not leave standing moisture at seams or edges.",
    ],
    commonMistakes: [
      "Skipping dry soil removal before damp cleaning.",
      "Using too much liquid and creating swelling risk.",
    ],
    whenToEscalate: [
      "Escalate if finish wear, cupping, or water damage is visible.",
    ],
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 16,
    foNotes: [
      "Traffic lanes usually need the towel detail pass.",
    ],
    seoSlug: "clean-dirt-buildup-from-hardwood-floor",
  },
  {
    id: "baseboard_dust_buildup_medium",
    surfaceId: "baseboard",
    problemId: "dust_buildup",
    severity: "medium",
    title: "Medium dust buildup on baseboard",
    summary:
      "Baseboards clean best with dry removal first, followed by a light detailed wipe.",
    recommendedMethodId: "low_moisture_detailing",
    toolIds: ["vacuum_soft_brush", "microfiber_towel", "detail_brush"],
    chemicalIds: ["neutral_surface_cleaner"],
    steps: [
      "Remove loose dust with a vacuum soft brush or dry microfiber first.",
      "Lightly dampen a microfiber towel with neutral cleaner.",
      "Wipe the top edge first, then the face, then the lower trim edge.",
      "Use a detail brush for profile grooves and corners.",
      "Dry any remaining moisture immediately.",
    ],
    warnings: [
      "Do not over-wet painted trim or MDF-like materials.",
    ],
    commonMistakes: [
      "Turning dust into mud by starting too wet.",
      "Ignoring top-edge dust lines.",
    ],
    whenToEscalate: [
      "Escalate if paint transfer, staining, or finish failure is present.",
    ],
    estimatedMinutesMin: 6,
    estimatedMinutesMax: 10,
    foNotes: [
      "The top edge is the usual missed area on inspections.",
    ],
    seoSlug: "clean-dust-buildup-from-baseboard",
  },
  {
    id: "toilet_bowl_mineral_scale_heavy",
    surfaceId: "toilet_bowl",
    problemId: "mineral_scale",
    severity: "heavy",
    title: "Heavy mineral scale in toilet bowl",
    summary:
      "Heavy toilet bowl scale needs bathroom descaling chemistry, full contact, and firm brush agitation.",
    recommendedMethodId: "disinfecting_bowl_descaling",
    toolIds: ["toilet_bowl_brush", "detail_brush", "microfiber_towel"],
    chemicalIds: ["disinfecting_bathroom_cleaner"],
    steps: [
      "Apply disinfecting bathroom cleaner or bowl-safe descaling product to the interior bowl surface.",
      "Allow 5-7 minutes dwell time, especially at the waterline.",
      "Scrub thoroughly with a toilet bowl brush, focusing on ring and outlet areas.",
      "Use a detail brush on stubborn upper-ring deposits where appropriate.",
      "Flush or rinse per product workflow and re-check remaining scale.",
      "Repeat one targeted pass if needed.",
    ],
    warnings: [
      "Avoid chemical splash-back during agitation.",
      "Do not mix bathroom products together.",
    ],
    commonMistakes: [
      "Not giving the product enough contact time at the ring line.",
      "Missing the underside of the rim and outlet path.",
    ],
    whenToEscalate: [
      "Escalate if scale appears deeply layered and remains after two passes.",
      "Escalate if staining is structural or bowl finish is compromised.",
    ],
    estimatedMinutesMin: 10,
    estimatedMinutesMax: 15,
    foNotes: [
      "Waterline mineral deposits often need the second focused pass.",
    ],
    seoSlug: "remove-heavy-mineral-scale-from-toilet-bowl",
  },
  {
    id: "sink_faucet_hard_water_spots_medium",
    surfaceId: "sink_faucet",
    problemId: "hard_water_spots",
    severity: "medium",
    title: "Medium hard water spots on sink faucet",
    summary:
      "Use localized acidic spot descaling and detail wiping to restore fixture clarity.",
    recommendedMethodId: "spot_descaling",
    toolIds: ["soft_applicator_pad", "detail_brush", "microfiber_towel"],
    chemicalIds: ["acidic_scale_remover"],
    steps: [
      "Apply acidic scale remover to a towel or applicator, not directly into open fixture gaps.",
      "Allow 1-2 minutes dwell time on spotted areas.",
      "Work the fixture surface with a soft applicator pad.",
      "Use a detail brush around the base and tight creases.",
      "Wipe completely with a damp microfiber towel.",
      "Buff dry to remove residual spotting and streaks.",
    ],
    warnings: [
      "Do not leave acidic chemistry sitting in seams or on delicate finishes.",
      "Avoid overspray onto nearby incompatible surfaces.",
    ],
    commonMistakes: [
      "Spraying directly into fixture seams.",
      "Skipping the dry buff and leaving dull haze.",
    ],
    whenToEscalate: [
      "Escalate if finish wear or plating damage is visible.",
    ],
    estimatedMinutesMin: 5,
    estimatedMinutesMax: 8,
    foNotes: [
      "Fixture clarity is heavily dependent on the final dry buff.",
    ],
    seoSlug: "remove-hard-water-spots-from-sink-faucet",
  },
  {
    id: "microwave_interior_grease_medium",
    surfaceId: "microwave_interior",
    problemId: "grease",
    severity: "medium",
    title: "Medium grease inside microwave",
    summary:
      "Use targeted degreasing and wipe extraction to remove food oils and splatter from the microwave interior.",
    recommendedMethodId: "targeted_degreasing",
    toolIds: ["soft_applicator_pad", "microfiber_towel", "detail_brush", "scraper_non_metal"],
    chemicalIds: ["alkaline_degreaser"],
    steps: [
      "Confirm the microwave is off and cool.",
      "Apply alkaline degreaser to a towel or applicator pad.",
      "Allow 1-2 minutes dwell time on greasy splatter.",
      "Wipe walls, ceiling, and floor of the cavity with controlled pressure.",
      "Use a non-metal scraper on softened stuck-on spots where safe.",
      "Use a detail brush at door edges and vent-like creases.",
      "Finish with a clean damp wipe and dry towel pass.",
    ],
    warnings: [
      "Do not oversaturate vent openings or electrical-adjacent areas.",
      "Do not use metal tools inside the cavity.",
    ],
    commonMistakes: [
      "Ignoring the ceiling panel where grease often bonds first.",
      "Leaving degreaser film behind after removal.",
    ],
    whenToEscalate: [
      "Escalate if residue is carbonized and remains bonded after controlled attempts.",
    ],
    estimatedMinutesMin: 8,
    estimatedMinutesMax: 12,
    foNotes: [
      "Door seam and roof panel usually carry the hidden residue load.",
    ],
    seoSlug: "clean-grease-from-microwave-interior",
  },
];

const surfaceMap = new Map<KnowledgeSurfaceId, KnowledgeSurfaceDefinition>(
  KNOWLEDGE_SURFACES.map((item) => [item.id, item]),
);

const problemMap = new Map<KnowledgeProblemId, KnowledgeProblemDefinition>(
  KNOWLEDGE_PROBLEMS.map((item) => [item.id, item]),
);

const methodMap = new Map<KnowledgeMethodId, KnowledgeMethodDefinition>(
  KNOWLEDGE_METHODS.map((item) => [item.id, item]),
);

const toolMap = new Map<KnowledgeToolId, KnowledgeToolDefinition>(
  KNOWLEDGE_TOOLS.map((item) => [item.id, item]),
);

const chemicalMap = new Map<KnowledgeChemicalId, KnowledgeChemicalDefinition>(
  KNOWLEDGE_CHEMICALS.map((item) => [item.id, item]),
);

function buildScenarioKey(
  surfaceId: KnowledgeSurfaceId,
  problemId: KnowledgeProblemId,
  severity: KnowledgeSeverity,
): string {
  return `${surfaceId}::${problemId}::${severity}`;
}

const scenarioKeyMap = new Map<string, KnowledgeQuickSolveScenario>(
  KNOWLEDGE_SCENARIOS.map((item) => [buildScenarioKey(item.surfaceId, item.problemId, item.severity), item]),
);

export function getKnowledgeSurfaceById(id: KnowledgeSurfaceId): KnowledgeSurfaceDefinition {
  const item = surfaceMap.get(id);
  if (!item) {
    throw new Error(`Unknown knowledge surface: ${id}`);
  }
  return item;
}

export function getKnowledgeProblemById(id: KnowledgeProblemId): KnowledgeProblemDefinition {
  const item = problemMap.get(id);
  if (!item) {
    throw new Error(`Unknown knowledge problem: ${id}`);
  }
  return item;
}

export function getKnowledgeMethodById(id: KnowledgeMethodId): KnowledgeMethodDefinition {
  const item = methodMap.get(id);
  if (!item) {
    throw new Error(`Unknown knowledge method: ${id}`);
  }
  return item;
}

export function getKnowledgeToolById(id: KnowledgeToolId): KnowledgeToolDefinition {
  const item = toolMap.get(id);
  if (!item) {
    throw new Error(`Unknown knowledge tool: ${id}`);
  }
  return item;
}

export function getKnowledgeChemicalById(id: KnowledgeChemicalId): KnowledgeChemicalDefinition {
  const item = chemicalMap.get(id);
  if (!item) {
    throw new Error(`Unknown knowledge chemical: ${id}`);
  }
  return item;
}

export function getKnowledgeScenarioByKey(
  surfaceId: KnowledgeSurfaceId,
  problemId: KnowledgeProblemId,
  severity: KnowledgeSeverity,
): KnowledgeQuickSolveScenario | undefined {
  const exact = scenarioKeyMap.get(buildScenarioKey(surfaceId, problemId, severity));
  if (exact) {
    return exact;
  }

  if (severity !== "medium") {
    const medium = scenarioKeyMap.get(buildScenarioKey(surfaceId, problemId, "medium"));
    if (medium) {
      return medium;
    }
  }

  return KNOWLEDGE_SCENARIOS.find(
    (item) => item.surfaceId === surfaceId && item.problemId === problemId,
  );
}
