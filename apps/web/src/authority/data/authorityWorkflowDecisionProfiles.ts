import type { AuthorityWorkflowDecisionProfile } from "@/authority/types/authorityWorkflowTypes";

export const AUTHORITY_WORKFLOW_DECISION_PROFILES: AuthorityWorkflowDecisionProfile[] = [
  {
    slug: "restroom-maintenance-workflow",
    title: "Restroom maintenance workflow",
    summary:
      "A wet-room workflow that separates mineral, soap, biological, and touchpoint work so chemistry does not conflict and residue does not restart the failure cycle.",
    workflowFamily: "bathroom_maintenance",
    intent:
      "Keep bathrooms clean by sequencing diagnosis, targeted chemistry, recovery, drying, and recurrence control instead of treating every residue as one scrub job.",
    bestForProblemSlugs: ["soap-scum", "hard-water-deposits", "light-mildew", "bathroom-buildup"],
    compatibleSurfaceSlugs: ["shower-glass", "tile", "porcelain-tile", "ceramic-tile", "grout", "fixtures"],
    supportingMethodSlugs: [
      "soap-scum-removal",
      "hard-water-deposit-removal",
      "touchpoint-sanitization",
      "glass-cleaning",
    ],
    requiredToolRoles: [
      {
        role: "zone-separated towels",
        logic:
          "Restroom soil moves between fixtures, glass, and touchpoints easily; towel separation prevents a clean pass from becoming redistribution.",
      },
      {
        role: "detail agitation",
        logic:
          "Grout edges, fixture bases, and door tracks need targeted agitation after dwell because broad wiping misses the residue pockets that drive odor and visual failure.",
      },
      {
        role: "drying tool",
        logic:
          "A squeegee or dry microfiber turns the final step into recurrence control by shortening the wet-dry cycle that feeds minerals and biofilm.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "mixed by zone: neutral, acidic, oxidizing, and disinfecting only where label-safe",
      soilFit:
        "Soap films need surfactant and agitation, minerals need compatible acid chemistry, and biological residue needs source cleaning before any disinfecting claim matters.",
      dwellLogic:
        "Each chemistry needs its own controlled dwell window; overlapping acid, oxidizer, and disinfectant steps creates safety risk and weakens diagnosis.",
      residueRecovery:
        "Rinse and dry after each targeted chemistry so softened film, dissolved minerals, and product residue do not become the next visible buildup layer.",
    },
    sequenceLogic: [
      {
        phase: "identify wet-room soil lanes",
        reason:
          "Mineral spotting, soap film, biofilm, and touchpoint contamination respond to different chemistry and should not be collapsed into one product choice.",
      },
      {
        phase: "pre-rinse or dry-remove loose soil",
        reason:
          "Loose dust and hair interfere with chemistry contact and become slurry during agitation.",
        dependsOn: "identify wet-room soil lanes",
      },
      {
        phase: "treat mineral and soap zones separately",
        reason:
          "Separating incompatible soil classes preserves surfaces and keeps the result readable when one lane fails.",
        dependsOn: "pre-rinse or dry-remove loose soil",
      },
      {
        phase: "recover residue before touchpoint finishing",
        reason:
          "Disinfection and final glass clarity fail when cleaner film or loosened soil remains on the surface.",
        dependsOn: "treat mineral and soap zones separately",
      },
      {
        phase: "dry and ventilate",
        reason:
          "Dry-down is the prevention step; without it, hard-water, mildew, and soap-film cycles restart immediately.",
        dependsOn: "recover residue before touchpoint finishing",
      },
    ],
    failureAnalysis: [
      {
        signal: "film clears while wet, then dries cloudy",
        likelyCause: "softened soap-mineral residue was not fully recovered or glass is etched",
        diagnosticResponse: "Repeat only with better rinse and dry inspection; stop if haze remains fixed after proper recovery.",
      },
      {
        signal: "odor returns quickly",
        likelyCause: "residue remains in grout, caulk, drain-adjacent zones, or airflow is insufficient",
        diagnosticResponse: "Inspect source zones and moisture persistence before adding fragrance or stronger disinfectant.",
      },
      {
        signal: "spotting returns within days",
        likelyCause: "hard water or a drip is rebuilding mineral deposits faster than the cadence can control",
        diagnosticResponse: "Treat the water path and dry-down habit as part of the workflow, not as optional maintenance.",
      },
    ],
    escalationLogic: [
      {
        trigger: "growth returns after source cleaning and dry-down improvements",
        reason: "Recurring biology can indicate hidden moisture, contaminated caulk, or repair needs beyond surface cleaning.",
      },
      {
        trigger: "stone, unknown coating, or specialty fixture finish is present",
        reason: "Bathroom mineral chemistry can damage acid-sensitive or coated surfaces before the workflow proves soil removal.",
      },
    ],
    safetyLogic: [
      {
        rule: "Do not mix restroom chemistries across steps.",
        reason: "Acids, oxidizers, bleach, ammonia, and disinfectants can create incompatible reactions or invalid label use.",
      },
      {
        rule: "Protect adjacent surfaces before targeted chemistry.",
        reason: "A cleaner that fits glass or porcelain may fail on stone, grout, painted trim, or plated hardware.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "daily or after-use dry-down in hard-water showers",
        reason: "Removing water before evaporation prevents mineral bonding better than occasional aggressive correction.",
      },
      {
        cadence: "weekly light film reset before visible layering",
        reason: "Short cycles keep soap and body-oil film soft enough for low-risk removal.",
      },
      {
        cadence: "periodic deep edge and grout detail",
        reason: "Residue accumulates first where broad towels do not reach, so edge work prevents later odor and mildew complaints.",
      },
    ],
    relatedGuides: ["chemical-usage-and-safety", "why-cleaning-fails", "when-cleaning-damages-surfaces"],
    antiPatternSlugs: [
      "why-bleach-isnt-a-universal-cleaner",
      "why-you-shouldnt-mix-cleaners",
      "why-shower-sprays-dont-remove-heavy-buildup",
    ],
  },
  {
    slug: "high-traffic-floor-maintenance",
    title: "High-traffic floor maintenance",
    summary:
      "A recurring floor workflow that prevents abrasive dry soil, mop residue, and traffic-lane film from compounding into correction or restoration work.",
    workflowFamily: "floor_care",
    intent:
      "Preserve walkable surfaces by separating dry soil removal, low-residue damp cleaning, pad recovery, and scheduled deeper agitation.",
    bestForProblemSlugs: ["floor-residue-buildup", "floor-buildup", "grime-buildup", "scuff-marks"],
    compatibleSurfaceSlugs: ["tile", "porcelain-tile", "ceramic-tile", "vinyl-flooring", "commercial-flooring", "hardwood"],
    supportingMethodSlugs: ["neutral-surface-cleaning", "detail-dusting", "dwell-and-lift-cleaning"],
    requiredToolRoles: [
      {
        role: "dry soil capture",
        logic:
          "Vacuuming or dust control removes abrasive grit before moisture turns it into slurry that scratches, hazes, or redeposits.",
      },
      {
        role: "controlled damp delivery",
        logic:
          "A mop or floor pad should deliver enough solution for soil suspension without flooding seams, coatings, or wood systems.",
      },
      {
        role: "soil recovery",
        logic:
          "Pad changes and clean solution matter because a loaded mop becomes the source of floor film.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "neutral to mildly alkaline only when soil load and surface tolerance justify it",
      soilFit:
        "Routine traffic soil is often particulate plus light residue; stronger chemistry is reserved for grease or embedded grime after dry soil is removed.",
      dwellLogic:
        "Routine passes use short contact time, while traffic lanes need scheduled dwell and agitation so force does not replace chemistry.",
      residueRecovery:
        "Recovered solution, clean pads, and correct dilution prevent tacky film, slip risk, and accelerated resoiling.",
    },
    sequenceLogic: [
      {
        phase: "dry-remove grit and debris",
        reason: "Moisture turns dry particulate into abrasive slurry and makes residue harder to diagnose.",
      },
      {
        phase: "use low-residue damp cleaning",
        reason: "Neutral maintenance preserves finish systems while removing routine soil before it bonds.",
        dependsOn: "dry-remove grit and debris",
      },
      {
        phase: "change pads or solution before loading",
        reason: "Tool loading controls whether the pass removes soil or redistributes it.",
        dependsOn: "use low-residue damp cleaning",
      },
      {
        phase: "schedule deeper agitation by traffic lane",
        reason: "Periodic correction handles embedded lanes without making aggressive pads the daily default.",
        dependsOn: "change pads or solution before loading",
      },
    ],
    failureAnalysis: [
      {
        signal: "floor feels tacky after cleaning",
        likelyCause: "overconcentrated cleaner, dirty solution, or insufficient recovery",
        diagnosticResponse: "Reset with clean water or correct dilution before increasing chemistry strength.",
      },
      {
        signal: "traffic lanes remain dark",
        likelyCause: "embedded soil, worn finish, or cadence too light for use intensity",
        diagnosticResponse: "Test a controlled dwell and agitation patch; stop if darkness is wear rather than soil.",
      },
      {
        signal: "slip complaints or rapid resoiling",
        likelyCause: "residue film is holding soil or changing floor friction",
        diagnosticResponse: "Audit dilution, pad changes, dry time, and recovery before adding polish or stronger cleaner.",
      },
    ],
    escalationLogic: [
      {
        trigger: "traffic lanes do not respond to correct dwell and agitation",
        reason: "The remaining issue may be finish wear, grout damage, or restoration work rather than cleaning failure.",
      },
      {
        trigger: "wood, coated, or commercial floor systems show dulling or swelling",
        reason: "Moisture and chemistry mistakes can damage floor systems faster than visible soil is removed.",
      },
    ],
    safetyLogic: [
      {
        rule: "Control wet-floor exposure and dry time.",
        reason: "Floor workflows create slip risk while chemistry and moisture are active.",
      },
      {
        rule: "Do not use degreaser logic as the default floor logic.",
        reason: "Residue and finish damage rise when chemistry strength is not matched to actual soil load.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "frequent dry soil control in entries and traffic lanes",
        reason: "Dry grit is the abrasive input that makes later damp passes riskier.",
      },
      {
        cadence: "predictable neutral cleaning based on traffic",
        reason: "Routine low-residue cleaning prevents correction chemistry from becoming the maintenance plan.",
      },
      {
        cadence: "periodic lane-specific agitation",
        reason: "High-use lanes need planned correction before soil load looks like permanent wear.",
      },
    ],
    relatedGuides: ["best-cleaners-for-floors", "why-cleaning-fails", "when-cleaning-damages-surfaces"],
    antiPatternSlugs: [
      "why-overwet-mops-leave-residue",
      "why-floor-cleaners-can-leave-film",
      "why-bucket-water-gets-dirtier-than-it-looks",
    ],
  },
  {
    slug: "commercial-degreasing",
    title: "Commercial degreasing",
    summary:
      "A grease-removal workflow that uses soil identification, alkaline or surfactant chemistry, dwell, agitation, and recovery to remove oil instead of smearing it.",
    workflowFamily: "kitchen_grease",
    intent:
      "Break lipid films loose from tolerant kitchen surfaces while protecting finishes from unnecessary alkalinity, solvent exposure, and abrasive force.",
    bestForProblemSlugs: ["grease-buildup", "kitchen-grease-film", "cooked-on-grease", "exhaust-hood-film"],
    compatibleSurfaceSlugs: ["stainless-steel", "tile", "laminate", "cabinets", "appliances", "countertops"],
    supportingMethodSlugs: ["degreasing", "dwell-and-lift-cleaning", "neutral-surface-cleaning"],
    requiredToolRoles: [
      {
        role: "pre-dust or dry wipe",
        logic:
          "Dust mixed into degreaser becomes muddy residue, so dry particulate should leave before chemistry starts emulsifying oil.",
      },
      {
        role: "non-scratch agitation",
        logic:
          "Agitation helps softened grease release, but the pad or brush must be safer than the finish being cleaned.",
      },
      {
        role: "fresh towel recovery",
        logic:
          "Grease removal depends on lifting contaminated slurry away; a saturated towel spreads the film back over the surface.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "alkaline or surfactant-forward, scaled by surface tolerance",
      soilFit:
        "Cooking oils resist water and often polymerize with heat, so the chemistry must emulsify lipid film before wiping can remove it.",
      dwellLogic:
        "Short dwell reduces force on bonded grease, while over-dwell can soften paint, coatings, or finishes.",
      residueRecovery:
        "A rinse or final neutral wipe removes degreaser film that would otherwise dry tacky and attract new dust.",
    },
    sequenceLogic: [
      {
        phase: "confirm grease rather than mineral, dust, or finish damage",
        reason: "Degreasing fails when the visible issue is not oil-based soil.",
      },
      {
        phase: "remove dry soil first",
        reason: "Dry dust hides grease behavior and turns wet cleaning into smear-prone slurry.",
        dependsOn: "confirm grease rather than mineral, dust, or finish damage",
      },
      {
        phase: "apply compatible degreaser with controlled dwell",
        reason: "Chemistry must soften the oil film before mechanical action does useful work.",
        dependsOn: "remove dry soil first",
      },
      {
        phase: "agitate only to the finish tolerance",
        reason: "The softened grease should release with less force; rising force means the method or surface read is wrong.",
        dependsOn: "apply compatible degreaser with controlled dwell",
      },
      {
        phase: "recover, rinse, and dry inspect",
        reason: "The job is not finished until dissolved grease and cleaner residue are removed from the surface.",
        dependsOn: "agitate only to the finish tolerance",
      },
    ],
    failureAnalysis: [
      {
        signal: "grease smears wider",
        likelyCause: "chemistry is too weak, dwell is too short, or towel faces are loaded",
        diagnosticResponse: "Improve dwell and towel rotation before moving to harsher chemistry.",
      },
      {
        signal: "surface gets tacky after drying",
        likelyCause: "degreaser or loosened oil residue remains",
        diagnosticResponse: "Add recovery and final wipe discipline instead of repeating the same wet pass.",
      },
      {
        signal: "color transfer or sheen change",
        likelyCause: "finish is reacting to chemistry or abrasion",
        diagnosticResponse: "Stop and treat the surface as finish-sensitive rather than increasing strength.",
      },
    ],
    escalationLogic: [
      {
        trigger: "grease is layered across overhead, vertical, and equipment-adjacent surfaces",
        reason: "Heavy aerosolized grease requires containment, ventilation awareness, and stronger recovery planning.",
      },
      {
        trigger: "painted or coated finishes soften during a test",
        reason: "Further cleaning can become finish damage rather than soil removal.",
      },
    ],
    safetyLogic: [
      {
        rule: "Ventilate and protect skin when using stronger degreasers.",
        reason: "Alkaline chemistry can irritate skin and concentrate exposure in kitchen zones.",
      },
      {
        rule: "Do not borrow oven or drain chemistry for general kitchen degreasing.",
        reason: "Caustic specialty products can damage finishes and create exposure risk outside their label workflow.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "frequent light degreasing around handles, hoods, and cooking splash paths",
        reason: "Fresh oil removes with lower-risk chemistry before heat and dust polymerize the film.",
      },
      {
        cadence: "scheduled deep recovery for hood-adjacent and cabinet-edge zones",
        reason: "Vertical and overhead surfaces collect hidden aerosol grease before users read them as dirty.",
      },
    ],
    relatedGuides: ["best-cleaners-for-kitchens", "why-cleaning-fails", "chemical-usage-and-safety"],
    antiPatternSlugs: [
      "why-vinegar-doesnt-remove-grease",
      "why-glass-cleaners-dont-work-on-grease",
      "why-stainless-polish-isnt-a-degreaser",
    ],
  },
  {
    slug: "dilution-control",
    title: "Dilution control",
    summary:
      "A chemical-control workflow that makes product strength part of the decision model so dwell, residue, safety, and finish tolerance stay aligned.",
    workflowFamily: "chemical_control",
    intent:
      "Use the weakest label-correct working solution that can perform the job, then recover residue before concentration errors become visible failures.",
    bestForProblemSlugs: ["product-residue-buildup", "surface-haze", "sticky-film", "floor-residue-buildup"],
    compatibleSurfaceSlugs: ["tile", "glass", "stainless-steel", "laminate", "countertops", "sealed-surfaces"],
    supportingMethodSlugs: ["neutral-surface-cleaning", "degreasing", "dwell-and-lift-cleaning"],
    requiredToolRoles: [
      {
        role: "measuring container or dilution bottle",
        logic:
          "Measured dilution turns concentration from a guess into a repeatable control point for residue and safety.",
      },
      {
        role: "labeled applicator",
        logic:
          "Clear container identity prevents accidental mixing, wrong-surface use, and mystery residue callbacks.",
      },
      {
        role: "clean recovery towel or pad",
        logic:
          "Even correct dilution can fail if dissolved soil and product solids are left behind.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "label-directed working solution",
      soilFit:
        "Concentration should match soil load and surface tolerance; more product can reduce performance by increasing residue.",
      dwellLogic:
        "Dwell time follows the working solution label, not the concentrate strength or user impatience.",
      residueRecovery:
        "Final wipe, rinse, or pad recovery removes the solids that overconcentration leaves as haze, tack, odor, or film.",
    },
    sequenceLogic: [
      {
        phase: "identify soil load and surface sensitivity",
        reason: "The same concentrate can be safe or damaging depending on finish and dilution.",
      },
      {
        phase: "mix or select the correct working solution",
        reason: "Concentration controls chemistry performance, exposure, and residue risk before cleaning begins.",
        dependsOn: "identify soil load and surface sensitivity",
      },
      {
        phase: "apply enough to maintain contact without flooding",
        reason: "Under-application breaks dwell; over-application drives seams, residue, and dry-time problems.",
        dependsOn: "mix or select the correct working solution",
      },
      {
        phase: "recover product and soil",
        reason: "Dilution control succeeds only when the surface is left clean, not just wet-cleaned.",
        dependsOn: "apply enough to maintain contact without flooding",
      },
    ],
    failureAnalysis: [
      {
        signal: "haze or sticky feel after drying",
        likelyCause: "too much product, skipped recovery, or dirty rinse media",
        diagnosticResponse: "Reset with correct dilution and clean recovery before changing product class.",
      },
      {
        signal: "soil does not release",
        likelyCause: "solution is too weak for soil load or dwell is too short",
        diagnosticResponse: "Adjust within label range only after confirming surface compatibility.",
      },
      {
        signal: "odor-heavy or chemical film remains",
        likelyCause: "overconcentration or incompatible product layering",
        diagnosticResponse: "Recover residue and stop adding products until the surface baseline is readable.",
      },
    ],
    escalationLogic: [
      {
        trigger: "repeated residue callbacks across rooms or routes",
        reason: "The issue is likely system-level dilution, labeling, or tool recovery rather than one dirty surface.",
      },
      {
        trigger: "concentrate handling lacks label, SDS, or container control",
        reason: "Chemical control has become an exposure and compliance issue.",
      },
    ],
    safetyLogic: [
      {
        rule: "Never mix unknown or incompatible products in the same container.",
        reason: "Dilution bottles can hide reactive chemistry and mislead future users.",
      },
      {
        rule: "Label working solutions clearly.",
        reason: "A correct mix becomes unsafe when the next user cannot identify it.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "review dilution when residue patterns recur",
        reason: "Film, tack, and streaking often indicate concentration drift, not a new soil type.",
      },
      {
        cadence: "refresh working solution before performance becomes inconsistent",
        reason: "Old, contaminated, or unlabeled solution breaks repeatability.",
      },
    ],
    relatedGuides: ["chemical-usage-and-safety", "why-cleaning-fails", "cleaning-every-surface"],
    antiPatternSlugs: [
      "why-using-too-much-cleaner-makes-things-worse",
      "why-too-much-product-causes-residue",
      "why-all-purpose-cleaners-leave-residue",
    ],
  },
  {
    slug: "peroxide-oxidizing-cleaning",
    title: "Peroxide oxidizing cleaning",
    summary:
      "An oxidizing workflow for compatible organic discoloration and restroom residue where reaction time, surface limits, and residue recovery determine success.",
    workflowFamily: "oxidizing_correction",
    intent:
      "Use oxygen-forward chemistry to react with compatible organic staining while avoiding mix hazards, over-dwell, and false confidence from bubbling alone.",
    bestForProblemSlugs: ["light-mildew", "organic-stains", "biofilm-buildup", "bathroom-buildup"],
    compatibleSurfaceSlugs: ["tile", "porcelain-tile", "ceramic-tile", "grout", "fixtures"],
    supportingMethodSlugs: ["dwell-and-lift-cleaning", "neutral-surface-cleaning", "soap-scum-removal"],
    requiredToolRoles: [
      {
        role: "controlled applicator",
        logic:
          "Oxidizers need targeted wet contact on the stained zone without overspray onto incompatible surfaces.",
      },
      {
        role: "soft detail brush",
        logic:
          "Light agitation after dwell helps remove loosened residue without treating abrasion as the active ingredient.",
      },
      {
        role: "rinse or wipe recovery",
        logic:
          "Reaction byproducts and leftover oxidizer must leave the surface so the result can be inspected accurately.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "oxidizing",
      soilFit:
        "Peroxide-style oxidizers fit some organic discoloration, grout brightening, and restroom films better than grease or mineral scale.",
      dwellLogic:
        "The reaction needs time, but uncontrolled drying can leave film or stress sensitive edges.",
      residueRecovery:
        "Wipe, rinse, or extract after the reaction window so remaining film does not keep reacting or dry into haze.",
    },
    sequenceLogic: [
      {
        phase: "confirm organic or biological residue context",
        reason: "Oxidizers are not degreasers, descalers, or proof that a stain is removable.",
      },
      {
        phase: "clean blocking soil first",
        reason: "Soap film, grease, and heavy soil can consume chemistry before it reaches the target discoloration.",
        dependsOn: "confirm organic or biological residue context",
      },
      {
        phase: "apply oxidizer for controlled dwell",
        reason: "Reaction time does the work; random scrubbing before dwell wastes the chemistry.",
        dependsOn: "clean blocking soil first",
      },
      {
        phase: "agitate lightly and recover residue",
        reason: "Mechanical help removes loosened material, while recovery prevents reactive residue from remaining.",
        dependsOn: "apply oxidizer for controlled dwell",
      },
      {
        phase: "dry inspect for stain versus damage",
        reason: "Remaining color may be embedded staining, material damage, or moisture recurrence rather than surface soil.",
        dependsOn: "agitate lightly and recover residue",
      },
    ],
    failureAnalysis: [
      {
        signal: "bubbling happens but appearance does not improve",
        likelyCause: "reaction is occurring on surface soil, not the controlling stain",
        diagnosticResponse: "Do not equate bubbles with cleaning; reassess soil class and depth.",
      },
      {
        signal: "dark spotting returns quickly",
        likelyCause: "moisture source or porous contamination remains",
        diagnosticResponse: "Shift diagnosis to recurrence and substrate conditions before repeating oxidizer.",
      },
      {
        signal: "haze or light film remains",
        likelyCause: "oxidizer residue or loosened soil was not recovered",
        diagnosticResponse: "Rinse or wipe clear, then inspect dry before further chemistry.",
      },
    ],
    escalationLogic: [
      {
        trigger: "growth or dark staining returns despite dry-down control",
        reason: "The source may be below caulk, grout, backing, or another porous material.",
      },
      {
        trigger: "surface color or sheen shifts during treatment",
        reason: "Oxidation can affect finishes, pigments, or coatings beyond the target soil.",
      },
    ],
    safetyLogic: [
      {
        rule: "Do not mix oxidizers with acids, ammonia, bleach, or unknown restroom chemistry.",
        reason: "Oxidizer workflows are especially sensitive to incompatible chemistry and exposure risk.",
      },
      {
        rule: "Keep oxidizer off unsupported sensitive materials.",
        reason: "Textiles, paint, coatings, and some metals may discolor or react outside label scope.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "use as correction when organic discoloration appears, not as every-pass maintenance",
        reason: "Routine prevention should reduce moisture and residue instead of repeatedly oxidizing the same area.",
      },
      {
        cadence: "follow with moisture-control cadence in wet areas",
        reason: "Oxidizing visible residue does not break the humidity cycle that lets it return.",
      },
    ],
    relatedGuides: ["chemical-usage-and-safety", "why-cleaning-fails", "when-cleaning-damages-surfaces"],
    antiPatternSlugs: [
      "why-peroxide-bubbles-dont-equal-clean",
      "why-enzymes-dont-fix-mildew-staining",
      "why-bleach-can-make-stains-look-better-but-not-solve-them",
    ],
  },
  {
    slug: "dwell-and-lift-cleaning",
    title: "Dwell-and-lift cleaning",
    summary:
      "A controlled-lift workflow that uses time, moisture, and gentle mechanics to release stuck-on soil before force creates damage.",
    workflowFamily: "controlled_lift",
    intent:
      "Reduce unnecessary scraping by giving compatible chemistry or moisture enough time to soften residue before removal.",
    bestForProblemSlugs: ["stuck-on-residue", "sticky-film", "adhesive-residue", "burnt-residue"],
    compatibleSurfaceSlugs: ["laminate", "quartz-countertops", "countertops", "appliances", "vinyl-flooring", "tile"],
    supportingMethodSlugs: ["dwell-and-lift-cleaning", "neutral-surface-cleaning", "degreasing"],
    requiredToolRoles: [
      {
        role: "controlled applicator",
        logic:
          "The residue needs contact time without flooding seams or spreading chemistry beyond the problem area.",
      },
      {
        role: "non-scratch lift tool",
        logic:
          "Once residue softens, a safe edge, towel, or pad should lift it without converting the job into abrasion.",
      },
      {
        role: "final residue towel",
        logic:
          "Lifted residue leaves a boundary film unless the final pass removes remaining cleaner and soil.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "surface-compatible neutral, alkaline, or specialty remover based on residue type",
      soilFit:
        "Dwell works when the residue can soften or rehydrate; it fails when the mark is damage, cured coating, or incompatible adhesive.",
      dwellLogic:
        "Time replaces force, but over-dwell can swell seams, soften finishes, or dry product into a new residue layer.",
      residueRecovery:
        "Lifted residue and softened soil must be recovered while mobile; otherwise they settle into edges, texture, or towel trails.",
    },
    sequenceLogic: [
      {
        phase: "identify whether the residue can soften",
        reason: "Dwell is useful for removable residue but not for scratches, etching, or finish failure.",
      },
      {
        phase: "spot-test surface tolerance",
        reason: "The safest lift chemistry still has to match the finish, coating, and seams.",
        dependsOn: "identify whether the residue can soften",
      },
      {
        phase: "apply controlled dwell",
        reason: "Softening first lowers the mechanical force needed for removal.",
        dependsOn: "spot-test surface tolerance",
      },
      {
        phase: "lift from edge to center or from least bonded area",
        reason: "Working from a released edge prevents gouging and shows whether the bond is actually changing.",
        dependsOn: "apply controlled dwell",
      },
      {
        phase: "clean boundary residue",
        reason: "Successful lift often leaves a halo of product, adhesive, or softened soil that needs a finishing pass.",
        dependsOn: "lift from edge to center or from least bonded area",
      },
    ],
    failureAnalysis: [
      {
        signal: "residue edges do not soften",
        likelyCause: "wrong chemistry, cured material, or surface damage rather than removable soil",
        diagnosticResponse: "Stop increasing pressure and reassess the material before scraping.",
      },
      {
        signal: "surface dulls or swells around residue",
        likelyCause: "over-dwell or incompatible chemistry is affecting the finish",
        diagnosticResponse: "Stop the workflow and shift to damage prevention.",
      },
      {
        signal: "sticky halo remains after lift",
        likelyCause: "softened residue was spread during recovery",
        diagnosticResponse: "Use fresh towel faces and a compatible finishing cleaner before repeating dwell.",
      },
    ],
    escalationLogic: [
      {
        trigger: "only sharp scraping appears to work",
        reason: "The damage risk is now higher than the cleaning benefit without expert surface assessment.",
      },
      {
        trigger: "adhesive or burnt residue sits on expensive, coated, or heat-sensitive material",
        reason: "Specialty remover or restoration decisions may be needed before surface damage occurs.",
      },
    ],
    safetyLogic: [
      {
        rule: "Do not substitute force for failed dwell.",
        reason: "Escalating pressure can scratch or dull a surface that chemistry has already failed to release.",
      },
      {
        rule: "Control moisture around seams and absorbent edges.",
        reason: "Dwell increases exposure time, which raises swelling and finish-lift risk.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "treat fresh stuck-on residue before it cures",
        reason: "Early softening needs less chemistry and less force.",
      },
      {
        cadence: "use as correction, not routine maintenance",
        reason: "Repeated dwell on the same area signals an unresolved source or surface mismatch.",
      },
    ],
    relatedGuides: ["how-to-remove-stains-safely", "why-cleaning-fails", "when-cleaning-damages-surfaces"],
    antiPatternSlugs: [
      "why-scrubbing-harder-doesnt-fix-buildup",
      "why-steel-wool-damages-finished-surfaces",
      "why-magic-erasers-dull-gloss-finishes",
    ],
  },
  {
    slug: "soap-scum-removal",
    title: "Soap scum removal",
    summary:
      "A bathroom-film workflow that treats soap scum as a layered soap, oil, mineral, and moisture system rather than a simple dirt layer.",
    workflowFamily: "bathroom_maintenance",
    intent:
      "Release waxy bathroom film with compatible chemistry, controlled dwell, soft agitation, recovery, and dry-down that slows recurrence.",
    bestForProblemSlugs: ["soap-scum", "soap-film", "bathroom-buildup", "cloudy-glass"],
    compatibleSurfaceSlugs: ["shower-glass", "tile", "porcelain-tile", "ceramic-tile", "grout", "fixtures"],
    supportingMethodSlugs: ["soap-scum-removal", "hard-water-deposit-removal", "glass-cleaning"],
    requiredToolRoles: [
      {
        role: "non-scratch agitation",
        logic:
          "Soap scum needs friction after dwell, but coated glass, acrylic, fixtures, and grout cannot be treated as abrasion-proof.",
      },
      {
        role: "rinse recovery",
        logic:
          "Softened soap-mineral film must be removed or it dries back as haze.",
      },
      {
        role: "dry finishing",
        logic:
          "Dry inspection separates remaining film from etching, coating damage, or mineral haze.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "bathroom film remover, with mineral chemistry only when surface-safe and mineral bonding is confirmed",
      soilFit:
        "Soap scum combines surfactant residue, body oils, minerals, and humidity, so neither bleach nor dry abrasion is the first answer.",
      dwellLogic:
        "Short controlled dwell softens the film so agitation can lift it without excessive pressure.",
      residueRecovery:
        "Rinse and dry passes remove loosened film and reveal whether cloudiness is still removable.",
    },
    sequenceLogic: [
      {
        phase: "distinguish soap film from mineral scale and etching",
        reason: "The wrong diagnosis sends the workflow toward force, acid, or bleach when the film requires layer control.",
      },
      {
        phase: "apply compatible film chemistry",
        reason: "The cleaner needs contact time to soften oils and soap binders before agitation.",
        dependsOn: "distinguish soap film from mineral scale and etching",
      },
      {
        phase: "agitate with surface-safe friction",
        reason: "Mechanical action removes softened film, but tool aggression must stay below finish tolerance.",
        dependsOn: "apply compatible film chemistry",
      },
      {
        phase: "rinse and dry inspect",
        reason: "Soap scum often looks solved while wet; dry inspection proves whether residue remains.",
        dependsOn: "agitate with surface-safe friction",
      },
      {
        phase: "set prevention cadence",
        reason: "Dry-down and light resets prevent the soap-mineral layer from bonding again.",
        dependsOn: "rinse and dry inspect",
      },
    ],
    failureAnalysis: [
      {
        signal: "waxy drag remains",
        likelyCause: "film was softened but not fully lifted or rinsed",
        diagnosticResponse: "Repeat with better dwell, soft agitation, and recovery rather than jumping to abrasive pads.",
      },
      {
        signal: "cloudiness remains fixed after dry inspection",
        likelyCause: "mineral etching, coating damage, or remaining mineral film",
        diagnosticResponse: "Test mineral behavior carefully; stop if the surface no longer changes.",
      },
      {
        signal: "film returns within a few uses",
        likelyCause: "dry-down, ventilation, or soap/mineral source is not controlled",
        diagnosticResponse: "Treat recurrence cadence as part of the workflow.",
      },
    ],
    escalationLogic: [
      {
        trigger: "coated glass, natural stone, or unknown bath finish is involved",
        reason: "Soap-scum chemistry and agitation can damage finishes before residue is removed.",
      },
      {
        trigger: "film remains after correct chemistry, rinse, and dry inspection",
        reason: "The visible issue may be etching or coating failure rather than removable scum.",
      },
    ],
    safetyLogic: [
      {
        rule: "Do not use bleach as the default soap-scum workflow.",
        reason: "Bleach can change appearance without removing soap-mineral film and can create mix hazards.",
      },
      {
        rule: "Protect stone, metal trim, and grout during chemistry escalation.",
        reason: "Bathroom surfaces sit close together but tolerate different chemistry.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "light weekly film reset in high-use showers",
        reason: "Thin film removes with lower risk than bonded soap-mineral buildup.",
      },
      {
        cadence: "after-use squeegee or dry pass on glass",
        reason: "Dry-down interrupts the moisture cycle that hardens soap scum.",
      },
    ],
    relatedGuides: ["best-cleaners-for-bathrooms", "why-cleaning-fails", "how-to-remove-stains-safely"],
    antiPatternSlugs: [
      "why-soap-scum-isnt-just-soap",
      "why-shower-sprays-dont-remove-heavy-buildup",
      "why-scrubbing-harder-doesnt-fix-buildup",
    ],
  },
  {
    slug: "hard-water-deposit-removal",
    title: "Hard water deposit removal",
    summary:
      "A mineral-removal workflow that uses surface-safe dissolution, short dwell, recovery, and water-path prevention instead of treating scale as dirt.",
    workflowFamily: "mineral_removal",
    intent:
      "Dissolve compatible mineral deposits while protecting acid-sensitive materials and identifying when cloudiness is etching, coating failure, or recurrence.",
    bestForProblemSlugs: ["hard-water-deposits", "limescale-buildup", "water-spotting", "mineral-film", "chrome-water-spots"],
    compatibleSurfaceSlugs: ["shower-glass", "glass", "tile", "porcelain-tile", "ceramic-tile", "fixtures", "sinks"],
    supportingMethodSlugs: ["hard-water-deposit-removal", "glass-cleaning", "neutral-surface-cleaning"],
    requiredToolRoles: [
      {
        role: "acid-compatible applicator",
        logic:
          "Mineral chemistry should contact the deposit, not drift onto stone, grout, coatings, or plated finishes without protection.",
      },
      {
        role: "non-scratch agitation",
        logic:
          "Light agitation after dwell removes softened scale while avoiding scratch damage from grit or hard pads.",
      },
      {
        role: "rinse and dry tool",
        logic:
          "Acid residue and dissolved minerals must be removed so the dry finish shows whether the deposit is gone.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "acidic only where surface and label allow",
      soilFit:
        "Hard water deposits are evaporated minerals, so dissolution is the active logic; plain detergents and force do not address the bond.",
      dwellLogic:
        "Short dwell allows reaction with mineral film, while long dwell raises risk for grout, metal, coatings, and adjacent stone.",
      residueRecovery:
        "Thorough rinse and dry inspection remove dissolved minerals and prevent acid residue from continuing to act.",
    },
    sequenceLogic: [
      {
        phase: "confirm mineral behavior and surface tolerance",
        reason: "The same white haze that needs acid on glass can be a stop sign on stone or etched surfaces.",
      },
      {
        phase: "protect incompatible adjacent materials",
        reason: "Water deposits often sit near grout, metal, stone, paint, and sealants with different acid tolerance.",
        dependsOn: "confirm mineral behavior and surface tolerance",
      },
      {
        phase: "apply acid-safe chemistry with short dwell",
        reason: "Dissolution needs time, but the risk curve rises as acid remains on the surface.",
        dependsOn: "protect incompatible adjacent materials",
      },
      {
        phase: "agitate lightly and rinse completely",
        reason: "Released minerals and acid residue should leave before the surface dries.",
        dependsOn: "apply acid-safe chemistry with short dwell",
      },
      {
        phase: "dry inspect and control water path",
        reason: "A dry result separates removed mineral film from etching and shows whether recurrence prevention is needed.",
        dependsOn: "agitate lightly and rinse completely",
      },
    ],
    failureAnalysis: [
      {
        signal: "roughness improves but cloudiness remains",
        likelyCause: "surface etching, coating damage, or non-mineral haze remains",
        diagnosticResponse: "Stop acid escalation and reassess the remaining condition as damage or another residue class.",
      },
      {
        signal: "scale returns within days",
        likelyCause: "active drip, hard-water splash path, or skipped dry-down",
        diagnosticResponse: "Solve the water path and cadence, not just the visible spots.",
      },
      {
        signal: "metal dulls or stone lightens",
        likelyCause: "acid contacted an incompatible surface",
        diagnosticResponse: "Stop immediately and shift to damage control rather than continued descaling.",
      },
    ],
    escalationLogic: [
      {
        trigger: "natural stone, unknown coating, or specialty fixture finish is present",
        reason: "Acid-compatible mineral logic may be unsafe on nearby or underlying materials.",
      },
      {
        trigger: "deposit remains after correct chemistry and controlled repeat",
        reason: "The visible issue may be etching, absorbed mineral, or restoration-level scale.",
      },
    ],
    safetyLogic: [
      {
        rule: "Never mix acid mineral removers with bleach or disinfectants.",
        reason: "Bathroom descaling often happens near other chemicals, creating high mix-hazard risk.",
      },
      {
        rule: "Treat stone and unknown coatings as acid-stop surfaces.",
        reason: "Acid damage can be permanent and may look like cleaning progress until the surface dries.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "dry high-splash zones after use",
        reason: "Minerals bond when water evaporates, so dry-down is the prevention workflow.",
      },
      {
        cadence: "descale lightly before crust forms",
        reason: "Thin mineral film needs less dwell and less agitation than layered scale.",
      },
    ],
    relatedGuides: ["chemical-usage-and-safety", "best-cleaners-for-bathrooms", "when-cleaning-damages-surfaces"],
    antiPatternSlugs: [
      "why-dish-soap-fails-on-hard-water-stains",
      "why-degreasers-dont-remove-limescale",
      "why-neutral-cleaners-dont-remove-limescale",
    ],
  },
  {
    slug: "glass-cleaning",
    title: "Glass cleaning",
    summary:
      "A clarity workflow that separates soil removal, residue control, towel discipline, and dry inspection so glass is not repeatedly rewiped into haze.",
    workflowFamily: "glass_clarity",
    intent:
      "Produce clear glass by matching the workflow to fingerprints, film, overspray, or mineral residue instead of assuming one spray solves every haze.",
    bestForProblemSlugs: ["streaking-on-glass", "fingerprints-and-smudges", "mirror-haze", "glass-cloudiness", "water-spots"],
    compatibleSurfaceSlugs: ["glass", "mirrors", "shower-glass", "fixtures"],
    supportingMethodSlugs: ["glass-cleaning", "neutral-surface-cleaning", "hard-water-deposit-removal"],
    requiredToolRoles: [
      {
        role: "clean low-lint towel",
        logic:
          "Glass exposes towel soil, lint, and residue faster than most surfaces, so the towel is part of the chemistry outcome.",
      },
      {
        role: "controlled product delivery",
        logic:
          "Too much cleaner creates the streak problem the workflow is trying to solve.",
      },
      {
        role: "dry finishing face",
        logic:
          "The dry pass removes the last film and proves whether haze is residue, mineral, or damage.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "low-residue glass or neutral cleaner; mineral chemistry only after diagnosis",
      soilFit:
        "Fingerprints and light films need low-residue cleaning, while mineral spots require a separate surface-safe descaling decision.",
      dwellLogic:
        "Routine glass work uses minimal dwell; leaving product wet increases streaks and edge residue.",
      residueRecovery:
        "Dry finishing and towel rotation recover cleaner film before it becomes visible trails.",
    },
    sequenceLogic: [
      {
        phase: "identify film type",
        reason: "Fingerprint oil, cleaner residue, shower film, and mineral spotting look similar on reflective glass but require different responses.",
      },
      {
        phase: "apply minimal low-residue cleaner",
        reason: "Glass clarity improves when product supports towel work instead of flooding the surface.",
        dependsOn: "identify film type",
      },
      {
        phase: "wipe with clean towel faces",
        reason: "A loaded towel transfers film and creates directional streaking.",
        dependsOn: "apply minimal low-residue cleaner",
      },
      {
        phase: "dry finish edges and high-glare zones",
        reason: "Edges hold product and light reveals the residue left by incomplete finishing.",
        dependsOn: "wipe with clean towel faces",
      },
      {
        phase: "route remaining haze to mineral or damage diagnosis",
        reason: "Repeating glass spray cannot fix etching, coating failure, or bonded mineral film.",
        dependsOn: "dry finish edges and high-glare zones",
      },
    ],
    failureAnalysis: [
      {
        signal: "directional streaks",
        likelyCause: "too much product, dirty towel, or no dry finishing pass",
        diagnosticResponse: "Reduce product and change towel faces before switching cleaners.",
      },
      {
        signal: "round spots remain",
        likelyCause: "evaporated minerals rather than routine glass soil",
        diagnosticResponse: "Move to surface-safe mineral diagnosis instead of rewiping.",
      },
      {
        signal: "uniform cloudy haze remains after correct cleaning",
        likelyCause: "coating damage, etching, or bonded film",
        diagnosticResponse: "Stop repeating glass cleaner and inspect for damage or mineral behavior.",
      },
    ],
    escalationLogic: [
      {
        trigger: "coated, tinted, antique, etched, or large high-glare glass is involved",
        reason: "Specialty glass may not tolerate ordinary pads, acids, or restoration assumptions.",
      },
      {
        trigger: "haze remains fixed after residue and mineral checks",
        reason: "The remaining issue may be permanent surface change rather than cleaning failure.",
      },
    ],
    safetyLogic: [
      {
        rule: "Keep abrasive pads and gritty towels away from glass.",
        reason: "Glass can be scratched by contaminated tools even when the cleaner is mild.",
      },
      {
        rule: "Protect adjacent stone, trim, and coatings during mineral escalation.",
        reason: "Glass-safe chemistry may not be safe for the materials framing the glass.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "clean high-touch glass before oil and dust layer",
        reason: "Thin films need less product and fewer passes.",
      },
      {
        cadence: "dry wet glass after repeated water exposure",
        reason: "Water spots become mineral workflow problems when evaporation is allowed to repeat.",
      },
    ],
    relatedGuides: ["cleaning-every-surface", "why-cleaning-fails", "when-cleaning-damages-surfaces"],
    antiPatternSlugs: [
      "why-vinegar-leaves-streaks-on-glass",
      "why-one-direction-wiping-causes-streaks",
      "why-glass-cleaners-dont-fix-haze",
    ],
  },
  {
    slug: "neutral-surface-cleaning",
    title: "Neutral surface cleaning",
    summary:
      "A routine maintenance workflow that removes light soil while preserving finishes through low-residue chemistry, controlled moisture, and clean-tool discipline.",
    workflowFamily: "routine_maintenance",
    intent:
      "Maintain finished surfaces without turning routine cleaning into residue buildup, finish stress, or unnecessary chemical escalation.",
    bestForProblemSlugs: ["general-soil", "dust-buildup", "fingerprints-and-smudges", "surface-haze", "countertop-residue"],
    compatibleSurfaceSlugs: [
      "countertops",
      "quartz-countertops",
      "granite-countertops",
      "laminate",
      "painted-surfaces",
      "sealed-surfaces",
      "hardwood",
    ],
    supportingMethodSlugs: ["neutral-surface-cleaning", "detail-dusting", "glass-cleaning"],
    requiredToolRoles: [
      {
        role: "clean microfiber",
        logic:
          "Microfiber captures light soil and oils when faces are rotated before loading.",
      },
      {
        role: "controlled moisture delivery",
        logic:
          "Routine maintenance should dampen enough to lift soil without flooding seams, coatings, or porous edges.",
      },
      {
        role: "dry finishing pass",
        logic:
          "Dry finishing controls streaks, residue, and moisture exposure on sensitive finishes.",
      },
    ],
    chemicalLogic: {
      chemistryClass: "neutral or low-residue maintenance cleaner",
      soilFit:
        "Neutral cleaning fits light particulate, fingerprints, and routine residue, but not bonded grease, mineral scale, or deep contamination.",
      dwellLogic:
        "Most neutral workflows rely on contact and wiping rather than long dwell; long wet exposure adds risk without much extra cleaning power.",
      residueRecovery:
        "Minimal product and dry finishing keep maintenance cleaner from becoming the next haze or tack layer.",
    },
    sequenceLogic: [
      {
        phase: "read surface and soil load",
        reason: "Neutral cleaning is safest when the issue is routine soil, not heavy grease, mineral scale, or damage.",
      },
      {
        phase: "dry-remove loose particulate when present",
        reason: "Dust and grit interfere with damp wiping and can scratch sensitive finishes.",
        dependsOn: "read surface and soil load",
      },
      {
        phase: "apply minimal neutral cleaner",
        reason: "Product should lubricate and lift light soil, not saturate the surface.",
        dependsOn: "dry-remove loose particulate when present",
      },
      {
        phase: "wipe with clean towel rotation",
        reason: "A loaded towel redistributes soil and creates the false-clean pattern.",
        dependsOn: "apply minimal neutral cleaner",
      },
      {
        phase: "dry finish and inspect",
        reason: "Inspection after drying reveals residue, dullness, or soil that needs a different workflow.",
        dependsOn: "wipe with clean towel rotation",
      },
    ],
    failureAnalysis: [
      {
        signal: "surface streaks or hazes after drying",
        likelyCause: "too much product, dirty towel, or soil beyond neutral maintenance",
        diagnosticResponse: "Reset with less product and clean towel faces before escalating chemistry.",
      },
      {
        signal: "soil remains tacky or oily",
        likelyCause: "grease or residue load exceeds neutral cleaner capability",
        diagnosticResponse: "Route to degreasing or residue recovery instead of repeating neutral spray.",
      },
      {
        signal: "finish dullness does not change",
        likelyCause: "wear, etching, or coating change rather than removable soil",
        diagnosticResponse: "Stop cleaning harder and assess damage versus residue.",
      },
    ],
    escalationLogic: [
      {
        trigger: "soil returns immediately after correct neutral cleaning",
        reason: "The source may be product residue, grease, moisture, or surface wear, not routine soil.",
      },
      {
        trigger: "unknown stone, wood, paint, or coating reacts to moisture",
        reason: "Even mild chemistry can damage sensitive finishes through water exposure or repeated wiping.",
      },
    ],
    safetyLogic: [
      {
        rule: "Use neutral cleaning as the baseline, not as a universal fix.",
        reason: "Safe maintenance becomes failure when the soil needs a different chemistry or method.",
      },
      {
        rule: "Control moisture on seams, wood, stone, and painted finishes.",
        reason: "Routine wet exposure can cause swelling, dulling, or coating stress over time.",
      },
    ],
    cadenceLogic: [
      {
        cadence: "frequent light maintenance before soil bonds",
        reason: "Routine soil removes with lower-risk chemistry when it is not allowed to layer.",
      },
      {
        cadence: "reassess when maintenance starts requiring force",
        reason: "Increasing pressure signals the workflow no longer matches the problem.",
      },
    ],
    relatedGuides: ["cleaning-every-surface", "why-cleaning-fails", "chemical-usage-and-safety"],
    antiPatternSlugs: [
      "why-all-purpose-cleaners-arent-universal",
      "why-cleaning-without-rinsing-fails",
      "why-water-alone-doesnt-clean-grease",
    ],
  },
];

export type AuthorityWorkflowDecisionSlug =
  (typeof AUTHORITY_WORKFLOW_DECISION_PROFILES)[number]["slug"];
