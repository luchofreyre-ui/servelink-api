import type { AuthoritySurfacePageData } from "@/authority/types/authorityPageTypes";
import { AUTHORITY_SURFACE_SLUGS, type AuthoritySurfaceSlug } from "@/authority/data/authorityTaxonomy";

const M = (slug: string) => `/methods/${slug}`;
const P = (slug: string) => `/problems/${slug}`;
const S = (slug: string) => `/surfaces/${slug}`;
const G = (slug: string) => `/guides/${slug}`;

function esMethod(slug: string, title: string, summary?: string) {
  return { slug, title, href: M(slug), summary, kind: "method" as const };
}

function esSurface(slug: string, title: string, summary?: string) {
  return { slug, title, href: S(slug), summary, kind: "surface" as const };
}

function guide(slug: string, title: string, summary?: string) {
  return { slug, title, href: G(slug), summary, kind: "guide" as const };
}

function rp(slug: string, title: string, summary?: string) {
  return { slug, title, href: P(slug), summary };
}

function base(slug: string, title: string): AuthoritySurfacePageData {
  return {
    slug,
    title,
    summary: `${title}: first constraints, compatible methods, and escalation cues.`,
    whatToKnowFirst: "Finish type and manufacturer guidance define safe chemistry and moisture limits.",
    safeMethods: "Neutral maintenance, label-directed products, and controlled dwell.",
    avoidMethods: "Undocumented acids, dry abrasion on coatings, and excess moisture at seams.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Its finish, porosity, seams, and exposure pattern matter more than the room where it appears.",
          "Cleaning should start with the least aggressive path that can remove the visible soil.",
        ],
      },
      {
        title: "What changes over time",
        points: [
          "Repeated residue, friction, and moisture gradually make the surface look duller even when it is not heavily soiled.",
          "Older finishes need shorter dwell, softer tools, and faster drying than new durable finishes.",
        ],
      },
    ],
    visualRecognition: [
      "Look for sheen change, edge swelling, haze, spotting, or texture change before increasing strength.",
      "Compare a protected area with a high-use area to separate soil from wear.",
    ],
    maintenanceRhythm: [
      "Use light maintenance frequently enough that soils do not need aggressive correction.",
      "Escalate only after routine soil removal fails and the surface has been reassessed.",
    ],
    professionalContext: [
      "High-traffic homes and light commercial spaces compress the maintenance interval.",
      "Professionals separate cleaning, restoration, and replacement decisions instead of treating every mark as soil.",
    ],
    preservationNotes: [
      "Test hidden areas before stronger chemistry or pressure.",
      "Stop when a mark behaves like finish damage rather than removable contamination.",
    ],
    visualCaption: `${title} should be read by finish, soil pattern, moisture exposure, and wear before choosing chemistry.`,
    commonProblems: [],
    recommendedTools: [{ name: "Microfiber", note: "Lint-free passes." }],
    recommendedChemicals: [{ name: "Neutral cleaner", note: "Dilute per label." }],
    commonMistakes: ["Cleaning hot surfaces.", "Single-cloth cross-contamination."],
    whenToEscalate: "Coating failure, widespread damage, or unidentified natural stone.",
    relatedSurfaces: [],
    relatedMethods: [],
    relatedGuides: [
      guide("cleaning-every-surface", "Cleaning every surface"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  };
}

