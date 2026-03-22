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
    recommendedToolSlugs: ["microfiber-towel", "non-scratch-scrub-pad", "grout-brush"],
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
    recommendedToolSlugs: ["microfiber-towel", "detail-brush", "non-scratch-scrub-pad", "grout-brush"],
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
    recommendedToolSlugs: ["white-terry-towel", "extractor", "detail-brush"],
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
    recommendedToolSlugs: ["grout-brush", "detail-brush", "microfiber-towel"],
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
    recommendedToolSlugs: ["microfiber-towel", "mop-pad"],
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
    recommendedToolSlugs: ["microfiber-towel", "mop-pad"],
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
    recommendedToolSlugs: ["grout-brush", "non-scratch-scrub-pad", "detail-brush"],
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
    recommendedToolSlugs: ["white-terry-towel", "extractor"],
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
    recommendedToolSlugs: ["squeegee", "microfiber-towel"],
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
];
