import { AUTHORITY_PROBLEM_SLUGS, type AuthorityProblemSlug } from "@/authority/data/authorityTaxonomy";
import type { AuthorityProblemScienceProfile } from "@/authority/types/authorityProblemScienceTypes";

const profiles = [
  {
    problemSlug: "soap-scum",
    observablePattern: [
      "Gray-white drag, waxy film, or cloudy lower-glass bands in wet areas.",
      "Film clears partly while wet, then dries back to haze or roughness.",
    ],
    rootMechanism:
      "Soap binders, body oils, minerals, and repeated wet-dry cycles form a layered residue that bonds more tightly as it dries.",
    causeDrivers: [
      "Bar soap or high-residue body products",
      "Hard water minerals",
      "Poor rinse and dry-down",
      "Low airflow and high shower frequency",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Soft surface film",
        diagnosticSignal: "Wipes or softens during a short neutral bathroom-cleaner dwell.",
        rootCauseMeaning: "Residue is still mostly on the surface.",
        remediationImplication: "Use non-abrasive dwell, soft agitation, rinse, and dry inspection.",
      },
      {
        severity: "moderate",
        label: "Layered soap-mineral film",
        diagnosticSignal: "Feels grabby or returns cloudy after the first rinse.",
        rootCauseMeaning: "Soap and mineral layers are stacked rather than one fresh soil layer.",
        remediationImplication: "Clean by layer and confirm whether mineral chemistry is surface-safe.",
      },
      {
        severity: "recurring",
        label: "Use-rate recurrence",
        diagnosticSignal: "Returns within a week in the same water path.",
        rootCauseMeaning: "Dry-down and airflow are below the shower use rate.",
        remediationImplication: "Add prevention levers instead of repeating stronger chemistry.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Hard water deposits",
        whyConfusing: "Both can look white or cloudy on glass and tile.",
        distinguishingEvidence: "Soap scum feels slick or waxy; mineral scale feels chalky or gritty.",
      },
      {
        mistakenFor: "Permanent glass etching",
        whyConfusing: "Both can stay cloudy after casual wiping.",
        distinguishingEvidence: "If safe soap or mineral lanes improve clarity, residue is still present.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Wet a small cloudy area and wait for full dry-down.",
        supports: "Film diagnosis when clarity changes while wet and returns dry.",
        reducesConfidenceWhen: "Cloudiness stays fixed through wetting and safe test lanes.",
      },
      {
        check: "Feel for waxy drag versus gritty mineral texture.",
        supports: "Soap-mineral film when the surface drags without sharp mineral grit.",
        reducesConfidenceWhen: "Texture is sharp, crusted, or concentrated at drip edges.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Use short dwell, soft agitation, rinse, and dry inspection.",
        scienceReason: "Dwell loosens the binder; rinse removes softened residue before it redeposits.",
        stopCondition: "Stop if gloss drops, coating changes, or stone/grout reacts.",
      },
      {
        mode: "source_control",
        action: "Reduce standing water and improve dry-down between uses.",
        scienceReason: "The film forms during repeated wet-dry cycles.",
        stopCondition: "Escalate if recurrence is faster than the maintenance interval.",
      },
    ],
    preventionLevers: [
      {
        lever: "Rinse and dry high-splash zones.",
        whyItPreventsRecurrence: "Removes soap and minerals before they dry into a new layer.",
      },
      {
        lever: "Improve airflow after showers.",
        whyItPreventsRecurrence: "Shortens the wet window that lets residue harden.",
      },
    ],
    expertNotes: [
      "Do not let wet clarity count as success; judge the surface after dry-down.",
      "The hard part is deciding whether soap, minerals, or etch is dominant before escalating.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "unknown_material"],
    remediationMode: ["targeted_removal", "source_control"],
  },
  {
    problemSlug: "grease-buildup",
    observablePattern: [
      "Slick, yellow, tacky, or dust-catching film near cooking zones.",
      "Smearing under towels or fingerprints that reappear quickly after wiping.",
    ],
    rootMechanism:
      "Airborne cooking oils condense on cooler surfaces, then oxidize and bind with dust into a persistent lipid film.",
    causeDrivers: [
      "Frequent frying or high-heat cooking",
      "Loaded hood filters or weak ventilation",
      "Warm appliance and cabinet surfaces",
      "Saturated towels that redistribute oil",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Fresh lipid film",
        diagnosticSignal: "Feels slick and lifts with surfactant plus clean towel rotation.",
        rootCauseMeaning: "Oil is recent and not yet polymerized.",
        remediationImplication: "Use surfactant or kitchen-safe degreasing with rinse control.",
      },
      {
        severity: "heavy",
        label: "Polymerized cooking film",
        diagnosticSignal: "Tacky film remains after ordinary wiping and grabs dust fast.",
        rootCauseMeaning: "Heat and time have hardened oils into a stronger binder.",
        remediationImplication: "Use longer controlled dwell and smaller sections, not more pressure first.",
      },
      {
        severity: "recurring",
        label: "Active aerosol source",
        diagnosticSignal: "Film returns after one or two cooking cycles.",
        rootCauseMeaning: "The kitchen is still feeding the visible surfaces.",
        remediationImplication: "Address hood filters, high ledges, and towel loading.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "General soil",
        whyConfusing: "Dust and grease combine into dark grime.",
        distinguishingEvidence: "Grease smears and feels slick; dry soil lifts before wet cleaning.",
      },
      {
        mistakenFor: "Stainless finish damage",
        whyConfusing: "Grease haze can dull reflective metal.",
        distinguishingEvidence: "A safe degreasing test improves reflection without changing the grain.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Wipe a small section with clean surfactant and a fresh towel, then dry.",
        supports: "Grease when the towel loads yellow or slick and the surface loses tack.",
        reducesConfidenceWhen: "Color, sheen, or coating changes during a mild test.",
      },
      {
        check: "Inspect hood filters, cabinet tops, and backsplash grout.",
        supports: "Active recurrence when reservoirs are loaded above visible surfaces.",
        reducesConfidenceWhen: "No nearby cooking aerosol source is present.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Work small sections with label-safe degreasing, towel rotation, rinse, and dry check.",
        scienceReason: "Oil must be emulsified and physically removed, not spread thinner.",
        stopCondition: "Stop if paint softens, laminate swells, stone darkens, or stainless discolors.",
      },
      {
        mode: "source_control",
        action: "Clean reservoirs and improve ventilation capture.",
        scienceReason: "Visible film returns when aerosol sources remain loaded.",
        stopCondition: "Escalate when heavy rental or commercial grease has polymerized.",
      },
    ],
    preventionLevers: [
      {
        lever: "Maintain hood filters and cabinet tops.",
        whyItPreventsRecurrence: "Reduces the aerosol reservoir that reloads clean surfaces.",
      },
      {
        lever: "Rotate towels before they feel slick.",
        whyItPreventsRecurrence: "Prevents dissolved oil from being redeposited.",
      },
    ],
    expertNotes: [
      "Stronger chemistry is not the first correction if the towel is already saturated.",
      "Recurring grease is usually a ventilation and reservoir problem before it is a product problem.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "commercial_or_turnover"],
    remediationMode: ["targeted_removal", "source_control"],
  },
  {
    problemSlug: "hard-water-deposits",
    observablePattern: [
      "White spots, chalky rings, or crust where water repeatedly dries.",
      "Rough mineral texture around fixtures, drains, glass edges, or lower splash paths.",
    ],
    rootMechanism:
      "Evaporating water leaves dissolved minerals behind; repeated drying bonds the minerals into film, scale, or crust.",
    causeDrivers: [
      "Hard source water",
      "Fixture drips or standing droplets",
      "Hot surfaces that accelerate evaporation",
      "Skipped rinse and dry passes",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Fresh spotting",
        diagnosticSignal: "Small spots appear after one drying cycle.",
        rootCauseMeaning: "Minerals are present but not heavily bonded.",
        remediationImplication: "Use surface-safe maintenance and dry-down prevention.",
      },
      {
        severity: "moderate",
        label: "Bonded mineral film",
        diagnosticSignal: "Cloudy film or gritty drag survives glass cleaner.",
        rootCauseMeaning: "Mineral residue is chemically different from ordinary dirt.",
        remediationImplication: "Use compatible mineral chemistry only after surface check.",
      },
      {
        severity: "likely_damage_or_embedded",
        label: "Etch or plating risk",
        diagnosticSignal: "Safe descaling removes roughness but fixed cloudiness remains.",
        rootCauseMeaning: "The deposit may have exposed or caused surface damage.",
        remediationImplication: "Stop repeated acid cycles and assess restoration limits.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Soap scum",
        whyConfusing: "Both appear white in bathrooms.",
        distinguishingEvidence: "Minerals feel chalky or gritty and follow water paths.",
      },
      {
        mistakenFor: "Glass cloudiness",
        whyConfusing: "Mineral haze can make glass look permanently cloudy.",
        distinguishingEvidence: "Mineral chemistry improves texture before permanent etch remains.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Map whether spots match drip, splash, or evaporation geometry.",
        supports: "Hard water when the pattern repeats along water paths.",
        reducesConfidenceWhen: "Marks follow hand contact, dust edges, or product wipe lines.",
      },
      {
        check: "Confirm surface compatibility before any acid-class test.",
        supports: "Mineral diagnosis when compatible chemistry improves roughness.",
        reducesConfidenceWhen: "Stone, unknown coating, or plated finish reacts.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Use surface-compatible mineral removal with short dwell, light agitation, rinse, and dry.",
        scienceReason: "Acid-class chemistry dissolves minerals; rinse prevents redeposition.",
        stopCondition: "Stop if stone dulls, grout whitens, plating pits, or glass stays fixed cloudy.",
      },
      {
        mode: "source_control",
        action: "Fix drips, standing water, and drying paths.",
        scienceReason: "Deposits recur where water repeatedly evaporates in place.",
        stopCondition: "Escalate when return is tied to leaks or incompatible surfaces.",
      },
    ],
    preventionLevers: [
      {
        lever: "Dry fixture bases and lower glass.",
        whyItPreventsRecurrence: "Removes dissolved minerals before evaporation leaves them behind.",
      },
      {
        lever: "Repair persistent drips.",
        whyItPreventsRecurrence: "Cuts off the water path feeding the deposit.",
      },
    ],
    expertNotes: [
      "Name the surface before naming the cleaner.",
      "The same mineral that calls for acid on glass can be a stop sign on stone.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "chemical_damage", "permanent_finish_change"],
    remediationMode: ["targeted_removal", "source_control", "professional_assessment"],
  },
  {
    problemSlug: "dust-buildup",
    observablePattern: [
      "Gray film, lint, edge bands, vent-shaped streaks, or fuzzy corner loading.",
      "Dust returns quickly after wiping or smears when damp-cleaned too early.",
    ],
    rootMechanism:
      "Airborne and contact particles settle by airflow, static, textiles, traffic, and residue that makes surfaces tacky.",
    causeDrivers: [
      "HVAC bypass or active airflow",
      "Textile, pet, or construction particle load",
      "Dry indoor air and static",
      "Cleaner or polish residue acting as a dust binder",
    ],
    severityLadder: [
      {
        severity: "trace",
        label: "Loose particulate",
        diagnosticSignal: "Lifts cleanly with dry microfiber.",
        rootCauseMeaning: "Soil is mostly unbound and surface-level.",
        remediationImplication: "Dry capture before any damp pass.",
      },
      {
        severity: "moderate",
        label: "Bound dust film",
        diagnosticSignal: "Smears gray or feels tacky during wiping.",
        rootCauseMeaning: "Dust is attached to residue, oil, or humidity.",
        remediationImplication: "Remove dry soil first, then reset the binder.",
      },
      {
        severity: "recurring",
        label: "Active reload",
        diagnosticSignal: "Dust returns in hours or vent-shaped patterns.",
        rootCauseMeaning: "Source control is more important than another wipe.",
        remediationImplication: "Investigate airflow, filtration, textiles, pets, and cleaning order.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "General soil",
        whyConfusing: "Dust can darken edges and traffic zones.",
        distinguishingEvidence: "Dry capture removes bulk before moisture creates mud.",
      },
      {
        mistakenFor: "Surface haze",
        whyConfusing: "Fine dust can dull gloss.",
        distinguishingEvidence: "If dry dusting improves clarity, particulate is dominant.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Dry wipe a small area before using liquid.",
        supports: "Dust when visible soil transfers dry and the surface clears.",
        reducesConfidenceWhen: "Tack, oil, or streaking remains after dry capture.",
      },
      {
        check: "Compare vent zones, textile zones, pet routes, and baseboards.",
        supports: "Active source when patterns follow airflow or shedding sources.",
        reducesConfidenceWhen: "Pattern follows cleaner paths or wet residues instead.",
      },
    ],
    remediationLadder: [
      {
        mode: "routine_cleaning",
        action: "Clean top-down with dry capture first, then damp-clean compatible hard surfaces.",
        scienceReason: "Dry capture removes particles before liquid turns them into streaking slurry.",
        stopCondition: "Stop damp work if the surface smears or grabs cloth fibers.",
      },
      {
        mode: "source_control",
        action: "Adjust filtration, vacuum order, textile shedding, and residue cleanup.",
        scienceReason: "Fast-return dust means the source remains active.",
        stopCondition: "Escalate for post-construction dust or suspected HVAC bypass.",
      },
    ],
    preventionLevers: [
      {
        lever: "Vacuum floors and textiles before final surface passes.",
        whyItPreventsRecurrence: "Prevents newly airborne particles from resettling on clean surfaces.",
      },
      {
        lever: "Remove tacky residue from high-dust surfaces.",
        whyItPreventsRecurrence: "Stops normal dust from binding into recurring film.",
      },
    ],
    expertNotes: [
      "Dust science is often source science, not tool preference.",
      "If dust returns in hours, look for airflow, static, or residue before changing dusters.",
    ],
    confidence: "high",
    escalationType: ["commercial_or_turnover"],
    remediationMode: ["routine_cleaning", "source_control"],
  },
  {
    problemSlug: "light-mildew",
    observablePattern: [
      "Thin gray, pink, tan, or black-speckled film in damp corners, caulk lines, or tracks.",
      "Returns in the same wet zones after cosmetic wiping.",
    ],
    rootMechanism:
      "Surface-level biological film establishes where moisture, organic residue, and slow drying create a repeatable habitat.",
    causeDrivers: [
      "Persistent humidity",
      "Weak exhaust or closed-door drying",
      "Soap film or organic residue",
      "Slow drains, wet mats, or failed caulk edges",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Surface biofilm",
        diagnosticSignal: "Limited to surface film in damp use zones.",
        rootCauseMeaning: "Moisture is feeding removable biological residue.",
        remediationImplication: "Clean soil first, use label-correct chemistry, rinse/dry as required.",
      },
      {
        severity: "recurring",
        label: "Moisture-cycle return",
        diagnosticSignal: "Returns within days or in the same corner.",
        rootCauseMeaning: "The surface is not drying below the biological growth window.",
        remediationImplication: "Correct airflow and standing moisture.",
      },
      {
        severity: "likely_damage_or_embedded",
        label: "Stain or deeper growth risk",
        diagnosticSignal: "Darkening survives cleaning or spreads beyond surface joints.",
        rootCauseMeaning: "Pigment, porous material, or hidden moisture may be involved.",
        remediationImplication: "Stop treating it as shallow mildew and reassess.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Soap scum",
        whyConfusing: "Both sit in wet bathroom zones.",
        distinguishingEvidence: "Mildew clusters where moisture lingers; soap scum follows soap and splash paths.",
      },
      {
        mistakenFor: "Mold growth",
        whyConfusing: "Both are biological and can darken surfaces.",
        distinguishingEvidence: "Light mildew is surface-limited; spreading, odor, or porous involvement raises mold concern.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Check whether the area dries fully between uses.",
        supports: "Mildew recurrence when dampness persists for hours.",
        reducesConfidenceWhen: "The area is dry, static, and the mark behaves like pigment or residue.",
      },
      {
        check: "Look for soap film underneath the visible biology.",
        supports: "Biofilm habitat when organic residue is present.",
        reducesConfidenceWhen: "No organic film or moisture path exists.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Remove soil film, apply label-correct bathroom chemistry, respect dwell, rinse/dry.",
        scienceReason: "Biology survives when protected by soap film or moisture.",
        stopCondition: "Stop and escalate if it spreads, smells musty, or involves porous material.",
      },
      {
        mode: "source_control",
        action: "Improve dry-down, exhaust runtime, and standing-water control.",
        scienceReason: "Moisture recurrence rebuilds the biological habitat.",
        stopCondition: "Escalate when return is faster than the corrected drying cycle.",
      },
    ],
    preventionLevers: [
      {
        lever: "Run exhaust and leave surfaces open to dry.",
        whyItPreventsRecurrence: "Shortens the damp window needed for regrowth.",
      },
      {
        lever: "Keep soap film from accumulating in corners.",
        whyItPreventsRecurrence: "Removes the organic food layer that supports biofilm.",
      },
    ],
    expertNotes: [
      "Bleach brightness is not proof that the moisture source is gone.",
      "The diagnostic question is whether the habitat remains, not whether the mark got lighter.",
    ],
    confidence: "high",
    escalationType: ["health_or_biological", "moisture_source"],
    remediationMode: ["targeted_removal", "source_control", "professional_assessment"],
  },
  {
    problemSlug: "mold-growth",
    observablePattern: [
      "Visible growth, expanding spots, musty odor, or staining tied to damp material.",
      "Return after rain, plumbing use, shower use, HVAC cycles, or condensation.",
    ],
    rootMechanism:
      "Fungal growth develops where moisture persists long enough on organic soil, porous material, or hidden damp assemblies.",
    causeDrivers: [
      "Leaks, condensation, or hidden moisture",
      "Porous or contaminated material",
      "Poor ventilation or HVAC moisture movement",
      "Repeated cosmetic cleaning without source correction",
    ],
    severityLadder: [
      {
        severity: "moderate",
        label: "Small surface-limited growth",
        diagnosticSignal: "Localized visible growth on cleanable nonporous material.",
        rootCauseMeaning: "Moisture and soil are present but may be surface limited.",
        remediationImplication: "Use containment-aware, label-correct cleaning and dry the source.",
      },
      {
        severity: "recurring",
        label: "Active source return",
        diagnosticSignal: "Returns after drying claims or use cycles.",
        rootCauseMeaning: "Moisture source is unresolved.",
        remediationImplication: "Shift from cleaning to source diagnosis.",
      },
      {
        severity: "likely_damage_or_embedded",
        label: "Porous or hidden involvement",
        diagnosticSignal: "Growth spreads, smells musty, or appears with soft/bubbling material.",
        rootCauseMeaning: "Contamination may extend beyond the visible surface.",
        remediationImplication: "Professional assessment is the safer remediation mode.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Light mildew",
        whyConfusing: "Both show dark biological marks in wet areas.",
        distinguishingEvidence: "Growth that spreads, smells, or involves porous material exceeds light surface mildew.",
      },
      {
        mistakenFor: "Historic staining",
        whyConfusing: "Old staining can remain after growth is inactive.",
        distinguishingEvidence: "Active mold correlates with moisture, odor, spread, or soft material.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Document size, moisture clues, odor, softness, and spread before disturbing.",
        supports: "Active growth when visual evidence aligns with moisture or material change.",
        reducesConfidenceWhen: "The area is dry, stable, odorless, and unchanged over time.",
      },
      {
        check: "Compare return timing to rain, plumbing, HVAC, or shower cycles.",
        supports: "Moisture-source diagnosis when recurrence tracks a use or weather event.",
        reducesConfidenceWhen: "Return is random and behaves like removable surface film.",
      },
    ],
    remediationLadder: [
      {
        mode: "professional_assessment",
        action: "Escalate when moisture source, porous material, spread, or occupant sensitivity is unclear.",
        scienceReason: "Cleaning visible growth without source correction leaves the biological system active.",
        stopCondition: "Do not continue cosmetic cleaning when growth expands or materials are compromised.",
      },
      {
        mode: "source_control",
        action: "Correct moisture, ventilation, and contaminated material conditions.",
        scienceReason: "Growth requires a sustained damp habitat.",
        stopCondition: "Escalate if source correction cannot be verified.",
      },
    ],
    preventionLevers: [
      {
        lever: "Eliminate leaks and condensation.",
        whyItPreventsRecurrence: "Removes the moisture requirement for growth.",
      },
      {
        lever: "Dry and monitor previously affected areas.",
        whyItPreventsRecurrence: "Confirms source control before cosmetic finish work.",
      },
    ],
    expertNotes: [
      "Repeated cleaning is the wrong loop when moisture remains active.",
      "The first expert move is documentation and source mapping, not stronger wiping.",
    ],
    confidence: "high",
    escalationType: ["health_or_biological", "moisture_source", "unknown_material"],
    remediationMode: ["source_control", "professional_assessment"],
  },
  {
    problemSlug: "surface-haze",
    observablePattern: [
      "Cloudy, matte, rainbow, or uneven film under angled light.",
      "Surface looks clearer while wet but dries back to haze.",
    ],
    rootMechanism:
      "Haze comes from thin residue layers, mineral film, soil binders, micro-scratching, etch, or altered finish reflectivity.",
    causeDrivers: [
      "Product stacking or overuse",
      "Hard water drying",
      "Loaded towels or dirty rinse water",
      "Acid, abrasive, polish, or coating history",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Removable film haze",
        diagnosticSignal: "Improves after neutral reset and full dry-down.",
        rootCauseMeaning: "Residue is changing light reflection.",
        remediationImplication: "Remove film before adding shine or stronger chemistry.",
      },
      {
        severity: "recurring",
        label: "Product or mineral loop",
        diagnosticSignal: "Returns at dry-down or after repeated cleanings.",
        rootCauseMeaning: "Maintenance is re-creating the haze layer.",
        remediationImplication: "Fix dilution, rinse, towel loading, or water path.",
      },
      {
        severity: "likely_damage_or_embedded",
        label: "Fixed finish haze",
        diagnosticSignal: "Safe test lanes do not change the dull field.",
        rootCauseMeaning: "Finish may be etched, scratched, or coating-damaged.",
        remediationImplication: "Stop cleaning escalation and assess restoration limits.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Dust buildup",
        whyConfusing: "Fine dust can dull gloss.",
        distinguishingEvidence: "Dry capture removes dust; film haze returns after wet dry-down.",
      },
      {
        mistakenFor: "Hard water deposits",
        whyConfusing: "Mineral film can look like general haze.",
        distinguishingEvidence: "Minerals follow water paths and may feel gritty.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Inspect after complete dry-down under angled light.",
        supports: "Haze diagnosis when wet shine hides the defect.",
        reducesConfidenceWhen: "The issue disappears with dry dust capture alone.",
      },
      {
        check: "Run a small neutral reset before acid, polish, or abrasion.",
        supports: "Residue haze when neutral reset improves clarity.",
        reducesConfidenceWhen: "No safe lane changes the fixed matte field.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Reset residue with low-residue cleaning, clean pickup, rinse where appropriate, and dry inspection.",
        scienceReason: "Thin films alter reflectivity even when the surface is not dirty-looking.",
        stopCondition: "Stop if haze expands or sheen changes after a safe test.",
      },
      {
        mode: "restoration_or_replacement",
        action: "Treat fixed haze as possible finish damage after safe lanes fail.",
        scienceReason: "Etch, abrasion, or coating failure is not solved by more cleaning.",
        stopCondition: "Escalate on stone, coated glass, or high-value finishes.",
      },
    ],
    preventionLevers: [
      {
        lever: "Reduce product load and improve pickup.",
        whyItPreventsRecurrence: "Prevents solids from drying into a new optical film.",
      },
      {
        lever: "Use dry inspection as the success check.",
        whyItPreventsRecurrence: "Catches false-clean haze before repeat product stacking.",
      },
    ],
    expertNotes: [
      "Haze is an optical symptom with multiple causes; the ladder prevents jumping straight to acid.",
      "Wet shine is the most common false-positive success signal.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "chemical_damage", "permanent_finish_change"],
    remediationMode: ["targeted_removal", "restoration_or_replacement", "professional_assessment"],
  },
  {
    problemSlug: "product-residue-buildup",
    observablePattern: [
      "Tacky feel, streaking, footprints, dull lanes, or dust attraction after cleaning.",
      "Surface looks acceptable while damp but fails after dry-down.",
    ],
    rootMechanism:
      "Cleaner solids, polish, fragrance, soap, disinfectant, or dirty water dry into a film that binds soil and changes surface feel.",
    causeDrivers: [
      "Over-concentrated products",
      "Skipped rinse or dry pickup",
      "Loaded mop water, pads, or towels",
      "Layering incompatible products",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Fresh leftover product",
        diagnosticSignal: "Tack, streaks, or film appears immediately after dry-down.",
        rootCauseMeaning: "The cleaning event left solids behind.",
        remediationImplication: "Reset with lower load, clean pickup, and dry inspection.",
      },
      {
        severity: "moderate",
        label: "Layered residue cycle",
        diagnosticSignal: "Footprints, dust attraction, or dulling recur after repeated cleaning.",
        rootCauseMeaning: "Old product is acting as a soil binder.",
        remediationImplication: "Remove the old film before adding any new product.",
      },
      {
        severity: "heavy",
        label: "Finish or stripping decision",
        diagnosticSignal: "Large floor or finish area remains dull, sticky, or uneven after reset.",
        rootCauseMeaning: "Residue may be mixed with finish wear or coating layers.",
        remediationImplication: "Escalate to finish-safe restoration planning.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Dirty surface",
        whyConfusing: "Residue attracts new soil and makes the area look dirty again.",
        distinguishingEvidence: "The failure appears after cleaning, especially after dry-down.",
      },
      {
        mistakenFor: "Surface dullness",
        whyConfusing: "Product film can mute reflectivity.",
        distinguishingEvidence: "A residue reset improves sheen without polish.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Ask what was used before adding chemistry.",
        supports: "Residue diagnosis when multiple sprays, concentrates, or polish layers were used.",
        reducesConfidenceWhen: "No product history exists and pattern follows wear or damage.",
      },
      {
        check: "Rinse/reset a small area and compare after dry-down.",
        supports: "Residue when tack or dullness improves after pickup.",
        reducesConfidenceWhen: "Finish stays changed after residue is removed.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Reduce product load, use clean water or neutral reset, change pads/towels, and dry inspect.",
        scienceReason: "The failure is leftover solids and suspended soil, not lack of product.",
        stopCondition: "Stop if sheen, color, or coating softens during reset.",
      },
      {
        mode: "source_control",
        action: "Correct dilution, water changes, pad loading, and product layering.",
        scienceReason: "Residue returns when the maintenance process keeps depositing solids.",
        stopCondition: "Escalate if residue is mixed with finish-restoration decisions.",
      },
    ],
    preventionLevers: [
      {
        lever: "Use correct dilution and fresh pickup materials.",
        whyItPreventsRecurrence: "Limits solids left behind after cleaning.",
      },
      {
        lever: "Avoid layering shine, scent, disinfectant, and cleaner as shortcuts.",
        whyItPreventsRecurrence: "Prevents incompatible films from stacking.",
      },
    ],
    expertNotes: [
      "The fix is often less product, not stronger product.",
      "Residue science explains why a surface can look cleaner while wet and worse when dry.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "chemical_damage", "commercial_or_turnover"],
    remediationMode: ["targeted_removal", "source_control", "restoration_or_replacement"],
  },
  {
    problemSlug: "odor-retention",
    observablePattern: [
      "Smell returns after the surface looks clean.",
      "Odor increases with humidity, heat, use cycles, drains, pets, bins, or textiles.",
    ],
    rootMechanism:
      "Odor-causing compounds remain in organic film, porous material, moisture zones, drains, soft goods, or repeat contamination paths.",
    causeDrivers: [
      "Organic residue below visible soil",
      "Moisture and humidity release",
      "Porous absorption",
      "Pet, drain, trash, laundry, or restroom source cycles",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Surface odor film",
        diagnosticSignal: "Improves after source cleaning without fragrance masking.",
        rootCauseMeaning: "Odor is held in removable organic film.",
        remediationImplication: "Clean source material, rinse/pick up, and dry.",
      },
      {
        severity: "recurring",
        label: "Humidity or use-triggered return",
        diagnosticSignal: "Smell returns with humidity, heat, HVAC, or fixture use.",
        rootCauseMeaning: "The odor reservoir is still active.",
        remediationImplication: "Map timing to source rather than adding scent.",
      },
      {
        severity: "likely_damage_or_embedded",
        label: "Absorbed or hidden source",
        diagnosticSignal: "Odor persists in porous material or repeat pet zones.",
        rootCauseMeaning: "Contamination may be below the cleanable surface.",
        remediationImplication: "Escalate beyond routine cleaning.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Poor fragrance strength",
        whyConfusing: "Fragrance can temporarily hide odor.",
        distinguishingEvidence: "True source cleaning reduces return without scent cover.",
      },
      {
        mistakenFor: "General soil",
        whyConfusing: "Dirty-looking zones can smell.",
        distinguishingEvidence: "Odor timing often points to drains, humidity, pets, or porous absorption.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Map when the odor returns: humidity, overnight, HVAC, use, or pet revisit.",
        supports: "Source diagnosis when timing repeats.",
        reducesConfidenceWhen: "Odor disappears after a single source removal and dry-out.",
      },
      {
        check: "Separate visible cleanliness from smell after drying.",
        supports: "Retention when clean-looking surfaces still smell.",
        reducesConfidenceWhen: "Smell was only from loose trash or fresh surface soil.",
      },
    ],
    remediationLadder: [
      {
        mode: "source_control",
        action: "Find and remove the odor source, then dry the area rather than masking it.",
        scienceReason: "Odor returns when volatile compounds remain in a reservoir.",
        stopCondition: "Escalate if odor tracks porous material, moisture, or HVAC paths.",
      },
      {
        mode: "professional_assessment",
        action: "Assess pet contamination, drains, damp cavities, or commercial restroom recurrence.",
        scienceReason: "Hidden or absorbed odor cannot be solved by surface fragrance.",
        stopCondition: "Stop repeating fragrance when odor returns faster after each use.",
      },
    ],
    preventionLevers: [
      {
        lever: "Control humidity and dry contaminated zones.",
        whyItPreventsRecurrence: "Moisture releases odor and supports biological films.",
      },
      {
        lever: "Remove organic reservoirs before deodorizing.",
        whyItPreventsRecurrence: "Eliminates the source instead of covering the signal.",
      },
    ],
    expertNotes: [
      "Odor science is timing science; the return pattern usually tells you the source.",
      "Fragrance can make the diagnosis worse by hiding source evidence.",
    ],
    confidence: "medium",
    escalationType: ["moisture_source", "commercial_or_turnover", "unknown_material"],
    remediationMode: ["source_control", "professional_assessment"],
  },
  {
    problemSlug: "cloudy-glass",
    observablePattern: [
      "Milky, foggy, hazy, or uneven glass clarity.",
      "Glass clears while wet but clouds again after drying, or does not change at all.",
    ],
    rootMechanism:
      "Cloudiness can come from soap film, mineral film, product residue, coating failure, micro-scratching, or etching.",
    causeDrivers: [
      "Hard water and shower spray",
      "Soap and conditioner film",
      "Product residue or poor rinse",
      "Prior acid, abrasive, or coating misuse",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Removable glass film",
        diagnosticSignal: "Clarity improves after residue, soap, or mineral lane.",
        rootCauseMeaning: "Cloudiness is mostly on top of the glass.",
        remediationImplication: "Use the matching lane and dry-inspect before escalating.",
      },
      {
        severity: "moderate",
        label: "Mixed soap-mineral haze",
        diagnosticSignal: "One lane improves texture but not full clarity.",
        rootCauseMeaning: "Multiple residue systems are layered.",
        remediationImplication: "Sequence lanes safely instead of repeating one chemistry.",
      },
      {
        severity: "likely_damage_or_embedded",
        label: "Etch or coating failure",
        diagnosticSignal: "Safe lanes fail and cloudiness stays fixed.",
        rootCauseMeaning: "The glass or coating may be permanently altered.",
        remediationImplication: "Stop abrasive or acid escalation.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Hard water deposits",
        whyConfusing: "Mineral film is a common source of cloudiness.",
        distinguishingEvidence: "If mineral texture improves but milkiness remains, damage or soap film may remain.",
      },
      {
        mistakenFor: "Streaking on glass",
        whyConfusing: "Both reduce clarity after drying.",
        distinguishingEvidence: "Streaking follows wipe direction; cloudy glass often has broad fields or water-path zones.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Run small residue, soap, and mineral lanes only where surface rules allow.",
        supports: "Layered film when one or more lanes improve clarity.",
        reducesConfidenceWhen: "No safe lane changes the cloudy field.",
      },
      {
        check: "Wait for full dry-down before judging success.",
        supports: "Film or etch diagnosis when wet clarity is misleading.",
        reducesConfidenceWhen: "Glass remains clear after dry-down.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Sequence safe residue, soap, and mineral tests before stronger escalation.",
        scienceReason: "Cloudy glass has multiple lookalike causes with different chemistry.",
        stopCondition: "Stop when safe lanes fail or coating damage is suspected.",
      },
      {
        mode: "restoration_or_replacement",
        action: "Treat fixed cloudiness as restoration or replacement territory.",
        scienceReason: "Etched or coating-damaged glass is not removable soil.",
        stopCondition: "Escalate for coated shower glass or rental turnover glass with unknown history.",
      },
    ],
    preventionLevers: [
      {
        lever: "Dry glass after wet use.",
        whyItPreventsRecurrence: "Reduces mineral and soap film drying.",
      },
      {
        lever: "Avoid routine acids and abrasives on coated glass.",
        whyItPreventsRecurrence: "Prevents the cleaning process from becoming the damage source.",
      },
    ],
    expertNotes: [
      "Cloudy glass is a misidentification trap: film, mineral, and etch can look nearly identical.",
      "The expert move is controlled test lanes, not repeated all-over scrubbing.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "chemical_damage", "permanent_finish_change"],
    remediationMode: ["targeted_removal", "restoration_or_replacement", "professional_assessment"],
  },
  {
    problemSlug: "mineral-film",
    observablePattern: [
      "Faint cloudy sheen, light spotting, or drag before thick scale forms.",
      "Same-shape haze returns along splash, drip, or evaporation paths.",
    ],
    rootMechanism:
      "Low-level dissolved minerals dry into a thin film before progressing into heavier hard-water deposits or limescale.",
    causeDrivers: [
      "Hard water",
      "Standing droplets and slow dry-down",
      "Heat and airflow that dry water in place",
      "Skipped rinse after mineral removal",
    ],
    severityLadder: [
      {
        severity: "trace",
        label: "Early mineral sheen",
        diagnosticSignal: "Faint haze follows splash paths and returns after drying.",
        rootCauseMeaning: "Mineral residue is beginning to accumulate.",
        remediationImplication: "Use maintenance and dry-down before scale forms.",
      },
      {
        severity: "moderate",
        label: "Bonding mineral film",
        diagnosticSignal: "Glass cleaner does not remove drag or haze.",
        rootCauseMeaning: "Minerals are bonding beyond ordinary residue.",
        remediationImplication: "Escalate only with compatible mineral chemistry.",
      },
      {
        severity: "recurring",
        label: "Active water-path film",
        diagnosticSignal: "Film returns in the same arc, ring, or lower-glass zone.",
        rootCauseMeaning: "Water source and evaporation pattern remain active.",
        remediationImplication: "Prevent recurrence by changing water behavior.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Surface haze",
        whyConfusing: "Early mineral film is optically subtle.",
        distinguishingEvidence: "Mineral film follows water geometry and may create fine drag.",
      },
      {
        mistakenFor: "Light-film buildup",
        whyConfusing: "Both are thin films.",
        distinguishingEvidence: "Mineral film is tied to evaporation paths and hard-water areas.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Look for drip trails, spray arcs, faucet rings, and lower-glass haze.",
        supports: "Mineral film when shape matches water movement.",
        reducesConfidenceWhen: "Film follows product application or hand-contact zones.",
      },
      {
        check: "Test whether neutral or glass maintenance fails before mineral chemistry.",
        supports: "Mineral behavior when ordinary residue removal does not resolve drag.",
        reducesConfidenceWhen: "Neutral reset clears the film completely.",
      },
    ],
    remediationLadder: [
      {
        mode: "routine_cleaning",
        action: "Use light maintenance and dry-down while the film is early.",
        scienceReason: "Early mineral film is easier to prevent than dissolve after bonding.",
        stopCondition: "Escalate carefully if drag or haze survives maintenance.",
      },
      {
        mode: "targeted_removal",
        action: "Use surface-safe mineral chemistry only when compatibility is clear.",
        scienceReason: "Mineral film requires dissolution, but acid risk is surface-specific.",
        stopCondition: "Stop if nearby stone, grout, plating, or coating reacts.",
      },
    ],
    preventionLevers: [
      {
        lever: "Dry repeated splash paths.",
        whyItPreventsRecurrence: "Removes mineral-bearing water before it evaporates.",
      },
      {
        lever: "Address leaks and standing water.",
        whyItPreventsRecurrence: "Reduces the repeated mineral supply.",
      },
    ],
    expertNotes: [
      "Mineral film is the early warning state before users call it scale.",
      "Prevention matters more here because repeated acid maintenance creates its own risk.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "chemical_damage"],
    remediationMode: ["routine_cleaning", "targeted_removal", "source_control"],
  },
  {
    problemSlug: "bathroom-buildup",
    observablePattern: [
      "Mixed soap film, mineral spotting, slick biofilm, musty odor, dull grout, or cloudy glass.",
      "Different layers return at different speeds after a bathroom reset.",
    ],
    rootMechanism:
      "Bathrooms stack water minerals, soap, body oils, humidity, organic residue, and poor dry-down into overlapping residue systems.",
    causeDrivers: [
      "Hard water and frequent wet use",
      "Soap and conditioner residue",
      "Weak exhaust or closed-room humidity",
      "Short turnover cleans that miss edges, tracks, and dry-down",
    ],
    severityLadder: [
      {
        severity: "light",
        label: "Single-layer wet-room film",
        diagnosticSignal: "One dominant layer, such as soap drag or light mineral spotting.",
        rootCauseMeaning: "The buildup is still diagnosable as a primary layer.",
        remediationImplication: "Treat the dominant layer and verify dry result.",
      },
      {
        severity: "heavy",
        label: "Layered bathroom stack",
        diagnosticSignal: "Soap, mineral, biofilm, and odor evidence appear together.",
        rootCauseMeaning: "The room has outpaced its maintenance interval.",
        remediationImplication: "Sequence by layer instead of using one all-purpose answer.",
      },
      {
        severity: "recurring",
        label: "Wet-room system recurrence",
        diagnosticSignal: "Same paths, corners, tracks, or glass zones reload quickly.",
        rootCauseMeaning: "Water, airflow, and use rate keep rebuilding the stack.",
        remediationImplication: "Reset maintenance interval and prevention levers.",
      },
    ],
    misidentificationTraps: [
      {
        mistakenFor: "Soap scum only",
        whyConfusing: "Soap film is often the most visible layer.",
        distinguishingEvidence: "Chalky scale, slick corners, odor, or fixed haze indicate additional layers.",
      },
      {
        mistakenFor: "Mold growth only",
        whyConfusing: "Dark wet-room marks attract biological concern.",
        distinguishingEvidence: "Layered buildup includes soap and mineral causes that must be removed before biology is judged.",
      },
    ],
    diagnosticChecks: [
      {
        check: "Identify the dominant layer: soap drag, chalky mineral, slick biofilm, odor, or fixed dullness.",
        supports: "Bathroom buildup when multiple layers coexist.",
        reducesConfidenceWhen: "Only one isolated problem is present.",
      },
      {
        check: "Check corners, tracks, grout, lower glass, fixture bases, and airflow.",
        supports: "System recurrence when edge zones are loaded despite open surfaces looking clean.",
        reducesConfidenceWhen: "Edges are clean and recurrence is limited to a single spill or event.",
      },
    ],
    remediationLadder: [
      {
        mode: "targeted_removal",
        action: "Sequence removal by layer: soap or organic film, mineral where compatible, then biology/odor controls.",
        scienceReason: "One cleaner cannot safely solve every bathroom layer or surface risk.",
        stopCondition: "Stop if stone, grout, coated glass, caulk, or finish reacts.",
      },
      {
        mode: "source_control",
        action: "Adjust ventilation, dry-down, water control, and maintenance frequency.",
        scienceReason: "Bathroom buildup returns when wet-room load exceeds the reset cycle.",
        stopCondition: "Escalate for commercial, hospitality, stone, or recurring odor/growth cases.",
      },
    ],
    preventionLevers: [
      {
        lever: "Detail edges, tracks, and lower splash zones.",
        whyItPreventsRecurrence: "These zones store the layers that reload broad surfaces.",
      },
      {
        lever: "Match maintenance interval to shower use and dry-down.",
        whyItPreventsRecurrence: "Prevents the buildup cycle from outrunning routine cleaning.",
      },
    ],
    expertNotes: [
      "Bathroom buildup is a system problem, not a single stain category.",
      "The expertise is sequencing layers without damaging the surfaces that share the room.",
    ],
    confidence: "high",
    escalationType: ["surface_risk", "moisture_source", "commercial_or_turnover"],
    remediationMode: ["targeted_removal", "source_control", "professional_assessment"],
  },
] satisfies AuthorityProblemScienceProfile[];