const SURFACES: Record<string, AuthoritySurfacePageData> = {
  glass: {
    ...base("glass", "Glass"),
    summary:
      "Glass surface guidance for streaking, haze, fingerprints, mineral deposits, coated finishes, and scratch prevention.",
    whatToKnowFirst:
      "Glass is non-porous but visually unforgiving. The cleaning risk is usually residue, abrasion, or mistaking mineral etching for removable film.",
    safeMethods:
      "Use low-residue glass cleaning, clean microfiber, controlled moisture, and dry finishing. Use hard-water removal only when mineral deposits are confirmed and the surrounding materials tolerate it.",
    avoidMethods:
      "Avoid dry scraping, dirty towels, abrasive pads, and strong chemistry near unknown coatings, frames, stone, or adjacent finishes.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Clear glass reveals small residue trails, towel lint, overspray, and water minerals that other finishes hide.",
          "Coated, tinted, etched, or decorative glass may not tolerate the same agitation as standard clear panes.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Fingerprints and hand oils collect around handles and edges.",
          "Overspray and cleaner film create haze that looks like dirt but moves with wiping patterns.",
          "Hard water leaves spotting, rings, or cloudy mineral film where droplets dry repeatedly.",
        ],
      },
      {
        title: "What damages glass",
        points: [
          "Abrasive grit trapped in cloths can create fine scratches.",
          "Metal blades and aggressive pads can permanently mark glass or damage applied coatings.",
          "Mineral deposits left too long can move from removable buildup into etching risk.",
        ],
      },
    ],
    visualRecognition: [
      "Directional streaks usually point to towel or product residue.",
      "Round spotting points to evaporation minerals.",
      "Cloudiness that does not shift after correct cleaning may be etching or coating damage.",
    ],
    maintenanceRhythm: [
      "Clean fingerprints and touch zones weekly in high-use areas.",
      "Dry wet glass promptly where water spotting is recurring.",
      "Treat mineral deposits before they become layered or bonded.",
    ],
    professionalContext: [
      "Large panes, storefront-style glass, and high-glare interiors require stricter towel rotation and edge detailing.",
      "Professionals identify coating and mineral risk before using restoration pads or stronger descaling chemistry.",
    ],
    preservationNotes: [
      "Keep abrasive bathroom or kitchen pads away from clear glass unless they are confirmed glass-safe.",
      "Protect adjacent stone, metal, painted trim, and sealants when using mineral-removal chemistry.",
    ],
    commonProblems: [
      rp("streaking-on-glass", "Streaking on glass", "Residue trails, towel drag, or poor drying technique."),
      rp("hard-water-deposits", "Hard water deposits", "Mineral spotting from repeated evaporation."),
      rp("fingerprints-and-smudges", "Fingerprints and smudges", "Oils that show quickly on reflective surfaces."),
      rp("cloudy-glass", "Cloudy glass", "Film, minerals, or etching that must be separated before escalation."),
    ],
    recommendedTools: [
      { name: "Clean microfiber glass towel", note: "Rotate faces before the towel loads with residue." },
      { name: "Squeegee", note: "Useful for larger wet panes and prevention passes." },
      { name: "Detail cloth", note: "Controls edges and corners without overspray." },
    ],
    recommendedChemicals: [
      { name: "Low-residue glass cleaner", note: "Best for fingerprints, haze, and routine soil." },
      { name: "Mineral remover", note: "Only for confirmed hard-water deposits and compatible adjacent materials." },
    ],
    commonMistakes: [
      "Using too much product and then chasing streaks.",
      "Reusing a greasy or lint-heavy towel.",
      "Treating etched glass like dirty glass.",
    ],
    whenToEscalate:
      "Escalate when cloudiness remains after residue and mineral checks, when specialty coatings are present, or when large panes need restoration-level clarity.",
    relatedSurfaces: [
      esSurface("shower-glass", "Shower glass", "Glass with constant moisture and mineral exposure."),
      esSurface("mirrors", "Mirrors", "Reflective glass with backing and edge sensitivity."),
      esSurface("fixtures", "Fixtures", "Adjacent metal that often shares water spotting."),
    ],
    relatedMethods: [
      esMethod("glass-cleaning", "Glass cleaning", "Low-residue clarity work."),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal", "Mineral-focused escalation."),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning", "Routine maintenance around frames and nearby finishes."),
    ],
    relatedGuides: [
      guide("best-cleaners-for-bathrooms", "Best cleaners for bathrooms"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  },
  tile: {
    ...base("tile", "Tile"),
    summary:
      "Tile surface guidance for soil identification, grout interaction, finish preservation, and wet-room or kitchen maintenance.",
    whatToKnowFirst:
      "Tile faces are often durable, but grout, caulk, glaze, texture, and nearby stone change the safe cleaning lane.",
    safeMethods:
      "Use neutral cleaning for maintenance, soap-scum removal in bathrooms, degreasing on kitchen tile, and controlled agitation after soil-specific dwell.",
    avoidMethods:
      "Avoid treating tile and grout as one material. Do not use aggressive acids, metal scraping, steam, or abrasive pads without confirming finish and joint tolerance.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Glazed, matte, textured, ceramic, porcelain, and stone-look tiles hold residue differently.",
          "The tile face may tolerate a cleaner that the grout joint or caulk line should not see repeatedly.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Bathrooms collect soap film, mineral splash, biofilm, and mildew at joints.",
          "Kitchens collect grease film around backsplashes, cooktops, and floor edges.",
          "Floors collect tracked grit that turns residue into abrasion during mopping.",
        ],
      },
      {
        title: "Moisture and abrasion sensitivity",
        points: [
          "Dense tile can handle moisture, but seams, grout, subfloors, and edges are the weak points.",
          "Textured tile needs better rinse and extraction so loosened soil does not settle back into low spots.",
        ],
      },
    ],
    commonProblems: [
      rp("general-soil", "General soil", "Routine dust, traffic, and mixed residue."),
      rp("soap-scum", "Soap scum", "Bathroom film that behaves differently than kitchen grease."),
      rp("grease-buildup", "Grease buildup", "Airborne kitchen oil on backsplashes and floors."),
      rp("hard-water-deposits", "Hard water deposits", "Mineral spotting near fixtures and showers."),
    ],
    recommendedTools: [
      { name: "Microfiber towel or mop pad", note: "Captures loose soil and cleaner residue." },
      { name: "Non-scratch scrub pad", note: "Use on compatible tile faces after dwell." },
      { name: "Grout brush", note: "Reserved for joints, not decorative faces." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Routine maintenance and residue control." },
      { name: "Alkaline degreaser", note: "Kitchen grease where the finish allows it." },
      { name: "Bathroom mineral or soap-scum cleaner", note: "Wet-room buildup with grout caution." },
    ],
    commonMistakes: [
      "Scrubbing before chemistry has softened the soil.",
      "Leaving dirty rinse water or mop solution behind.",
      "Using the tile-safe product repeatedly on grout without checking joint risk.",
    ],
    visualRecognition: [
      "Glossy haze often means cleaner residue or hard-water film.",
      "Dark grout beside clean tile points to joint contamination, not tile failure.",
      "Patchy dullness on textured tile can be soil trapped in low points.",
    ],
    maintenanceRhythm: [
      "Dry-remove grit before damp mopping or scrubbing.",
      "Use neutral maintenance weekly in traffic areas and soil-specific correction as buildup appears.",
      "Rinse and dry shower tile often enough to slow mineral and soap layering.",
    ],
    professionalContext: [
      "Commercial tile floors need more frequent soil suspension and recovery because traffic grinds grit into finish texture.",
      "Professionals separate tile-face cleaning, grout-line cleaning, and restoration decisions.",
    ],
    preservationNotes: [
      "Test matte, decorative, handmade, or stone-look finishes before stronger chemistry.",
      "Protect grout, caulk, and metal trim when using acids or oxidizers.",
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("soap-scum-removal", "Soap scum removal"),
      esMethod("degreasing", "Degreasing"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
    relatedSurfaces: [
      esSurface("grout", "Grout", "The joint material that changes tile cleaning risk."),
      esSurface("vinyl-flooring", "Vinyl flooring", "Another floor surface where residue control matters."),
      esSurface("natural-stone", "Natural stone", "A surface that cannot inherit tile chemistry assumptions."),
    ],
    relatedGuides: [
      guide("best-cleaners-for-bathrooms", "Best cleaners for bathrooms"),
      guide("best-cleaners-for-floors", "Best cleaners for floors"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
    ],
  },
  "shower-glass": {
    ...base("shower-glass", "Shower glass"),
    summary:
      "Shower glass guidance for soap scum, hard-water deposits, cloudy film, etching risk, and recurring maintenance.",
    whatToKnowFirst:
      "Shower glass is glass plus a wet-room cycle. Every use adds moisture, soap residue, minerals, body oils, and drying behavior to the surface.",
    safeMethods:
      "Separate routine glass cleaning from soap-scum removal and hard-water deposit removal. Rinse, squeegee, and dry after corrective cleaning so residue does not restart the cycle.",
    avoidMethods:
      "Avoid metal blades, abrasive pads, repeated acid exposure without rinse discipline, and treating permanent etching as removable haze.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Repeated wet-dry cycles bond minerals and soap film faster than ordinary interior glass.",
          "Door coatings, sweeps, tracks, seals, and metal trim all change the safe chemistry decision.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "White spotting and cloudy patches usually come from hard-water evaporation.",
          "Waxy drag or gray film often points to soap scum and body-product residue.",
          "Dark specks near tracks and silicone usually indicate moisture retention or biological growth nearby.",
        ],
      },
      {
        title: "When recurring maintenance matters",
        points: [
          "Light daily squeegee habits prevent mineral layering better than occasional aggressive correction.",
          "Hard-water homes need shorter maintenance cycles because deposits bond between cleanings.",
        ],
      },
    ],
    commonProblems: [
      rp("soap-scum", "Soap scum", "Waxy bath film that holds minerals and body oils."),
      rp("hard-water-deposits", "Hard water deposits", "White spotting, scale, and cloudy mineral film."),
      rp("cloudy-glass", "Cloudy glass", "Film, mineral damage, or etching requiring diagnosis."),
      rp("light-mildew", "Light mildew appearance", "Usually at tracks, seals, and adjacent joints."),
    ],
    recommendedTools: [
      { name: "Squeegee", note: "Primary prevention tool after shower use and rinse steps." },
      { name: "Clean microfiber", note: "Dry finishing and edge control." },
      { name: "Non-scratch pad", note: "Only for compatible glass and softened film." },
    ],
    recommendedChemicals: [
      { name: "Glass cleaner", note: "Routine clarity and fingerprints." },
      { name: "Soap-scum remover", note: "For bath film after confirming adjacent material tolerance." },
      { name: "Hard-water remover", note: "For mineral deposits with careful rinse and dry control." },
    ],
    commonMistakes: [
      "Using mirror cleaner on layered mineral and soap buildup.",
      "Scrubbing cloudy deposits before chemistry has done the work.",
      "Letting acidic cleaner dry around metal trim or stone surrounds.",
    ],
    visualRecognition: [
      "Droplet-shaped spots point to mineral evaporation.",
      "Uniform cloudy panels suggest soap/mineral layering or etching.",
      "Cleaner streaks after wiping usually indicate residue still on the glass.",
    ],
    maintenanceRhythm: [
      "Squeegee after use in hard-water bathrooms.",
      "Use light weekly cleaning before film becomes bonded.",
      "Schedule deeper mineral correction before the glass loses clarity across full panels.",
    ],
    professionalContext: [
      "Full enclosures, rental turns, and luxury baths often need a professional read on coatings, tracks, and etching.",
      "Professionals stop when cloudiness is glass damage rather than removable deposit.",
    ],
    preservationNotes: [
      "Protect stone, grout, silicone, and metal trim during acid-class cleaning.",
      "Do not escalate to abrasive restoration without confirming the glass and coating type.",
    ],
    relatedMethods: [
      esMethod("glass-cleaning", "Glass cleaning"),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("soap-scum-removal", "Soap scum removal"),
    ],
    relatedSurfaces: [
      esSurface("glass", "Glass", "Lower-moisture glass contexts."),
      esSurface("grout", "Grout", "Adjacent porous joints affected by shower moisture."),
      esSurface("fixtures", "Fixtures", "Metal trim and hardware that share water spotting."),
    ],
    relatedGuides: [
      guide("best-cleaners-for-bathrooms", "Best cleaners for bathrooms"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  },
  grout: {
    ...base("grout", "Grout"),
    summary:
      "Grout guidance for porous joint soil, soap scum, calcium buildup, mildew, sealing cycles, and acid/abrasion risk.",
    whatToKnowFirst:
      "Grout is usually more porous and vulnerable than the tile around it. Cleaning decisions must account for soil absorption, moisture retention, and whether the grout is sealed.",
    safeMethods:
      "Use alkaline or oxidizing cleaning for organic and embedded soils, controlled dwell, grout-safe brushing, careful recovery of suspended soil, and drying. Use acid only when mineral deposits justify the risk.",
    avoidMethods:
      "Avoid routine acid use, flooding, metal scraping, high-force brushing on weak joints, and fragrance or bleach-only approaches that leave embedded soil behind.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Grout sits below the tile plane and acts like a narrow soil reservoir.",
          "Unsealed or worn grout absorbs residue faster and releases it slower than sealed grout.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Traffic lanes darken from fine soil and oily residue.",
          "Showers collect soap scum, calcium buildup, mildew, and biofilm at persistent wet joints.",
          "Kitchen grout holds grease film where backsplash or floor joints sit near cooking zones.",
        ],
      },
      {
        title: "Sealed vs unsealed behavior",
        points: [
          "Sealed grout buys time for wiping but does not make joints maintenance-free.",
          "Unsealed grout needs tighter moisture control and may need professional sealing after soil removal.",
        ],
      },
    ],
    commonProblems: [
      rp("general-soil", "General soil", "Embedded traffic and mixed residue in joints."),
      rp("soap-scum", "Soap scum", "Bath film held inside porous lines."),
      rp("hard-water-deposits", "Hard water deposits", "Calcium and mineral buildup requiring caution."),
      rp("light-mildew", "Light mildew", "Moisture-fed spotting around wet joints."),
      rp("biofilm-buildup", "Biofilm buildup", "Recurring residue in damp grout zones."),
    ],
    recommendedTools: [
      { name: "Grout brush", note: "Narrow agitation inside the joint line." },
      { name: "Detail brush", note: "Corners, edges, and fixture transitions." },
      { name: "Orbital scrubber", note: "Professional escalation for larger compatible areas with controlled pressure." },
      { name: "Microfiber recovery towel", note: "Removes suspended soil instead of redistributing it." },
    ],
    recommendedChemicals: [
      { name: "Alkaline cleaner", note: "Primary lane for oily and embedded soils." },
      { name: "Oxygen or oxidizing cleaner", note: "Organic discoloration and mildew-adjacent staining where appropriate." },
      { name: "Acidic mineral remover", note: "Caution lane for calcium buildup, not routine maintenance." },
    ],
    commonMistakes: [
      "Flooding grout and pushing dirty water deeper into the joint.",
      "Using acid because grout is dark when the issue is soil or staining.",
      "Expecting cleaning to fix worn, missing, or permanently stained grout.",
    ],
    visualRecognition: [
      "Dark uniform lanes usually indicate embedded traffic soil.",
      "White crust or chalky edges suggest mineral buildup.",
      "Patchy black or green speckling in wet areas points to moisture-supported growth.",
    ],
    maintenanceRhythm: [
      "Dry wet grout lines and improve ventilation after showers.",
      "Use targeted brushing before discoloration becomes widespread.",
      "Reassess sealing cycles after deep cleaning, especially in showers and traffic floors.",
    ],
    professionalContext: [
      "High-traffic floors often need machine-assisted agitation and soil recovery rather than more chemical strength.",
      "Professionals distinguish cleaning, stain reduction, regrouting, and sealing before promising color restoration.",
    ],
    preservationNotes: [
      "Repeated acid exposure can weaken cementitious grout and compromise surrounding materials.",
      "Stop if grout powders, cracks, lifts, or releases sand during brushing.",
    ],
    whenToEscalate:
      "Escalate when grout remains dark after controlled cleaning, when joints are deteriorating, when sealing is due, or when mineral removal would require acid near sensitive surfaces.",
    relatedMethods: [
      esMethod("soap-scum-removal", "Soap scum removal"),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
    relatedSurfaces: [
      esSurface("tile", "Tile", "The adjacent face that is usually more tolerant."),
      esSurface("shower-glass", "Shower glass", "Shares soap, mineral, and moisture cycles."),
      esSurface("sealed-surfaces", "Sealed surfaces", "Useful for understanding maintenance cycles."),
    ],
    relatedGuides: [
      guide("best-cleaners-for-bathrooms", "Best cleaners for bathrooms"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
      guide("how-to-remove-stains-safely", "How to remove stains safely"),
    ],
  },
  "stainless-steel": {
    ...base("stainless-steel", "Stainless steel"),
    summary:
      "Stainless steel guidance for fingerprints, grease, water spotting, polish residue, grain direction, and abrasion risk.",
    whatToKnowFirst:
      "Stainless steel is durable but appearance-sensitive. The goal is to remove oils and residue while preserving grain, sheen, and control panels.",
    safeMethods:
      "Use degreasing for oily film, neutral or low-residue cleaning for maintenance, microfiber with the grain, and dry finishing to remove residue.",
    avoidMethods:
      "Avoid steel wool, abrasive pads, harsh acids, chlorine residue, excess polish, and wetting seams, electronics, or label plates.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Brushed grain makes wipe direction and scratch direction visible.",
          "Oily residue can look clean at one angle and streaked under stronger light.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Fingerprints and smudges collect around handles, panels, and appliance edges.",
          "Grease film builds near ranges, hoods, and dishwasher fronts.",
          "Hard water spots appear on sinks, faucets, trim, and wet appliance zones.",
        ],
      },
      {
        title: "Polish compatibility",
        points: [
          "Polish can improve appearance after cleaning but becomes a problem when layered over soil.",
          "Food-contact and high-touch zones need residue awareness, not only shine.",
        ],
      },
    ],
    commonProblems: [
      rp("fingerprints-and-smudges", "Fingerprints and smudges", "High-touch oil transfer."),
      rp("grease-buildup", "Grease buildup", "Kitchen film around cooking zones."),
      rp("appliance-grime", "Appliance grime", "Mixed residue on fronts and handles."),
      rp("water-spotting", "Water spotting", "Mineral marks on sinks and trim."),
      rp("finish-scratches", "Finish scratches", "Often permanent abrasion, not soil."),
    ],
    recommendedTools: [
      { name: "Soft microfiber", note: "Fold and rotate to prevent oil smearing." },
      { name: "Detail cloth", note: "Handles, panel edges, and grain corners." },
      { name: "Non-scratch pad", note: "Only for compatible stainless and softened residue." },
    ],
    recommendedChemicals: [
      { name: "Mild degreaser", note: "For oily kitchen films with full residue removal." },
      { name: "Neutral cleaner", note: "Routine fingerprints and smudges." },
      { name: "Stainless polish", note: "Optional finish step, not a substitute for cleaning." },
    ],
    commonMistakes: [
      "Polishing over grease instead of removing it.",
      "Wiping across visible grain with a loaded towel.",
      "Using abrasive pads that permanently alter sheen.",
    ],
    visualRecognition: [
      "Directional wipe marks usually mean residue or wrong towel technique.",
      "Fine linear damage that catches light is likely abrasion.",
      "Rainbow or brown heat tint near cooking areas may not be removable soil.",
    ],
    maintenanceRhythm: [
      "Wipe handles and fronts frequently before oils polymerize.",
      "Deep-degrease range-adjacent stainless before applying any appearance polish.",
      "Dry sinks and wet trim to reduce mineral spotting.",
    ],
    professionalContext: [
      "Commercial kitchens and shared office appliances need shorter degreasing intervals and stricter towel separation.",
      "Professionals choose microfiber selection, grain direction, and residue removal before cosmetic polish.",
    ],
    preservationNotes: [
      "Keep chlorine and strong acid residues off stainless unless labels explicitly allow the use case.",
      "Do not use steel wool; embedded metal particles and scratches can create corrosion-looking defects.",
    ],
    relatedSurfaces: [
      esSurface("appliances", "Appliances", "High-touch panels and control areas."),
      esSurface("sinks", "Sinks", "Water, mineral, and food residue context."),
      esSurface("fixtures", "Fixtures", "Similar metal spotting and polish risk."),
    ],
    relatedMethods: [
      esMethod("degreasing", "Degreasing"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-kitchens", "Best cleaners for kitchens"),
      guide("best-cleaners-for-appliances", "Best cleaners for appliances"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
    ],
  },
  "quartz-countertops": {
    ...base("quartz-countertops", "Quartz countertops"),
    summary:
      "Quartz countertop guidance for resin-bound stone behavior, heat risk, discoloration, residue film, and daily maintenance chemistry.",
    whatToKnowFirst:
      "Quartz is engineered stone with resin binders. It resists many daily soils but is not a heat-proof, acid-proof, or abrasive-proof work surface.",
    safeMethods:
      "Use neutral surface cleaning for daily maintenance, mild degreasing for kitchen film, and controlled dwell-and-lift for dried residue.",
    avoidMethods:
      "Avoid high heat, harsh solvents, abrasive powders, strong acids or alkalis, and letting colored spills or cleaners dwell unnecessarily.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Quartz combines mineral filler with resin, so heat and some chemicals can affect appearance even when the stone fraction is durable.",
          "Polished quartz shows film, fingerprints, and wipe trails quickly under kitchen lighting.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Countertop residue builds from dish soap, food film, disinfectant overuse, and damp towel wiping.",
          "Sink edges develop water spots and light mineral rings.",
          "Cooking zones collect grease and sticky films that need removal before neutral maintenance looks good.",
        ],
      },
      {
        title: "Heat and discoloration sensitivity",
        points: [
          "Hot pans, heat appliances, and prolonged thermal exposure can leave marks that cleaning cannot reverse.",
          "Pigmented spills and strong cleaners can create discoloration when allowed to dwell.",
        ],
      },
    ],
    commonProblems: [
      rp("countertop-residue", "Countertop residue", "Daily film from food, cleaner, and dish-soap residue."),
      rp("product-residue-buildup", "Product residue buildup", "Repeated cleaner layers that dull the finish."),
      rp("heat-damage-marks", "Heat damage marks", "Thermal marks that may not be cleanable."),
      rp("water-spotting", "Water spotting", "Mineral spots around sinks and wet zones."),
      rp("smudge-marks", "Smudge marks", "Oily hand and food transfer."),
    ],
    recommendedTools: [
      { name: "Microfiber towel", note: "Use one damp pass and one dry finish pass." },
      { name: "Non-scratch pad", note: "Only for softened residue and confirmed finish tolerance." },
      { name: "Plastic scraper", note: "For lifted residue, never force dry scraping." },
    ],
    recommendedChemicals: [
      { name: "Neutral countertop cleaner", note: "Daily maintenance lane." },
      { name: "Mild degreaser", note: "Kitchen film where label allows quartz." },
      { name: "Dwell-and-lift product", note: "Short controlled dwell for dried spills." },
    ],
    commonMistakes: [
      "Using stone myths to assume quartz tolerates any chemistry.",
      "Putting hot pans or appliances directly on the surface.",
      "Overusing disinfectants and leaving dulling residue behind.",
    ],
    visualRecognition: [
      "Uniform dullness often means cleaner film rather than surface failure.",
      "Yellowing or ring marks near heat sources require damage assessment.",
      "Smears that return after wiping usually mean residue is being redistributed.",
    ],
    maintenanceRhythm: [
      "Wipe food and pigment spills promptly.",
      "Use neutral daily maintenance and periodic residue resets in cooking zones.",
      "Dry sink edges to prevent water-spot loops.",
    ],
    professionalContext: [
      "Commercial breakrooms and kitchen islands need more frequent residue resets due to constant hand and food contact.",
      "Professionals separate daily cleaning from finish correction and warranty-sensitive damage.",
    ],
    preservationNotes: [
      "Use trivets and heat pads; cleaning cannot reliably fix resin heat damage.",
      "Avoid abrasive powders and aggressive solvents that can change sheen.",
    ],
    relatedSurfaces: [
      esSurface("countertops", "Countertops", "Broader countertop maintenance context."),
      esSurface("sinks", "Sinks", "Wet-edge mineral and residue patterns."),
      esSurface("natural-stone", "Natural stone", "A different stone lane with stronger chemistry restrictions."),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("degreasing", "Degreasing"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-kitchens", "Best cleaners for kitchens"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  },
  "granite-countertops": {
    ...base("granite-countertops", "Granite countertops"),
    summary:
      "Granite countertop guidance for sealed stone behavior, water spots, residue film, sealer wear, and acid etching caution.",
    whatToKnowFirst:
      "Granite cleaning is stone plus sealer management. The stone may be durable, but the sealer, finish, and surrounding grout or caulk define safe maintenance.",
    safeMethods:
      "Use neutral stone-safe cleaning, gentle degreasing only when label-compatible, quick drying, and sealer-aware maintenance.",
    avoidMethods:
      "Avoid vinegar, harsh acids, abrasive powders, unknown stone polishes, and heavy degreaser dwell that may affect sealers.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Granite porosity and sealer condition vary, so two countertops can respond differently to the same spill.",
          "The visible issue may be soil, water spotting, sealer wear, or true stone damage.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Sink zones collect water spots, soap residue, and ring stains.",
          "Cooking zones collect grease and food film that dulls polished stone.",
          "Bathroom vanity granite may see toothpaste, cosmetics, and hard-water film.",
        ],
      },
      {
        title: "Sealer and acid sensitivity",
        points: [
          "Sealers reduce absorption but do not make stone chemical-proof.",
          "Acid mistakes can show as dullness or etching-like changes, especially around citrus, vinegar, and bathroom products.",
        ],
      },
    ],
    commonProblems: [
      rp("countertop-residue", "Countertop residue", "Daily cleaner and food film."),
      rp("water-spotting", "Water spotting", "Mineral marks around wet zones."),
      rp("surface-dullness", "Surface dullness", "Residue, sealer wear, or finish damage."),
      rp("etching-on-finishes", "Etching on finishes", "Often a stop-and-assess condition on stone."),
    ],
    recommendedTools: [
      { name: "Soft microfiber", note: "Low-abrasion wiping and dry finishing." },
      { name: "Stone-safe pad", note: "Only when confirmed compatible and soil is softened." },
    ],
    recommendedChemicals: [
      { name: "pH-neutral stone cleaner", note: "Default daily lane." },
      { name: "Stone-safe degreaser", note: "Short dwell only where label allows." },
    ],
    commonMistakes: [
      "Using vinegar or bathroom descaler on stone.",
      "Assuming sealed stone can be flooded.",
      "Treating sealer wear as removable soil.",
    ],
    visualRecognition: [
      "Darkening around water contact can indicate absorption or sealer weakness.",
      "Dull spots may be residue, sealer change, or etching-like damage.",
      "Ring stains near sinks should be treated as stone-specific until proven otherwise.",
    ],
    maintenanceRhythm: [
      "Wipe spills promptly and dry wet zones.",
      "Use neutral stone maintenance routinely rather than strong occasional correction.",
      "Reassess sealer performance when water darkens the stone or stains linger.",
    ],
    professionalContext: [
      "Hospitality, office kitchens, and heavy-use islands need more frequent neutral maintenance and sealer checks.",
      "Professionals avoid promising stain removal before identifying stone type, finish, and sealer state.",
    ],
    preservationNotes: [
      "Keep acid-class bath and mineral products away from natural stone unless stone-safe and label-approved.",
      "Stop when dullness does not respond to residue removal; it may need stone restoration.",
    ],
    relatedSurfaces: [
      esSurface("natural-stone", "Natural stone", "The broader stone preservation lane."),
      esSurface("countertops", "Countertops", "Daily food-contact maintenance context."),
      esSurface("quartz-countertops", "Quartz countertops", "Engineered stone with different risks."),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("degreasing", "Degreasing"),
    ],
    relatedGuides: [
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  },
  "natural-stone": {
    ...base("natural-stone", "Natural stone"),
    summary:
      "Natural stone guidance for marble, granite, travertine, limestone, slate, sealed finishes, acid etching, and stain risk.",
    whatToKnowFirst:
      "Natural stone must be identified before cleaning. Acid sensitivity, porosity, finish type, and sealer condition determine the safe lane.",
    safeMethods:
      "Use pH-neutral stone-safe cleaning, minimal dwell, soft tools, and fast drying. Treat stains, etching, and sealer failure as separate diagnoses.",
    avoidMethods:
      "Avoid vinegar, descalers, abrasive powders, strong alkaline degreasers, steam, and generic bathroom cleaners unless explicitly stone-safe.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Some stones react chemically with acids while others mainly carry porosity and sealer risks.",
          "Polished, honed, tumbled, and textured finishes show damage in different ways.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Bathrooms create mineral and soap residue that tempts unsafe acid use.",
          "Kitchens create oil, pigment, and water rings that may penetrate if sealer is weak.",
          "Floors collect grit that abrades softer stone under foot traffic.",
        ],
      },
      {
        title: "Escalation conditions",
        points: [
          "Etching, deep stains, sealer failure, or unknown stone type should stop DIY escalation.",
          "Recurring darkening after cleaning suggests absorption or moisture below the surface.",
        ],
      },
    ],
    commonProblems: [
      rp("etching-on-finishes", "Etching on finishes", "Chemical dulling risk on acid-sensitive stone."),
      rp("surface-dullness", "Surface dullness", "Residue, wear, or finish damage."),
      rp("water-spotting", "Water spotting", "Mineral marks that require stone-safe handling."),
      rp("organic-stains", "Organic stains", "Pigment or oil absorption risk."),
    ],
    recommendedTools: [
      { name: "Soft microfiber", note: "Default for daily stone maintenance." },
      { name: "Neutral mop pad", note: "Lightly damp, never saturated." },
    ],
    recommendedChemicals: [
      { name: "Stone-safe neutral cleaner", note: "Default chemistry lane." },
      { name: "Stone-specific poultice", note: "Professional or label-directed stain work only." },
    ],
    commonMistakes: [
      "Using acid mineral remover on marble, limestone, or travertine.",
      "Assuming all stone behaves like porcelain tile.",
      "Trying to scrub out etching that is actually finish damage.",
    ],
    visualRecognition: [
      "Dull splash marks can indicate acid etching.",
      "Darkened wet-looking areas can point to absorption.",
      "Fine traffic haze can be abrasive wear from grit, not cleaner failure.",
    ],
    maintenanceRhythm: [
      "Dry water and spills promptly.",
      "Use frequent gentle maintenance instead of infrequent aggressive cleaning.",
      "Monitor sealer performance in sink, shower, and food-prep zones.",
    ],
    professionalContext: [
      "Commercial stone floors require dust control and scheduled maintenance to prevent grit abrasion.",
      "Professionals confirm stone class before stain, etch, or sealer decisions.",
    ],
    preservationNotes: [
      "When stone type is unknown, treat it as acid-sensitive until identified.",
      "Do not use generic hard-water or soap-scum products on natural stone without explicit compatibility.",
    ],
    relatedSurfaces: [
      esSurface("granite-countertops", "Granite countertops"),
      esSurface("tile", "Tile"),
      esSurface("sealed-surfaces", "Sealed surfaces"),
      esSurface("unsealed-surfaces", "Unsealed surfaces"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("detail-dusting", "Detail dusting"),
    ],
    relatedGuides: [
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
      guide("how-to-remove-stains-safely", "How to remove stains safely"),
    ],
  },
  laminate: {
    ...base("laminate", "Laminate"),
    summary:
      "Laminate guidance for seam moisture, grease film, scuffs, cleaner residue, heat marks, and finish-safe maintenance.",
    whatToKnowFirst:
      "Laminate is a durable wear layer over a moisture-sensitive core or backing. Edges, seams, and abrasion define the risk.",
    safeMethods:
      "Use neutral cleaning for routine maintenance, mild degreasing for kitchen film, and short dwell-and-lift for sticky residue with quick drying.",
    avoidMethods:
      "Avoid flooding seams, steam, abrasive pads, hot surface cleaning, and strong solvents that can haze or soften finish layers.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "The top layer may resist soil while seams and substrate remain vulnerable to water.",
          "Textured laminate traps film and needs residue removal, not extra shine product.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Kitchen laminate collects grease, fingerprints, cabinet grime, and sticky residue.",
          "Vanity laminate sees water spotting and product film around sinks.",
          "Flooring laminate develops mop haze when cleaner is over-applied.",
        ],
      },
      {
        title: "Moisture and heat sensitivity",
        points: [
          "Standing water can swell seams and edges.",
          "Heat marks and delamination are preservation issues, not cleaning targets.",
        ],
      },
    ],
    commonProblems: [
      rp("grease-buildup", "Grease buildup", "Kitchen film on counters, cabinets, and edges."),
      rp("sticky-film", "Sticky film", "Residue that needs dwell and lift."),
      rp("scuff-marks", "Scuff marks", "Transfer or abrasion-like marks."),
      rp("product-residue-buildup", "Product residue buildup", "Cleaner film from overuse."),
      rp("heat-damage-marks", "Heat damage marks", "Thermal damage risk."),
    ],
    recommendedTools: [
      { name: "Microfiber towel", note: "Controlled damp wiping and dry finishing." },
      { name: "Non-scratch pad", note: "Only light pressure on softened soil." },
      { name: "Mop pad", note: "For laminate flooring with minimal moisture." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Routine laminate maintenance." },
      { name: "Mild degreaser", note: "Kitchen films with complete wipe-off." },
    ],
    commonMistakes: [
      "Letting cleaner pool at seams and edges.",
      "Using abrasive pads to remove scuffs.",
      "Adding polish or shine products over residue.",
    ],
    visualRecognition: [
      "Raised seams or edge swelling signal moisture damage.",
      "Tacky feel points to grease or cleaner residue.",
      "White haze after mopping usually means over-application or poor rinse control.",
    ],
    maintenanceRhythm: [
      "Wipe spills promptly and dry seams.",
      "Reset kitchen film before it becomes sticky or yellowed.",
      "Use low-moisture floor maintenance instead of wet mopping.",
    ],
    professionalContext: [
      "Rental turns and breakrooms often need degreasing around handles and edges, not stronger all-over chemistry.",
      "Professionals avoid forcing swollen seams back to a cleanable state.",
    ],
    preservationNotes: [
      "Do not steam laminate floors or cabinet panels.",
      "Stop when marks reveal finish wear, delamination, or swelling.",
    ],
    relatedSurfaces: [
      esSurface("cabinets", "Cabinets"),
      esSurface("countertops", "Countertops"),
      esSurface("vinyl-flooring", "Vinyl flooring"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("degreasing", "Degreasing"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-kitchens", "Best cleaners for kitchens"),
      guide("best-cleaners-for-floors", "Best cleaners for floors"),
    ],
  },
  "finished-wood": {
    ...base("finished-wood", "Finished wood"),
    summary:
      "Finished wood guidance for low-moisture cleaning, dust, fingerprints, product buildup, dullness, and finish preservation.",
    whatToKnowFirst:
      "Finished wood cleaning protects the coating first and removes soil second. Moisture, abrasion, and product buildup are the main failure modes.",
    safeMethods:
      "Dry dust first, then use lightly damp microfiber and finish-safe neutral maintenance. Dry-finish where residue or sheen differences appear.",
    avoidMethods:
      "Avoid direct spraying, flooding, steam, strong alkaline or acidic cleaners, oil-heavy buildup products, and aggressive scrub pads.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "The visible surface is usually a finish layer over wood, veneer, or composite.",
          "Moisture can enter joints, end grain, scratches, and worn finish areas faster than the flat face.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Dust and hand oils collect on rails, shelves, furniture tops, and cabinet edges.",
          "Polish buildup creates dull or sticky areas that look like soil.",
          "Baseboard and trim edges collect floor dust and mop splash.",
        ],
      },
      {
        title: "What changes over time",
        points: [
          "Finish wear makes the surface more moisture-sensitive.",
          "Repeated product layers can hide the original sheen and attract soil.",
        ],
      },
    ],
    commonProblems: [
      rp("dust-buildup", "Dust buildup", "Dry soil that should be captured before damp wiping."),
      rp("smudge-marks", "Smudge marks", "Oils and touch transfer."),
      rp("surface-dullness", "Surface dullness", "Residue, wear, or product buildup."),
      rp("residue-buildup", "Residue buildup", "Polish or cleaner layers."),
    ],
    recommendedTools: [
      { name: "Dry microfiber", note: "Capture dust before moisture." },
      { name: "Lightly damp microfiber", note: "Controlled maintenance only." },
      { name: "Detail brush", note: "Dry or barely damp edge work." },
    ],
    recommendedChemicals: [
      { name: "Finish-safe neutral cleaner", note: "Use sparingly and never flood." },
      { name: "Wood-maintenance product", note: "Only when compatible with the finish, not as a soil coverup." },
    ],
    commonMistakes: [
      "Spraying cleaner directly onto wood.",
      "Using furniture polish to hide greasy or dusty buildup.",
      "Scrubbing worn finish until sheen changes.",
    ],
    visualRecognition: [
      "White rings, raised grain, or edge swelling indicate moisture stress.",
      "Sticky drag can indicate polish or grease buildup.",
      "Uneven sheen may be wear rather than removable soil.",
    ],
    maintenanceRhythm: [
      "Dust frequently and damp-clean only as needed.",
      "Use low-moisture touchpoint cleaning where hands contact wood.",
      "Address product buildup before applying more finish-enhancing product.",
    ],
    professionalContext: [
      "High-end woodwork and commercial millwork require towel discipline and finish identification before cleaning.",
      "Professionals separate cleaning from refinishing when finish integrity is compromised.",
    ],
    preservationNotes: [
      "Keep moisture out of joints, end grain, veneer edges, and worn finish.",
      "Stop if color, sheen, or texture changes during cleaning.",
    ],
    relatedSurfaces: [
      esSurface("hardwood", "Hardwood"),
      esSurface("baseboards", "Baseboards"),
      esSurface("cabinets", "Cabinets"),
    ],
    relatedMethods: [
      esMethod("detail-dusting", "Detail dusting"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
    relatedGuides: [
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
      guide("best-cleaners-for-floors", "Best cleaners for floors"),
    ],
  },
  hardwood: {
    ...base("hardwood", "Hardwood"),
    summary:
      "Hardwood guidance for sealed floors, moisture control, grit abrasion, finish dullness, pet marks, and recurring maintenance.",
    whatToKnowFirst:
      "Most routine hardwood cleaning is finish cleaning. The wood underneath becomes vulnerable when seams, scratches, or worn finish admit moisture.",
    safeMethods:
      "Use dry soil removal first, then neutral floor cleaner with a lightly damp microfiber pad. Dry high-risk areas and avoid leaving cleaner film.",
    avoidMethods:
      "Avoid wet mopping, steam, vinegar, high-alkaline degreasers, abrasive pads, and heat-based treatments.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "A sealed hardwood floor depends on the integrity of its finish coat.",
          "Grit underfoot can abrade finish faster than most routine household soils.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Entry lanes collect grit, dust, and heel transfer.",
          "Kitchen and dining areas collect food film and light grease at traffic paths.",
          "Pet zones may involve moisture, odor, and finish exposure rather than surface soil alone.",
        ],
      },
      {
        title: "Moisture sensitivity",
        points: [
          "Standing water can enter seams and cause cupping, darkening, or finish failure.",
          "Overwet pads leave haze and can stress older finishes.",
        ],
      },
    ],
    commonProblems: [
      rp("dust-buildup", "Dust buildup", "Grit that should be removed before damp cleaning."),
      rp("floor-residue-buildup", "Floor residue buildup", "Cleaner film from over-application."),
      rp("scuff-marks", "Scuff marks", "Transfer or finish abrasion."),
      rp("surface-dullness", "Surface dullness", "Residue, wear, or finish damage."),
    ],
    recommendedTools: [
      { name: "Dust mop", note: "Removes abrasive soil before moisture." },
      { name: "Microfiber mop pad", note: "Lightly damp, changed before it loads." },
      { name: "Soft detail cloth", note: "Edges and spot work." },
    ],
    recommendedChemicals: [
      { name: "pH-neutral hardwood floor cleaner", note: "Use sparingly and dry promptly." },
    ],
    commonMistakes: [
      "Wet mopping as if the floor were tile.",
      "Using vinegar or steam to chase shine.",
      "Adding polish over gritty or dirty residue.",
    ],
    visualRecognition: [
      "Cloudy paths often indicate residue or finish wear.",
      "Dark seams or raised edges point to moisture intrusion.",
      "Fine dull traffic lanes may be abrasion, not removable dirt.",
    ],
    maintenanceRhythm: [
      "Dry dust high-traffic lanes often.",
      "Damp-maintain with minimal product when residue or footprints appear.",
      "Use mats and grit control to reduce abrasion between cleanings.",
    ],
    professionalContext: [
      "Commercial hardwood needs scheduled dry soil control because traffic converts grit into finish wear.",
      "Professionals stop cleaning escalation when screening, recoating, or refinishing is the real fix.",
    ],
    preservationNotes: [
      "Do not use steam machines on hardwood.",
      "Stop if the finish becomes tacky, white, darkened, or rough during cleaning.",
    ],
    relatedSurfaces: [
      esSurface("finished-wood", "Finished wood"),
      esSurface("vinyl-flooring", "Vinyl flooring"),
      esSurface("baseboards", "Baseboards"),
    ],
    relatedMethods: [
      esMethod("detail-dusting", "Detail dusting"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-floors", "Best cleaners for floors"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  },
  "vinyl-flooring": {
    ...base("vinyl-flooring", "Vinyl flooring"),
    summary:
      "Vinyl flooring guidance for mop residue, scuffs, floor buildup, cleaner film, moisture control, and wear-layer preservation.",
    whatToKnowFirst:
      "Vinyl flooring is water-tolerant on the surface but not immune to seam moisture, finish film, abrasive grit, or incompatible polish.",
    safeMethods:
      "Dry-remove grit first, use neutral floor cleaning with controlled solution, change pads or rinse water often, and dry areas that stay tacky.",
    avoidMethods:
      "Avoid steam, abrasive pads, excessive water at seams, wax unless the product system requires it, and solvent-heavy spot removal.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "The wear layer controls cleanability and scratch resistance.",
          "Cleaner residue on vinyl can feel sticky and collect new soil quickly.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Traffic lanes collect grit and floor film.",
          "Kitchen vinyl gets grease mist and sticky food residue.",
          "Bathroom vinyl develops water spots and residue near fixtures.",
        ],
      },
      {
        title: "Recurring maintenance risk",
        points: [
          "Dirty mop water and too much product create the dull film people keep trying to clean.",
          "Scuffs often need controlled lift, not stronger whole-floor chemistry.",
        ],
      },
    ],
    commonProblems: [
      rp("floor-residue-buildup", "Floor residue buildup", "Cleaner or mop film."),
      rp("scuff-marks", "Scuff marks", "Transfer marks from traffic."),
      rp("floor-buildup", "Floor buildup", "Traffic soil and old product."),
      rp("greasy-grime", "Greasy grime", "Kitchen film on floor paths."),
    ],
    recommendedTools: [
      { name: "Dust mop or vacuum", note: "Removes grit before damp cleaning." },
      { name: "Microfiber mop pad", note: "Controls solution and residue pickup." },
      { name: "Soft white pad", note: "Spot scuffs without cutting the wear layer." },
    ],
    recommendedChemicals: [
      { name: "Neutral floor cleaner", note: "Diluted correctly for routine maintenance." },
      { name: "Residue reset cleaner", note: "For film buildup where floor type allows it." },
    ],
    commonMistakes: [
      "Using too much cleaner and creating sticky film.",
      "Mopping with dirty solution across the whole room.",
      "Using abrasive pads that dull the wear layer.",
    ],
    visualRecognition: [
      "Footprints appearing after cleaning often mean residue remains.",
      "Gray traffic lanes indicate soil plus abrasion pressure.",
      "Yellowing may be age, plasticizer change, adhesive, or incompatible product.",
    ],
    maintenanceRhythm: [
      "Dry soil removal should be more frequent than wet mopping.",
      "Neutral mop regularly in high-traffic lanes with fresh pads.",
      "Do periodic residue resets when the floor looks clean but feels tacky.",
    ],
    professionalContext: [
      "Commercial vinyl needs autoscrub or controlled pad systems only when compatible with the wear layer.",
      "Professionals treat stripping, coating, and residential maintenance as separate systems.",
    ],
    preservationNotes: [
      "Keep steam and aggressive solvents away from seams and adhesive-sensitive areas.",
      "Stop when discoloration or dullness follows a wear pattern instead of a soil pattern.",
    ],
    relatedSurfaces: [
      esSurface("laminate", "Laminate"),
      esSurface("tile", "Tile"),
      esSurface("sealed-surfaces", "Sealed surfaces"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
      esMethod("detail-dusting", "Detail dusting"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-floors", "Best cleaners for floors"),
      guide("why-cleaning-fails", "Why cleaning fails"),
    ],
  },
  "painted-walls": {
    ...base("painted-walls", "Painted walls"),
    summary:
      "Painted wall guidance for fingerprints, scuffs, dust, washable paint limits, moisture control, and finish dulling.",
    whatToKnowFirst:
      "Painted walls are finish-sensitive. Paint sheen, age, color, and washability determine whether a mark can be cleaned without flashing or dulling.",
    safeMethods:
      "Dry dust first, spot clean with a lightly damp microfiber and mild neutral cleaner, then feather and dry the area.",
    avoidMethods:
      "Avoid scrubbing flat paint, using strong degreasers broadly, soaking drywall, and using abrasive pads that burnish or remove paint.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Flat and matte paints hide wall imperfections but mark and burnish more easily.",
          "Satin and semi-gloss paints tolerate more cleaning but can still streak or dull.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Switch plates, hallways, doors, and stair walls collect hand oils and smudges.",
          "Bathrooms and laundry areas may show moisture staining or mildew-adjacent marks.",
          "Kitchen-adjacent walls collect airborne grease that needs gentle degreasing discipline.",
        ],
      },
      {
        title: "Moisture sensitivity",
        points: [
          "Drywall-backed assemblies cannot be saturated.",
          "Water marks can spread if cleaning is too wet or not feathered.",
        ],
      },
    ],
    commonProblems: [
      rp("smudge-marks", "Smudge marks", "Hand oils and traffic marks."),
      rp("scuff-marks", "Scuff marks", "Transfer or abrasion marks."),
      rp("dust-buildup", "Dust buildup", "Dry soil on texture and corners."),
      rp("surface-streaking", "Surface streaking", "Cleaning marks from uneven moisture."),
      rp("grime-buildup", "Grime buildup", "Traffic and kitchen-adjacent film."),
    ],
    recommendedTools: [
      { name: "Dry microfiber duster", note: "First pass for dust and cobwebs." },
      { name: "Lightly damp microfiber", note: "Spot cleaning with low pressure." },
      { name: "Detail cloth", note: "Switch plates, corners, and trim edges." },
    ],
    recommendedChemicals: [
      { name: "Mild neutral cleaner", note: "Diluted and used sparingly." },
      { name: "Gentle degreaser", note: "Only on washable paint near kitchens." },
    ],
    commonMistakes: [
      "Scrubbing a mark until the paint burnishes.",
      "Cleaning one small spot so it flashes against the surrounding wall.",
      "Using too much moisture on drywall.",
    ],
    visualRecognition: [
      "Shiny patches on matte paint suggest burnishing.",
      "Gray hand-height patterns point to oil and touch transfer.",
      "Brown or spreading stains may be moisture or substrate issues, not surface soil.",
    ],
    maintenanceRhythm: [
      "Dust wall edges and corners before damp cleaning.",
      "Spot clean high-touch zones before oils set into paint.",
      "Repaint or touch up when cleaning changes sheen faster than it removes soil.",
    ],
    professionalContext: [
      "Commercial hallways and offices often need scheduled touchpoint cleaning plus paint maintenance, not aggressive washing.",
      "Professionals test washability before treating large wall fields.",
    ],
    preservationNotes: [
      "Stop if paint transfers to the towel or sheen changes.",
      "Treat recurring musty marks as moisture investigation, not repeated wiping.",
    ],
    relatedSurfaces: [
      esSurface("painted-surfaces", "Painted surfaces"),
      esSurface("baseboards", "Baseboards"),
      esSurface("cabinets", "Cabinets"),
    ],
    relatedMethods: [
      esMethod("detail-dusting", "Detail dusting"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("degreasing", "Degreasing"),
    ],
    relatedGuides: [
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
      guide("cleaning-every-surface", "Cleaning every surface"),
    ],
  },
  "painted-surfaces": {
    ...base("painted-surfaces", "Painted surfaces"),
    summary:
      "Painted surface guidance for doors, trim, rails, cabinetry, wall paint, fingerprints, scuffs, degreasing limits, and finish dulling.",
    whatToKnowFirst:
      "Painted surfaces are not one material. Sheen, cure age, substrate, and wear determine whether cleaning removes soil or changes the finish.",
    safeMethods:
      "Use dry dusting, neutral spot cleaning, mild degreasing only where the paint is washable, and low-pressure microfiber passes.",
    avoidMethods:
      "Avoid abrasive pads, strong solvent, excess dwell, and repeated scrubbing on matte, older, or already compromised paint.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Paint is a coating, so the coating condition controls risk more than the underlying substrate.",
          "High-touch painted surfaces collect oils that need cleaning, while low-sheen areas can be damaged by the cleaning itself.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Doors, trim, and railings collect hand oils and smudges.",
          "Kitchen-painted surfaces collect grease film.",
          "Baseboards collect floor dust, mop splash, and impact scuffs.",
        ],
      },
      {
        title: "Abrasion sensitivity",
        points: [
          "Burnishing can make a clean spot look shinier than the surrounding paint.",
          "Old or poorly bonded paint can transfer to towels under mild friction.",
        ],
      },
    ],
    commonProblems: [
      rp("smudge-marks", "Smudge marks"),
      rp("scuff-marks", "Scuff marks"),
      rp("grime-buildup", "Grime buildup"),
      rp("surface-discoloration", "Surface discoloration"),
    ],
    recommendedTools: [
      { name: "Soft microfiber", note: "Low-pressure wiping." },
      { name: "Detail brush", note: "Dry detailing around profiles and grooves." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Default for washable paint." },
      { name: "Mild degreaser", note: "Kitchen areas only after test spot." },
    ],
    commonMistakes: [
      "Using the same pressure on flat wall paint and semi-gloss trim.",
      "Cleaning cured grease with water alone until paint dulls.",
      "Ignoring paint transfer on the towel.",
    ],
    visualRecognition: [
      "Gloss shift indicates burnishing or coating change.",
      "Color on the cloth indicates paint transfer.",
      "Edge swelling or cracking indicates substrate or moisture issues.",
    ],
    maintenanceRhythm: [
      "Dust profiles before damp cleaning.",
      "Spot clean touchpoints regularly with low moisture.",
      "Use repainting or touch-up when soil removal would damage the coating.",
    ],
    professionalContext: [
      "Commercial door frames and rails need frequent touchpoint cleaning with finish-safe products.",
      "Professionals separate disinfecting labels from paint compatibility.",
    ],
    preservationNotes: [
      "Do not chase every scuff if the paint begins to burnish.",
      "Escalate to touch-up rather than stronger chemistry when coating wear is visible.",
    ],
    relatedSurfaces: [
      esSurface("painted-walls", "Painted walls"),
      esSurface("baseboards", "Baseboards"),
      esSurface("cabinets", "Cabinets"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("detail-dusting", "Detail dusting"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
  },
  baseboards: {
    ...base("baseboards", "Baseboards"),
    summary:
      "Baseboard guidance for dust ledges, mop splash, scuffs, pet residue, paint preservation, and trim-detail maintenance.",
    whatToKnowFirst:
      "Baseboards combine painted or finished trim with floor-adjacent contamination. Soil often comes from dust, footwear, mops, pets, and wall contact.",
    safeMethods:
      "Dry dust first, then use low-moisture neutral cleaning. Treat scuffs and sticky spots locally with minimal pressure.",
    avoidMethods:
      "Avoid soaking the wall-floor joint, abrasive pads on painted trim, and dragging dirty mop water against the baseboard.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Baseboards sit in the dust and splash zone where walls, floors, and trim meet.",
          "Profiles and caulk lines trap soils that flat wall cleaning misses.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Top ledges collect dust and hair.",
          "Lower edges collect mop splash, pet residue, and shoe scuffs.",
          "Corners collect compacted dust and residue.",
        ],
      },
      {
        title: "When recurring maintenance matters",
        points: [
          "Regular dry detailing prevents dust from becoming damp grime.",
          "High-traffic rooms need baseboard attention before deep-clean visits make the contrast obvious.",
        ],
      },
    ],
    commonProblems: [
      rp("dust-buildup", "Dust buildup"),
      rp("scuff-marks", "Scuff marks"),
      rp("grime-buildup", "Grime buildup"),
      rp("organic-stains", "Organic stains"),
    ],
    recommendedTools: [
      { name: "Detail duster", note: "Top ledges and corners." },
      { name: "Microfiber cloth", note: "Low-moisture wipe-down." },
      { name: "Soft detail brush", note: "Profiles and caulk lines." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Light wipe-down after dust removal." },
      { name: "Mild degreaser", note: "Kitchen and dining baseboards only after testing paint." },
    ],
    commonMistakes: [
      "Starting wet and turning dust into mud.",
      "Scrubbing painted trim until it burnishes.",
      "Ignoring dirty mop splash as a recurring source.",
    ],
    visualRecognition: [
      "Gray top edges point to dry dust accumulation.",
      "Dark lower streaks often come from mop water or shoe contact.",
      "Chipped or peeling paint is a preservation issue, not a cleaning target.",
    ],
    maintenanceRhythm: [
      "Dry dust baseboards during routine room maintenance.",
      "Damp wipe high-traffic trim during deeper cleaning cycles.",
      "Correct floor-cleaning technique if mop splash keeps returning.",
    ],
    professionalContext: [
      "Move-out and light commercial cleanings often expose baseboards as a major visual quality cue.",
      "Professionals detail baseboards after floors are dry enough not to resoil trim.",
    ],
    preservationNotes: [
      "Keep moisture out of wall-floor gaps.",
      "Stop if paint flakes, caulk opens, or trim swells.",
    ],
    relatedSurfaces: [
      esSurface("painted-surfaces", "Painted surfaces"),
      esSurface("painted-walls", "Painted walls"),
      esSurface("hardwood", "Hardwood"),
      esSurface("vinyl-flooring", "Vinyl flooring"),
    ],
    relatedMethods: [
      esMethod("detail-dusting", "Detail dusting"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
  },
  cabinets: {
    ...base("cabinets", "Cabinets"),
    summary:
      "Cabinet guidance for painted, stained, laminate, and thermofoil faces exposed to grease, fingerprints, moisture, and edge wear.",
    whatToKnowFirst:
      "Cabinets are assembled surfaces. Door faces, edges, pulls, seams, hinges, and finishes can each have different cleaning tolerance.",
    safeMethods:
      "Dry remove dust, use mild degreasing only where needed, wipe with controlled moisture, and dry seams and hardware.",
    avoidMethods:
      "Avoid spraying into hinges or seams, strong degreaser dwell on painted finishes, abrasive pads, and soaking lower cabinet edges.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Cabinet finishes often sit over wood, MDF, veneer, laminate, or thermofoil.",
          "Edges and pulls experience more hand oil and moisture stress than center panels.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Upper cabinets near ranges collect airborne grease.",
          "Pull areas collect fingerprints, lotion, and food residue.",
          "Sink-base doors collect water drips and cleaner overspray.",
        ],
      },
      {
        title: "Professional handling considerations",
        points: [
          "Identify painted, stained, laminate, or thermofoil before choosing strength.",
          "Clean hardware and finish separately when metal polish or stronger degreaser is involved.",
        ],
      },
    ],
    commonProblems: [
      rp("cabinet-grime", "Cabinet grime"),
      rp("kitchen-grease-film", "Kitchen grease film"),
      rp("fingerprints-and-smudges", "Fingerprints and smudges"),
      rp("sticky-film", "Sticky film"),
      rp("surface-discoloration", "Surface discoloration"),
    ],
    recommendedTools: [
      { name: "Microfiber cloth", note: "Panel faces and dry finishing." },
      { name: "Detail brush", note: "Pulls, bevels, hinges, and corners." },
      { name: "Non-scratch pad", note: "Only on compatible laminate or durable finishes." },
    ],
    recommendedChemicals: [
      { name: "Mild degreaser", note: "Kitchen grease with short dwell and full wipe-off." },
      { name: "Neutral cleaner", note: "Routine touchpoints and painted finishes." },
    ],
    commonMistakes: [
      "Spraying cleaner directly onto cabinet doors.",
      "Letting degreaser dwell on paint or thermofoil edges.",
      "Using abrasive pads around pulls and wearing through finish.",
    ],
    visualRecognition: [
      "Sticky yellowing near ranges points to grease film.",
      "Swollen edges or bubbling point to moisture or heat damage.",
      "Shiny hand patches may be oils, worn finish, or burnishing.",
    ],
    maintenanceRhythm: [
      "Wipe pulls and touchpoints frequently.",
      "Degrease range-adjacent cabinets before film polymerizes.",
      "Dry sink-base and dishwasher-adjacent edges promptly.",
    ],
    professionalContext: [
      "Professional kitchen cleanings often treat cabinet faces as a premium-detail zone because damage is costly and visible.",
      "Commercial breakroom cabinets require more frequent touchpoint cleaning but still need finish-safe chemistry.",
    ],
    preservationNotes: [
      "Protect seams, edges, and hardware from pooling product.",
      "Stop when color transfers, finish softens, or laminate lifts.",
    ],
    relatedSurfaces: [
      esSurface("painted-surfaces", "Painted surfaces"),
      esSurface("laminate", "Laminate"),
      esSurface("finished-wood", "Finished wood"),
      esSurface("appliances", "Appliances"),
    ],
    relatedMethods: [
      esMethod("degreasing", "Degreasing"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-kitchens", "Best cleaners for kitchens"),
      guide("when-cleaning-damages-surfaces", "When cleaning damages surfaces"),
    ],
  },
  countertops: {
    ...base("countertops", "Countertops"),
    summary:
      "Countertop guidance for food-contact residue, sink rings, grease film, disinfectant residue, stone and laminate differences, and heat risk.",
    whatToKnowFirst:
      "Countertop cleaning starts with material identification. Quartz, laminate, granite, solid surface, butcher block, and sealed stone have different heat, chemical, and moisture risks.",
    safeMethods:
      "Use neutral maintenance for daily soil, mild degreasing for cooking film, and material-safe dwell-and-lift for dried residue.",
    avoidMethods:
      "Avoid treating all countertops as the same. Do not use acid, bleach, solvent, abrasive powder, or heat exposure without material-specific compatibility.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Countertops combine food contact, water exposure, hot items, and frequent hand contact.",
          "The same mark may mean residue on quartz, sealer wear on stone, or swelling on laminate.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Dish soap and disinfectant residue can dull the entire work zone.",
          "Sink rings and faucet edges collect minerals and biofilm.",
          "Cooking zones collect grease, spice pigment, and sticky residue.",
        ],
      },
      {
        title: "Safe vs unsafe chemistry",
        points: [
          "Neutral cleaners are the safest shared maintenance lane.",
          "Degreasers, acids, oxidizers, and disinfectants must be filtered through the material and label.",
        ],
      },
    ],
    commonProblems: [
      rp("countertop-residue", "Countertop residue"),
      rp("sink-ring-stains", "Sink ring stains"),
      rp("kitchen-grease-film", "Kitchen grease film"),
      rp("sticky-film", "Sticky film"),
      rp("heat-damage-marks", "Heat damage marks"),
    ],
    recommendedTools: [
      { name: "Microfiber towel", note: "Damp pass plus dry finish pass." },
      { name: "Soft non-scratch pad", note: "Only after material compatibility is known." },
      { name: "Plastic scraper", note: "For loosened residue, not forceful dry scraping." },
    ],
    recommendedChemicals: [
      { name: "Neutral countertop cleaner", note: "Default maintenance lane." },
      { name: "Material-safe degreaser", note: "Cooking film and sticky residues." },
      { name: "Label-compatible disinfectant", note: "Only after soil removal and with dwell control." },
    ],
    commonMistakes: [
      "Using disinfectant as a cleaner on visible soil.",
      "Using stone-unsafe acid around sink rings.",
      "Forgetting heat risk on engineered or laminate surfaces.",
    ],
    visualRecognition: [
      "Uniform haze usually indicates residue.",
      "Rings around sink edges point to water minerals or sealer weakness.",
      "Raised seams or swollen edges point to moisture damage.",
    ],
    maintenanceRhythm: [
      "Clean food-contact areas after use and dry sink edges.",
      "Reset residue weekly in busy kitchens.",
      "Escalate by material, not by frustration.",
    ],
    professionalContext: [
      "Shared kitchens and commercial breakrooms need frequent soil removal before sanitizing.",
      "Professionals route countertop work by material class before choosing chemistry.",
    ],
    preservationNotes: [
      "Protect natural stone from acids and laminate seams from moisture.",
      "Stop when marks indicate heat, swelling, or etching rather than soil.",
    ],
    relatedSurfaces: [
      esSurface("quartz-countertops", "Quartz countertops"),
      esSurface("granite-countertops", "Granite countertops"),
      esSurface("laminate", "Laminate"),
      esSurface("sinks", "Sinks"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("degreasing", "Degreasing"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-kitchens", "Best cleaners for kitchens"),
      guide("chemical-usage-and-safety", "Chemical usage and safety"),
    ],
  },
  sinks: {
    ...base("sinks", "Sinks"),
    summary:
      "Sink guidance for stainless, porcelain, composite, and stone-adjacent basins with water spots, rings, soap film, food residue, and abrasion risk.",
    whatToKnowFirst:
      "Sink cleaning depends on basin material and surrounding surface. Water exposure is constant, so minerals, soap, food, and abrasion interact.",
    safeMethods:
      "Use material-safe cleaning, controlled descaling where allowed, non-scratch tools, thorough rinse, and dry finishing around fixtures and rims.",
    avoidMethods:
      "Avoid steel wool on stainless, acid on stone surrounds, abrasive powders on glossy basins, and mixing drain chemicals with surface cleaners.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Sinks combine food residue, soap, minerals, water, and impact wear in one zone.",
          "The basin, drain, faucet, caulk, and countertop edge may each require different chemistry.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Rings form at water lines, drains, and faucet bases.",
          "Stainless basins show water spots, scratches, and food film.",
          "Porcelain and composite sinks can hold pigment, scuffs, and dull film.",
        ],
      },
      {
        title: "Escalation conditions",
        points: [
          "Rust-like marks, chipped enamel, deep scratches, and stone-adjacent staining need material-specific handling.",
          "Recurring odor points to drain or disposal context, not only basin cleaning.",
        ],
      },
    ],
    commonProblems: [
      rp("sink-ring-stains", "Sink ring stains"),
      rp("water-spotting", "Water spotting"),
      rp("soap-film", "Soap film"),
      rp("organic-stains", "Organic stains"),
      rp("metal-tarnish", "Metal tarnish"),
    ],
    recommendedTools: [
      { name: "Non-scratch pad", note: "Only where basin finish allows it." },
      { name: "Microfiber towel", note: "Dry finishing around faucets and rims." },
      { name: "Detail brush", note: "Drain rims and faucet bases." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Routine basin and rim work." },
      { name: "Mineral remover", note: "Only on compatible basin and surrounding materials." },
      { name: "Degreaser", note: "Food and oil film where label allows." },
    ],
    commonMistakes: [
      "Using the same descaler on the basin, faucet, and stone counter edge.",
      "Scrubbing stainless across the grain with abrasive tools.",
      "Ignoring residue and moisture left at faucet bases.",
    ],
    visualRecognition: [
      "White rings suggest mineral evaporation.",
      "Rainbow or oily film suggests food and soap residue.",
      "Dark seams or countertop-edge staining may be moisture intrusion.",
    ],
    maintenanceRhythm: [
      "Rinse food and soap residue after use.",
      "Dry faucet bases and rims in hard-water homes.",
      "Deep clean drains and overflow areas when odor or biofilm appears.",
    ],
    professionalContext: [
      "Commercial sinks require more frequent residue removal and sanitizing after cleaning.",
      "Professionals isolate drain issues from surface appearance issues.",
    ],
    preservationNotes: [
      "Do not use abrasive metal tools on stainless or plated drains.",
      "Protect adjacent natural stone during mineral removal.",
    ],
    relatedSurfaces: [
      esSurface("stainless-steel", "Stainless steel"),
      esSurface("fixtures", "Fixtures"),
      esSurface("countertops", "Countertops"),
      esSurface("natural-stone", "Natural stone"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("degreasing", "Degreasing"),
    ],
  },
  fixtures: {
    ...base("fixtures", "Fixtures"),
    summary:
      "Fixture guidance for chrome, brushed nickel, stainless, brass, matte black, water spots, fingerprints, soap film, and finish preservation.",
    whatToKnowFirst:
      "Fixtures are finish systems, not raw metal. Plating, coating, color, and manufacturer guidance define safe chemistry.",
    safeMethods:
      "Use neutral cleaning, soft microfiber, short contact times, and dry finishing. Use mineral removal only when the finish and label permit it.",
    avoidMethods:
      "Avoid abrasive pads, metal tools, harsh acids, bleach residue, and leaving products pooled around bases, seams, or aerators.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Thin plated or coated finishes can be damaged faster than the metal underneath.",
          "Water spots, soap film, and fingerprints are highly visible on reflective and dark finishes.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Faucet bases collect mineral rings and biofilm.",
          "Handles collect fingerprints, soap, lotion, and sanitizing residue.",
          "Shower fixtures collect hard-water deposits and soap scum.",
        ],
      },
      {
        title: "Safe vs unsafe chemistry",
        points: [
          "Neutral cleaning is the safest maintenance lane.",
          "Acidic mineral removers may be effective but can damage sensitive plating or adjacent stone.",
        ],
      },
    ],
    commonProblems: [
      rp("chrome-water-spots", "Chrome water spots"),
      rp("water-spotting", "Water spotting"),
      rp("fingerprints-and-smudges", "Fingerprints and smudges"),
      rp("soap-film", "Soap film"),
      rp("metal-tarnish", "Metal tarnish"),
    ],
    recommendedTools: [
      { name: "Soft microfiber", note: "Dry polishing and residue removal." },
      { name: "Detail brush", note: "Base seams and aerator edges with low pressure." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Default for plated and coated fixtures." },
      { name: "Finish-safe descaler", note: "Use carefully where water spots are confirmed." },
    ],
    commonMistakes: [
      "Using bathroom acid on every fixture finish.",
      "Scrubbing matte black or brushed finishes until the sheen changes.",
      "Letting cleaner sit around faucet bases.",
    ],
    visualRecognition: [
      "White crust at bases suggests mineral buildup.",
      "Patchy shine loss may indicate coating damage.",
      "Dark finish spotting can be mineral, soap, or cleaner residue.",
    ],
    maintenanceRhythm: [
      "Dry high-spotting fixtures after wet use.",
      "Remove soap and mineral film before it bonds at bases.",
      "Clean touchpoints often in shared bathrooms and kitchens.",
    ],
    professionalContext: [
      "Commercial restrooms need frequent fixture drying and label-directed disinfection without damaging finishes.",
      "Professionals protect adjacent stone, grout, and glass when descaling fixtures.",
    ],
    preservationNotes: [
      "Treat specialty finishes as coating-sensitive unless manufacturer guidance says otherwise.",
      "Stop if plating color changes, flakes, or develops uneven shine.",
    ],
    relatedSurfaces: [
      esSurface("sinks", "Sinks"),
      esSurface("shower-glass", "Shower glass"),
      esSurface("stainless-steel", "Stainless steel"),
      esSurface("natural-stone", "Natural stone"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("hard-water-deposit-removal", "Hard water deposit removal"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
  },
  appliances: {
    ...base("appliances", "Appliances"),
    summary:
      "Appliance guidance for stainless, enamel, glass, plastic, control panels, grease film, fingerprints, food residue, and electronics-safe cleaning.",
    whatToKnowFirst:
      "Appliances combine multiple surfaces in one object: metal, glass, plastic, enamel, gaskets, labels, and electronics.",
    safeMethods:
      "Clean by zone: degrease cooking residue, use glass cleaning on compatible panes, neutral clean handles and panels, and keep moisture away from controls.",
    avoidMethods:
      "Avoid spraying into controls, using abrasives on stainless or glass, flooding gaskets, and applying oven-strength chemistry outside label scope.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Heat, grease, hand contact, and electronics all meet on appliance fronts and edges.",
          "A single appliance can require stainless, glass, plastic, and gasket-safe techniques.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Range and hood areas collect cooked-on grease and exhaust film.",
          "Refrigerator and dishwasher fronts collect fingerprints and water drips.",
          "Microwave and oven windows collect food splatter and surface haze.",
        ],
      },
      {
        title: "Heat sensitivity",
        points: [
          "Cleaning hot surfaces can flash-dry product and create residue or fumes.",
          "Heat-set grease needs dwell-and-lift, not uncontrolled abrasion.",
        ],
      },
    ],
    commonProblems: [
      rp("appliance-grime", "Appliance grime"),
      rp("appliance-buildup", "Appliance buildup"),
      rp("fingerprints-and-smudges", "Fingerprints and smudges"),
      rp("cooked-on-grease", "Cooked-on grease"),
      rp("exhaust-hood-film", "Exhaust hood film"),
    ],
    recommendedTools: [
      { name: "Microfiber cloths", note: "Separate grease, glass, and finish towels." },
      { name: "Detail brush", note: "Crevices, handles, and gasket edges." },
      { name: "Non-scratch pad", note: "Only on compatible cooked-on residue zones." },
    ],
    recommendedChemicals: [
      { name: "Mild degreaser", note: "Cooking film and range-adjacent residue." },
      { name: "Glass cleaner", note: "Compatible appliance glass and windows." },
      { name: "Neutral cleaner", note: "Handles, panels, and routine fronts." },
    ],
    commonMistakes: [
      "Spraying product directly into control panels.",
      "Using one greasy towel across stainless, glass, and plastic.",
      "Scrubbing heated residue before dwell softens it.",
    ],
    visualRecognition: [
      "Yellow tacky film indicates grease accumulation.",
      "Smudged fronts indicate oils or polish residue.",
      "Cloudy appliance glass may be grease film, cleaner residue, or heat-set splatter.",
    ],
    maintenanceRhythm: [
      "Wipe handles and fronts frequently.",
      "Degrease cooking appliances before film polymerizes.",
      "Detail gasket and edge zones during deeper cleaning cycles.",
    ],
    professionalContext: [
      "Commercial and shared kitchens need more frequent degreasing and separate sanitizing after soil removal.",
      "Professionals protect electronics and labels while escalating cooked-on residue.",
    ],
    preservationNotes: [
      "Let hot appliances cool before cleaning unless the label specifically instructs otherwise.",
      "Keep moisture and strong chemistry out of vents, seams, displays, and control panels.",
    ],
    relatedSurfaces: [
      esSurface("stainless-steel", "Stainless steel"),
      esSurface("glass", "Glass"),
      esSurface("cabinets", "Cabinets"),
      esSurface("painted-surfaces", "Painted surfaces"),
    ],
    relatedMethods: [
      esMethod("degreasing", "Degreasing"),
      esMethod("glass-cleaning", "Glass cleaning"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
      esMethod("touchpoint-sanitization", "Touchpoint sanitization"),
    ],
    relatedGuides: [
      guide("best-cleaners-for-appliances", "Best cleaners for appliances"),
      guide("best-cleaners-for-kitchens", "Best cleaners for kitchens"),
    ],
  },
  mirrors: {
    ...base("mirrors", "Mirrors"),
    summary:
      "Mirror guidance for haze, streaking, fingerprints, toothpaste specks, edge moisture, backing sensitivity, and low-residue finishing.",
    whatToKnowFirst:
      "Mirrors are reflective glass with backing and edge sensitivity. Cleaning must control product, moisture, and towel residue.",
    safeMethods:
      "Use low-residue glass cleaner applied to cloth, clean microfiber, and dry edge control. Remove toothpaste or hairspray specks before final polishing.",
    avoidMethods:
      "Avoid spraying heavily at mirror edges, using abrasive pads, and wiping with linty or oily towels.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Mirror reflection magnifies streaks and lint.",
          "Edges and backing can be vulnerable to moisture and chemical intrusion.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Bathroom mirrors collect toothpaste, hairspray, soap mist, and water spotting.",
          "Entry and bedroom mirrors collect fingerprints and dust.",
          "Repeated overspray creates edge haze and cleaning halos.",
        ],
      },
      {
        title: "Visual authority cues",
        points: [
          "A clean mirror should show no drag lines under side lighting.",
          "Persistent edge darkening is not ordinary surface soil.",
        ],
      },
    ],
    commonProblems: [
      rp("mirror-haze", "Mirror haze"),
      rp("streaking-on-glass", "Streaking on glass"),
      rp("fingerprints-and-smudges", "Fingerprints and smudges"),
      rp("water-spotting", "Water spotting"),
    ],
    recommendedTools: [
      { name: "Glass microfiber", note: "Low-lint final finish." },
      { name: "Detail cloth", note: "Edges and corners without overspray." },
    ],
    recommendedChemicals: [
      { name: "Low-residue glass cleaner", note: "Apply to cloth for edge control." },
    ],
    commonMistakes: [
      "Spraying cleaner directly until it runs behind the mirror edge.",
      "Using bathroom towels that leave lint or fabric softener residue.",
      "Polishing over toothpaste specks instead of lifting them first.",
    ],
    visualRecognition: [
      "Vertical runs at the edge suggest overspray history.",
      "Haze that follows wipe direction points to towel or product residue.",
      "Blackened edges suggest backing deterioration or moisture intrusion.",
    ],
    maintenanceRhythm: [
      "Spot clean splatter before it dries into specks.",
      "Use a light product load and dry finish during bathroom cleanings.",
      "Watch mirror edges in humid bathrooms.",
    ],
    professionalContext: [
      "Hospitality and salon mirrors need frequent low-residue touchups and strict towel separation.",
      "Professionals treat edge deterioration as preservation, not more cleaning.",
    ],
    preservationNotes: [
      "Keep moisture and cleaner from pooling at edges.",
      "Do not scrape decorative or antique mirror surfaces.",
    ],
    relatedSurfaces: [
      esSurface("glass", "Glass"),
      esSurface("fixtures", "Fixtures"),
      esSurface("shower-glass", "Shower glass"),
    ],
    relatedMethods: [
      esMethod("glass-cleaning", "Glass cleaning"),
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
    ],
  },
  "sealed-surfaces": {
    ...base("sealed-surfaces", "Sealed surfaces"),
    summary:
      "Sealed surface guidance for protective coatings, sealer wear, maintenance cycles, residue control, and when cleaning becomes restoration.",
    whatToKnowFirst:
      "A sealed surface is protected, not invincible. The sealer buys response time but can wear, haze, stain, or fail under incompatible chemistry.",
    safeMethods:
      "Use neutral maintenance, soft tools, prompt drying, and sealer-compatible spot treatment.",
    avoidMethods:
      "Avoid strong acids, solvent, abrasive pads, and long dwell unless the sealer system and label explicitly allow it.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "The sealer is the first contact surface, so preserving it preserves the material below.",
          "Damage can appear as dullness, uneven absorption, or stains that suddenly penetrate.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Cleaner residue can sit on top of the sealer and create haze.",
          "High-use zones wear through protection faster than edges.",
          "Water darkening suggests the seal is weakening or absent.",
        ],
      },
      {
        title: "When recurring maintenance matters",
        points: [
          "Regular gentle cleaning extends the useful life of sealers.",
          "Heavy correction should prompt a sealer assessment rather than stronger routine chemistry.",
        ],
      },
    ],
    commonProblems: [
      rp("surface-dullness", "Surface dullness"),
      rp("uneven-finish", "Uneven finish"),
      rp("water-spotting", "Water spotting"),
      rp("product-residue-buildup", "Product residue buildup"),
    ],
    recommendedTools: [
      { name: "Soft microfiber", note: "Low-abrasion maintenance." },
      { name: "Neutral mop pad", note: "Controlled moisture on sealed floors." },
    ],
    recommendedChemicals: [
      { name: "Sealer-compatible neutral cleaner", note: "Default maintenance." },
    ],
    commonMistakes: [
      "Assuming sealer makes acid or abrasion safe.",
      "Ignoring water darkening as a sign of protection loss.",
      "Adding topical products over dirty or worn sealer.",
    ],
    visualRecognition: [
      "Water beading less than before indicates changing protection.",
      "Uneven shine can indicate residue, wear, or failed coating.",
      "Dark spots after spills suggest absorption.",
    ],
    maintenanceRhythm: [
      "Use neutral maintenance frequently enough to avoid harsh correction.",
      "Check high-use and wet zones for sealer performance.",
      "Reseal when protection no longer behaves consistently.",
    ],
    professionalContext: [
      "Commercial sealed floors need scheduled maintenance that protects coatings rather than stripping them accidentally.",
      "Professionals separate cleaning, stripping, sealing, and restoration scopes.",
    ],
    preservationNotes: [
      "Do not use aggressive chemistry to overcome a failed sealer.",
      "Escalate when the protective layer is worn, lifting, or absorbing.",
    ],
    relatedSurfaces: [
      esSurface("natural-stone", "Natural stone"),
      esSurface("grout", "Grout"),
      esSurface("hardwood", "Hardwood"),
      esSurface("vinyl-flooring", "Vinyl flooring"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("detail-dusting", "Detail dusting"),
    ],
  },
  "unsealed-surfaces": {
    ...base("unsealed-surfaces", "Unsealed surfaces"),
    summary:
      "Unsealed surface guidance for porous absorption, moisture intrusion, staining, cautious chemistry, and professional escalation.",
    whatToKnowFirst:
      "Unsealed surfaces absorb faster and forgive less. Cleaning must control liquid, pigment, dwell time, and soil removal before contamination moves below the surface.",
    safeMethods:
      "Use minimal moisture, blotting or controlled extraction where applicable, gentle neutral chemistry, and fast drying.",
    avoidMethods:
      "Avoid flooding, colored cleaners, long dwell, acids on sensitive minerals, and scrubbing that drives contamination deeper.",
    operationalSections: [
      {
        title: "Why this surface behaves differently",
        points: [
          "Without a protective layer, the material itself becomes the contact surface.",
          "Stains and odors can migrate below what wiping can reach.",
        ],
      },
      {
        title: "Common contamination patterns",
        points: [
          "Water darkening, rings, and tide lines show absorption.",
          "Oils and pigments can penetrate and remain after surface soil is gone.",
          "Porous grout, stone, wood, and textiles each need different extraction logic.",
        ],
      },
      {
        title: "Escalation conditions",
        points: [
          "Deep stains, odor, structural moisture, and unknown material identity should stop routine cleaning.",
          "Sealing decisions belong after proper cleaning and drying, not before.",
        ],
      },
    ],
    commonProblems: [
      rp("organic-stains", "Organic stains"),
      rp("musty-odor", "Musty odor"),
      rp("water-spotting", "Water spotting"),
      rp("surface-discoloration", "Surface discoloration"),
    ],
    recommendedTools: [
      { name: "White absorbent towel", note: "Tracks transfer and controls moisture." },
      { name: "Soft brush", note: "Only when agitation will not drive soil deeper." },
      { name: "Extractor", note: "Professional or textile-appropriate moisture recovery." },
    ],
    recommendedChemicals: [
      { name: "Neutral cleaner", note: "Lowest-risk starting point." },
      { name: "Material-specific treatment", note: "Only after identifying the substrate." },
    ],
    commonMistakes: [
      "Flooding a porous material to make it look evenly wet.",
      "Sealing over residual soil or moisture.",
      "Using strong chemistry before identifying the material.",
    ],
    visualRecognition: [
      "Fast darkening under water points to absorption.",
      "Tide lines show moisture movement through pores.",
      "Persistent odor suggests deeper contamination.",
    ],
    maintenanceRhythm: [
      "Respond quickly to spills and moisture.",
      "Dry thoroughly before judging the final result.",
      "Consider sealing only after cleaning is complete and the material is appropriate for it.",
    ],
    professionalContext: [
      "Commercial porous surfaces need source control and scheduled protection, not only stronger cleaning.",
      "Professionals assess whether cleaning, extraction, sealing, or replacement is the correct scope.",
    ],
    preservationNotes: [
      "Do not trap moisture or contamination under a new sealer.",
      "Stop if the surface darkens, softens, powders, or smells worse during cleaning.",
    ],
    relatedSurfaces: [
      esSurface("grout", "Grout"),
      esSurface("natural-stone", "Natural stone"),
      esSurface("finished-wood", "Finished wood"),
      esSurface("sealed-surfaces", "Sealed surfaces"),
    ],
    relatedMethods: [
      esMethod("neutral-surface-cleaning", "Neutral surface cleaning"),
      esMethod("dwell-and-lift-cleaning", "Dwell-and-lift cleaning"),
    ],
  },
};

