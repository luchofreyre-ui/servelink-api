import type { VisualDiagnosticProfile } from "./visualAuthorityTypes";

function plannedProfile(
  profile: Omit<VisualDiagnosticProfile, "assetStatus" | "source" | "src">,
): VisualDiagnosticProfile {
  return {
    ...profile,
    assetStatus: "planned",
    source: "not-yet-generated",
    src: null,
  };
}

export const VISUAL_DIAGNOSTIC_PROFILES: readonly VisualDiagnosticProfile[] = [
  plannedProfile({
    slug: "soap-scum",
    title: "Soap Scum Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "workflow"],
    assetId: "VDA-PROBLEM-SOAP-SCUM-001",
    alt: "Planned diagnostic visual showing soap scum as a removable cloudy film on shower glass.",
    diagnosticClaim:
      "Soap scum should read as a bonded, cloudy surfactant-and-body-oil film that softens with the right chemistry, not as permanent glass damage.",
    visibleMarkers: [
      "Cloudy white veil strongest near lower splash zones",
      "Patchy buildup around door edges and hardware",
      "Dull film that changes under wetting or test cleaning",
    ],
    expertRead:
      "Read the film location and response to moisture before choosing acid, alkaline, or abrasive escalation.",
    severityBand: "moderate",
    progressionStage: "established",
    misidentifiedAs: ["hard-water-stains", "haze-vs-etching"],
    distinguishFrom: [
      "Hard-water deposits show sharper mineral spotting and ring patterns",
      "Etching remains visible after soil is removed and dry-down completes",
    ],
    wrongActionRisk:
      "Users may scrub with abrasive powders and create real haze while trying to remove a chemistry-solvable film.",
    workflowStage: ["inspect", "identify", "pretest", "treat", "rinse", "dry", "verify"],
    nextAction:
      "Confirm film response on a small section before increasing dwell or agitation.",
    stopCondition:
      "Stop if clearing stalls after soil removal and the remaining haze tracks glass damage rather than removable film.",
    approvalNotes:
      "Must show diagnostic film behavior, not a generic clean shower or exaggerated grime scene.",
  }),
  plannedProfile({
    slug: "hard-water-stains",
    title: "Hard Water Stain Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-PROBLEM-HARD-WATER-001",
    alt: "Planned diagnostic visual showing mineral spotting and limescale edges on glass or fixtures.",
    diagnosticClaim:
      "Hard-water staining should show mineral deposition patterns that require mineral-aware chemistry and surface-risk control.",
    visibleMarkers: [
      "White or gray mineral spots with defined edges",
      "Deposits concentrated where water dries repeatedly",
      "Raised or crusted scale at fixture bases and seams",
    ],
    expertRead:
      "Separate mineral scale from soap film by edge definition, location, and controlled acid response.",
    severityBand: "severe",
    progressionStage: "recurring",
    misidentifiedAs: ["soap-scum", "surface-haze"],
    distinguishFrom: [
      "Soap scum appears more smeared and surfactant-like",
      "General haze lacks distinct droplet or evaporation outlines",
    ],
    wrongActionRisk:
      "Users may apply broad abrasive force instead of controlled mineral chemistry, damaging coatings and adjacent stone.",
    workflowStage: ["inspect", "identify", "pretest", "treat", "rinse", "dry", "verify"],
    nextAction:
      "Pretest compatible mineral remover away from stone, unsealed grout, and sensitive metal finishes.",
    stopCondition:
      "Stop if mineral removal exposes etched glass, pitted metal, or coating failure.",
    approvalNotes:
      "Needs visible mineral logic: droplet maps, scale ridges, and surface compatibility cues.",
  }),
  plannedProfile({
    slug: "surface-haze",
    title: "Surface Haze Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-PROBLEM-SURFACE-HAZE-001",
    alt: "Planned diagnostic visual showing broad dull surface haze under raking light.",
    diagnosticClaim:
      "Surface haze should show loss of uniform reflectivity and help distinguish residue, mineral film, and finish damage.",
    visibleMarkers: [
      "Broad dull veil across the surface field",
      "Reflection breaks visible under angled light",
      "Edges or wipe paths that reveal cleaning history",
    ],
    expertRead:
      "Use light angle, texture, and test-clean response to decide whether haze is removable residue or surface alteration.",
    severityBand: "moderate",
    progressionStage: "established",
    misidentifiedAs: ["haze-vs-etching", "product-residue"],
    distinguishFrom: [
      "Residue often follows wipe direction or product spread",
      "Etching remains after full cleaning and shows structural dulling",
    ],
    wrongActionRisk:
      "Users may keep applying stronger chemistry to permanent or finish-level haze.",
    workflowStage: ["inspect", "pretest", "treat", "dry", "verify", "stop"],
    nextAction:
      "Use a small test area and dry-down check before deciding whether cleaning can continue.",
    stopCondition:
      "Stop when haze remains unchanged after appropriate residue and mineral tests.",
    approvalNotes:
      "Must include angled-light readability and a reason to change workflow, not just a dull surface.",
  }),
  plannedProfile({
    slug: "streaking",
    title: "Streaking Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-PROBLEM-STREAKING-001",
    alt: "Planned diagnostic visual showing directional streaking after cleaning.",
    diagnosticClaim:
      "Streaking should show directional drying, product load, or tool-pattern evidence that changes rinse and dry technique.",
    visibleMarkers: [
      "Linear marks aligned with wiping path",
      "Uneven shine after dry-down",
      "Streaks strongest where product or moisture was over-applied",
    ],
    expertRead:
      "Read streak direction to separate technique failure from product residue or surface damage.",
    severityBand: "mild",
    progressionStage: "early",
    misidentifiedAs: ["streaking-vs-residue", "surface-haze"],
    distinguishFrom: [
      "Residue feels tackier or reactivates when dampened",
      "Haze is broader and less directionally tied to the last pass",
    ],
    wrongActionRisk:
      "Users may add more cleaner when the fix is less product, better rinse control, and full dry-down.",
    workflowStage: ["inspect", "identify", "rinse", "dry", "verify"],
    nextAction:
      "Reduce product load, rinse if needed, and finish with a clean dry pass.",
    stopCondition:
      "Stop escalating chemistry if streaking disappears with technique correction.",
    approvalNotes:
      "Must make wipe path and dry-down behavior legible.",
  }),
  plannedProfile({
    slug: "grease-buildup",
    title: "Grease Buildup Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "workflow"],
    assetId: "VDA-PROBLEM-GREASE-BUILDUP-001",
    alt: "Planned diagnostic visual showing tacky grease buildup near a kitchen cooking zone.",
    diagnosticClaim:
      "Grease buildup should read as a tacky organic film that concentrates near cooking zones and needs degreasing discipline.",
    visibleMarkers: [
      "Amber or gray film near cooktop-adjacent surfaces",
      "Dust adhered into oily residue",
      "Smear trails that widen when wiped dry",
    ],
    expertRead:
      "Confirm organic load and substrate sensitivity before selecting alkaline strength and dwell time.",
    severityBand: "moderate",
    progressionStage: "established",
    misidentifiedAs: ["product-residue", "surface-haze"],
    distinguishFrom: [
      "Product residue usually maps to recent cleaning paths",
      "Mineral haze does not smear with the same oily drag",
    ],
    wrongActionRisk:
      "Users may spread grease with light cleaner or overuse abrasive pads on delicate finishes.",
    workflowStage: ["inspect", "pretest", "treat", "dwell", "agitate", "rinse", "dry"],
    nextAction:
      "Use controlled degreaser dwell and remove released soil rather than polishing it around.",
    stopCondition:
      "Stop if finish softening, color lift, or coating dulling appears during dwell.",
    approvalNotes:
      "Should show grease as a material condition, not just a dirty kitchen mood image.",
  }),
  plannedProfile({
    slug: "product-residue",
    title: "Product Residue Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-PROBLEM-PRODUCT-RESIDUE-001",
    alt: "Planned diagnostic visual showing cleaning product residue as a tacky or cloudy film.",
    diagnosticClaim:
      "Product residue should reveal over-application, incomplete rinse, or incompatible product layering.",
    visibleMarkers: [
      "Tacky drag or dull film after cleaning",
      "Overlap marks where product dried unevenly",
      "Clouding that follows application pattern",
    ],
    expertRead:
      "Interpret residue as a process failure before assuming the surface itself is damaged.",
    severityBand: "moderate",
    progressionStage: "recurring",
    misidentifiedAs: ["surface-haze", "streaking-vs-residue"],
    distinguishFrom: [
      "Streaking is usually linear and corrected by dry technique",
      "Etching remains after residue is fully removed",
    ],
    wrongActionRisk:
      "Users may layer more product over old residue and make the surface harder to recover.",
    workflowStage: ["inspect", "identify", "rinse", "dry", "verify"],
    nextAction:
      "Strip or rinse residue in a controlled area, then reset maintenance product dose.",
    stopCondition:
      "Stop if a clean, residue-free test patch still shows structural haze or finish damage.",
    approvalNotes:
      "Must show process evidence: overlap, drag, or film behavior.",
  }),
  plannedProfile({
    slug: "mold-mildew",
    title: "Mold and Mildew Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-PROBLEM-MOLD-MILDEW-001",
    alt: "Planned diagnostic visual showing mildew spotting in a moisture-prone bathroom area.",
    diagnosticClaim:
      "Mold and mildew visuals must distinguish active biological growth from staining, soil, or shadowing.",
    visibleMarkers: [
      "Clustered dark or gray spotting in moisture-retentive zones",
      "Growth concentrated on caulk, grout, seams, or airflow-dead corners",
      "Pattern follows moisture source rather than random dirt distribution",
    ],
    expertRead:
      "Judge moisture source and material porosity before promising removal versus stain reduction.",
    severityBand: "severe",
    progressionStage: "recurring",
    misidentifiedAs: ["mildew-vs-soil-staining", "grout"],
    distinguishFrom: [
      "Soil staining follows contact and splash patterns without biological clustering",
      "Permanent grout staining remains after sanitizing and controlled cleaning",
    ],
    wrongActionRisk:
      "Users may wipe visible spots without addressing moisture recurrence or porous material limits.",
    workflowStage: ["inspect", "identify", "pretest", "treat", "dwell", "rinse", "dry", "verify", "stop"],
    nextAction:
      "Confirm moisture driver, clean safely, and define whether recurrence prevention or material replacement is needed.",
    stopCondition:
      "Stop and escalate if growth is widespread, inside porous material, or tied to active water intrusion.",
    approvalNotes:
      "Avoid horror framing; the image must teach moisture pattern and remediation limits.",
  }),
  plannedProfile({
    slug: "rust-stains",
    title: "Rust Stain Diagnostic Visual",
    authorityKind: "problem",
    visualPurpose: ["identification", "severity", "progression", "workflow"],
    assetId: "VDA-PROBLEM-RUST-STAINS-001",
    alt: "Planned diagnostic visual showing orange-brown rust staining near a metal contact point.",
    diagnosticClaim:
      "Rust staining should connect orange-brown transfer to metal source, porosity, and acid-risk limits.",
    visibleMarkers: [
      "Orange-brown stain bleeding from metal contact or water path",
      "Concentrated halo near fixture, can, tool, or fastener source",
      "Porous surface darkening where iron penetrated",
    ],
    expertRead:
      "Identify the iron source and substrate before applying rust remover or acid chemistry.",
    severityBand: "moderate",
    progressionStage: "established",
    misidentifiedAs: ["hard-water-stains", "grout"],
    distinguishFrom: [
      "Hard-water scale is typically white or gray mineral buildup",
      "Organic stains lack the same iron-orange bleed from a source point",
    ],
    wrongActionRisk:
      "Users may use harsh acid on stone, grout, or sensitive metal and trade a stain for etching.",
    workflowStage: ["inspect", "identify", "pretest", "treat", "rinse", "dry", "verify"],
    nextAction:
      "Remove or isolate the source, then pretest rust chemistry for the substrate.",
    stopCondition:
      "Stop if the substrate reacts, lightens, pits, or etches during pretest.",
    approvalNotes:
      "Needs source-point logic and substrate risk, not isolated orange color alone.",
  }),
  plannedProfile({
    slug: "shower-glass",
    title: "Shower Glass Surface Diagnostic Visual",
    authorityKind: "surface",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-SURFACE-SHOWER-GLASS-001",
    alt: "Planned diagnostic visual showing shower glass with light angle revealing film and etching risk.",
    diagnosticClaim:
      "Shower glass visuals should teach how to read film, mineral deposits, coating risk, and permanent etching under light.",
    visibleMarkers: [
      "Lower-panel buildup where water and soap dwell",
      "Hardware-edge accumulation",
      "Raking-light reflectivity changes",
    ],
    expertRead:
      "Glass can look clean straight on and still reveal film or damage when inspected at an angle.",
    severityBand: "moderate",
    progressionStage: "recurring",
    misidentifiedAs: ["soap-scum", "hard-water-stains", "haze-vs-etching"],
    distinguishFrom: [
      "Removable film changes during pretest",
      "Coating failure or etching persists after complete dry-down",
    ],
    wrongActionRisk:
      "Users may scrape or powder-scrub coated glass and cause irreversible dulling.",
    workflowStage: ["inspect", "pretest", "treat", "rinse", "dry", "verify", "stop"],
    nextAction:
      "Inspect with raking light and run the least aggressive compatible test first.",
    stopCondition:
      "Stop if glass coating, etched patches, or scratch patterns become visible.",
    approvalNotes:
      "Must privilege surface-read expertise over bathroom lifestyle imagery.",
  }),
  plannedProfile({
    slug: "grout",
    title: "Grout Surface Diagnostic Visual",
    authorityKind: "surface",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-SURFACE-GROUT-001",
    alt: "Planned diagnostic visual showing grout lines with soil, staining, and porosity cues.",
    diagnosticClaim:
      "Grout visuals should show porous-line behavior so users separate removable soil from staining, mildew, or material wear.",
    visibleMarkers: [
      "Darkening along porous grout lines",
      "Edge soil where tile meets grout",
      "Uneven color that may remain after cleaning",
    ],
    expertRead:
      "Judge porosity, seal condition, and moisture exposure before promising full color restoration.",
    severityBand: "severe",
    progressionStage: "recurring",
    misidentifiedAs: ["mold-mildew", "mildew-vs-soil-staining", "rust-stains"],
    distinguishFrom: [
      "Mildew clusters in moisture-retentive areas",
      "Rust has orange-brown source-point bleeding",
    ],
    wrongActionRisk:
      "Users may over-bleach, over-acid, or wire-brush grout and damage the cementitious surface.",
    workflowStage: ["inspect", "pretest", "treat", "agitate", "rinse", "dry", "verify", "stop"],
    nextAction:
      "Pretest cleaner and agitation level, then verify color only after full dry-down.",
    stopCondition:
      "Stop if grout sheds material, lightens unevenly, or shows failed seal/caulk boundaries.",
    approvalNotes:
      "Needs porosity and boundary cues, not a generic tile-cleaning close-up.",
  }),
  plannedProfile({
    slug: "stainless-steel",
    title: "Stainless Steel Surface Diagnostic Visual",
    authorityKind: "surface",
    visualPurpose: ["identification", "severity", "progression", "misidentification", "workflow"],
    assetId: "VDA-SURFACE-STAINLESS-STEEL-001",
    alt: "Planned diagnostic visual showing stainless steel grain, fingerprints, streaking, and scratch risk.",
    diagnosticClaim:
      "Stainless steel visuals should make grain direction, residue, fingerprints, and scratch risk visible.",
    visibleMarkers: [
      "Directional grain lines",
      "Fingerprint oils and wipe marks",
      "Light scratches or dulling against the grain",
    ],
    expertRead:
      "Read the grain and residue pattern before choosing polish, degreaser, or rinse reset.",
    severityBand: "mild",
    progressionStage: "established",
    misidentifiedAs: ["streaking", "product-residue", "surface-haze"],
    distinguishFrom: [
      "Technique streaks align with recent wiping",
      "True scratches cut across reflected grain and do not rinse away",
    ],
    wrongActionRisk:
      "Users may scrub across grain or add oily polish over residue.",
    workflowStage: ["inspect", "identify", "rinse", "dry", "verify"],
    nextAction:
      "Clean with the grain, remove residue, and verify under angled light before polishing.",
    stopCondition:
      "Stop abrasive action if scratches, coating damage, or grain disruption appears.",
    approvalNotes:
      "Must expose grain-reading expertise rather than a glossy appliance glamour shot.",
  }),
  plannedProfile({
    slug: "finished-wood",
    title: "Finished Wood Surface Diagnostic Visual",
    authorityKind: "surface",
    visualPurpose: ["identification", "severity", "progression", "workflow"],
    assetId: "VDA-SURFACE-FINISHED-WOOD-001",
    alt: "Planned diagnostic visual showing finished wood with moisture, residue, and finish-risk cues.",
    diagnosticClaim:
      "Finished wood visuals should distinguish surface residue from finish damage, swelling, whitening, and abrasion risk.",
    visibleMarkers: [
      "Dull film that follows product application",
      "White moisture marks or finish clouding",
      "Raised grain, edge swelling, or worn finish zones",
    ],
    expertRead:
      "Treat finished wood as a coating system first; visible soil is not the only risk.",
    severityBand: "permanent-risk",
    progressionStage: "damaged",
    misidentifiedAs: ["product-residue", "surface-haze"],
    distinguishFrom: [
      "Residue improves with careful reset cleaning",
      "Finish whitening or swelling remains after dry-down",
    ],
    wrongActionRisk:
      "Users may over-wet, over-alkalize, or abrade through the protective finish.",
    workflowStage: ["inspect", "pretest", "dry", "verify", "stop"],
    nextAction:
      "Use minimal moisture and verify finish integrity before any cleaning escalation.",
    stopCondition:
      "Stop if whitening, tackiness, color lift, swelling, or finish softening appears.",
    approvalNotes:
      "Must show material-risk judgment, not a decorative wood-floor lifestyle image.",
  }),
  plannedProfile({
    slug: "soap-scum-vs-hard-water",
    title: "Soap Scum vs Hard Water Misidentification Visual",
    authorityKind: "misidentification",
    visualPurpose: ["misidentification", "identification", "workflow"],
    assetId: "VDA-MISID-SOAP-SCUM-HARD-WATER-001",
    alt: "Planned comparison visual distinguishing cloudy soap film from mineral hard-water deposits.",
    diagnosticClaim:
      "This comparison should show why cloudy soap film and mineral deposits demand different chemistry and risk controls.",
    visibleMarkers: [
      "Soap scum appears smeared and film-like",
      "Hard-water deposits show sharper droplet or scale edges",
      "Both may coexist near lower shower zones",
    ],
    expertRead:
      "The correct read depends on pattern, edge definition, and test response, not whiteness alone.",
    severityBand: "not-applicable",
    progressionStage: "not-applicable",
    misidentifiedAs: ["soap-scum", "hard-water-stains"],
    distinguishFrom: [
      "Soap scum responds to surfactant/organic-film strategy",
      "Hard water responds to mineral strategy with substrate safeguards",
    ],
    wrongActionRisk:
      "Users may choose the wrong chemistry and either fail to clean or damage adjacent surfaces.",
    workflowStage: ["inspect", "identify", "pretest", "stop"],
    nextAction:
      "Run a small diagnostic test before committing to acid, alkaline, or mechanical escalation.",
    stopCondition:
      "Stop if mixed conditions make a single aggressive treatment unsafe.",
    approvalNotes:
      "Must be a true comparison frame with visible differentiators.",
  }),
  plannedProfile({
    slug: "haze-vs-etching",
    title: "Haze vs Etching Misidentification Visual",
    authorityKind: "misidentification",
    visualPurpose: ["misidentification", "severity", "progression", "workflow"],
    assetId: "VDA-MISID-HAZE-ETCHING-001",
    alt: "Planned comparison visual distinguishing removable haze from permanent etching.",
    diagnosticClaim:
      "This comparison should prevent users from treating permanent etching as removable haze.",
    visibleMarkers: [
      "Removable haze changes after cleaning and dry-down",
      "Etching keeps a structural dull patch under raking light",
      "Etched areas may interrupt reflection more sharply than film",
    ],
    expertRead:
      "The decisive signal is not dullness; it is whether the surface changes after appropriate soil removal.",
    severityBand: "permanent-risk",
    progressionStage: "irreversible-risk",
    misidentifiedAs: ["surface-haze", "hard-water-stains"],
    distinguishFrom: [
      "Haze can be residue, minerals, or product film",
      "Etching is surface alteration and should not be chased with stronger cleaner",
    ],
    wrongActionRisk:
      "Users may keep increasing acid or abrasion and deepen irreversible damage.",
    workflowStage: ["inspect", "pretest", "dry", "verify", "stop"],
    nextAction:
      "Clean a controlled patch, dry fully, then decide whether the remaining mark is damage.",
    stopCondition:
      "Stop when a cleaned and dried patch shows unchanged dullness or pitting.",
    approvalNotes:
      "Needs before/after-test logic, not an attractive reflection shot.",
  }),
  plannedProfile({
    slug: "streaking-vs-residue",
    title: "Streaking vs Residue Misidentification Visual",
    authorityKind: "misidentification",
    visualPurpose: ["misidentification", "identification", "workflow"],
    assetId: "VDA-MISID-STREAKING-RESIDUE-001",
    alt: "Planned comparison visual distinguishing wipe streaks from product residue.",
    diagnosticClaim:
      "This comparison should show whether the issue is final-pass technique or leftover cleaning chemistry.",
    visibleMarkers: [
      "Streaking follows wipe direction and dry-pass gaps",
      "Residue leaves drag, tack, or cloudy overlap",
      "Residue can smear or reactivate when lightly dampened",
    ],
    expertRead:
      "Differentiate a technique correction from a residue reset before adding product.",
    severityBand: "not-applicable",
    progressionStage: "not-applicable",
    misidentifiedAs: ["streaking", "product-residue"],
    distinguishFrom: [
      "Technique streaking improves with clean dry microfiber",
      "Residue requires removal or rinse reset",
    ],
    wrongActionRisk:
      "Users may apply more cleaner when the surface actually needs product removal.",
    workflowStage: ["inspect", "identify", "rinse", "dry", "verify"],
    nextAction:
      "Use damp reset plus dry verification if residue signs are present; otherwise correct final-pass technique.",
    stopCondition:
      "Stop product addition until the residue question is resolved.",
    approvalNotes:
      "Must show visual/physical process evidence, not generic shine.",
  }),
  plannedProfile({
    slug: "mildew-vs-soil-staining",
    title: "Mildew vs Soil Staining Misidentification Visual",
    authorityKind: "misidentification",
    visualPurpose: ["misidentification", "severity", "progression", "workflow"],
    assetId: "VDA-MISID-MILDEW-SOIL-STAINING-001",
    alt: "Planned comparison visual distinguishing mildew growth from soil staining.",
    diagnosticClaim:
      "This comparison should show whether dark marks are biological growth, embedded soil, or permanent staining.",
    visibleMarkers: [
      "Mildew clusters in damp, airflow-poor zones",
      "Soil staining follows contact, splash, or traffic patterns",
      "Permanent staining remains after cleaning and sanitizing",
    ],
    expertRead:
      "Pattern and recurrence source matter more than dark color alone.",
    severityBand: "severe",
    progressionStage: "recurring",
    misidentifiedAs: ["mold-mildew", "grout"],
    distinguishFrom: [
      "Mildew requires moisture-source reasoning",
      "Soil staining requires cleaning and porosity expectations",
    ],
    wrongActionRisk:
      "Users may bleach repeatedly without addressing moisture, or assume harmless soil where growth risk exists.",
    workflowStage: ["inspect", "identify", "pretest", "treat", "dry", "verify", "stop"],
    nextAction:
      "Identify moisture pattern, clean safely, then define recurrence prevention or replacement limits.",
    stopCondition:
      "Stop and escalate if growth appears widespread, returns quickly, or sits behind failed caulk/grout.",
    approvalNotes:
      "Must avoid fear imagery and teach moisture/soil pattern distinction.",
  }),
] as const;

export type VisualDiagnosticProfileSlug =
  (typeof VISUAL_DIAGNOSTIC_PROFILES)[number]["slug"];