export const AUTHORITY_PROBLEM_SCIENCE_PROFILES: AuthorityProblemScienceProfile[] = profiles.map(
  (profile) => ({ ...profile }),
);

export const AUTHORITY_PROBLEM_SCIENCE_PROFILE_SLUGS: AuthorityProblemSlug[] =
  AUTHORITY_PROBLEM_SCIENCE_PROFILES.map((profile) => profile.problemSlug);

function validateAuthorityProblemScienceProfiles(): void {
  const knownProblemSlugs = new Set<string>(AUTHORITY_PROBLEM_SLUGS);
  const seen = new Set<string>();

  for (const profile of AUTHORITY_PROBLEM_SCIENCE_PROFILES) {
    if (!knownProblemSlugs.has(profile.problemSlug)) {
      throw new Error(`Unknown problem science slug: ${profile.problemSlug}`);
    }
    if (seen.has(profile.problemSlug)) {
      throw new Error(`Duplicate problem science slug: ${profile.problemSlug}`);
    }
    seen.add(profile.problemSlug);

    if (profile.severityLadder.length < 3) {
      throw new Error(`Problem science profile requires at least three severity steps: ${profile.problemSlug}`);
    }
    if (profile.misidentificationTraps.length < 2) {
      throw new Error(`Problem science profile requires at least two misidentification traps: ${profile.problemSlug}`);
    }
    if (profile.diagnosticChecks.length < 2) {
      throw new Error(`Problem science profile requires at least two diagnostic checks: ${profile.problemSlug}`);
    }
    if (profile.remediationLadder.length < 2) {
      throw new Error(`Problem science profile requires at least two remediation steps: ${profile.problemSlug}`);
    }
    if (profile.preventionLevers.length < 2) {
      throw new Error(`Problem science profile requires at least two prevention levers: ${profile.problemSlug}`);
    }
  }
}

validateAuthorityProblemScienceProfiles();
