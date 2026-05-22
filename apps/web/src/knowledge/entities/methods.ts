import type { MethodEntity } from "./types";

export const METHOD_ENTITIES: MethodEntity[] = [
  {
    slug: "acid-cleaners",
    name: "Acid Cleaners",
    kind: "method",
    summary:
      "A chemistry class used primarily to dissolve mineral-based deposits such as hard water staining and soap scum components.",
    aliases: ["acidic cleaners", "descaling cleaners"],
    relatedArticleSlugs: [
      "how-to-remove-hard-water-stains",
      "how-to-remove-soap-scum",
      "how-to-clean-shower",
    ],
    relatedServiceSlugs: ["bathroom-cleaning", "deep-cleaning"],
    chemistryClass: "acidic",
    mechanism: [
      "reacts with alkaline mineral deposits",
      "helps dissolve bonded scale and residue",
    ],
    idealForSoilSlugs: ["soap-scum", "hard-water-stains"],
    compatibleSurfaceSlugs: ["glass", "ceramic-tile", "porcelain-tile", "fiberglass", "chrome"],
    incompatibleSurfaceSlugs: ["grout", "stainless-steel", "sealed-hardwood", "painted-drywall"],
    recommendedToolSlugs: ["microfiber-towel", "glass-microfiber-towel", "non-scratch-scrub-pad", "grout-brush", "dilution-bottle", "trigger-sprayer", "restroom-cleaner-system"],
    dwellTimeGuidance: [
      "allow enough dwell time to soften mineral residue before agitation",
      "do not let the product dry on the surface",
    ],
    moistureControlGuidance: [
      "rinse thoroughly after use",
      "dry the surface to prevent new mineral spotting",
    ],
    residueConsiderations: [
      "incomplete rinsing can leave chemistry residue behind",
      "re-drying on glass can create haze or streaking",
    ],
    safetyNotes: [
      "Always confirm the surface is acid-compatible.",
      "Use ventilation and avoid mixing with incompatible chemicals.",
    ],
    professionalEscalationThresholds: [
      "natural stone or highly sensitive finishes are present",
      "etching may be confused with removable residue",
    ],
  },
  {
    slug: "alkaline-cleaners",
    name: "Alkaline Cleaners",
    kind: "method",
    summary:
      "A chemistry class used to break down oily, greasy, and protein-based soils commonly found in kitchens and traffic soils.",
    aliases: ["degreasers", "alkaline degreasers"],
    relatedArticleSlugs: ["how-to-clean-kitchen", "how-to-clean-greasy-kitchen-cabinets"],
    relatedServiceSlugs: ["kitchen-cleaning", "deep-cleaning"],
    chemistryClass: "alkaline",
    mechanism: [
      "breaks down oily residue",
      "helps emulsify grease so it can be removed",
    ],
    idealForSoilSlugs: ["kitchen-grease", "grout-soiling"],
    compatibleSurfaceSlugs: ["stainless-steel", "painted-cabinetry", "laminate", "ceramic-tile", "porcelain-tile", "grout"],
    incompatibleSurfaceSlugs: ["sealed-hardwood"],
    recommendedToolSlugs: ["microfiber-towel", "high-pile-microfiber-towel", "low-pile-microfiber-towel", "detail-brush", "non-scratch-scrub-pad", "grout-brush", "commercial-degreaser", "dilution-bottle", "trigger-sprayer", "commercial-kitchen-maintenance-system"],
    dwellTimeGuidance: [
      "allow dwell time for grease softening before wiping",
      "do not over-dwell on sensitive painted finishes",
    ],
    moistureControlGuidance: [
      "use controlled moisture on cabinetry and laminates",
      "remove loosened soil instead of smearing it around",
    ],
    residueConsiderations: [
      "degreaser residue can leave surfaces tacky if not rinsed or wiped clean",
    ],
    safetyNotes: [
      "Match strength to finish sensitivity.",
      "Avoid overwetting wood-based or seam-sensitive surfaces.",
    ],
    professionalEscalationThresholds: [
      "heavy neglected grease layering exists",
      "finish stability is uncertain",
    ],
  },
  {
    slug: "enzyme-cleaners",
    name: "Enzyme Cleaners",
    kind: "method",
    summary:
      "A biologically targeted chemistry used to break down organic residues that standard surface cleaners may not fully address.",
    aliases: ["enzymatic cleaners"],
    relatedArticleSlugs: ["how-to-remove-pet-stains"],
    relatedServiceSlugs: ["deep-cleaning"],
    chemistryClass: "enzyme",
    mechanism: [
      "targets organic residues",
      "helps digest odor-causing contamination at the source",
    ],
    idealForSoilSlugs: ["pet-stains"],
    compatibleSurfaceSlugs: ["carpet", "upholstery"],
    incompatibleSurfaceSlugs: ["sealed-hardwood"],
    recommendedToolSlugs: ["white-terry-towel", "extractor", "detail-brush", "soft-bristle-brush", "hepa-vacuum"],
    dwellTimeGuidance: [
      "enzymes often need controlled dwell time to work effectively",
      "avoid rushing removal before the product has had time to act",
    ],
    moistureControlGuidance: [
      "avoid oversaturation",
      "fully extract or blot excess moisture after treatment",
    ],
    residueConsiderations: [
      "excess product left in fabric can attract resoiling",
    ],
    safetyNotes: [
      "Follow label dwell guidance and test sensitive textiles first.",
    ],
    professionalEscalationThresholds: [
      "odor is deep in padding or substrate",
      "large-area contamination is present",
    ],
  },
  {
    slug: "oxidizing-cleaners",
    name: "Oxidizing Cleaners",
    kind: "method",
    summary:
      "A chemistry class used to help lift organic discoloration and biological staining on appropriate surfaces.",
    aliases: ["oxygen-based cleaners"],
    relatedArticleSlugs: ["how-to-clean-grout", "how-to-clean-shower"],
    relatedServiceSlugs: ["bathroom-cleaning", "deep-cleaning"],
    chemistryClass: "oxidizing",
    mechanism: [
      "helps break down organic staining",
      "supports whitening or brightening of certain residues",
    ],
    idealForSoilSlugs: ["mildew", "grout-soiling"],
    compatibleSurfaceSlugs: ["ceramic-tile", "porcelain-tile", "grout", "caulk"],
    incompatibleSurfaceSlugs: ["painted-drywall", "sealed-hardwood"],
    recommendedToolSlugs: ["grout-brush", "detail-brush", "soft-bristle-brush", "microfiber-towel", "peroxide-cleaner", "trigger-sprayer", "restroom-cleaner-system"],
    dwellTimeGuidance: [
      "allow the chemistry time to act before scrubbing",
      "do not let product dry uncontrolled on the surface",
    ],
    moistureControlGuidance: [
      "rinse and dry thoroughly after use",
      "reduce future moisture persistence to prevent recurrence",
    ],
    residueConsiderations: [
      "left-behind residue can continue reacting or leave visible film",
    ],
    safetyNotes: [
      "Use ventilation and avoid incompatible product mixing.",
    ],
    professionalEscalationThresholds: [
      "recurring biological growth suggests hidden moisture",
      "porous materials may be contaminated below the surface",
    ],
  },
  {
    slug: "neutral-cleaners",
    name: "Neutral Cleaners",
    kind: "method",
    summary:
      "A mild chemistry class used for routine cleaning and maintenance on more sensitive finished surfaces.",
    aliases: ["pH-neutral cleaners"],
    relatedArticleSlugs: ["how-to-clean-hardwood-floors"],
    relatedServiceSlugs: ["deep-cleaning"],
    chemistryClass: "neutral",
    mechanism: [
      "lifts light soils without aggressive chemical reaction",
      "supports maintenance cleaning on finish-sensitive surfaces",
    ],
    idealForSoilSlugs: [],
    compatibleSurfaceSlugs: ["laminate", "painted-drywall", "sealed-hardwood"],
    incompatibleSurfaceSlugs: [],
    recommendedToolSlugs: ["microfiber-towel", "mop-pad", "flat-mop-system", "microfiber-floor-pad-system", "neutral-floor-cleaner"],
    dwellTimeGuidance: [
      "routine neutral cleaners typically rely more on mechanical wiping than long dwell",
    ],
    moistureControlGuidance: [
      "keep moisture minimal on wood or wall finishes",
    ],
    residueConsiderations: [
      "over-application can still leave streaking or residue if not removed properly",
    ],
    safetyNotes: [
      "Even mild cleaners require finish compatibility awareness.",
    ],
    professionalEscalationThresholds: [
      "soil load is beyond routine maintenance conditions",
    ],
  },
  {
    slug: "microfiber-cleaning",
    name: "Microfiber Cleaning",
    kind: "method",
    summary:
      "A low-abrasion mechanical cleaning method that uses microfiber structure to capture and lift soils effectively.",
    aliases: ["microfiber wiping"],
    relatedArticleSlugs: ["how-to-clean-windows", "how-to-clean-kitchen", "how-to-clean-shower"],
    relatedServiceSlugs: ["bathroom-cleaning", "kitchen-cleaning", "window-cleaning"],
    chemistryClass: "mechanical",
    mechanism: [
      "physically lifts and traps soils in fine fiber structure",
      "reduces smear and lint when clean towels are used correctly",
    ],
    idealForSoilSlugs: ["soap-scum", "hard-water-stains", "kitchen-grease"],
    compatibleSurfaceSlugs: [
      "glass",
      "ceramic-tile",
      "porcelain-tile",
      "fiberglass",
      "chrome",
      "stainless-steel",
      "painted-cabinetry",
      "laminate",
      "sealed-hardwood",
    ],
    incompatibleSurfaceSlugs: [],
    recommendedToolSlugs: ["microfiber-towel", "glass-microfiber-towel", "high-pile-microfiber-towel", "low-pile-microfiber-towel", "mop-pad", "flat-mop-system", "microfiber-floor-pad-system"],
    dwellTimeGuidance: [
      "microfiber performs best when paired with proper pre-softening or chemistry where needed",
    ],
    moistureControlGuidance: [
      "rotate clean dry towel faces frequently",
      "use drying passes to control streaking and spotting",
    ],
    residueConsiderations: [
      "dirty or overloaded microfiber redistributes soil instead of removing it",
    ],
    safetyNotes: [
      "Do not use contaminated towels across multiple finish-sensitive surfaces.",
    ],
    professionalEscalationThresholds: [
      "residue is too bonded to be removed mechanically alone",
    ],
  },
  {
    slug: "mechanical-agitation",
    name: "Mechanical Agitation",
    kind: "method",
    summary:
      "A friction-based cleaning method used to dislodge bonded soils after they have been properly softened or loosened.",
    aliases: ["scrubbing", "agitation"],
    relatedArticleSlugs: ["how-to-clean-grout", "how-to-clean-shower"],
    relatedServiceSlugs: ["bathroom-cleaning", "deep-cleaning"],
    chemistryClass: "mechanical",
    mechanism: [
      "breaks soil bond through friction and repeated contact",
      "improves removal after chemistry or moisture has softened the residue",
    ],
    idealForSoilSlugs: ["soap-scum", "grout-soiling", "mildew", "kitchen-grease"],
    compatibleSurfaceSlugs: ["glass", "ceramic-tile", "porcelain-tile", "grout", "fiberglass"],
    incompatibleSurfaceSlugs: ["painted-drywall"],
    recommendedToolSlugs: ["grout-brush", "non-scratch-scrub-pad", "detail-brush", "soft-bristle-brush", "stiff-bristle-brush", "drill-brush-attachment"],
    dwellTimeGuidance: [
      "agitation should follow enough dwell time to avoid unnecessary force",
    ],
    moistureControlGuidance: [
      "suspend and remove loosened soil promptly",
      "do not flood porous surfaces during scrubbing",
    ],
    residueConsiderations: [
      "scrubbing without soil removal can redeposit grime",
    ],
    safetyNotes: [
      "Aggression must be matched to surface durability.",
    ],
    professionalEscalationThresholds: [
      "excess force would be required for removal",
      "surface finish damage risk is rising",
    ],
  },
  {
    slug: "absorption-and-extraction",
    name: "Absorption and Extraction",
    kind: "method",
    summary:
      "A textile-focused removal method that uses blotting and extraction to lift contamination out of porous materials.",
    aliases: ["blotting and extraction", "textile extraction"],
    relatedArticleSlugs: ["how-to-remove-pet-stains"],
    relatedServiceSlugs: ["deep-cleaning"],
    chemistryClass: "absorbent",
    mechanism: [
      "draws contamination out of porous fibers",
      "removes moisture and suspended soils rather than spreading them",
    ],
    idealForSoilSlugs: ["pet-stains"],
    compatibleSurfaceSlugs: ["carpet", "upholstery"],
    incompatibleSurfaceSlugs: ["sealed-hardwood"],
    recommendedToolSlugs: ["white-terry-towel", "extractor", "soft-bristle-brush", "hepa-vacuum"],
    dwellTimeGuidance: [
      "pair with appropriate chemistry dwell before extraction where needed",
    ],
    moistureControlGuidance: [
      "remove as much moisture as possible after treatment",
      "support fast drying to prevent odor recurrence or wicking",
    ],
    residueConsiderations: [
      "insufficient extraction leaves behind both moisture and residue",
    ],
    safetyNotes: [
      "Avoid overwetting backing, padding, or delicate textile structures.",
    ],
    professionalEscalationThresholds: [
      "source contamination extends below the visible surface",
    ],
  },
  {
    slug: "moisture-reduction",
    name: "Moisture Reduction",
    kind: "method",
    summary:
      "A preventive and finishing method focused on drying, airflow, and moisture control to reduce recurrence of bathroom growth and residue.",
    aliases: ["drying and ventilation control"],
    relatedArticleSlugs: ["how-to-clean-shower", "bathroom-cleaning-guide"],
    relatedServiceSlugs: ["bathroom-cleaning"],
    chemistryClass: "thermal",
    mechanism: [
      "reduces the environmental conditions that allow residue persistence and biological growth",
    ],
    idealForSoilSlugs: ["mildew", "soap-scum", "hard-water-stains"],
    compatibleSurfaceSlugs: ["glass", "ceramic-tile", "porcelain-tile", "grout", "caulk", "chrome"],
    incompatibleSurfaceSlugs: [],
    recommendedToolSlugs: ["squeegee", "microfiber-towel", "glass-microfiber-towel", "restroom-cleaner-system"],
    dwellTimeGuidance: [
      "apply immediately after rinsing or wet use events for best prevention",
    ],
    moistureControlGuidance: [
      "remove standing water",
      "improve airflow and drying time",
    ],
    residueConsiderations: [
      "drying without removing soil first can bake residue into the maintenance cycle",
    ],
    safetyNotes: [
      "Persistent moisture problems may indicate ventilation or building-envelope issues.",
    ],
    professionalEscalationThresholds: [
      "surfaces remain damp long after normal use",
      "growth repeatedly returns despite proper cleaning",
    ],
  },
  {
    slug: "abrasive-scraping",
    name: "Abrasive Scraping",
    kind: "method",
    summary:
      "A high-risk removal approach involving sharp or abrasive force that is usually not appropriate for residential finish preservation.",
    aliases: ["aggressive scraping"],
    relatedArticleSlugs: [],
    relatedServiceSlugs: [],
    chemistryClass: "mechanical",
    mechanism: [
      "forces soil removal through sharp-edge or high-abrasion contact",
    ],
    idealForSoilSlugs: [],
    compatibleSurfaceSlugs: [],
    incompatibleSurfaceSlugs: [
      "glass",
      "fiberglass",
      "chrome",
      "stainless-steel",
      "painted-cabinetry",
      "laminate",
      "grout",
      "caulk",
      "painted-drywall",
      "sealed-hardwood",
      "carpet",
      "upholstery",
    ],
    recommendedToolSlugs: [],
    dwellTimeGuidance: [],
    moistureControlGuidance: [],
    residueConsiderations: [],
    safetyNotes: [
      "This approach commonly causes avoidable surface damage.",
    ],
    professionalEscalationThresholds: [
      "when this is the only apparent option, the surface and soil should be reassessed first",
    ],
  },
  {
    slug: "overwetting-wood-finishes",
    name: "Overwetting Wood Finishes",
    kind: "method",
    summary:
      "A moisture-heavy cleaning approach that should be avoided on wood-based and finish-sensitive assembled surfaces.",
    aliases: ["flooding cabinet finishes"],
    relatedArticleSlugs: [],
    relatedServiceSlugs: [],
    chemistryClass: "thermal",
    mechanism: [
      "introduces excess moisture into seams, edges, or finish systems",
    ],
    idealForSoilSlugs: [],
    compatibleSurfaceSlugs: [],
    incompatibleSurfaceSlugs: ["painted-cabinetry", "laminate", "sealed-hardwood"],
    recommendedToolSlugs: [],
    dwellTimeGuidance: [],
    moistureControlGuidance: [],
    residueConsiderations: [],
    safetyNotes: [
      "This causes swelling, seam stress, and finish failure risk.",
    ],
    professionalEscalationThresholds: [],
  },
  {
    slug: "high-heat-setting-without-removal",
    name: "High Heat Setting Without Removal",
    kind: "method",
    summary:
      "A risky textile treatment behavior where heat is applied before contamination is fully lifted from the material.",
    aliases: ["heat setting stains"],
    relatedArticleSlugs: [],
    relatedServiceSlugs: [],
    chemistryClass: "thermal",
    mechanism: [
      "can lock stains or odor residues into porous materials",
    ],
    idealForSoilSlugs: [],
    compatibleSurfaceSlugs: [],
    incompatibleSurfaceSlugs: ["carpet", "upholstery", "sealed-hardwood"],
    recommendedToolSlugs: [],
    dwellTimeGuidance: [],
    moistureControlGuidance: [],
    residueConsiderations: [],
    safetyNotes: [
      "Avoid heat-based drying or treatment until contamination is actually removed.",
    ],
    professionalEscalationThresholds: [],
  },
  {
    slug: "surface-fragrance-coverup",
    name: "Surface Fragrance Coverup",
    kind: "method",
    summary:
      "A masking approach that hides odor or appearance temporarily without resolving the underlying contamination.",
    aliases: ["odor masking"],
    relatedArticleSlugs: [],
    relatedServiceSlugs: [],
    chemistryClass: "neutral",
    mechanism: ["covers symptoms without removing source contamination"],
    idealForSoilSlugs: [],
    compatibleSurfaceSlugs: [],
    incompatibleSurfaceSlugs: ["grout", "caulk", "carpet", "upholstery"],
    recommendedToolSlugs: [],
    dwellTimeGuidance: [],
    moistureControlGuidance: [],
    residueConsiderations: [
      "can leave residue while failing to address actual contamination",
    ],
    safetyNotes: [
      "Masking should never be treated as remediation.",
    ],
    professionalEscalationThresholds: [],
  },
  {
    slug: "acid-on-cementitious-grout-without-need",
    name: "Acid on Cementitious Grout Without Need",
    kind: "method",
    summary:
      "An avoidable misuse of acidic chemistry on grout where the residue type does not justify the risk.",
    aliases: ["unnecessary acid on grout"],
    relatedArticleSlugs: [],
    relatedServiceSlugs: [],
    chemistryClass: "acidic",
    mechanism: ["exposes grout to acid stress without clear removal advantage"],
    idealForSoilSlugs: [],
    compatibleSurfaceSlugs: [],
    incompatibleSurfaceSlugs: ["grout"],
    recommendedToolSlugs: [],
    dwellTimeGuidance: [],
    moistureControlGuidance: [],
    residueConsiderations: [],
    safetyNotes: [
      "Acid use on grout should be deliberate and justified, not routine.",
    ],
    professionalEscalationThresholds: [],
  },
  {
    slug: "dilution-control",
    name: "Dilution Control",
    kind: "method",
    summary:
      "A chemical control method that measures concentrates into task-appropriate working solutions to prevent residue, damage, and exposure problems.",
    aliases: ["controlled dilution", "chemical dilution"],
    relatedArticleSlugs: ["kitchen-cleaning-guide", "bathroom-cleaning-guide"],
    relatedServiceSlugs: ["kitchen-cleaning", "bathroom-cleaning", "deep-cleaning"],
    chemistryClass: "neutral",
    mechanism: [
      "matches product strength to soil load and surface tolerance",
      "prevents overconcentration from creating residue or finish damage",
    ],
    idealForSoilSlugs: ["kitchen-grease", "soap-scum", "grout-soiling", "hard-water-stains"],
    compatibleSurfaceSlugs: ["glass", "ceramic-tile", "porcelain-tile", "fiberglass", "chrome", "stainless-steel", "painted-cabinetry", "laminate", "grout", "sealed-hardwood"],
    incompatibleSurfaceSlugs: [],
    recommendedToolSlugs: ["dilution-bottle", "trigger-sprayer", "commercial-concentrate", "ready-to-use-cleaner"],
    dwellTimeGuidance: [
      "dwell time should follow the diluted product label, not the concentrate strength",
    ],
    moistureControlGuidance: [
      "apply only enough working solution to maintain contact without flooding seams",
    ],
    residueConsiderations: [
      "overconcentration leaves tacky, hazy, or odor-heavy residue even when the surface looks wet-cleaned",
    ],
    safetyNotes: [
      "Never mix incompatible products or relabel unknown chemistry as a working solution.",
    ],
    professionalEscalationThresholds: [
      "route teams are repeatedly seeing residue callbacks or finish dulling",
      "commercial concentrate handling requires formal labeling and SDS control",
    ],
  },
  {
    slug: "commercial-degreasing",
    name: "Commercial Degreasing",
    kind: "method",
    summary:
      "An alkaline soil-removal method for grease-heavy kitchens and traffic films where dwell, agitation, and residue removal are managed together.",
    aliases: ["degreasing workflow", "alkaline grease removal"],
    relatedArticleSlugs: ["how-to-clean-kitchen", "how-to-clean-greasy-kitchen-cabinets", "kitchen-cleaning-guide"],
    relatedServiceSlugs: ["kitchen-cleaning", "deep-cleaning"],
    chemistryClass: "alkaline",
    mechanism: [
      "emulsifies oily films so they can be wiped or rinsed away",
      "uses dwell to reduce the mechanical force required for bonded grease",
    ],
    idealForSoilSlugs: ["kitchen-grease", "grout-soiling"],
    compatibleSurfaceSlugs: ["stainless-steel", "laminate", "ceramic-tile", "porcelain-tile", "grout"],
    incompatibleSurfaceSlugs: ["sealed-hardwood", "painted-drywall"],
    recommendedToolSlugs: ["commercial-degreaser", "commercial-kitchen-maintenance-system", "low-pile-microfiber-towel", "high-pile-microfiber-towel", "non-scratch-scrub-pad", "trigger-sprayer", "dilution-bottle"],
    dwellTimeGuidance: [
      "allow grease to soften before wiping or pad agitation",
      "shorten dwell on painted or coated finishes",
    ],
    moistureControlGuidance: [
      "use spray-to-towel control near seams, electronics, and cabinet edges",
      "remove slurry with clean towels or pads before it dries",
    ],
    residueConsiderations: [
      "degreaser residue can leave tacky surfaces that collect dust and resoil quickly",
    ],
    safetyNotes: [
      "Use ventilation, gloves, and surface testing for stronger alkaline mixes.",
    ],
    professionalEscalationThresholds: [
      "grease layering is heavy across vertical, overhead, and floor surfaces",
      "finish stability is uncertain or already dulling",
    ],
  },
  {
    slug: "peroxide-oxidizing-cleaning",
    name: "Peroxide Oxidizing Cleaning",
    kind: "method",
    summary:
      "An oxidizing method for organic discoloration, grout brightening, restroom residue, and some odor-prone soils on compatible surfaces.",
    aliases: ["peroxide cleaning", "oxygen-based cleaning"],
    relatedArticleSlugs: ["how-to-clean-grout", "how-to-clean-shower", "bathroom-cleaning-guide"],
    relatedServiceSlugs: ["bathroom-cleaning", "deep-cleaning"],
    chemistryClass: "oxidizing",
    mechanism: [
      "oxidizes organic staining and residue",
      "supports visual brightening where residue is compatible with oxidizing chemistry",
    ],
    idealForSoilSlugs: ["mildew", "grout-soiling", "pet-stains"],
    compatibleSurfaceSlugs: ["ceramic-tile", "porcelain-tile", "grout", "caulk"],
    incompatibleSurfaceSlugs: ["sealed-hardwood", "painted-drywall"],
    recommendedToolSlugs: ["peroxide-cleaner", "restroom-cleaner-system", "grout-brush", "detail-brush", "soft-bristle-brush", "dilution-bottle", "trigger-sprayer"],
    dwellTimeGuidance: [
      "oxidizers need enough dwell to react before agitation",
      "do not let oxidizer dry uncontrolled on sensitive edges",
    ],
    moistureControlGuidance: [
      "rinse, wipe, or extract residue after the reaction period",
      "dry wet areas to reduce recurrence",
    ],
    residueConsiderations: [
      "leftover oxidizer film can continue reacting or dry into visible haze",
    ],
    safetyNotes: [
      "Do not mix oxidizers with acids, ammonia, or unknown restroom chemicals.",
    ],
    professionalEscalationThresholds: [
      "dark spotting returns quickly after treatment",
      "caulk, grout, or backing material may be contaminated below the surface",
    ],
  },
  {
    slug: "restroom-maintenance-workflow",
    name: "Restroom Maintenance Workflow",
    kind: "method",
    summary:
      "A sequenced workflow for restroom cleaning that separates mineral removal, organic residue control, touchpoint cleaning, and contamination isolation.",
    aliases: ["restroom cleaning workflow", "bathroom maintenance cycle"],
    relatedArticleSlugs: ["bathroom-cleaning-guide", "how-to-clean-shower", "how-to-clean-grout"],
    relatedServiceSlugs: ["bathroom-cleaning", "deep-cleaning"],
    chemistryClass: "mechanical",
    mechanism: [
      "separates incompatible soil classes and tool zones",
      "reduces cross-contamination while preserving fixtures and finishes",
    ],
    idealForSoilSlugs: ["soap-scum", "hard-water-stains", "mildew", "grout-soiling"],
    compatibleSurfaceSlugs: ["glass", "ceramic-tile", "porcelain-tile", "fiberglass", "chrome", "grout", "caulk"],
    incompatibleSurfaceSlugs: ["sealed-hardwood", "carpet", "upholstery"],
    recommendedToolSlugs: ["restroom-cleaner-system", "peroxide-cleaner", "glass-microfiber-towel", "grout-brush", "detail-brush", "trigger-sprayer", "dilution-bottle"],
    dwellTimeGuidance: [
      "apply task-specific chemistry early enough to dwell before agitation and final wiping",
    ],
    moistureControlGuidance: [
      "keep wet chemistry off drywall, wood, textiles, and unprotected seams",
      "finish with drying and ventilation to reduce recurrence",
    ],
    residueConsiderations: [
      "restroom residue left in grout, caulk, and fixture bases drives odor and visual failure",
    ],
    safetyNotes: [
      "Keep acid, oxidizer, and disinfectant products separated unless the label explicitly permits combined use.",
    ],
    professionalEscalationThresholds: [
      "odor or biological growth returns quickly",
      "grout or caulk condition suggests repair rather than cleaning",
    ],
  },
  {
    slug: "high-traffic-floor-maintenance",
    name: "High-Traffic Floor Maintenance",
    kind: "method",
    summary:
      "A recurring floor-care method that combines dry soil removal, low-residue damp cleaning, pad changes, and periodic agitation for traffic lanes.",
    aliases: ["commercial floor maintenance", "traffic lane maintenance"],
    relatedArticleSlugs: ["how-to-clean-tile", "how-to-clean-laminate-floors", "best-floor-cleaning-tools"],
    relatedServiceSlugs: ["deep-cleaning"],
    chemistryClass: "neutral",
    mechanism: [
      "removes abrasive dry soil before it becomes wet slurry",
      "maintains floors with low-residue chemistry between deeper agitation cycles",
    ],
    idealForSoilSlugs: ["grout-soiling", "kitchen-grease", "pet-stains"],
    compatibleSurfaceSlugs: ["ceramic-tile", "porcelain-tile", "grout", "laminate", "sealed-hardwood"],
    incompatibleSurfaceSlugs: ["carpet", "upholstery"],
    recommendedToolSlugs: ["high-traffic-floor-care-system", "hepa-vacuum", "flat-mop-system", "microfiber-floor-pad-system", "neutral-floor-cleaner", "string-mop", "stiff-bristle-brush"],
    dwellTimeGuidance: [
      "routine neutral cleaning uses short contact time; deeper traffic soil needs scheduled agitation dwell",
    ],
    moistureControlGuidance: [
      "control moisture on wood and laminate while changing pads before soil redistribution",
    ],
    residueConsiderations: [
      "residue accelerates resoiling and can create slip risk in commercial routes",
    ],
    safetyNotes: [
      "Wet floors need dry-time planning and product dilution control.",
    ],
    professionalEscalationThresholds: [
      "traffic lanes remain dark after proper maintenance",
      "finish wear, grout deterioration, or slip complaints appear",
    ],
  },
];
