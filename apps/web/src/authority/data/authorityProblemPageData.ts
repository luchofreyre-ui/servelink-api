import type { AuthorityProblemPageData } from "@/authority/types/authorityPageTypes";
import type { AuthorityProblemCategory } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_PROBLEM_SLUGS, type AuthorityProblemSlug } from "@/authority/data/authorityTaxonomy";

/** Reusable voice + guardrails for core problem hubs (merged at read time). */
export type AuthorityToneBlock = {
  lead: string;
  subline: string;
  beforeYouClean: string[];
  diagnosticVoiceLines: string[];
};

export const AUTHORITY_CORE_PROBLEM_TONES = {
  "grease-buildup": {
    subline: "This is buildup, not damage. Remove it cleanly without spreading it around.",
    lead: "Grease buildup looks worse than it is. It's usually just layered oils that haven't been fully removed.",
    beforeYouClean: [
      "Do not start with a heavy degreaser. You'll smear it.",
      "Warm water matters more than people think here.",
      "You need removal, not redistribution.",
    ],
    diagnosticVoiceLines: [
      "If it feels slick, it's grease—not damage.",
      "If it smears, you're not breaking it down yet.",
      "If it keeps coming back, you're leaving residue behind.",
    ],
  },
  "hard-water-deposits": {
    subline: "Minerals sit on top. You dissolve them—you don't scrub them off.",
    lead: "Hard water deposits are mineral buildup. Scrubbing alone won't remove them, and can damage the surface.",
    beforeYouClean: [
      "Do not dry scrub this.",
      "Let chemistry do the work first.",
      "Time-on-surface matters more than pressure.",
    ],
    diagnosticVoiceLines: [
      "If it's chalky, it's mineral—not dirt.",
      "If it doesn't budge with scrubbing, you need acid—not force.",
      "If it comes back quickly, water source is the issue.",
    ],
  },
  "mold-growth": {
    subline: "You're not just removing it—you're preventing it from returning.",
    lead: "Mold growth is a moisture problem first, and a cleaning problem second.",
    beforeYouClean: [
      "Do not just wipe the surface.",
      "You need to address moisture, not just visibility.",
      "Disinfecting alone is not enough.",
    ],
    diagnosticVoiceLines: [
      "If it keeps coming back, moisture is still present.",
      "If it spreads, you're disturbing spores without removal.",
      "If it stains, you're dealing with both growth and residue.",
    ],
  },
} as const satisfies Record<string, AuthorityToneBlock>;

function applyCoreProblemTone(
  slug: string,
  base: AuthorityProblemPageData,
): AuthorityProblemPageData {
  const tone = AUTHORITY_CORE_PROBLEM_TONES[slug as keyof typeof AUTHORITY_CORE_PROBLEM_TONES];
  if (!tone) return base;
  return {
    ...base,
    heroSubline: tone.subline,
    whatItUsuallyIs: tone.lead,
    beforeYouClean: tone.beforeYouClean.join("\n\n"),
    diagnosticVoiceLines: [...tone.diagnosticVoiceLines],
  };
}