const TITLE: Record<string, string> = {
  grout: "Grout",
  "stainless-steel": "Stainless steel",
  "quartz-countertops": "Quartz countertops",
  "granite-countertops": "Granite countertops",
  laminate: "Laminate",
  "finished-wood": "Finished wood",
  "vinyl-flooring": "Vinyl flooring",
  "painted-walls": "Painted walls",
  glass: "Glass",
  mirrors: "Mirrors",
  "natural-stone": "Natural stone",
  hardwood: "Hardwood",
  "painted-surfaces": "Painted surfaces",
  baseboards: "Baseboards",
  cabinets: "Cabinets",
  countertops: "Countertops",
  sinks: "Sinks",
  fixtures: "Fixtures",
  appliances: "Appliances",
  "sealed-surfaces": "Sealed surfaces",
  "unsealed-surfaces": "Unsealed surfaces",
};

for (const slug of AUTHORITY_SURFACE_SLUGS) {
  if (SURFACES[slug]) continue;
  SURFACES[slug] = base(slug, TITLE[slug] ?? slug);
}

export function getSurfacePageBySlug(slug: string): AuthoritySurfacePageData | undefined {
  return SURFACES[slug];
}

export function getAllSurfacePages(): AuthoritySurfacePageData[] {
  return AUTHORITY_SURFACE_SLUGS.map((s) => SURFACES[s]);
}

export function surfaceSlugExists(slug: string): boolean {
  return AUTHORITY_SURFACE_SLUGS.includes(slug as AuthoritySurfaceSlug);
}