const M = (slug: string) => `/methods/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const P = (slug: string) => `/problems/${slug}`;

function rpRel(slug: string, title: string) {
  return { slug, title, href: P(slug) };
}

function esMethod(slug: string, title: string, summary?: string) {
  return { slug, title, href: M(slug), summary, kind: "method" as const };
}

function esSurface(slug: string, title: string, summary?: string) {
  return { slug, title, href: S(slug), summary, kind: "surface" as const };
}

function prob(
  slug: string,
  title: string,
  category: AuthorityProblemCategory,
): AuthorityProblemPageData {
  return {
    slug,
    title,
    description: `${title}: what it usually is, safe method fit, and when to stop.`,
    summary: `${title}: identification, method fit, and finish protection.`,
    category,
    symptoms: ["Visible change versus clean baseline", "Recurring pattern after wipes"],
    causes: ["Use environment", "Water chemistry", "Maintenance cadence"],
    whatItUsuallyIs: "A surface-confined soil or film that may be removable with correct technique.",
    whyItHappens: "Soil accumulates where airflow, water, or contact concentrates residue.",
    commonOn: "Residential kitchens and baths; high-touch and wet zones.",
    bestMethods: "Neutral first; escalate only with label checks and spot tests.",
    avoidMethods: "Undocumented mixing, dry abrasion on coatings, and guessing acids on stone.",
    recommendedTools: [{ name: "Microfiber", note: "Dedicated cloths per step." }],
    recommendedChemicals: [{ name: "Surface-appropriate cleaner", note: "Read the label." }],
    commonMistakes: ["Treating damage as removable residue.", "Skipping rinse passes."],
    whenItFails: "If appearance worsens after a careful attempt, assume possible damage—not more force.",
    whenToEscalate: "Manufacturer-sensitive finishes, large areas, or structural moisture.",
    relatedProblems: [],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    relatedSurfaces: [esSurface("tile", "Tile")],
  };
}

type ProblemDepthExpansion = Partial<Omit<AuthorityProblemPageData, "slug" | "title" | "category">>;

const AUTHORITY_PROBLEM_DEPTH_EXPANSIONS: Record<string, ProblemDepthExpansion> = {
  "soap-scum": {
    quickAnswer:
      "Soap scum is a layered bathroom film: soap binders, body oils, minerals, and moisture history. Diagnose it by drag, gray-white film, and where water paths dry.",
    heroSubline:
      "Read it as a soap-mineral-oil system, then clean by layer instead of grinding at the surface.",
    whatItUsuallyIs:
      "Soap scum is a bonded bathroom film made from soap binders, body oils, conditioner residue, and hard-water minerals.\n\nIt usually looks gray-white, waxy, or cloudy; it feels grabby under a fingertip and often thickens on lower glass, grout edges, tub ledges, and shower door overlap zones.",
    whyItHappens:
      "It forms when rinse water leaves surfactants and oils behind, then humidity keeps the film soft enough to accept more mineral and skin oil on the next use.\n\nPoor ventilation, high shower frequency, bar soap, hard water, and skipped dry-downs create a recurrence loop. Once the layer is established, quick sprays often only soften the top while the base film remains.",
    commonOn:
      "Shower glass, tile, grout, acrylic surrounds, fixtures, and tub ledges.\n\nHospitality bathrooms and rental turnovers build it faster because repeated short resets rarely include full rinse, edge detail, and dry-down.",
    bestMethods:
      "Start by confirming film, not etch: wet a small area and check whether clarity improves temporarily.\n\nUse a non-abrasive bathroom or soap-scum workflow with short dwell, soft agitation, thorough rinse, and dry inspection. If minerals are part of the film, step toward hard-water chemistry only where the surface allows it.\n\nMaintenance matters: dry high-splash glass, improve airflow, and remove light film before it hardens into a soap-mineral crust.",
    avoidMethods:
      "Dry abrasive pads on coated glass or acrylic\nAcid guessing on natural stone, colored grout, or unknown sealers\nBleach as the first answer when the problem is soap-mineral film\nLeaving softened scum on the surface without a rinse and dry pass",
    beforeYouClean:
      "Separate soap scum from hard-water spotting: soap scum smears or feels waxy; mineral scale feels chalky and resists surfactants.\n\nTest the finish before acid or abrasive escalation. A cleaner that is safe on porcelain can still dull stone, coated glass, plated fixtures, or acrylic.",
    commonMistakes: [
      "Scrubbing harder instead of giving chemistry enough dwell time.",
      "Using bleach for a mineral-soap film and assuming brightness equals removal.",
      "Skipping rinse, which leaves new surfactant residue for the next layer to bond to.",
      "Treating etched or coating-damaged glass as removable soap scum.",
    ],
    whenItFails:
      "If the area clears while wet but returns uniformly dry, suspect bonded mineral film or glass etching. If it feels rough after cleaning, you may have exposed scale or damaged a coating.\n\nStop escalating when gloss drops, color changes, grout sheds, or the surface looks worse from more pressure.",
    whenToEscalate:
      "Escalate when buildup is layered across coated glass, stone showers, rental turnover bathrooms, or recurring hospitality wet rooms where chemistry choice, ventilation, and maintenance frequency all need to be reset.",
    relatedProblems: [
      rpRel("hard-water-deposits", "Hard water deposits"),
      rpRel("soap-film", "Soap film"),
      rpRel("bathroom-buildup", "Bathroom buildup"),
      rpRel("cloudy-glass", "Cloudy glass"),
      rpRel("light-mildew", "Light mildew appearance"),
    ],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass", "Shows film, spotting, and coating damage early."),
      esSurface("tile", "Tile", "Handles bathroom film when chemistry matches the tile body."),
      esSurface("grout", "Grout", "Collects soap film in porous joint lines."),
    ],
    relatedMethods: [
      esMethod("soap-scum-removal", "Soap scum removal", "Primary film-removal lane for bath residue."),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal", "Use only when mineral bonding is confirmed and the surface allows acid."),
      esMethod("glass-cleaning", "Glass cleaning", "Final clarity and dry inspection lane."),
    ],
  },
  "hard-water-deposits": {
    quickAnswer:
      "Hard water deposits are evaporated minerals, not ordinary dirt. They need surface-safe dissolution, rinse, and recurrence control at the water path.",
    heroSubline:
      "Mineral buildup is a water-chemistry pattern first and a scrubbing problem last.",
    whatItUsuallyIs:
      "Hard water deposits are calcium, magnesium, and other dissolved minerals left behind as water evaporates.\n\nThey usually appear as white spotting, chalky crust, cloudy bands, or ring-shaped deposits. On glass they can mimic haze; on fixtures they can look like corrosion; on grout they can lock into the joint line.",
    whyItHappens:
      "Every wet-dry cycle leaves a little mineral behind. Heat, poor wipe-downs, slow leaks, splash zones, and humid bathrooms accelerate layering.\n\nRecurrence is normal when the source water stays hard or fixtures drip. Cleaning removes the deposit; maintenance frequency controls how fast the next layer bonds.",
    commonOn:
      "Shower glass, chrome and stainless fixtures, faucet bases, tile near shower spray, grout joints, sink rings, and bath floors with repeated splash.\n\nCommercial restrooms and rental bathrooms show heavier scale where high use meets short cleaning windows.",
    bestMethods:
      "Confirm mineral behavior: dry chalk, crisp spot edges, or a ring at evaporation points. Use acid-class chemistry only on compatible surfaces, let it dwell briefly, agitate lightly, then rinse completely.\n\nFor recurring zones, reduce standing water, dry glass and fixtures, repair drips, and schedule descaling before scale becomes crust.",
    avoidMethods:
      "Acids on marble, limestone, travertine, many stone sealers, or unknown finishes\nSteel wool or hard abrasives on plated fixtures and coated glass\nMixing acid products with bleach or disinfectants\nAssuming a cloudy surface is removable scale after careful chemistry has failed",
    beforeYouClean:
      "Name the surface before naming the cleaner. The same deposit that needs acid on glass can be a stop sign on stone.\n\nIf a small test spot dulls, pits, or changes sheen, stop and treat the surface as acid-sensitive.",
    commonMistakes: [
      "Using force when the bond is chemical.",
      "Letting acid dwell too long on fixtures, grout, or coatings.",
      "Cleaning the visible spots while ignoring the drip or splash path that rebuilds them.",
      "Mistaking etching for mineral haze and escalating until the finish is permanently dull.",
    ],
    whenItFails:
      "If compatible acid removes roughness but cloudiness remains, the surface may be etched or coating-damaged. If deposits return within days, the water path or leak is still active.\n\nPersistent white crust in grout can also signal absorbed minerals, not just surface scale.",
    whenToEscalate:
      "Escalate for natural stone, unknown coatings, heavy restroom scale, glass that may be etched, or recurring buildup tied to leaks, failed seals, or high-volume commercial use.",
    relatedProblems: [
      rpRel("limescale-buildup", "Limescale buildup"),
      rpRel("water-spotting", "Water spotting"),
      rpRel("mineral-film", "Mineral film"),
      rpRel("cloudy-glass", "Cloudy glass"),
      rpRel("soap-scum", "Soap scum"),
    ],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass", "Mineral spots and etched-looking haze show quickly."),
      esSurface("grout", "Grout", "Porous lines need extra caution with acids."),
      esSurface("stainless-steel", "Stainless steel", "Fixtures and trim can spot, pit, or discolor if mishandled."),
      esSurface("granite-countertops", "Granite countertops", "Stone requires acid avoidance and sealer awareness."),
    ],
    relatedMethods: [
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("glass-cleaning", "Glass cleaning"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning", "Maintenance lane after deposit removal."),
    ],
  },
  "grease-buildup": {
    quickAnswer:
      "Grease buildup is layered lipid film from cooking aerosols, hand oils, and heat. Break the oil film, rinse it away, and stop cloths from redepositing it.",
    heroSubline:
      "Kitchen grease is an aerosol and heat problem, not just a dirty-counter problem.",
    whatItUsuallyIs:
      "Grease buildup is layered oil that has settled, cooled, and captured dust or food particles.\n\nIt can look yellow, gray, shiny, or matte depending on age. Fresh grease smears; older grease feels tacky, resists water, and darkens around handles, hood edges, cabinet rails, backsplash grout, and appliance fronts.",
    whyItHappens:
      "Cooking aerosol travels with steam and air movement, then condenses on cooler vertical surfaces. Heat polymerizes oils so they behave more like film than fresh splatter.\n\nRecurrence is driven by range use, ventilation quality, hood filter loading, microfiber saturation, over-diluted degreaser, and incomplete rinse.",
    commonOn:
      "Range hoods, cabinet fronts, backsplashes, stainless panels, appliance handles, nearby walls, and counter edges.\n\nCommercial kitchens, break rooms, vacation rentals, and high-turnover units load faster because cooking frequency outruns maintenance detail.",
    bestMethods:
      "Work from light to strong: remove loose dust first, apply kitchen-safe surfactant or degreaser, allow short dwell, wipe with clean faces, rinse or final-wipe to remove cleaner residue, then dry inspect.\n\nFor heavy films, rotate towels aggressively. A loaded microfiber becomes a grease applicator.",
    avoidMethods:
      "Oven-class caustics on cabinets, painted walls, counters, or appliance fronts unless the label explicitly allows it\nPolish-only passes on soil-heavy stainless\nHot surfaces that flash dry cleaner before it can work\nOver-dilution that turns degreasing into smearing",
    beforeYouClean:
      "Dust first if the film looks fuzzy or gray. Dry soil mixed into wet degreaser makes mud and streaking.\n\nVentilate and protect adjacent finishes before stronger degreasers; kitchen-safe does not mean safe for every paint, sealer, or coating.",
    commonMistakes: [
      "Using one towel across the whole kitchen until it redeposits grease.",
      "Skipping a rinse or final wipe, leaving surfactant film that grabs dust.",
      "Using stainless polish as the cleaning step instead of the appearance step.",
      "Borrowing oven cleaner for surfaces it was never meant to touch.",
    ],
    whenItFails:
      "If grease smears but does not lift, chemistry is too weak, dwell is too short, or the towel is saturated. If finish softens, color transfers, or sheen changes, stop before solvent or alkaline damage spreads.",
    whenToEscalate:
      "Escalate for heavy hood films, commercial aerosol loading, rental turnovers with polymerized cabinet grease, or any finish that shows color transfer or softening during a test.",
    relatedProblems: [
      rpRel("kitchen-grease-film", "Kitchen grease film"),
      rpRel("greasy-grime", "Greasy grime"),
      rpRel("cabinet-grime", "Cabinet grime"),
      rpRel("appliance-buildup", "Appliance buildup"),
      rpRel("product-residue-buildup", "Product residue buildup"),
    ],
    relatedSurfaces: [
      esSurface("stainless-steel", "Stainless steel"),
      esSurface("tile", "Tile"),
      esSurface("laminate", "Laminate"),
      esSurface("painted-walls", "Painted walls"),
    ],
    relatedMethods: [
      esMethod("degreasing", "Degreasing"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning", "Reset and maintenance after degreasing."),
    ],
  },
  "dust-buildup": {
    quickAnswer:
      "Dust buildup is a source-control and capture problem: fibers, skin cells, pollen, HVAC fines, pet dander, and static settle faster when filtration or cleaning order is weak.",
    heroSubline:
      "Recurring dust is usually a loop: source, airflow, static, and tool loading.",
    whatItUsuallyIs:
      "Dust buildup is loose particulate soil: textile fibers, skin flakes, pollen, outdoor grit, pet dander, construction fines, and HVAC-borne particles.\n\nIt appears as gray film, edge lines, fan-blade loading, baseboard bands, fuzzy corners, or quick-return haze on glossy surfaces.",
    whyItHappens:
      "Dust follows airflow and static. HVAC gaps, filter bypass, open windows, shedding textiles, pet traffic, dry indoor air, and vacuuming after dusting all reload surfaces.\n\nResidue also matters: tacky polish or cleaner film turns normal dust into recurring buildup.",
    commonOn:
      "Ceiling fans, baseboards, shelves, vents, blinds, electronics, finished wood, floors, and surfaces near doors, textiles, litter boxes, and pet beds.\n\nHigh-traffic offices, rental turnovers, and post-construction rooms need source control before cosmetic wiping.",
    bestMethods:
      "Work top-down with dry capture first: vacuum, HEPA where appropriate, microfiber or electrostatic tools, then damp-clean only where the finish allows.\n\nIf dust returns quickly, inspect filters, mats, textiles, pet zones, static, and whether the last cleaner left tack.",
    avoidMethods:
      "Spraying cleaner directly into dust clouds\nFeather dusting that launches particles into the room\nOily polishes that attract fibers\nDamp wiping unfinished wood, delicate electronics, or loaded dust without dry capture first",
    beforeYouClean:
      "Look for the pattern before wiping it away: vent streaks point to airflow, edge bands point to poor pickup, and fuzzy gray film points to textile or pet sources.\n\nIf the surface feels tacky after dusting, solve residue before blaming the HVAC system.",
    commonMistakes: [
      "Dusting before vacuuming high-shedding floors or textiles.",
      "Using a damp cloth on heavy dust and creating muddy streaks.",
      "Ignoring HVAC filters, return vents, door mats, and pet bedding.",
      "Adding polish to make a surface look clean while building a dust magnet.",
    ],
    whenItFails:
      "If dust returns within hours, the source is still active or the surface is tacky. If wiping creates gray streaks, dry capture was skipped or the cloth was overloaded.",
    whenToEscalate:
      "Escalate for post-construction dust, suspected duct or filtration issues, heavy pet dander cycles, commercial traffic lanes, or fine dust that requires HEPA containment rather than ordinary wiping.",
    relatedProblems: [
      rpRel("residue-buildup", "Residue buildup"),
      rpRel("grime-buildup", "Grime buildup"),
      rpRel("floor-buildup", "Floor buildup"),
      rpRel("fingerprints-and-smudges", "Fingerprints and smudges"),
    ],
    relatedSurfaces: [
      esSurface("finished-wood", "Finished wood"),
      esSurface("vinyl-flooring", "Vinyl flooring"),
      esSurface("painted-walls", "Painted walls"),
      esSurface("laminate", "Laminate"),
    ],
    relatedMethods: [
      esMethod("detail-dusting", "Detail dusting"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
  },
  "light-mildew": {
    quickAnswer:
      "Light mildew appearance is usually surface biofilm in damp, poorly ventilated zones. Remove the film, dry the area, and fix the moisture pattern.",
    whatItUsuallyIs:
      "Light mildew is a surface-level biological film or staining pattern that appears in damp corners, caulk lines, grout edges, and shower tracks.\n\nIt often looks gray, pink, tan, or black-speckled. Unlike soap scum, it clusters where moisture lingers rather than where soap simply dries.",
    whyItHappens:
      "Humidity, poor exhaust, slow-drying joints, organic residue, and repeated wet-dry cycles let surface biology establish.\n\nIf moisture remains, wiping the visible film only resets the clock; it does not break the recurrence cycle.",
    commonOn:
      "Bathrooms, shower tracks, grout lines, silicone, tub corners, laundry areas, and shaded sink zones.",
    bestMethods:
      "Ventilate first, clean soil and soap film, use a label-correct bathroom disinfectant or mildew product on compatible surfaces, respect dwell time, rinse where required, and dry thoroughly.\n\nFollow with airflow and maintenance frequency changes.",
    avoidMethods:
      "Bleach over heavy soap scum without removing the film\nSealing damp grout or caulk\nDry brushing visible growth into the room\nCalling recurring moisture a product failure when ventilation is the driver",
    commonMistakes: [
      "Treating mildew and soap scum as the same problem.",
      "Skipping dry-down after chemistry.",
      "Ignoring failed caulk, slow drains, and closed bathroom doors.",
    ],
    whenItFails:
      "If it returns quickly in the same location, the moisture condition remains. If staining remains after film removal, the issue may be pigment, caulk staining, or deeper growth rather than removable surface mildew.",
    whenToEscalate:
      "Escalate when growth spreads, covers a large area, involves porous materials, returns with a musty odor, or appears connected to leaks, HVAC, wall cavities, or structural moisture.",
    relatedProblems: [
      rpRel("mold-growth", "Mold growth"),
      rpRel("bathroom-buildup", "Bathroom buildup"),
      rpRel("biofilm-buildup", "Biofilm buildup"),
      rpRel("musty-odor", "Musty odor"),
      rpRel("soap-scum", "Soap scum"),
    ],
    relatedSurfaces: [esSurface("grout", "Grout"), esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass")],
    relatedMethods: [
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
      esMethod("soap-scum-removal", "Soap scum removal"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
  },
  "mold-growth": {
    quickAnswer:
      "Mold growth is evidence of a moisture condition. Cleaning visible growth is only one step; source control and escalation boundaries matter.",
    whatItUsuallyIs:
      "Mold growth is active or recurring fungal growth on or into a material. It can appear fuzzy, spotted, smeared, or stained, and it often comes with musty odor or recurring dampness.\n\nSurface-limited bathroom growth is different from growth in drywall, HVAC, insulation, or cavities.",
    whyItHappens:
      "Mold persists when moisture, food source, and time align. Leaks, condensation, poor ventilation, wet porous materials, and trapped humidity are the operational drivers.\n\nIf the moisture source is not corrected, cleaning becomes a cosmetic reset instead of remediation.",
    commonOn:
      "Caulk, grout, tile edges, window frames, under sinks, laundry zones, HVAC-adjacent surfaces, and any material with persistent dampness.",
    bestMethods:
      "Identify and stop moisture first. For small surface-limited areas, use products labeled for the surface and follow dwell, removal, containment, and drying instructions.\n\nFor porous, hidden, or expanding growth, shift from cleaning to professional assessment.",
    avoidMethods:
      "Painting over active growth\nDry sanding or brushing growth without containment\nBleach guessing on porous materials\nContinuing cosmetic cleaning while a leak or humidity problem remains",
    commonMistakes: [
      "Treating mold as a fragrance or disinfectant-only problem.",
      "Cleaning visible spots while ignoring wall, cabinet, or HVAC moisture.",
      "Disturbing growth and spreading debris during dry removal.",
      "Confusing old staining with active growth without checking moisture conditions.",
    ],
    whenItFails:
      "If the stain remains but the surface is dry and clean, it may be residual staining. If growth returns, expands, smells musty, or appears after rain or plumbing use, the moisture source is unresolved.",
    whenToEscalate:
      "Escalate for large areas, porous materials, hidden cavities, HVAC involvement, recurring growth, health-sensitive occupants, or any situation where containment and source correction are unclear.",
    relatedProblems: [
      rpRel("light-mildew", "Light mildew appearance"),
      rpRel("musty-odor", "Musty odor"),
      rpRel("biofilm-buildup", "Biofilm buildup"),
      rpRel("moisture-damage-indicators", "Moisture damage indicators"),
    ].filter((p) => problemSlugExists(p.slug)),
    relatedSurfaces: [esSurface("grout", "Grout"), esSurface("tile", "Tile"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "streaking-on-glass": {
    quickAnswer:
      "Glass streaking is dried residue geometry: towel load, product concentration, minerals, or evaporation lines. Fix pickup and dry-down before adding more spray.",
    whatItUsuallyIs:
      "Streaking on glass is visible wipe direction, squeegee chatter, drip trails, or rainbow film after the surface dries.\n\nIt usually means something remained on the surface: cleaner solids, minerals, oils, lint, or wet film left too thick.",
    whyItHappens:
      "Glass exposes small errors because it reflects light cleanly. Too much product, hard water, dirty cloths, sun-warmed panes, slow pickup, and saturated towels all leave residue edges.\n\nRecurring streaking often comes from towel management, not cleaner strength.",
    commonOn:
      "Shower glass, mirrors, windows, glass doors, stainless-adjacent panels, and high-touch glossy surfaces.",
    bestMethods:
      "Use less liquid, clean towel faces, and a defined wet-clean plus dry-buff sequence. On shower glass, remove soap or mineral film before expecting a glass cleaner to finish perfectly.",
    avoidMethods:
      "More spray on an already wet surface\nPaper or cloth that sheds lint\nCleaning hot glass in direct sun\nTreating etching or coating failure as streak residue",
    commonMistakes: [
      "Reusing the same towel face after it is loaded.",
      "Skipping mineral or soap-film diagnosis on shower glass.",
      "Letting product dry before pickup.",
    ],
    whenItFails:
      "If streaks move with the towel, it is technique or residue. If the same cloudy pattern stays fixed after glass and mineral lanes, suspect etching, coating failure, or embedded damage.",
    whenToEscalate:
      "Escalate for coated glass, tall atrium glass, etched shower doors, or commercial glass where water quality, access, and quality checks need a system.",
    relatedProblems: [
      rpRel("surface-haze", "Surface haze"),
      rpRel("cloudy-glass", "Cloudy glass"),
      rpRel("product-residue-buildup", "Product residue buildup"),
      rpRel("water-spotting", "Water spotting"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
  },
  "surface-haze": {
    quickAnswer:
      "Surface haze is a light-scattering film until proven otherwise. Separate residue, minerals, oils, and actual finish damage before escalating chemistry.",
    whatItUsuallyIs:
      "Surface haze is a cloudy, foggy, rainbow, or uneven sheen that changes how light reflects.\n\nIt may be cleaner residue, mineral film, soap film, grease, dust on tacky residue, micro-scratching, etching, or failing coating.",
    whyItHappens:
      "Haze develops when thin layers dry unevenly or when a finish is altered. Product stacking, hard water, microfiber saturation, oily aerosols, humidity, and abrasive history all change the diagnosis.",
    commonOn:
      "Glass, mirrors, shower doors, glossy tile, quartz, laminate, stainless, and sealed stone.",
    bestMethods:
      "Run the diagnosis in lanes: dry dust if particulate is present, neutral rinse for product film, glass workflow for wipe residue, mineral chemistry only when the surface allows it, then stop if damage remains fixed.",
    avoidMethods:
      "Jumping from haze directly to acid\nAbrasive powders on glossy or coated surfaces\nLayering polish over dirty film\nCalling permanent etch a cleaning failure",
    commonMistakes: [
      "Judging haze while the surface is still wet.",
      "Using shine products to hide residue instead of removing it.",
      "Escalating chemistry without identifying the finish.",
    ],
    whenItFails:
      "If haze moves, smears, or changes with a test lane, it is probably removable film. If it stays fixed from every angle after compatible cleaning, suspect etch, wear, or coating failure.",
    whenToEscalate:
      "Escalate for high-value stone, coated glass, polished concrete, commercial floors, or any haze that appeared after acid, bleach, abrasive pads, or solvent misuse.",
    relatedProblems: [
      rpRel("product-residue-buildup", "Product residue buildup"),
      rpRel("mineral-film", "Mineral film"),
      rpRel("surface-dullness", "Surface dullness"),
      rpRel("etching-on-finishes", "Etching on finishes"),
      rpRel("cloudy-glass", "Cloudy glass"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
  },
  "product-residue-buildup": {
    quickAnswer:
      "Product residue buildup is cleaner left behind: too much product, dirty water, incomplete rinse, or polish stacking. Reset with dilution, pickup, and dry inspection.",
    whatItUsuallyIs:
      "Residue buildup is old cleaner, polish, fragrance, soap, or soil suspended in product film.\n\nIt shows up as tackiness, streaking, footprints, dull lanes, dust attraction, or a surface that looks clean only while wet.",
    whyItHappens:
      "Over-concentration, skipped rinse, loaded mop water, frequent sprays, incompatible products, and insufficient dry pickup leave solids behind.\n\nThe film then grabs dust, fingerprints, pet hair, and traffic soil, causing recurring buildup cycles.",
    commonOn:
      "Floors, countertops, cabinets, glass, stainless, sealed stone, vinyl, and high-touch laminate.",
    bestMethods:
      "Reduce product load, use clean water or neutral cleaner as appropriate, change towels or mop solution often, and finish with a dry or rinse pass.\n\nFor waxy or adhesive residue, use a compatible remover only after a small test.",
    avoidMethods:
      "Adding stronger product before removing old product\nMixing disinfectants, glass cleaners, polishes, and floor concentrates on the same surface\nOver-wetting wood or laminate edges\nUsing shine as proof of cleanliness",
    commonMistakes: [
      "Blaming the surface when the dilution ratio is wrong.",
      "Mopping with dirty solution across multiple rooms.",
      "Leaving residue that becomes the next dust and fingerprint magnet.",
    ],
    whenItFails:
      "If tackiness improves after rinse passes, residue was the driver. If dullness remains after a residue reset, inspect for wear, etch, finish failure, or traffic-pattern abrasion.",
    whenToEscalate:
      "Escalate for large floor resets, commercial residue cycles, finish-stripping decisions, stone or wood sensitivity, and rental turnovers where multiple unknown products were layered.",
    relatedProblems: [
      rpRel("residue-buildup", "Residue buildup"),
      rpRel("floor-residue-buildup", "Floor residue buildup"),
      rpRel("surface-streaking", "Surface streaking"),
      rpRel("surface-haze", "Surface haze"),
      rpRel("sticky-film", "Sticky film"),
    ],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
  },
  "fingerprints-and-smudges": {
    quickAnswer:
      "Fingerprints are transfer soils: skin oils, lotion, food film, and touchpoint residue. They need soil removal and dry buffing, not just shine.",
    whatItUsuallyIs:
      "Fingerprints and smudges are oily transfer marks that distort gloss or darken matte surfaces.\n\nThey cluster at handles, appliance fronts, cabinet pulls, doors, switches, railings, glass edges, and child or pet-height zones.",
    whyItHappens:
      "Hands transfer oils, lotions, food residue, sanitizer film, and fine dust. Glossy surfaces show it first; textured or matte surfaces hold it longer.\n\nFrequent touchpoints in rentals, offices, hospitality rooms, and family kitchens need a maintenance rhythm, not occasional spot chasing.",
    commonOn:
      "Stainless steel, glass, painted doors, laminate cabinets, quartz, light switches, handrails, and appliance handles.",
    bestMethods:
      "Remove actual soil first with a low-residue cleaner matched to the surface, then dry buff. On stainless, follow grain and separate degreasing from appearance polish.",
    avoidMethods:
      "Oil polish over dirty fingerprints\nAggressive solvents on painted or coated surfaces\nWet wiping touchpoints without drying\nTreating hygiene disinfecting as a substitute for soil removal",
    commonMistakes: [
      "Polishing fingerprints into stainless instead of cleaning them off.",
      "Using one damp towel across many handles.",
      "Ignoring sanitizer and lotion residue as part of the film.",
    ],
    whenItFails:
      "If smudges return immediately, the towel or polish is redepositing oil. If marks are permanent shadows, inspect for wear, abrasion, or finish burnishing at the touchpoint.",
    whenToEscalate:
      "Escalate for specialty appliance coatings, black stainless, matte paint, high-traffic commercial touchpoints, or finishes that color-transfer during cleaning.",
    relatedProblems: [
      rpRel("smudge-marks", "Smudge marks"),
      rpRel("touchpoint-contamination", "Touchpoint contamination"),
      rpRel("grease-buildup", "Grease buildup"),
      rpRel("product-residue-buildup", "Product residue buildup"),
    ],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("shower-glass", "Shower glass"), esSurface("painted-walls", "Painted walls"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
  },
  "odor-retention": {
    quickAnswer:
      "Odor retention means the source is still present or the material is holding odor compounds. Remove soil, match odor chemistry, and fix moisture or biology.",
    whatItUsuallyIs:
      "Odor retention is smell that returns after the surface looks clean. It can live in organic film, drains, trash zones, laundry, pet contamination, porous grout, soft goods, or damp cavities.\n\nA fragrance cover-up is not source removal.",
    whyItHappens:
      "Odor molecules bind to oils, proteins, damp fibers, biofilm, and porous materials. Heat and humidity release them again, so the room smells clean briefly and then rebounds.",
    commonOn:
      "Pet zones, bathrooms, kitchens, bins, drains, laundry areas, carpets, upholstery, grout, and rental turnover spaces.",
    bestMethods:
      "Find the source pattern first: organic stain, biofilm, moisture, drain debris, fabric, or trash. Clean visible soil, then use enzyme, neutralizer, disinfectant, or extraction only when it matches the source and label.",
    avoidMethods:
      "Fragrance-only masking\nDisinfectant as a universal odor fix\nOver-wetting fabrics or porous floors\nSealing in odor before the source is removed",
    commonMistakes: [
      "Treating pet urine like general room odor.",
      "Skipping extraction or rinse after breaking down organic residue.",
      "Ignoring dampness and biofilm in drains or grout.",
    ],
    whenItFails:
      "If odor returns with humidity, moisture or porous absorption is likely. If it returns near drains or bins, hidden organic film is still active. If it returns after pet cleanup, contamination may extend below the visible surface.",
    whenToEscalate:
      "Escalate for pet contamination in subfloors, persistent musty odor, commercial restroom odor cycles, rental turnover odor, sewage or drain concerns, or soft surfaces requiring extraction.",
    relatedProblems: [
      rpRel("musty-odor", "Musty odor"),
      rpRel("organic-stains", "Organic stains"),
      rpRel("biofilm-buildup", "Biofilm buildup"),
      rpRel("laundry-odor", "Laundry odor"),
      rpRel("mold-growth", "Mold growth"),
    ],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("grout", "Grout"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning")],
  },
  "surface-discoloration": {
    quickAnswer:
      "Discoloration can be soil, staining, UV/heat aging, chemical change, or moisture damage. Test removability before treating it like dirt.",
    whatItUsuallyIs:
      "Surface discoloration is a color shift: yellowing, darkening, brown rings, gray lanes, orange staining, or uneven patches.\n\nSome discoloration is removable soil; some is absorbed pigment, oxidation, UV aging, heat damage, sealer change, or moisture indicator.",
    whyItHappens:
      "Color changes follow exposure history: sunlight, heat, standing water, dyes, food acids, metal contact, pet accidents, cleaner misuse, and traffic abrasion.\n\nRecurring discoloration often means the cause is still present or the material has already changed.",
    commonOn:
      "Vinyl, laminate, painted walls, plastic trim, sealed stone, grout, appliance handles, and floors under mats or furniture.",
    bestMethods:
      "Compare with a protected baseline, test a small area, and identify whether color lifts, lightens, or stays fixed. Use stain-removal lanes only when the material allows it.",
    avoidMethods:
      "Bleach guessing on plastics, stone, grout, or colored finishes\nAbrasive brightening that removes finish\nAcid on stone or vulnerable sealers\nAssuming every yellow or brown mark is removable",
    commonMistakes: [
      "Over-cleaning permanent UV or heat aging.",
      "Using stain removers without identifying the material.",
      "Ignoring moisture indicators near edges, seams, and walls.",
    ],
    whenItFails:
      "If color does not transfer or lighten in a safe test, it may be finish or material change. If discoloration expands, softens, bubbles, or smells musty, treat it as possible moisture damage.",
    whenToEscalate:
      "Escalate for stone staining, moisture indicators, widespread floor discoloration, unknown chemical burns, rental turnover stains, or surfaces with warranty-sensitive finishes.",
    relatedProblems: [
      rpRel("yellowing", "Yellowing"),
      rpRel("plastic-yellowing", "Plastic yellowing"),
      rpRel("organic-stains", "Organic stains"),
      rpRel("surface-dullness", "Surface dullness"),
      rpRel("heat-damage-marks", "Heat damage marks"),
    ],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls"), esSurface("granite-countertops", "Granite countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning")],
  },
  "surface-dullness": {
    quickAnswer:
      "Surface dullness is either removable film or finish change. Diagnose with rinse, dry inspection, and damage history before adding polish or acid.",
    whatItUsuallyIs:
      "Dullness is loss of sheen, clarity, or reflectivity. It may be residue, mineral haze, grease film, traffic wear, micro-scratches, etching, sealer fatigue, or moisture damage.\n\nThe key diagnostic question is whether the sheen changes after a controlled test.",
    whyItHappens:
      "Dullness develops from film stacking, abrasive pads, acidic or alkaline misuse, repeated traffic lanes, UV, heat, or worn coatings.\n\nFloors and counters often show dullness where maintenance frequency does not match use intensity.",
    commonOn:
      "Vinyl flooring, finished wood, sealed stone, quartz, laminate, glossy tile, glass, and appliance fronts.",
    bestMethods:
      "Reset residue first with neutral cleaning and dry inspection. If sheen returns while wet but disappears dry, inspect for haze, etch, wear, or coating failure.\n\nPreserve the finish: maintenance cleaning is not restoration.",
    avoidMethods:
      "Abrasive pads to chase shine\nAcids on stone or sealed finishes\nWax or polish over soil\nAssuming dull traffic lanes are just dirty",
    commonMistakes: [
      "Adding shine products before removing residue.",
      "Over-scrubbing worn traffic lanes.",
      "Missing acid or abrasive damage history.",
    ],
    whenItFails:
      "If dullness remains fixed after residue removal, it is likely wear, etch, or finish change. More cleaning can widen the damaged area.",
    whenToEscalate:
      "Escalate for stone etch, wood finish dulling, commercial floor traffic lanes, wax/finish stripping questions, or any premium finish where restoration is different from cleaning.",
    relatedProblems: [
      rpRel("dullness", "Dullness"),
      rpRel("surface-haze", "Surface haze"),
      rpRel("etching-on-finishes", "Etching on finishes"),
      rpRel("uneven-finish", "Uneven finish"),
      rpRel("floor-buildup", "Floor buildup"),
    ],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("finished-wood", "Finished wood"), esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "floor-residue-buildup": {
    quickAnswer:
      "Floor residue buildup is usually mop redeposit: too much cleaner, dirty solution, hard water, or incomplete pickup. It shows as tack, dullness, footprints, and traffic lanes.",
    whatItUsuallyIs:
      "Floor residue is a thin film of cleaner, soil, minerals, or old finish that remains after mopping.\n\nIt often appears as dull lanes, sticky feel, shoe prints that return quickly, gray edges, or patchy gloss under light.",
    whyItHappens:
      "Floors receive the most soil and the dirtiest water. Over-concentrated product, infrequent water changes, dirty pads, high traffic, pet soil, and quick-dry passes leave residue behind.\n\nIn commercial or rental settings, short reset windows often clean appearance but leave the film cycle intact.",
    commonOn:
      "Vinyl, tile, laminate, sealed concrete, entry lanes, kitchens, bathrooms, pet routes, and high-traffic corridors.",
    bestMethods:
      "Dry remove grit first, use correct dilution, change solution or pads before they load, rinse if residue exists, and dry inspect traffic lanes separately from edges.",
    avoidMethods:
      "More concentrate for a dirtier floor\nSoaking seams or laminate edges\nSteam or harsh strippers on finishes not rated for them\nPolish layers over sticky soil",
    commonMistakes: [
      "Mopping before vacuuming grit and hair.",
      "Using the same dirty solution across multiple rooms.",
      "Confusing worn finish with removable film.",
    ],
    whenItFails:
      "If tack improves after rinse, residue was the issue. If dull lanes remain fixed, inspect for wear, finish damage, or embedded traffic soil.",
    whenToEscalate:
      "Escalate for commercial traffic-pattern wear, rental turnover floors with unknown product layers, stripping decisions, pet contamination below seams, or moisture-sensitive flooring.",
    relatedProblems: [
      rpRel("floor-buildup", "Floor buildup"),
      rpRel("product-residue-buildup", "Product residue buildup"),
      rpRel("sticky-film", "Sticky film"),
      rpRel("surface-dullness", "Surface dullness"),
      rpRel("grime-buildup", "Grime buildup"),
    ],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
  },
  "sticky-film": {
    quickAnswer:
      "Sticky film is tacky residue from sugar, soap, grease, adhesive, or cleaner solids. Identify whether it dissolves, emulsifies, or gums before escalating.",
    whatItUsuallyIs:
      "Sticky film is surface tack that grabs dust, hair, lint, or fingerprints. It may come from sugary spills, kitchen aerosols, soap residue, adhesive plasticizers, floor cleaner, or over-applied polish.",
    whyItHappens:
      "Tack remains when residue is softened but not removed, when product is over-concentrated, or when warm oils cool into a film.\n\nIt recurs fast because dust and traffic stick to it immediately.",
    commonOn:
      "Counters, cabinet edges, appliance handles, floors, child-height walls, pet feeding zones, and adhesive or label areas.",
    bestMethods:
      "Test behavior: water-softening suggests sugar or soap, surfactant response suggests grease, solvent response suggests adhesive. Use short dwell, clean pickup, rinse, and dry inspection.",
    avoidMethods:
      "Grinding sticky residue into porous grout\nSolvents on paint, stone, or plastics without a spot test\nLeaving loosened residue wet on the surface\nAssuming tack is always food soil",
    commonMistakes: [
      "Wiping tack in a wider circle instead of lifting it.",
      "Using hot water on finishes that cannot tolerate heat or moisture.",
      "Skipping the final rinse that removes loosened film.",
    ],
    whenItFails:
      "If tack smears, the chemistry is only softening it. If the surface dulls or swells, stop and reassess finish sensitivity.",
    whenToEscalate:
      "Escalate for adhesive-style residue on specialty finishes, widespread sticky floors, pet-related contamination, or surfaces showing swelling, color transfer, or coating softening.",
    relatedProblems: [
      rpRel("adhesive-residue", "Adhesive residue"),
      rpRel("product-residue-buildup", "Product residue buildup"),
      rpRel("grease-buildup", "Grease buildup"),
      rpRel("floor-residue-buildup", "Floor residue buildup"),
    ],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "bathroom-buildup": {
    quickAnswer:
      "Bathroom buildup is a stack: soap film, minerals, biofilm, humidity, and rinse failure. Diagnose the dominant layer before choosing acid, disinfectant, or soap-scum chemistry.",
    whatItUsuallyIs:
      "Bathroom buildup is layered residue in wet rooms. It can show as gray soap film, white mineral spotting, pink or dark biofilm, musty odor, dull grout, or cloudy glass.\n\nCorners and edges tell the truth before broad tile fields do.",
    whyItHappens:
      "Bathrooms combine water hardness, body oils, soap, humidity, poor airflow, and frequent wet-dry cycles. Each shower adds a layer; poor dry-down and weak ventilation keep it active.",
    commonOn:
      "Shower glass, tile, grout, caulk, fixtures, tub ledges, shower tracks, sink bases, and restroom floors.",
    bestMethods:
      "Map the layer: mineral, soap, biofilm, or residue. Ventilate, pre-rinse, use matched chemistry with dwell, detail edges and grout, rinse thoroughly, and dry key zones.\n\nMaintenance frequency is the fix for recurrence.",
    avoidMethods:
      "One harsh product for every bathroom surface\nBleach over soap and mineral layers\nAcid on stone or unknown grout sealers\nIgnoring exhaust fan performance and standing water",
    commonMistakes: [
      "Cleaning open tile while leaving corners, tracks, and caulk loaded.",
      "Confusing mildew staining with active growth.",
      "Skipping dry-down after deep cleaning.",
    ],
    whenItFails:
      "If buildup returns in the same path, moisture and use pattern are driving it. If dullness remains after film removal, inspect for etch, sealer damage, or scratched acrylic.",
    whenToEscalate:
      "Escalate for commercial restrooms, hospitality showers, rental turnovers, stone bathrooms, recurring mildew, or heavy mineral scale tied to leaks or ventilation failure.",
    relatedProblems: [
      rpRel("soap-scum", "Soap scum"),
      rpRel("hard-water-deposits", "Hard water deposits"),
      rpRel("light-mildew", "Light mildew appearance"),
      rpRel("biofilm-buildup", "Biofilm buildup"),
      rpRel("musty-odor", "Musty odor"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile"), esSurface("grout", "Grout")],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
  },
  "kitchen-grease-film": {
    quickAnswer:
      "Kitchen grease film is airborne oil that settles on cool surfaces. Ventilation, degreaser dwell, towel rotation, and rinse control determine whether it lifts or smears.",
    whatItUsuallyIs:
      "Kitchen grease film is a thin aerosolized lipid layer, often mixed with dust and food vapor.\n\nIt shows as yellow tack, matte haze, fingerprints that smear, sticky cabinet rails, and darkening near hoods, handles, and backsplash grout.",
    whyItHappens:
      "Cooking heat atomizes oils; exhaust pulls some out and spreads some onto nearby surfaces. Hood filters, poor capture, frequent frying, and hot surfaces increase loading.\n\nFilm becomes harder as oils oxidize and polymerize.",
    commonOn:
      "Hoods, cabinet faces, backsplash tile, stainless appliances, microwave fronts, counters near ranges, and painted walls close to cooking zones.",
    bestMethods:
      "Dust first if gray film is present, then use kitchen-safe degreaser or surfactant with short dwell. Wipe in controlled sections, rotate cloths, rinse where needed, and finish dry.",
    avoidMethods:
      "Oven cleaner overspray on cabinets or painted walls\nPolish-only stainless passes on oily soil\nCleaning hot surfaces that flash dry\nUnder-ventilated degreasing in tight kitchens",
    commonMistakes: [
      "Using weak dilution and calling the grease stubborn.",
      "Spreading oil with a loaded towel.",
      "Ignoring hood filters as the recurrence source.",
    ],
    whenItFails:
      "If film smears, increase dwell or towel rotation before increasing strength. If paint or finish softens, stop and move to a finish-safe process.",
    whenToEscalate:
      "Escalate for commercial aerosol loading, heavy hood buildup, rental turnover kitchens, or cabinet finishes with unknown coatings.",
    relatedProblems: [
      rpRel("grease-buildup", "Grease buildup"),
      rpRel("exhaust-hood-film", "Exhaust hood film"),
      rpRel("cabinet-grime", "Cabinet grime"),
      rpRel("appliance-buildup", "Appliance buildup"),
    ],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile"), esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "mineral-film": {
    quickAnswer:
      "Mineral film is thin hardness residue from drying water. It reads as haze before it becomes scale, and acid only belongs on compatible surfaces.",
    whatItUsuallyIs:
      "Mineral film is early-stage hard-water residue: a cloudy sheen, fine spotting, or faint drag instead of thick crust.\n\nIt often appears on glass, tile, fixtures, and grout near repeated splash or evaporation paths.",
    whyItHappens:
      "Water evaporates and leaves dissolved minerals. Heat, airflow, hard water, slow drying, and poor squeegee or towel habits control how quickly the film returns.",
    commonOn:
      "Shower glass, chrome, stainless, glossy tile, grout lines, sink bases, and bath floors near fixtures.",
    bestMethods:
      "Start with neutral or glass maintenance for light film, then escalate to surface-safe mineral chemistry only when needed. Rinse and dry so dissolved minerals do not redeposit.",
    avoidMethods:
      "Acids on stone or unknown sealers\nScrubbing mineral haze with abrasive pads\nSkipping rinse after descaling\nTreating etched glass as removable film",
    commonMistakes: [
      "Waiting until film becomes limescale.",
      "Using acid as routine maintenance on vulnerable finishes.",
      "Ignoring drips and splash patterns.",
    ],
    whenItFails:
      "If mineral film returns quickly, the water path is unchanged. If compatible mineral chemistry does not improve clarity, inspect for etching, coating failure, or soap film.",
    whenToEscalate:
      "Escalate for stone bathrooms, recurring commercial restroom spotting, etched glass, or scale tied to plumbing leaks.",
    relatedProblems: [
      rpRel("hard-water-deposits", "Hard water deposits"),
      rpRel("water-spots", "Water spots"),
      rpRel("limescale-buildup", "Limescale buildup"),
      rpRel("surface-haze", "Surface haze"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile"), esSurface("grout", "Grout"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("glass-cleaning", "Glass cleaning")],
  },
  "cloudy-glass": {
    quickAnswer:
      "Cloudy glass can be soap film, mineral haze, product residue, or permanent etch. If clarity only improves while wet, diagnose before scrubbing harder.",
    whatItUsuallyIs:
      "Cloudy glass is reduced clarity: milkiness, fog, mineral haze, wipe film, or etched-looking patches.\n\nThe pattern matters: spots suggest minerals, broad waxy drag suggests soap film, fixed uniform milkiness can indicate etch or coating failure.",
    whyItHappens:
      "Soap, minerals, humidity, product residue, hard water, and aggressive cleaning history all interact on glass.\n\nCoated shower glass is especially sensitive because the wrong chemistry can damage the surface while the original film remains.",
    commonOn:
      "Shower doors, bath partitions, mirrors, glass tile, and high-humidity windows.",
    bestMethods:
      "Run sequential tests: glass cleaner for residue, soap-scum lane for waxy film, mineral lane only if compatible, then stop if the pattern remains fixed.\n\nUse dry inspection from multiple angles before declaring success.",
    avoidMethods:
      "Abrasive powders or pads on coated glass\nAcid guessing without knowing glass/coating rules\nContinuing to scrub fixed etching\nLeaving rinse water to dry back into new spots",
    commonMistakes: [
      "Calling every cloudy door hard water.",
      "Using glass spray on heavy soap film and expecting clarity.",
      "Over-cleaning permanent etch.",
    ],
    whenItFails:
      "If the cloudiness clears wet and returns dry, film or etch is likely. If mineral and soap lanes both fail in safe tests, treat it as damage or coating failure.",
    whenToEscalate:
      "Escalate for coated shower glass, etched doors, rental turnover glass with unknown product history, or commercial glass where replacement versus restoration needs assessment.",
    relatedProblems: [
      rpRel("glass-cloudiness", "Glass cloudiness"),
      rpRel("hard-water-deposits", "Hard water deposits"),
      rpRel("soap-scum", "Soap scum"),
      rpRel("surface-haze", "Surface haze"),
      rpRel("etching-on-finishes", "Etching on finishes"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")],
  },
  "grime-buildup": {
    quickAnswer:
      "Grime buildup is mixed soil: dust plus oil plus traffic residue. Remove dry particulate first, then break the oily or sticky binder.",
    whatItUsuallyIs:
      "Grime is dark, textured, or sticky mixed soil. It collects where hands, air movement, cooking aerosol, pets, and foot traffic concentrate.\n\nIt often appears along trim, cabinet rails, floor edges, entry lanes, and textured surfaces.",
    whyItHappens:
      "Dry soil becomes grime when it binds with oils, humidity, food residue, or cleaner film. Traffic pressure and repeated light cleaning compact it into edges and textures.",
    commonOn:
      "Baseboards, cabinets, painted walls, tile, stainless, vinyl floors, entry zones, pet routes, and rental turnover kitchens.",
    bestMethods:
      "Vacuum or dry dust first, then use surfactant or degreasing chemistry matched to the finish. Work small sections and rinse where cleaner load is visible.",
    avoidMethods:
      "Wet wiping heavy dry soil into mud\nStrong degreasers on soft paint or wood without testing\nIgnoring edges and texture where grime actually lives\nAbrasive scrubbing that removes finish before soil",
    commonMistakes: [
      "Treating grime as just dust.",
      "Using clean-looking but saturated cloths.",
      "Skipping corner and edge detail in high-traffic rooms.",
    ],
    whenItFails:
      "If darkening remains after soil removal, inspect for wear, staining, or finish burnishing. If grime returns quickly, source control or maintenance frequency is insufficient.",
    whenToEscalate:
      "Escalate for commercial traffic lanes, heavy rental turnover grime, smoke or cooking aerosol history, and finish-sensitive paint or wood.",
    relatedProblems: [
      rpRel("greasy-grime", "Greasy grime"),
      rpRel("dust-buildup", "Dust buildup"),
      rpRel("kitchen-grease-film", "Kitchen grease film"),
      rpRel("floor-buildup", "Floor buildup"),
    ],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls"), esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("detail-dusting", "Detail dusting"), esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "biofilm-buildup": {
    quickAnswer:
      "Biofilm buildup is a moisture-fed organic film. It is not solved by scent; remove soil, use label-correct chemistry, and dry the habitat.",
    whatItUsuallyIs:
      "Biofilm is a slick or colored biological layer that forms where moisture and organic residue persist.\n\nIt can look pink, gray, tan, dark, or translucent, often with slippery feel or recurring odor.",
    whyItHappens:
      "Water, soap residue, skin oils, food particles, drains, and poor airflow create a habitat. The film protects itself, so casual wiping often leaves enough behind to regrow.",
    commonOn:
      "Shower corners, drains, sink rims, grout, tile, refrigerator gaskets, trash zones, pet bowls, and restroom floors.",
    bestMethods:
      "Remove gross soil first, apply compatible chemistry with proper dwell, agitate texture, rinse where required, and dry the zone. Maintenance should reduce moisture and food source.",
    avoidMethods:
      "Fragrance-only treatment\nDisinfecting over visible soil\nDry brushing film into the room\nIgnoring slow drains, splash zones, and poor airflow",
    commonMistakes: [
      "Confusing biofilm with simple soap film.",
      "Missing underside edges and drain contact points.",
      "Stopping before the surface is dry.",
    ],
    whenItFails:
      "If slickness or odor returns, film remains in texture, drain edges, or wet seams. If dark growth spreads, reassess as mold or moisture damage.",
    whenToEscalate:
      "Escalate for recurring commercial restroom biofilm, food-service zones, musty odor, porous materials, or suspected hidden moisture.",
    relatedProblems: [
      rpRel("light-mildew", "Light mildew appearance"),
      rpRel("mold-growth", "Mold growth"),
      rpRel("odor-retention", "Odor retention"),
      rpRel("bathroom-buildup", "Bathroom buildup"),
    ],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("grout", "Grout"), esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("touchpoint-sanitization", "Touchpoint sanitization"), esMethod("soap-scum-removal", "Soap scum removal"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
};

function applyProblemDepthExpansion(
  slug: string,
  base: AuthorityProblemPageData,
): AuthorityProblemPageData {
  const expansion = AUTHORITY_PROBLEM_DEPTH_EXPANSIONS[slug];
  if (!expansion) return base;
  return { ...base, ...expansion };
}

const PROBLEMS: Record<string, AuthorityProblemPageData> = {
  "soap-scum": {
    ...prob("soap-scum", "Soap scum", "residue"),
    summary:
      "Soap scum is a grabby bathroom film from soap, minerals, and oils—remove it with the right cleaner order, not guesswork.",
    problemDefinitionLine:
      "A film of soap residue, hard-water minerals, and body oils on wet surfaces—often mistaken for permanent damage.",
    executionQuickFix: {
      use: "Neutral bathroom cleaner (non-abrasive).",
      do: "Spray → wait 1–2 min → soft scrub → rinse.",
      ifNeeded: "Stronger cleaner if needed. No abrasives on delicate surfaces.",
    },
    whyThisWorksShort:
      "Soap scum is a surface film. Gentle cleaners break it up without damaging the material.",
    whatItUsuallyIs:
      "Soap scum is a surface film made from soap residue, minerals in water, and body oils.\n\nIt builds up in layers and can look like staining or damage, especially on grout, tile, and glass.",
    whyItHappens:
      "It forms in areas that stay damp and don't get fully rinsed.\n\nOver time, residue layers combine with minerals in the water, creating a film that becomes harder to remove the longer it sits.",
    commonOn:
      "Showers, grout lines, glass, and any surface that regularly stays wet.\n\nHigh-use areas build it faster, especially where airflow is limited.",
    beforeYouClean:
      "Spot-test first. Go gentle → stronger; don’t guess acids on stone or coated glass.\n\nIf the look or feel changes after a pass, stop immediately—more chemistry usually makes it worse.",
    bestMethods:
      "Start with a neutral cleaner and a soft tool to break up the film.\n\nIf buildup remains, step up gradually—don't jump straight to harsh chemicals.\n\nRinsing thoroughly matters just as much as the cleaner you use.",
    avoidMethods:
      "Jumping straight to strong acids\nDry scrubbing on sensitive finishes\nMixing products without knowing compatibility\nAssuming all buildup is removable residue",
    whenItFails:
      "If the surface gets dull, rough, or worse after cleaning, you may be dealing with damage—not residue.\n\nAt that point, more cleaning won't fix it.",
    diagnosticVoiceLines: [
      "You don't need anything aggressive to fix this.",
      "This is where most people go wrong.",
      "If it gets worse, stop—this usually means damage.",
    ],
  },
  "grease-buildup": {
    ...prob("grease-buildup", "Grease buildup", "oil_based"),
    summary:
      "Kitchen grease: degrease with label-safe chemistry, rinse, protect finishes.",
    problemDefinitionLine:
      "Layered cooking oil on hoods, backsplashes, and appliances—degrease, then rinse.",
    executionQuickFix: {
      use: "Degreasing cleaner (kitchen-safe)",
      do: "Spray → wait 1–2 min → wipe or soft scrub → rinse",
      ifNeeded: "Repeat or use stronger degreaser. Avoid harsh scrubbing on finishes.",
    },
    whyThisWorksShort:
      "Grease is oil-based. Degreasers break it down so it can be removed from the surface.",
    decisionShortcuts: [
      {
        label: "Light buildup on everyday hard surfaces",
        body: "Start with surfactant-forward cleaners you can rinse clean; escalate only if soil stays after a careful pass.",
        productSlugs: ["dawn-platinum-dish-spray"],
      },
      {
        label: "Heavy hood or cooktop grease films",
        body: "Use labeled kitchen degreasers with ventilation—oven cleaners and broad industrial SKUs are for different jobs.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "weiman-gas-range-cleaner-degreaser"],
      },
      {
        label: "Delicate or sealed stone finishes",
        body: "Default to stone-rated maintenance chemistry; do not borrow cooktop degreasers without a label check.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
    ],
    bestBySurfaceExtras: [
      {
        line: "Cooktops (smudges / light film): Cerama Bryte or Weiman cooktop products beat heavy hood degreasers.",
        href: "/products/cerama-bryte-cooktop-cleaner",
      },
      {
        line: "Range hoods (greasy film): Krud Kutter Kitchen or Weiman cooktop degreaser.",
        href: "/products/krud-kutter-kitchen-degreaser",
      },
      {
        line: "Stainless fronts / appliances: appearance polishes vs true degreasing—match chemistry to soil depth.",
        href: "/products/weiman-stainless-steel-cleaner-polish",
      },
    ],
    productScenarios: [
      {
        problem: "grease buildup",
        surface: "kitchen",
        products: [
          { slug: "dawn-platinum-dish-spray", name: "Dawn Platinum EZ-Squeeze Dish Spray" },
          { slug: "krud-kutter-kitchen-degreaser", name: "Krud Kutter Kitchen Degreaser" },
        ],
      },
    ],
  },
  "hard-water-deposits": {
    ...prob("hard-water-deposits", "Hard water deposits", "mineral"),
    summary:
      "Hard water leaves mineral residue—dissolve with surface-safe acids, then rinse.",
    problemDefinitionLine:
      "Mineral buildup left behind when water evaporates, often appearing as white or cloudy residue.",
    executionQuickFix: {
      use: "Acid-based cleaner (safe for the surface)",
      do: "Apply → wait 1–3 min → light scrub → rinse",
      ifNeeded: "Repeat or increase dwell time. Avoid acids on stone.",
    },
    whyThisWorksShort:
      "Hard water deposits are mineral-based. Acids dissolve the minerals so they can be removed.",
    decisionShortcuts: [
      {
        label: "Light spotting on glass or chrome",
        body: "Try glass-focused maintenance first; acids are powerful—respect labels and dwell.",
        productSlugs: ["windex-original-glass-cleaner"],
      },
      {
        label: "Visible scale or stubborn mineral film",
        body: "Acid descalers win when the surface allows it—never guess on acid-sensitive stone.",
        productSlugs: ["clr-calcium-lime-rust", "zep-calcium-lime-rust-remover"],
      },
      {
        label: "Stone or unknown sealers",
        body: "Pause and use stone-rated products; vinegar and CLR-class acids can etch or dull the wrong finish.",
        productSlugs: ["granite-gold-daily-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "hard water",
        surface: "fixtures",
        products: [
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "zep-calcium-lime-rust-remover", name: "Zep Calcium, Lime & Rust Remover" },
        ],
      },
    ],
  },
  "dust-buildup": {
    ...prob("dust-buildup", "Dust buildup", "organic"),
    problemDefinitionLine:
      "Loose dry soil and fibers that resettle after wiping—capture first, then damp-clean only where the finish allows.",
    executionQuickFix: {
      use: "Dry microfiber or electrostatic duster; damp cleaner only after dry soil is lifted.",
      do: "Top-down → edges → floors; vacuum or dry-dust first → then light damp pass on hard surfaces.",
      ifNeeded:
        "If dust returns in hours, check HVAC filters, textiles shedding, and whether you are smearing with a loaded cloth.",
    },
    whyThisWorksShort:
      "Dust is mostly particles and lint. Dry capture removes bulk; damp passes lift what clings without turning it into muddy streaks.",
    decisionShortcuts: [
      {
        label: "Hard floors and open areas",
        body: "Dry soil first—neutral damp mopping beats soaking when the goal is dust, not disinfecting.",
        productSlugs: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      },
      {
        label: "Counters, shelves, and baseboards",
        body: "Light all-purpose pass after dry dusting; avoid heavy fragrance loads that leave film.",
        productSlugs: ["simple-green-all-purpose-cleaner", "seventh-generation-disinfecting-multi-surface-cleaner"],
      },
      {
        label: "Glass and glossy finishes showing dust trails",
        body: "Finish with a dry buff; if haze persists, treat as residue—not more dust.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "dust buildup",
        surface: "hardwood",
        products: [
          { slug: "bona-hard-surface-floor-cleaner", name: "Bona Hard-Surface Floor Cleaner" },
          { slug: "zep-neutral-ph-floor-cleaner", name: "Zep Neutral pH Floor Cleaner" },
          { slug: "method-all-purpose-cleaner", name: "Method All-Purpose Cleaner (Pink Grapefruit)" },
        ],
      },
      { problem: "dust buildup", surface: "laminate" },
      { problem: "dust buildup", surface: "tile" },
    ],
    relatedProblems: [
      rpRel("general-soil", "General soil"),
      rpRel("floor-residue-buildup", "Floor residue buildup"),
      rpRel("fingerprints-and-smudges", "Fingerprints and smudges"),
    ],
  },
  "fingerprints-and-smudges": prob("fingerprints-and-smudges", "Fingerprints and smudges", "transfer"),
  "stuck-on-residue": prob("stuck-on-residue", "Stuck-on residue", "residue"),
  "light-mildew": {
    ...prob("light-mildew", "Light mildew appearance", "biological"),
    problemDefinitionLine:
      "A thin biofilm on damp bathroom surfaces—usually surface-level, not the same as heavy mold growth.",
    executionQuickFix: {
      use: "Bathroom disinfectant or mildew cleaner labeled for the surface.",
      do: "Ventilate → spray → dwell per label → soft scrub → rinse and dry thoroughly.",
      ifNeeded: "Improve airflow and fix lingering moisture. If it spreads or returns fast, reassess as broader growth—not just ‘wipe harder.’",
    },
    whyThisWorksShort:
      "On non-porous surfaces, labeled chemistry removes the film; drying and ventilation remove what lets it come back.",
    productScenarios: [
      {
        problem: "light mildew cleanup",
        surface: "bathroom",
        products: [
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
          { slug: "heinz-distilled-white-vinegar-5pct", name: "White Vinegar (5%)" },
          { slug: "scrubbing-bubbles-daily-shower-cleaner", name: "Scrubbing Bubbles Daily Shower Cleaner" },
        ],
      },
    ],
  },
  "streaking-on-glass": {
    ...prob("streaking-on-glass", "Streaking on glass", "residue"),
    problemDefinitionLine:
      "Wipe trails and haze from cleaner residue, cloth friction, or minerals—often technique and rinse, not ‘dirtier glass.’",
    executionQuickFix: {
      use: "Glass cleaner or very light surfactant; two clean microfibers (wet wipe + dry buff).",
      do: "Mist lightly → wipe in one direction → flip cloth or switch to dry side → buff dry.",
      ifNeeded: "Swap cloths if product loads up; rinse first if layers stack. Treat mineral spots with label-safe steps separately.",
    },
    whyThisWorksShort:
      "Streaks are usually leftover product or water minerals. Less chemistry, fresh cloth, and a true dry pass stop the smear loop.",
    productScenarios: [
      {
        problem: "streak-free glass cleaning",
        surface: "glass",
        products: [
          { slug: "invisible-glass-premium-glass-cleaner", name: "Invisible Glass" },
          { slug: "windex-original-glass-cleaner", name: "Windex Original" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
    ],
  },
  "general-soil": prob("general-soil", "General soil", "organic"),
  "touchpoint-contamination": prob("touchpoint-contamination", "Touchpoint contamination", "biological"),

  "adhesive-residue": {
    ...prob("adhesive-residue", "Adhesive residue", "residue"),
    problemDefinitionLine:
      "Sticky tape, label, or glue residue that grabs dust—needs dwell and the right solvent, not blind scraping.",
    executionQuickFix: {
      use: "Adhesive remover or petroleum/citrus solvent labeled for the finish (start mild).",
      do: "Spot-test → apply → short dwell → lift with plastic edge or cloth → wipe clean.",
      ifNeeded: "Step up only if the label allows; skip metal razors on soft plastics and coated glass.",
    },
    whyThisWorksShort:
      "Solvents soften the adhesive so it releases; controlled lift avoids driving gum deeper or scratching the finish.",
    whatItUsuallyIs:
      "Tape, label, or sticker residue that re-gums when heated, plus light tacky films that attract dust.",
    bestMethods: "Start with the least aggressive solvent that the label allows; dwell, then lift—don’t gouge.",
    avoidMethods: "Attacking stone or painted finishes with strong solvents without a spot test.",
    commonMistakes: [
      "Using razor blades on soft plastics or coated glass.",
      "Applying citrus or petroleum solvents to unfinished stone.",
      "Rubbing adhesive deeper into porous grout lines.",
    ],
    decisionShortcuts: [
      {
        label: "Tape or sticker residue on hard plastic",
        body: "Start with mild citrus or petroleum-based removers before jumping to aggressive solvents.",
        productSlugs: ["goo-gone-original-liquid", "un-du-adhesive-remover"],
      },
      {
        label: "Heavy adhesive or cured gum",
        body: "Stronger solvent blends may be warranted—ventilation and finish tests matter more here.",
        productSlugs: ["goof-off-professional-strength-remover", "3m-adhesive-remover"],
      },
      {
        label: "Stone, painted trim, or unknown coatings",
        body: "Spot-test and favor the gentlest effective remover; adhesives are not worth a ruined finish.",
        productSlugs: ["un-du-adhesive-remover"],
      },
    ],
    productScenarios: [
      { problem: "adhesive residue", surface: "plastic" },
      { problem: "adhesive residue", surface: "glass" },
      { problem: "sticky residue", surface: "laminate" },
    ],
    relatedSurfaces: [
      esSurface("laminate", "Laminate"),
      esSurface("tile", "Tile"),
      esSurface("painted-walls", "Painted walls"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
  },

  "odor-retention": {
    ...prob("odor-retention", "Odor retention", "organic"),
    problemDefinitionLine:
      "Smells that return because organic film or soil is still hiding in fibers, drains, or bins—not a missing ‘fresh scent.’",
    executionQuickFix: {
      use: "Remove visible soil first; then odor neutralizer, enzyme, or disinfectant matched to the source (per label).",
      do: "Clean the surface or container → apply product → dwell → ventilate, rinse, or extract as the label directs.",
      ifNeeded:
        "Laundry: proper rinse/extract. Drains: remove debris, then labeled drain care. Skip fragrance-only cover-ups.",
    },
    whyThisWorksShort:
      "Odor compounds cling to film and porous material. Hitting the labeled source beats perfume that masks without removing what holds the smell.",
    whatItUsuallyIs:
      "Smells that return after cleaning—often from soft surfaces, drains, or garbage zones holding organic film.",
    bestMethods:
      "Remove soil first, then use odor chemistry matched to the source (neutralizers vs enzymes vs disinfectants when appropriate).",
    avoidMethods: "Masking with fragrance-only sprays when biology or film is still present.",
    commonMistakes: [
      "Using disinfectant sprays as a substitute for fabric or carpet odor chemistry.",
      "Skipping laundry rinse or extraction on soft surfaces.",
      "Treating pet urine like a generic “room spray” problem.",
    ],
    decisionShortcuts: [
      {
        label: "Soft surfaces holding organic film",
        body: "Enzyme or neutralizer-forward SKUs beat disinfectant-only masking when biology is involved.",
        productSlugs: ["natures-miracle-stain-and-odor-remover", "zero-odor-eliminator-spray"],
      },
      {
        label: "Laundry or fabric refresh",
        body: "Fabric refreshers and sanitizers play different roles—match chemistry to whether you need biology vs hygiene.",
        productSlugs: ["febreze-fabric-refresher-antimicrobial", "clorox-laundry-sanitizer"],
      },
      {
        label: "Garbage or plastic bins",
        body: "Clean soil first, then deodorize; heavy fragrance without removal usually fails fast.",
        productSlugs: ["fresh-wave-odor-removing-spray"],
      },
    ],
    productScenarios: [
      {
        problem: "neutralize lingering odors",
        surface: "home",
        products: [
          { slug: "zero-odor-eliminator-spray", name: "Zero Odor Eliminator" },
          { slug: "natures-miracle-stain-and-odor-remover", name: "Nature's Miracle Stain & Odor Remover" },
          { slug: "fresh-wave-odor-removing-spray", name: "Fresh Wave Odor Removing Spray" },
        ],
      },
      { problem: "odor retention", surface: "carpet" },
      { problem: "odor retention", surface: "laundry" },
      { problem: "odor retention", surface: "garbage cans" },
    ],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },

  "mold-growth": {
    ...prob("mold-growth", "Mold growth", "biological"),
    problemDefinitionLine:
      "Active or recurring fungal growth on damp surfaces—moisture control matters as much as cleaning.",
    executionQuickFix: {
      use: "Mold-control or remediation product labeled for the surface (follow the label exactly).",
      do: "Ventilate → apply per label → wait → wipe and bag visible debris → dry the area.",
      ifNeeded:
        "If it returns, find and fix the moisture source. Large areas, hidden cavities, or HVAC involvement → professional help.",
    },
    whyThisWorksShort:
      "Mold needs moisture to persist. Labeled removal steps address visible growth while drying and source control reduce what grows back.",
    whatItUsuallyIs:
      "Active or recurring microbial growth—distinct from a single light mildew film—often tied to moisture and ventilation.",
    bestMethods: "Identify moisture, reduce humidity, then use label-correct remediation chemistry; escalate large areas.",
    avoidMethods: "Bleach-forward guessing on porous materials without understanding what the label allows.",
    commonMistakes: [
      "Painting over active growth without fixing moisture.",
      "Using vinegar or weak cleaners when EPA-registered steps are required.",
      "Treating all musty smells as “disinfectant only.”",
    ],
    decisionShortcuts: [
      {
        label: "Small, surface-limited growth in wet areas",
        body: "Fix moisture first; use label-correct remediation chemistry and stop if spread is unclear.",
        productSlugs: ["concrobium-mold-control", "mold-armor-rapid-clean-remediation"],
      },
      {
        label: "Bathroom film that might be mildew vs soap scum",
        body: "Soap-scum removers and mold products overlap—choose based on growth vs mineral film.",
        productSlugs: ["zep-shower-tub-tile-cleaner", "concrobium-mold-control"],
      },
      {
        label: "Large areas or HVAC involvement",
        body: "Escalate to professionals—this hub is not a substitute for containment planning.",
      },
    ],
    productScenarios: [
      {
        problem: "bathroom mold removal",
        surface: "bathroom",
        products: [
          { slug: "scrubbing-bubbles-bathroom-grime-fighter", name: "Scrubbing Bubbles Bathroom Cleaner" },
          { slug: "concrobium-mold-control", name: "Concrobium Mold Control" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      { problem: "mold growth", surface: "tile" },
      { problem: "mold growth", surface: "countertops" },
      { problem: "mildew stains", surface: "shower glass" },
    ],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass"),
      esSurface("tile", "Tile"),
      esSurface("grout", "Grout"),
    ],
    relatedMethods: [
      esMethod("soap-scum-removal", "Soap scum removal"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
  },

  "burnt-residue": {
    ...prob("burnt-residue", "Burnt residue", "oil_based"),
    whatItUsuallyIs:
      "Carbonized oils, browned-on films, and char that behave more like polymerized grease than loose dust.",
    bestMethods: "Ventilate, use labeled oven or cooktop chemistry only where the surface allows it, then rinse residue fully.",
    avoidMethods: "Borrowing oven cleaner for countertops, cabinets, or unknown coatings.",
    relatedProblems: [rpRel("cooked-on-grease", "Cooked-on grease"), rpRel("grease-buildup", "Grease buildup")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    decisionShortcuts: [
      {
        label: "Inside labeled ovens / grills",
        body: "Heavy-duty oven products are for enclosed, labeled interiors—not open food-prep zones.",
        productSlugs: ["easy-off-heavy-duty-oven-cleaner", "zep-oven-and-grill-cleaner"],
      },
      {
        label: "Cooktops and hoods (not oven interiors)",
        body: "Kitchen degreasers and cooktop lines beat oven chemistry for daily hard surfaces.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "weiman-gas-range-cleaner-degreaser"],
      },
      {
        label: "Light film after cooking",
        body: "Start mild, rinse, then escalate only if soil remains and the label agrees.",
        productSlugs: ["dawn-platinum-dish-spray"],
      },
    ],
    productScenarios: [
      { problem: "burnt residue", surface: "stainless steel" },
      { problem: "burnt residue", surface: "glass" },
    ],
  },

  "cloudy-glass": {
    ...prob("cloudy-glass", "Cloudy glass", "residue"),
    problemDefinitionLine:
      "Dull or foggy glass from mineral film, soap residue, or product buildup—sometimes confused with permanent etching.",
    executionQuickFix: {
      use: "Glass cleaner or neutral bath spray; acid descalers only when labels allow and you are targeting mineral film.",
      do: "Rinse → spray → short dwell → soft scrub → squeegee or dry buff → re-check under light.",
      ifNeeded:
        "If appearance does not improve after careful passes, assume possible etch or coating damage—not more aggressive scrubbing.",
    },
    whyThisWorksShort:
      "Removable haze is usually film on the surface. Matched chemistry and rinse lift that film; etched damage will not wipe away.",
    whatItUsuallyIs:
      "A dull or foggy appearance from mineral film, etched damage, or cleaner residue—not always removable with glass spray alone.",
    bestMethods: "Separate mineral film from damage: tolerant glass can accept descale steps; damage needs replacement or professional polish.",
    avoidMethods: "Scrubbing coated or acid-sensitive glass with the wrong chemistry.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("streaking-on-glass", "Streaking on glass"), rpRel("soap-film", "Soap film")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    decisionShortcuts: [
      {
        label: "Spotting / mineral haze on tolerant glass",
        body: "Hard-water chemistry can help when labels allow—never guess on coated or unknown glass.",
        productSlugs: ["clr-calcium-lime-rust", "windex-original-glass-cleaner"],
      },
      {
        label: "Soap or product film",
        body: "Rinse-first discipline and a clean glass workflow often beats adding more product.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "restore cloudy glass",
        surface: "glass",
        products: [
          { slug: "bar-keepers-friend-cleanser", name: "Bar Keepers Friend" },
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
      { problem: "cloudy film", surface: "shower glass" },
      { problem: "cloudy film", surface: "glass" },
    ],
  },

  "cooked-on-grease": {
    ...prob("cooked-on-grease", "Cooked-on grease", "oil_based"),
    problemDefinitionLine:
      "Heat-set oil and food residue on cooktops, hoods, and backsplashes—tougher than fresh splatter.",
    executionQuickFix: {
      use: "Kitchen degreaser or surfactant-forward cleaner labeled for the surface.",
      do: "Ventilate → spray → dwell 2–5 min → wipe or soft scrub → rinse.",
      ifNeeded:
        "Repeat or use a stronger labeled degreaser. Keep oven-class caustics off open food-prep surfaces unless the label allows it.",
    },
    whyThisWorksShort:
      "Heat polymerizes oils into a film. Surfactants and degreasers break that film so it lifts and rinses away instead of smearing.",
    whatItUsuallyIs:
      "Heat-set lipid films that resist quick wipes—different from light kitchen dust or fresh splatter.",
    bestMethods: "Dwell with surfactant-forward or labeled degreasers; finish with rinse passes so residue does not attract soil.",
    avoidMethods: "Enzyme-only workflows for fryer-grade grease on hard surfaces where surfactants are the primary tool.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("burnt-residue", "Burnt residue")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    decisionShortcuts: [
      {
        label: "Range hoods and backsplashes",
        body: "Kitchen degreasers with ventilation; match chemistry to soil depth.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "dawn-platinum-dish-spray"],
      },
      {
        label: "Glass cooktops",
        body: "Cooktop-specific polishers reduce scratch risk versus generic scrub pads.",
        productSlugs: ["cerama-bryte-cooktop-cleaner", "weiman-gas-range-cleaner-degreaser"],
      },
    ],
    productScenarios: [
      { problem: "cooked-on grease", surface: "stainless steel" },
      { problem: "cooked-on grease", surface: "glass" },
    ],
  },

  "oxidation": {
    ...prob("oxidation", "Oxidation / tarnish", "physical_damage"),
    whatItUsuallyIs:
      "Chemical change in the finish—often on metals—not a simple removable soil layer.",
    bestMethods: "Match metal polish or manufacturer guidance; stop if appearance worsens.",
    avoidMethods: "Acid guessing on plated finishes or mixed-material assemblies.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("yellowing", "Yellowing")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    decisionShortcuts: [
      {
        label: "Stainless fronts and fixtures",
        body: "Polish-forward maintenance lines vs true degreasing when the issue is appearance, not fresh grease.",
        productSlugs: ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish"],
      },
    ],
    productScenarios: [
      { problem: "oxidation", surface: "stainless steel" },
      { problem: "tarnish", surface: "stainless steel" },
    ],
  },

  "smudge-marks": {
    ...prob("smudge-marks", "Smudge marks", "transfer"),
    problemDefinitionLine:
      "Oils and fingerprints that smear on brushed stainless and glossy fronts—often a film problem, not missing pressure.",
    executionQuickFix: {
      use: "Stainless cleaner–polish labeled for appliance fronts, or mild surfactant + clean microfiber when soil is heavy.",
      do: "Wipe with the grain → dry buff with a fresh cloth; flip or swap cloths instead of re-smearing.",
      ifNeeded:
        "Heavy kitchen grease: degrease first where labels allow, then a separate polish pass—don’t turn polish into your only soil removal step.",
    },
    whyThisWorksShort:
      "Smudges are oil film caught in the grain or on gloss. Grain-direction passes and dry buffing lift film instead of spreading it.",
    whatItUsuallyIs:
      "Oils and films that redistribute under wiping—common on glossy laminates, appliances, and some walls.",
    bestMethods: "Low-residue damp passes with clean microfiber; escalate chemistry only when the label matches the finish.",
    avoidMethods: "Heavy wax or oil polishes that add more transferable film.",
    relatedProblems: [rpRel("fingerprints-and-smudges", "Fingerprints and smudges"), rpRel("grease-buildup", "Grease buildup")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("stainless-steel", "Stainless steel"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Appliance fronts",
        body: "Stainless polishes can be appearance tools—separate from true degreasing when soil is heavy.",
        productSlugs: ["weiman-stainless-steel-cleaner-polish", "therapy-stainless-steel-cleaner-polish"],
      },
      {
        label: "High-gloss hard surfaces",
        body: "Glass-forward streak control can help when the finish behaves like glass.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "remove fingerprints and smudges",
        surface: "glass",
        products: [
          { slug: "windex-original-glass-cleaner", name: "Windex Original" },
          { slug: "invisible-glass-premium-glass-cleaner", name: "Invisible Glass Premium" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
      {
        problem: "remove fingerprints and smudges",
        surface: "stainless steel",
        products: [
          { slug: "method-all-purpose-cleaner", name: "Method All-Purpose Cleaner" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
          { slug: "windex-original-glass-cleaner", name: "Windex Original" },
        ],
      },
      {
        problem: "remove fingerprints and smudges",
        surface: "surfaces",
        products: [
          { slug: "windex-original-glass-cleaner", name: "Windex Original" },
          { slug: "method-all-purpose-cleaner", name: "Method All-Purpose Cleaner" },
          { slug: "rubbermaid-microfiber-cleaning-cloths", name: "Microfiber Cleaning Cloths" },
        ],
      },
      { problem: "smudge marks", surface: "laminate" },
      { problem: "smudge marks", surface: "stainless steel" },
    ],
  },

  "soap-film": {
    ...prob("soap-film", "Soap film (light mineral + surfactant haze)", "residue"),
    problemDefinitionLine:
      "A clingy bath and shower film from soaps, conditioners, and minerals—lighter than chunky soap scum but still layer-forming.",
    executionQuickFix: {
      use: "Neutral bathroom cleaner or daily shower spray (non-abrasive).",
      do: "Rinse with warm water → spray → short dwell → soft scrub → rinse thoroughly.",
      ifNeeded:
        "If film remains, step up gradually (soap-scum–class cleaners). Spot-test stone, coatings, and delicate glass.",
    },
    whyThisWorksShort:
      "The film is surfactant + mineral residue on the surface. Short dwell and rinse cycles let chemistry work without grinding soil into the finish.",
    whatItUsuallyIs:
      "A clingy film from soaps and conditioners that reads differently than chunky soap scum—often on glass and tile.",
    bestMethods: "Rinse-first passes, then bath or glass maintenance lines that match label chemistry.",
    avoidMethods: "Attacking unknown stone with bathroom acids meant for tolerant porcelain.",
    relatedProblems: [rpRel("soap-scum", "Soap scum"), rpRel("hard-water-deposits", "Hard water deposits"), rpRel("cloudy-glass", "Cloudy glass")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Daily shower maintenance",
        body: "Daily sprays reduce film between deeper cleans—still read stone and coating rules.",
        productSlugs: ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      },
      {
        label: "Heavier bath film",
        body: "Foam bathroom cleaners when labels allow; ventilate and rinse.",
        productSlugs: ["scrubbing-bubbles-bathroom-grime-fighter", "zep-shower-tub-tile-cleaner"],
      },
    ],
    productScenarios: [
      { problem: "white film", surface: "shower glass" },
      { problem: "soap scum", surface: "tile" },
    ],
  },

  "surface-streaking": {
    ...prob("surface-streaking", "Streaking (non-glass surfaces)", "residue"),
    whatItUsuallyIs:
      "Visible wipe trails from cleaner residue, wrong cloth friction, or too much product on glossy hard surfaces.",
    bestMethods: "Less chemistry, cleaner water, and fresh microfiber; finish with dry buff where safe.",
    avoidMethods: "Stacking fragranced all-purpose sprays on already-coated finishes.",
    relatedProblems: [rpRel("streaking-on-glass", "Streaking on glass"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    decisionShortcuts: [
      {
        label: "Countertops and cabinets",
        body: "pH-neutral maintenance lines with rinse discipline beat ‘more product’ for streak loops.",
        productSlugs: ["simple-green-all-purpose-cleaner", "seventh-generation-disinfecting-multi-surface-cleaner"],
      },
    ],
    productScenarios: [
      { problem: "streaking", surface: "laminate" },
      { problem: "streaking", surface: "quartz" },
    ],
  },

  "yellowing": {
    ...prob("yellowing", "Yellowing / discoloration", "physical_damage"),
    whatItUsuallyIs:
      "Aging polymers, heat history, or absorbed organics—sometimes maintenance, sometimes irreversible change.",
    bestMethods: "Identify material first (sealed stone vs plastic vs paint), then use label-correct brightening or accept replacement.",
    avoidMethods: "Bleach-forward guessing on unknown plastics or stone.",
    relatedProblems: [rpRel("oxidation", "Oxidation / tarnish"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    decisionShortcuts: [
      {
        label: "Sealed counters with mystery dullness",
        body: "Stone-rated dailies vs aggressive acids—misclassification is the common failure mode.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
    ],
    productScenarios: [
      { problem: "yellowing", surface: "laminate" },
      { problem: "discoloration", surface: "vinyl" },
    ],
  },

  "surface-haze": {
    ...prob("surface-haze", "Surface haze", "residue"),
    problemDefinitionLine:
      "A dull or greasy-looking film that reads as ‘fog’ or uneven sheen—often residue, minerals, or stacked cleaners rather than true abrasion.",
    executionQuickFix: {
      use: "Neutral or label-correct glass / hard-surface cleaner; rinse water for layered products.",
      do: "Dry dust or rinse loose soil → clean in one direction → fresh cloth dry buff → reassess before adding acid.",
      ifNeeded:
        "If haze survives neutral passes, separate mineral film from product film—misclassification drives the wrong chemistry.",
    },
    whyThisWorksShort:
      "Haze is usually removable film. Removing soil and old product in thin layers restores clarity without grinding the finish.",
    decisionShortcuts: [
      {
        label: "Glass and mirrors",
        body: "Two-cloth technique: wet clean + dry buff; streaks often mean cloth or product load, not ‘more spray.’",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
      {
        label: "Showers and glossy tile / quartz",
        body: "Daily maintenance sprays reduce film stacking; heavy acids are a last resort when labels allow.",
        productSlugs: ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      },
      {
        label: "Mineral or soap film suspected",
        body: "Acid-capable products only when the surface allows—stone and sealed finishes need label discipline.",
        productSlugs: ["clr-calcium-lime-rust", "granite-gold-daily-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "surface haze",
        surface: "glass",
        products: [
          { slug: "windex-original-glass-cleaner", name: "Windex Original Glass Cleaner" },
          { slug: "invisible-glass-premium-glass-cleaner", name: "Invisible Glass Premium Glass Cleaner" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      {
        problem: "surface haze",
        surface: "shower glass",
        products: [
          { slug: "windex-original-glass-cleaner", name: "Windex Original Glass Cleaner" },
          { slug: "invisible-glass-premium-glass-cleaner", name: "Invisible Glass Premium Glass Cleaner" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      { problem: "surface haze", surface: "quartz" },
    ],
    relatedProblems: [
      rpRel("cloudy-glass", "Cloudy glass"),
      rpRel("product-residue-buildup", "Product residue buildup"),
      rpRel("streaking-on-glass", "Streaking on glass"),
    ],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
  },
  "product-residue-buildup": {
    ...prob("product-residue-buildup", "Product residue buildup", "residue"),
    problemDefinitionLine:
      "Cleaner, polish, or fragrance left behind in layers—sticky, streaky, or dull—often from too much product or incomplete rinse.",
    executionQuickFix: {
      use: "Plain water rinse + fresh microfiber; mild surfactant only if labels agree.",
      do: "Remove excess product → rinse → dry buff → repeat thin passes instead of stacking new chemistry.",
      ifNeeded:
        "If residue is baked on or wax-like, escalate to label-correct removers—never guess acids on stone or coatings.",
    },
    whyThisWorksShort:
      "Residue problems are removal problems. Dilution and rinse break the film so you are not smearing old product into new streaks.",
    decisionShortcuts: [
      {
        label: "Kitchen films on counters and appliances",
        body: "Degrease gently, then rinse—heavy fragrance cleaners often leave the most visible film.",
        productSlugs: ["dawn-platinum-dish-spray", "simple-green-all-purpose-cleaner"],
      },
      {
        label: "Daily stone or sealed tops",
        body: "Stone-rated dailies beat all-purpose stacking on sensitive finishes.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
      {
        label: "Floors that feel tacky after mopping",
        body: "Cut product ratio, change water often, and finish dry—tacky usually means leftover surfactant.",
        productSlugs: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      },
    ],
    productScenarios: [
      {
        problem: "product residue",
        surface: "laminate",
        products: [
          { slug: "dawn-platinum-dish-spray", name: "Dawn Platinum EZ-Squeeze Dish Spray" },
          { slug: "simple-green-all-purpose-cleaner", name: "Simple Green All-Purpose Cleaner" },
          { slug: "granite-gold-daily-cleaner", name: "Granite Gold Daily Cleaner" },
        ],
      },
      { problem: "product residue", surface: "quartz" },
      { problem: "product residue", surface: "glass" },
    ],
    relatedProblems: [
      rpRel("surface-streaking", "Surface streaking"),
      rpRel("soap-film", "Soap film"),
      rpRel("surface-haze", "Surface haze"),
    ],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
  },
  "appliance-grime": {
    ...prob("appliance-grime", "Buildup on appliances", "oil_based"),
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("greasy-grime", "Greasy grime")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "surface-discoloration": {
    ...prob("surface-discoloration", "Discoloration on surfaces", "physical_damage"),
    relatedProblems: [rpRel("yellowing", "Yellowing"), rpRel("surface-dullness", "Surface dullness")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "discoloration", surface: "laminate" }],
  },
  "light-film-buildup": {
    ...prob("light-film-buildup", "Light film buildup", "residue"),
    relatedProblems: [rpRel("soap-film", "Soap film"), rpRel("water-spotting", "Water spotting")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "light film", surface: "shower glass" }],
  },
  "surface-dullness": {
    ...prob("surface-dullness", "Surface dullness", "physical_damage"),
    relatedProblems: [rpRel("uneven-finish", "Uneven finish"), rpRel("etching-on-finishes", "Etching on finishes")],
    relatedSurfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "dullness", surface: "granite" }],
  },
  "uneven-finish": {
    ...prob("uneven-finish", "Uneven finish", "physical_damage"),
    relatedProblems: [rpRel("surface-dullness", "Surface dullness"), rpRel("etching-on-finishes", "Etching on finishes")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "uneven finish", surface: "quartz" }],
  },
  "water-spotting": {
    ...prob("water-spotting", "Water spotting (evaporation film)", "mineral"),
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("limescale-buildup", "Limescale buildup")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    productScenarios: [{ problem: "hard water film", surface: "shower glass" }],
  },
  "limescale-buildup": {
    ...prob("limescale-buildup", "Limescale buildup", "mineral"),
    problemDefinitionLine:
      "Mineral scale left behind by hard water, usually bonding in layers on fixtures, glass, and tile.",
    executionQuickFix: {
      use: "Label-safe descaler or acid-based cleaner approved for the surface",
      do: "Apply → wait briefly → light scrub → rinse thoroughly",
      ifNeeded:
        "Repeat for buildup in layers. Avoid acids on natural stone and other acid-sensitive finishes.",
    },
    whyThisWorksShort:
      "Limescale is mineral-based. Compatible acids dissolve the deposit so it can be lifted and rinsed away.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("water-spotting", "Water spotting")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("grout", "Grout")],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [
      {
        problem: "remove limescale",
        surface: "glass",
        products: [
          { slug: "zep-calcium-lime-rust-remover", name: "Zep Calcium, Lime & Rust Remover" },
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      {
        problem: "remove limescale",
        surface: "tile",
        products: [
          { slug: "zep-calcium-lime-rust-remover", name: "Zep Calcium, Lime & Rust Remover" },
          { slug: "clr-calcium-lime-rust", name: "CLR Calcium, Lime & Rust Remover" },
          { slug: "method-daily-shower-spray", name: "Method Daily Shower Spray" },
        ],
      },
      { problem: "limescale", surface: "tile" },
    ],
  },
  "greasy-grime": {
    ...prob("greasy-grime", "Greasy grime", "oil_based"),
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("appliance-grime", "Buildup on appliances")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "greasy film", surface: "tile" }],
  },
  "floor-residue-buildup": {
    ...prob("floor-residue-buildup", "Floor residue buildup", "residue"),
    relatedProblems: [rpRel("general-soil", "General soil"), rpRel("product-residue-buildup", "Product residue buildup")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("detail-dusting", "Detail dusting")],
    productScenarios: [{ problem: "floor residue", surface: "vinyl" }],
  },
  "scuff-marks": {
    ...prob("scuff-marks", "Scuff marks", "physical_damage"),
    relatedProblems: [rpRel("finish-scratches", "Finish scratches"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    productScenarios: [{ problem: "scuff marks", surface: "vinyl" }],
  },
  "finish-scratches": {
    ...prob("finish-scratches", "Finish scratches", "physical_damage"),
    relatedProblems: [rpRel("scuff-marks", "Scuff marks"), rpRel("etching-on-finishes", "Etching on finishes")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "scratches", surface: "laminate" }],
  },
  "etching-on-finishes": {
    ...prob("etching-on-finishes", "Etching on finishes", "physical_damage"),
    relatedProblems: [rpRel("surface-dullness", "Surface dullness"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("granite-countertops", "Granite countertops"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "etching", surface: "marble" }],
  },
  "heat-damage-marks": {
    ...prob("heat-damage-marks", "Heat damage marks", "physical_damage"),
    relatedProblems: [rpRel("burnt-residue", "Burnt residue"), rpRel("surface-discoloration", "Discoloration on surfaces")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "heat damage", surface: "laminate" }],
  },
  "metal-tarnish": {
    ...prob("metal-tarnish", "Metal tarnish", "physical_damage"),
    relatedProblems: [rpRel("oxidation", "Oxidation / tarnish"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "tarnish", surface: "stainless steel" }],
  },
  "musty-odor": {
    ...prob("musty-odor", "Musty odor", "biological"),
    relatedProblems: [rpRel("odor-retention", "Odor retention"), rpRel("mold-growth", "Mold growth")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("grout", "Grout")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    productScenarios: [{ problem: "musty odor", surface: "tile" }],
  },
  "biofilm-buildup": {
    ...prob("biofilm-buildup", "Biofilm buildup", "biological"),
    relatedProblems: [rpRel("touchpoint-contamination", "Touchpoint contamination"), rpRel("mold-growth", "Mold growth")],
    relatedSurfaces: [esSurface("tile", "Tile"), esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("touchpoint-sanitization", "Touchpoint sanitization")],
    productScenarios: [{ problem: "biofilm", surface: "tile" }],
  },
  "organic-stains": {
    ...prob("organic-stains", "Organic stains", "organic"),
    relatedProblems: [rpRel("odor-retention", "Odor retention"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    productScenarios: [{ problem: "organic stains", surface: "carpet" }],
  },
  "laundry-odor": {
    ...prob("laundry-odor", "Laundry odor", "organic"),
    relatedProblems: [rpRel("odor-retention", "Odor retention"), rpRel("musty-odor", "Musty odor")],
    relatedSurfaces: [esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "laundry odor", surface: "laundry" }],
  },

  "residue-buildup": {
    ...prob("residue-buildup", "Residue buildup", "residue"),
    quickAnswer:
      "Residue buildup is usually spent cleaner or soil left in solution—it improves with less product, cleaner water, and a true finish pass before you change chemistry families.",
    whatItUsuallyIs: "Tacky, fast-re-soiling, or streaky surfaces after cleaning that looked fine mid-wipe.",
    relatedProblems: [rpRel("product-residue-buildup", "Product residue buildup"), rpRel("surface-streaking", "Surface streaking")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Counters and cabinets",
        body: "Neutral maintenance with rinse discipline; avoid stacking scented sprays.",
        productSlugs: ["simple-green-all-purpose-cleaner", "seventh-generation-disinfecting-multi-surface-cleaner"],
      },
    ],
    bestBySurfaceExtras: [
      { line: "Compare residue vs true etch on stone before acids.", href: "/problems/etching-on-finishes" },
    ],
    productScenarios: [{ problem: "product residue", surface: "laminate" }],
  },
  "film-buildup": {
    ...prob("film-buildup", "Film buildup", "residue"),
    quickAnswer:
      "Film buildup is a thin layer of soap, minerals, or polymers that changes how light reflects—fix it by naming film vs damage, then matching chemistry to the soil class.",
    whatItUsuallyIs: "Rainbow smears, foggy gloss, or ‘clean but dingy’ hard surfaces.",
    relatedProblems: [rpRel("light-film-buildup", "Light film buildup"), rpRel("soap-film", "Soap film")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    decisionShortcuts: [
      {
        label: "Shower glass",
        body: "Separate grease from mineral-soap film before picking acids.",
        productSlugs: ["windex-original-glass-cleaner", "method-daily-shower-spray"],
      },
    ],
    productScenarios: [{ problem: "light film", surface: "shower glass" }],
  },
  "grime-buildup": {
    ...prob("grime-buildup", "Grime buildup", "oil_based"),
    quickAnswer:
      "Grime is usually mixed dust and oil that polymerizes in corners—capture dry soil first, then use surfactant-forward chemistry where labels allow.",
    whatItUsuallyIs: "Dark lines along trim, sticky dust on cabinets, or textured soil that resists plain water.",
    relatedProblems: [rpRel("greasy-grime", "Greasy grime"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Kitchen cabinets",
        body: "Mild surfactant and frequent water changes beat heavy solvents near finishes.",
        productSlugs: ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "greasy film", surface: "laminate" }],
  },
  dullness: {
    ...prob("dullness", "Dullness", "physical_damage"),
    quickAnswer:
      "Dullness can be residue, wear, or etch—if aggressive chemistry made it worse, stop and treat it as finish risk, not ‘more scrubbing.’",
    whatItUsuallyIs: "Sheen loss on sealed stone, coated wood, or glossy synthetics.",
    relatedProblems: [rpRel("surface-dullness", "Surface dullness"), rpRel("uneven-finish", "Uneven finish")],
    relatedSurfaces: [esSurface("finished-wood", "Finished wood"), esSurface("granite-countertops", "Granite countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Sealed stone tops",
        body: "Stone-rated dailies before any restorative polish marketing.",
        productSlugs: ["granite-gold-daily-cleaner", "stonetech-daily-cleaner"],
      },
    ],
    productScenarios: [{ problem: "dullness", surface: "granite" }],
  },
  "water-spots": {
    ...prob("water-spots", "Water spots", "mineral"),
    problemDefinitionLine:
      "Mineral rings after water dries on glass, chrome, or glossy tile—light film vs bonded scale need different chemistry.",
    executionQuickFix: {
      use: "Glass cleaner or damp microfiber for light spots; label-approved descaler only where acids are explicitly allowed.",
      do: "Wet wipe → dry buff → if haze remains, short dwell with compatible chemistry → rinse thoroughly.",
      ifNeeded:
        "Do not guess acids on stone or coated finishes. If the surface etches or dulls, stop—treat as damage, not more scrubbing.",
    },
    whyThisWorksShort:
      "Spots are minerals left on the surface. The right cleaner lifts or dissolves that film on tolerant materials; wrong surfaces need non-acid lanes.",
    quickAnswer:
      "Water spots are minerals left after evaporation—mild spots lift with glass maintenance; bonded scale needs label-approved descalers on tolerant surfaces only.",
    whatItUsuallyIs: "Round marks on glass, chrome, or glossy tile after drying.",
    relatedProblems: [rpRel("water-spotting", "Water spotting"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    decisionShortcuts: [
      {
        label: "Fixture spotting",
        body: "Try glass-forward maintenance before acid-class bathroom sprays.",
        productSlugs: ["windex-original-glass-cleaner", "invisible-glass-premium-glass-cleaner"],
      },
      {
        label: "Bonded scale",
        body: "Acid descalers only where labels explicitly allow—never guess on stone.",
        productSlugs: ["clr-calcium-lime-rust", "lime-a-way-cleaner"],
      },
    ],
    productScenarios: [{ problem: "hard water film", surface: "shower glass" }],
  },
  "mineral-film": {
    ...prob("mineral-film", "Mineral film", "mineral"),
    quickAnswer:
      "Mineral film is dissolved hardness redeposited as it dries—neutral cleaners maintain; acids remove only when the surface class is explicitly compatible.",
    whatItUsuallyIs: "Hazy sheen on glass and tile that returns quickly after wipes.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("limescale-buildup", "Limescale buildup")],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass"),
      esSurface("tile", "Tile"),
      esSurface("grout", "Grout"),
    ],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("glass-cleaning", "Glass cleaning")],
    decisionShortcuts: [
      {
        label: "Shower glass",
        body: "Stage from glass cleaner to acid only if film persists and labels allow.",
        productSlugs: ["windex-original-glass-cleaner", "clr-calcium-lime-rust"],
      },
    ],
    productScenarios: [{ problem: "hard water stains", surface: "shower glass" }],
  },
  "sticky-film": {
    ...prob("sticky-film", "Sticky film", "residue"),
    problemDefinitionLine:
      "Tacky, dust-grabbing film on counters and edges—often sugar, soap, or adhesive residue, not ordinary dust.",
    executionQuickFix: {
      use: "Neutral all-purpose or surfactant cleaner; mild citrus or label-safe solvent if it behaves like adhesive.",
      do: "Dwell briefly → wipe with a clean cloth → rinse or dry buff. Warm (not hot) water can help sugary films.",
      ifNeeded:
        "Persistent gum: use adhesive-style remover with ventilation and spot tests on paint, stone, and plastics.",
    },
    whyThisWorksShort:
      "Surfactants break oily and sugary films; solvents soften adhesive-style tack so it lifts instead of smearing into the finish.",
    quickAnswer:
      "Sticky film is often sugar, soap, or adhesive plasticizers—pick solvent or surfactant lane based on whether it gums when warm or smears when wet.",
    whatItUsuallyIs: "Tack that grabs dust; common near handles, edges, and plastics.",
    relatedProblems: [rpRel("adhesive-residue", "Adhesive residue"), rpRel("stuck-on-residue", "Stuck-on residue")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("quartz-countertops", "Quartz countertops")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning"), esMethod("dwell-and-lift-cleaning", "Dwell and lift cleaning")],
    productScenarios: [{ problem: "sticky residue", surface: "laminate" }],
  },
  "kitchen-grease-film": {
    ...prob("kitchen-grease-film", "Kitchen grease film", "oil_based"),
    quickAnswer:
      "Kitchen grease film is airborne lipid that settles on fronts and cabinets—degrease with ventilation, then avoid turning polishes into your only soil removal step.",
    whatItUsuallyIs: "Yellowing tack near the range, matte fingerprints that return fast, or haze that smears under heat.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("appliance-grime", "Buildup on appliances")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Hood and adjacent cabinets",
        body: "Kitchen degreaser class with rinse; keep oven chemistry away from painted surfaces.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "easy-off-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "bathroom-buildup": {
    ...prob("bathroom-buildup", "Bathroom buildup", "residue"),
    problemDefinitionLine:
      "Layered soap, minerals, and biofilm in wet zones—corners, grout, and glass dingy before open tile fields look obviously dirty.",
    executionQuickFix: {
      use: "Bathroom cleaner or foam spray labeled for tile and glass; daily shower spray for lighter maintenance passes.",
      do: "Ventilate → spray → dwell per label → scrub corners and grout lines → rinse thoroughly.",
      ifNeeded:
        "Step up between deep cleans with daily spray; spot-test stone, coatings, and delicate finishes before stronger chemistry.",
    },
    whyThisWorksShort:
      "Buildup is staged residue in water paths. Dwell plus rinse breaks the film; wiping only tile fields misses where soil actually bonds.",
    quickAnswer:
      "Bathroom buildup is usually soap + mineral complexes plus biofilm in corners—ventilate, stage chemistry, and detail grout lines instead of only wiping tile fields.",
    whatItUsuallyIs: "Dingy corners, pink or gray films, and texture change along caulk.",
    relatedProblems: [rpRel("soap-scum", "Soap scum"), rpRel("biofilm-buildup", "Biofilm buildup")],
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass"),
      esSurface("tile", "Tile"),
      esSurface("grout", "Grout"),
    ],
    relatedMethods: [esMethod("soap-scum-removal", "Soap scum removal"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    decisionShortcuts: [
      {
        label: "Daily maintenance",
        body: "Daily sprays reduce bonding between deep cleans.",
        productSlugs: ["method-daily-shower-spray", "tilex-daily-shower-cleaner"],
      },
    ],
    productScenarios: [{ problem: "soap scum", surface: "tile" }],
  },
  "appliance-buildup": {
    ...prob("appliance-buildup", "Appliance buildup", "oil_based"),
    quickAnswer:
      "Appliance buildup combines touch oils, cooking aerosols, and cleaner residue—match stainless vs painted panels and separate degrease from cosmetic polish passes.",
    whatItUsuallyIs: "Finger waves, vertical drip lines, and tacky bands along handles.",
    relatedProblems: [rpRel("appliance-grime", "Buildup on appliances"), rpRel("smudge-marks", "Smudge marks")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Stainless fronts",
        body: "Degrease first when soil is heavy; polish last when labels allow.",
        productSlugs: ["weiman-stainless-steel-cleaner-polish", "dawn-platinum-dish-spray"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "countertop-residue": {
    ...prob("countertop-residue", "Countertop residue", "residue"),
    quickAnswer:
      "Countertop residue is usually too much daily cleaner or mixed incompatible sprays—reset with neutral rinse passes before assuming the seal failed.",
    whatItUsuallyIs: "Streaks, tack, or fog on quartz and laminate that worsens under raking light.",
    relatedProblems: [rpRel("product-residue-buildup", "Product residue buildup"), rpRel("surface-streaking", "Surface streaking")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("laminate", "Laminate")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "product residue", surface: "quartz" }],
  },
  "floor-buildup": {
    ...prob("floor-buildup", "Floor buildup", "residue"),
    quickAnswer:
      "Floor buildup is mop redeposit and over-concentrate—fix dilution, water changes, and dry passes before buying a new ‘shine’ product.",
    whatItUsuallyIs: "Dull lanes, footprints that return in hours, or tacky vinyl.",
    relatedProblems: [rpRel("floor-residue-buildup", "Floor residue buildup"), rpRel("general-soil", "General soil")],
    relatedSurfaces: [esSurface("vinyl-flooring", "Vinyl flooring"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Resilient hard floors",
        body: "Neutral pH floor lines with frequent rinse water.",
        productSlugs: ["bona-hard-surface-floor-cleaner", "zep-neutral-ph-floor-cleaner"],
      },
    ],
    productScenarios: [{ problem: "floor residue", surface: "vinyl" }],
  },
  "mirror-haze": {
    ...prob("mirror-haze", "Mirror haze", "residue"),
    quickAnswer:
      "Mirror haze is usually residue or coating failure on the reflective stack—try glass technique first; replace or service when etch lives in the glass itself.",
    whatItUsuallyIs: "Foggy reflection that survives cleaning or returns in patches.",
    relatedProblems: [rpRel("surface-haze", "Surface haze"), rpRel("streaking-on-glass", "Streaking on glass")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning")],
    productScenarios: [{ problem: "surface haze", surface: "glass" }],
  },
  "chrome-water-spots": {
    ...prob("chrome-water-spots", "Chrome water spots", "mineral"),
    quickAnswer:
      "Chrome water spots are evaporated minerals on plated metal—gentle acids help only when labels allow; pitting means stop and reassess.",
    whatItUsuallyIs: "Speckled or cloudy fixtures after drying hard water.",
    relatedProblems: [rpRel("water-spotting", "Water spotting"), rpRel("hard-water-deposits", "Hard water deposits")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel"), esSurface("tile", "Tile")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("hard-water-deposit-removal", "Hard water deposit removal")],
    productScenarios: [{ problem: "hard water film", surface: "stainless steel" }],
  },
  "plastic-yellowing": {
    ...prob("plastic-yellowing", "Plastic yellowing", "physical_damage"),
    quickAnswer:
      "Plastic yellowing is often UV or heat aging—not always removable soil—test small areas before aggressive oxidizers.",
    whatItUsuallyIs: "Uniform yellow shift on appliance handles, switch plates, or vinyl edges.",
    relatedProblems: [rpRel("yellowing", "Yellowing"), rpRel("surface-discoloration", "Discoloration on surfaces")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("vinyl-flooring", "Vinyl flooring")],
    relatedMethods: [esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    productScenarios: [{ problem: "yellowing", surface: "laminate" }],
  },
  "cabinet-grime": {
    ...prob("cabinet-grime", "Cabinet grime", "oil_based"),
    quickAnswer:
      "Cabinet grime is aerosolized grease plus dust on vertical paint or laminate—work top-down with mild surfactant and dry buff to protect edges.",
    whatItUsuallyIs: "Darkening near hardware and sticky dust on rails.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("grime-buildup", "Grime buildup")],
    relatedSurfaces: [esSurface("laminate", "Laminate"), esSurface("painted-walls", "Painted walls")],
    relatedMethods: [esMethod("degreasing", "Degreasing"), esMethod("neutral-surface-cleaning", "Neutral surface cleaning")],
    decisionShortcuts: [
      {
        label: "Painted cabinet faces",
        body: "Avoid oven and heavy solvent overspray; kitchen degreasers only with label checks.",
        productSlugs: ["dawn-platinum-dish-spray", "krud-kutter-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "laminate" }],
  },
  "glass-cloudiness": {
    ...prob("glass-cloudiness", "Glass cloudiness", "residue"),
    quickAnswer:
      "Glass cloudiness splits into removable film vs permanent etch or failed coating—if acid and surfactant lanes both fail evenly, assume damage not ‘dirt.’",
    whatItUsuallyIs: "Uniform milkiness that survives multiple cleaning styles.",
    relatedProblems: [rpRel("cloudy-glass", "Cloudy glass"), rpRel("surface-haze", "Surface haze")],
    relatedSurfaces: [esSurface("shower-glass", "Shower glass")],
    relatedMethods: [esMethod("glass-cleaning", "Glass cleaning"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "cloudy film", surface: "shower glass" }],
  },
  "exhaust-hood-film": {
    ...prob("exhaust-hood-film", "Exhaust hood film", "oil_based"),
    quickAnswer:
      "Hood film is concentrated lipid aerosol—ventilate, use labeled kitchen degreasers, and keep caustic oven chemistry away from painted adjacent cabinets.",
    whatItUsuallyIs: "Thick tack on mesh filters and satin stainless that smears when hot.",
    relatedProblems: [rpRel("grease-buildup", "Grease buildup"), rpRel("kitchen-grease-film", "Kitchen grease film")],
    relatedSurfaces: [esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("degreasing", "Degreasing")],
    decisionShortcuts: [
      {
        label: "Filters and baffles",
        body: "Soak-and-rinse beats spraying hot surfaces blindly.",
        productSlugs: ["krud-kutter-kitchen-degreaser", "easy-off-kitchen-degreaser"],
      },
    ],
    productScenarios: [{ problem: "kitchen grease film", surface: "stainless steel" }],
  },
  "sink-ring-stains": {
    ...prob("sink-ring-stains", "Sink ring stains", "mineral"),
    quickAnswer:
      "Sink rings are mineral and soap complexes at the water line—gentle acids or descalers win on tolerant porcelain; stone sinks need different lanes.",
    whatItUsuallyIs: "Brown or white bands where water sits longest.",
    relatedProblems: [rpRel("hard-water-deposits", "Hard water deposits"), rpRel("soap-scum", "Soap scum")],
    relatedSurfaces: [esSurface("quartz-countertops", "Quartz countertops"), esSurface("stainless-steel", "Stainless steel")],
    relatedMethods: [esMethod("hard-water-deposit-removal", "Hard water deposit removal"), esMethod("soap-scum-removal", "Soap scum removal")],
    productScenarios: [{ problem: "hard water stains", surface: "stainless steel" }],
  },
};

export function getProblemPageBySlug(slug: string): AuthorityProblemPageData | undefined {
  const base = PROBLEMS[slug];
  if (!base) return undefined;
  return applyProblemDepthExpansion(slug, applyCoreProblemTone(slug, base));
}

export function getAllProblemPages(): AuthorityProblemPageData[] {
  return AUTHORITY_PROBLEM_SLUGS.map((s) => {
    const base = PROBLEMS[s];
    return applyProblemDepthExpansion(s, applyCoreProblemTone(s, base));
  });
}

export function problemSlugExists(slug: string): boolean {
  return AUTHORITY_PROBLEM_SLUGS.includes(slug as AuthorityProblemSlug);
}
