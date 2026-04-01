import type {
  AuthorityComparisonPageData,
  AuthorityComparisonRow,
  AuthorityMethodPageData,
  AuthorityProblemPageData,
  AuthoritySurfacePageData,
} from "../types/authorityPageTypes";
import {
  getComparisonSeedBySlug,
  getComparisonSeedsByType,
  normalizeComparisonSlug,
} from "./authorityComparisonSelectors";
import type { ProductDetailView } from "@/lib/products/productRegistry";
import { getProductBySlug } from "@/lib/products/productRegistry";
import { getProductResearch } from "@/lib/products/getProductResearch";
import { buildProductComparisonScenarioWinners } from "@/lib/products/productComparisonScenarioWinners";
import {
  getMethodSlugsForProblem,
  getMethodSlugsForSurface,
  getProblemSlugsForMethod,
  getProblemSlugsForSurface,
  getSurfaceSlugsForMethod,
  getSurfaceSlugsForProblem,
} from "./authorityGraphSelectors";
import { getMethodPageBySlug } from "./authorityMethodPageData";
import { getProblemPageBySlug } from "./authorityProblemPageData";
import { getSurfacePageBySlug } from "./authoritySurfacePageData";

function uniqueSorted(values: string[], exclude: string[] = [], max = 6): string[] {
  return Array.from(new Set(values))
    .filter((value) => !exclude.includes(value))
    .sort((a, b) => a.localeCompare(b))
    .slice(0, max);
}

function joinOrNone(values?: string[]): string {
  return values?.length ? values.join(", ") : "Not specified";
}

function joinBullets(values: string[], max = 3): string {
  if (!values.length) return "Not specified";
  return values.slice(0, max).join(" · ");
}

type ProductComparisonRouting = ReturnType<typeof buildProductComparisonRouting>;

/** Pair-specific routing copy for “good confusion” comparisons (overrides generic routing). */
const PRODUCT_COMPARISON_EXPERT_COPY: Record<
  string,
  Partial<
    ProductComparisonRouting & {
      quickAnswer?: string;
    }
  >
> = {
  "lime-a-way-cleaner-vs-wet-and-forget-shower-cleaner": {
    quickAnswer: `Pick Lime-A-Way when you need an active acid cycle on bonded bathroom scale or stubborn soap film on label-safe porcelain, chrome, and glass; pick Wet & Forget Shower when you want a scheduled, low-effort mist between deep cleans—not a same-day descale.`,
    notInterchangeable: {
      leftWins: `Lime-A-Way wins when the shower story is mineral-linked film, rough spots, or soap scum that still reads “crusty” after neutral wipes—on surfaces its label explicitly allows, with controlled dwell and a full rinse.`,
      rightWins: `Wet & Forget Shower wins when the goal is maintenance cadence: keeping light films from setting between scrubs, especially if you will not rinse aggressively every time.`,
      bothFail: `Both are wrong openers for natural stone or sealed quartz showers, heavy kitchen grease on bath-adjacent surfaces, clogged drains, or expectations of a passive no-rinse product melting thick calcium in one pass.`,
    },
    quickDecision: [
      `If you can scratch scale with a fingernail or white vinegar barely touches it → Lime-A-Way (label-safe surfaces only), then rinse thoroughly.`,
      `If buildup is thin and returns weekly unless you mist after use → Wet & Forget Shower on its labeled program.`,
      `If the surface is stone, coating-unknown, or damage looks etched → stop here; open the hard-water or soap-scum problem hub and choose stone-safe routing.`,
    ],
    commonMistake: `People spray Wet & Forget expecting CLR-class results on thick scale, then escalate with longer Lime-A-Way dwell on grout and trim—blurring “maintain” chemistry with “restore” chemistry and risking acid damage where rinse discipline matters.`,
    whenNeitherWorks: `When silicone is failing, ventilation is poor enough that films are mostly biofilm, or marks are etching—not residue—neither SKU fixes the underlying assembly; treat moisture and surface integrity first, then re-pick chemistry from the matching problem page.`,
  },
  "biokleen-bac-out-stain-odor-remover-vs-zero-odor-eliminator-spray": {
    quickAnswer: `Bac-Out is the enzyme lane for organic stains and digested residues on fabrics and soft surfaces; Zero Odor is the pairing neutralizer when the goal is binding airborne or embedded odor molecules after soil removal—not dissolving a stain.`,
    notInterchangeable: {
      leftWins: `Bac-Out wins on urine, vomit, milk, and other protein or organic stains where dwell time and repeat applications can actually consume residue trapped in fibers or porous areas.`,
      rightWins: `Zero Odor wins when visible soil is already gone but smell persists—think soft surfaces, enclosed rooms, or post-clean “ghost odor” where you want a neutralizer pass, not another surfactant cycle.`,
      bothFail: `Both fail as first moves on set grease, adhesive, mold staining inside walls, or heavy bathroom scale—those need solvent, mold, or acid workflows from the right problem hub.`,
    },
    quickDecision: [
      `If you still see a stain outline or ring after blotting → Bac-Out with label dwell and patience; repeat rather than switching bottles.`,
      `If the area looks clean but still smells after washing → Zero Odor as a targeted neutralizer pass, then airflow.`,
      `If the issue is crusty hard-water on tile or glass → skip both; open mineral-film or limescale routing.`,
    ],
    commonMistake: `Spraying Zero Odor on fresh pet accidents without blotting and enzyme work, or using Bac-Out once on dried grease and calling enzymes “weak”—confusing odor chemistry with lipid removal.`,
    whenNeitherWorks: `When carpet pad is saturated, drywall is stained from behind, or HVAC is recirculating odor, bottles will not replace extraction, drying, and source removal—escalate physically before buying more SKUs.`,
  },
  "dawn-platinum-dish-spray-vs-easy-off-kitchen-degreaser": {
    quickAnswer: `Dawn Platinum is the surfactant-first lane for fresh to moderate kitchen grease on label-safe hard surfaces; Easy-Off Kitchen is the alkaline degreaser lane when films are polymerized on hoods, backsplashes, and range-adjacent verticals—still not a substitute for oven-baked carbon chemistry.`,
    notInterchangeable: {
      leftWins: `Dawn wins on dishware, lightly filmed stainless, and mixed kitchen tops where you want controlled foam, rinseability, and less aggressive pH than a packaged degreaser.`,
      rightWins: `Easy-Off Kitchen wins when grease is tacky, orange-brown, and heat-set on appliances and nearby hard surfaces its label covers—where a surfactant-only wipe keeps smearing.`,
      bothFail: `Both fail as primary tools on self-clean oven cycles, inside porous stone, fabric, or adhesive residue—those need oven, stone, or solvent playbooks instead.`,
    },
    quickDecision: [
      `If a quick surfactant wipe clears a clean towel → stay with Dawn and improve rinse discipline.`,
      `If towels keep browning and smears return in the same stroke → Easy-Off Kitchen on labeled areas with ventilation, then rinse.`,
      `If the soil is black, flaky carbon on racks → not this comparison; use the burnt-residue / oven hub.`,
    ],
    commonMistake: `Chasing hood grease with endless Dawn sprays without dwell or rinse upgrades, then jumping to heavy oven cleaner on cabinets—skipping the intermediate labeled degreaser lane that Easy-Off Kitchen is meant to occupy.`,
    whenNeitherWorks: `When grease is mixed with failing paint, bare wood, or unknown film coatings, neither bottle replaces a spot test and manufacturer guidance—wrong pH or solvent class can strip finishes outright.`,
  },
  "febreze-fabric-refresher-antimicrobial-vs-zero-odor-eliminator-spray": {
    quickAnswer: `Febreze Fabric Antimicrobial is a fabric refresher with an antimicrobial positioning for soft surfaces after soil is reduced; Zero Odor is a dedicated neutralizer for stubborn odor molecules—use it when the job is “smell chemistry,” not “make the couch smell nicer for an hour.”`,
    notInterchangeable: {
      leftWins: `Febreze wins on routine soft-surface refresh where you want a light, even application on upholstery and fabrics that already read acceptably clean.`,
      rightWins: `Zero Odor wins when laundry or soft surfaces still smell sour or stale after washing—especially if you need a neutralizer layer rather than another perfume-forward pass.`,
      bothFail: `Both fail as substitutes for washing pet bedding, extracting carpet pad moisture, or removing visible mold—those need mechanical cleaning and moisture control first.`,
    },
    quickDecision: [
      `If the fabric is visibly soiled → wash or extract first; then pick refresher vs neutralizer.`,
      `If it is clean but antimicrobial “still feels smelly” → Zero Odor targeted passes plus drying.`,
      `If odor tracks with HVAC or drains → leave fabric SKUs; open musty-odor or drain-adjacent routing.`,
    ],
    commonMistake: `Layering fabric sprays to mask smoke, pet, or mildew odor without changing the source item (pad, pillow fill, closet airflow)—treating Zero Odor like a stronger Febreze instead of a post-clean neutralizer.`,
    whenNeitherWorks: `When foam smells chemical-hot, there is active mold on drywall, or items never fully dry, sprays recycle the problem; fix drying and contamination boundaries before comparing fabric SKUs.`,
  },
  "cerama-bryte-cooktop-cleaner-vs-weiman-gas-range-cleaner-degreaser": {
    quickAnswer: `Cerama Bryte is the glass-ceramic cooktop polish lane for careful removal of cooked-on spatters without attacking trim; Weiman Gas Range Cleaner targets gas-range grates, caps, and vertical metal films where a cooktop cream is the wrong tool.`,
    notInterchangeable: {
      leftWins: `Cerama Bryte wins on smooth glass-ceramic tops where the risk is scratching or hazing—especially light-to-moderate cooked-on marks with razor-safe technique on label.`,
      rightWins: `Weiman Gas Range Cleaner wins on gas hardware, burner-adjacent metal, and vertical grease films where a cooktop cream cannot reach geometry or soil thickness effectively.`,
      bothFail: `Both are poor first choices inside self-clean ovens, on raw aluminum you cannot verify, or on stone—those surfaces need different chemistry classes entirely.`,
    },
    quickDecision: [
      `If the soil is on the flat glass top only → Cerama Bryte workflow and conservative tools.`,
      `If grates, caps, or stainless verticals are tacky → Weiman Gas Range Cleaner where labeled.`,
      `If carbon is thick and oven-internal → redirect to oven-cleaner comparison and burnt-residue hub.`,
    ],
    commonMistake: `Using cooktop cream on packed burner ports and cast grates, or using range degreaser aggressively on a glass top—swapping “kitchen” for “cooktop-safe” without reading the soil location.`,
    whenNeitherWorks: `When enamel is chipped, igniters are clogged with paste residue, or heat tint is confused with soil, mechanical service beats another SKU swap—clean what is soil, not what is damage.`,
  },
  "murphy-oil-soap-wood-cleaner-vs-pledge-multisurface-cleaner": {
    quickAnswer: `Murphy’s Oil Soap is the conditioned-wood maintenance lane that leaves an oiled-handling feel; Pledge Multisurface is the quick gloss wipe for sealed or synthetic finishes where you want light cleaning plus sheen—not penetrating oil behavior on raw wood.`,
    notInterchangeable: {
      leftWins: `Murphy’s wins on unfinished or oil-finished wood where mild soap-and-oil cleaning matches how the surface was meant to be maintained.`,
      rightWins: `Pledge wins on sealed cabinets, laminate, and many labeled multisurface jobs where you want fast smudge pickup and a cosmetic sheen without building sticky oil layers.`,
      bothFail: `Both fail as stone-safe daily cleaners, heavy degreasers on hoods, or fixes for water-damaged swelling—wrong chemistry class for those hubs.`,
    },
    quickDecision: [
      `If water beads on cabinet film and grain is sealed → Pledge-style multisurface if the label agrees.`,
      `If the wood is bare, oiled, or thirsty-looking → Murphy’s dilution path and minimal water.`,
      `If grease is heavy near the range → neither is the primary tool; degrease first from the grease hub.`,
    ],
    commonMistake: `Using Murphy’s at high concentration on factory-sealed cabinets to “nourish” them—building tacky residue—or using Pledge on open grain floors then wondering why dust sticks.`,
    whenNeitherWorks: `When finish is failing (peeling, whitening, tacky forever), the issue is coating breakdown, not cleaner brand—strip/repair per manufacturer instead of alternating oils and sprays.`,
  },
  "concrobium-mold-control-vs-mold-armor-rapid-clean-remediation": {
    quickAnswer: `Concrobium Mold Control is the low-odor, wide-surface mold-treatment positioning many people choose for maintenance and prevention passes; Mold Armor Rapid Clean leans faster visible attack on label-permitted mold staining—still not a substitute for fixing moisture.`,
    notInterchangeable: {
      leftWins: `Concrobium wins when you want a treatment-style pass on label-covered areas with ventilation control and repeat applications, especially on porous-adjacent hard surfaces in the product’s lane.`,
      rightWins: `Mold Armor Rapid Clean wins when you need a stronger, label-directed remediation pass on permitted non-porous surfaces and accept the fumes and PPE story that come with it.`,
      bothFail: `Both fail when mold is inside wall cavities, insulation is wet, or caulk and grout lines indicate chronic leaks—bottles cannot dry the assembly.`,
    },
    quickDecision: [
      `If the spot is small, surface-limited, and dryness is improving → pick the label that matches your ventilation tolerance and surface list.`,
      `If it returns in the same corner weekly → moisture investigation beats swapping brands.`,
      `If texture is soft or drywall bows → stop spraying; professional remediation scope.`,
    ],
    commonMistake: `Spraying either product into HVAC returns, behind wallpaper, or over thick carpet without removing the wet layer—treating mold like a countertop stain.`,
    whenNeitherWorks: `When occupancy includes respiratory vulnerability, staining covers multiple rooms, or insurance documentation is required, consumer SKUs are not the whole plan—document, dry, and escalate per local guidance.`,
  },
};

function mergeExpertProductRouting(
  comparisonSlug: string,
  base: ProductComparisonRouting,
): ProductComparisonRouting & { quickAnswer?: string } {
  const expert = PRODUCT_COMPARISON_EXPERT_COPY[comparisonSlug];
  if (!expert) return base;
  return {
    notInterchangeable: expert.notInterchangeable
      ? { ...base.notInterchangeable, ...expert.notInterchangeable }
      : base.notInterchangeable,
    quickDecision: expert.quickDecision ?? base.quickDecision,
    commonMistake: expert.commonMistake ?? base.commonMistake,
    whenNeitherWorks: expert.whenNeitherWorks ?? base.whenNeitherWorks,
    quickAnswer: expert.quickAnswer,
  };
}

function buildProductComparisonRouting(left: ProductDetailView, right: ProductDetailView) {
  const leftLane = left.bestUseCases?.[0] ?? left.heroVerdict ?? "its labeled best-use cases";
  const rightLane = right.bestUseCases?.[0] ?? right.heroVerdict ?? "its labeled best-use cases";
  const leftAvoid = left.avoidUseCases?.[0] ?? "work outside its chemistry class";
  const rightAvoid = right.avoidUseCases?.[0] ?? "work outside its chemistry class";
  return {
    notInterchangeable: {
      leftWins: `${left.name} tends to win when the soil, surface, and risk profile line up with what it is formulated for—often around ${leftLane}.`,
      rightWins: `${right.name} tends to win when the job centers on ${rightLane}.`,
      bothFail: `Both are poor starters when the real issue is ${leftAvoid}, ${rightAvoid}, or when neither label clearly covers your surface—route through the problem hub instead of swapping bottles blindly.`,
    },
    quickDecision: [
      `If you are mainly fighting ${leftLane.toLowerCase()} → start with ${left.name}.`,
      `If you are mainly fighting ${rightLane.toLowerCase()} → start with ${right.name}.`,
      `If you are unsure what soil type you have → neutral wipe-down, decide residue vs damage, then return to the matching problem page.`,
    ],
    commonMistake: `People often grab ${left.name} when the soil is actually in ${right.name}’s lane (or vice versa) because the bottles sit next to each other—then they escalate pressure instead of re-identifying the problem class.`,
    whenNeitherWorks: `When the failure mode is mineral scale, sealed stone risk, embedded biofilm, or a surface class neither label clearly covers, stop alternating SKUs—open the matching problem hub and pick chemistry from there (often a different category entirely).`,
  };
}

function buildProductRows(left: ProductDetailView, right: ProductDetailView): AuthorityComparisonRow[] {
  const lRes = getProductResearch(left.slug);
  const rRes = getProductResearch(right.slug);
  return [
    {
      label: "One-line verdict",
      leftValue: left.heroVerdict,
      rightValue: right.heroVerdict,
    },
    {
      label: "Authority score",
      leftValue: left.finalScore.toFixed(1),
      rightValue: right.finalScore.toFixed(1),
    },
    {
      label: "Category",
      leftValue: left.category,
      rightValue: right.category,
    },
    {
      label: "Chemistry (library class)",
      leftValue: left.chemicalClass,
      rightValue: right.chemicalClass,
    },
    {
      label: "Best use cases",
      leftValue: joinBullets(left.bestUseCases ?? []),
      rightValue: joinBullets(right.bestUseCases ?? []),
    },
    {
      label: "Avoid / weak fits",
      leftValue: joinBullets(left.avoidUseCases ?? []),
      rightValue: joinBullets(right.avoidUseCases ?? []),
    },
    {
      label: "Strengths (dossier)",
      leftValue: joinBullets(left.strengths ?? []),
      rightValue: joinBullets(right.strengths ?? []),
    },
    {
      label: "Weaknesses / risks (dossier)",
      leftValue: joinBullets(left.weaknesses ?? []),
      rightValue: joinBullets(right.weaknesses ?? []),
    },
    {
      label: "Safety notes (research)",
      leftValue: joinBullets(lRes?.safetyWarnings ?? [], 2),
      rightValue: joinBullets(rRes?.safetyWarnings ?? [], 2),
    },
  ];
}

function methodsViaSurfacesForPair(methodA: string, methodB: string): string[] {
  const surfaces = new Set([
    ...getSurfaceSlugsForMethod(methodA),
    ...getSurfaceSlugsForMethod(methodB),
  ]);
  const methods: string[] = [];
  for (const s of surfaces) {
    methods.push(...getMethodSlugsForSurface(s));
  }
  return uniqueSorted(methods, [methodA, methodB]);
}

function buildMethodRows(
  left: AuthorityMethodPageData,
  right: AuthorityMethodPageData,
): AuthorityComparisonRow[] {
  return [
    {
      label: "Primary role",
      leftValue: left.summary,
      rightValue: right.summary,
    },
    {
      label: "Connected surfaces",
      leftValue: joinOrNone(getSurfaceSlugsForMethod(left.slug)),
      rightValue: joinOrNone(getSurfaceSlugsForMethod(right.slug)),
    },
    {
      label: "Connected problems",
      leftValue: joinOrNone(getProblemSlugsForMethod(left.slug)),
      rightValue: joinOrNone(getProblemSlugsForMethod(right.slug)),
    },
  ];
}

function buildSurfaceRows(
  left: AuthoritySurfacePageData,
  right: AuthoritySurfacePageData,
): AuthorityComparisonRow[] {
  return [
    {
      label: "Surface description",
      leftValue: left.summary,
      rightValue: right.summary,
    },
    {
      label: "Connected methods",
      leftValue: joinOrNone(getMethodSlugsForSurface(left.slug)),
      rightValue: joinOrNone(getMethodSlugsForSurface(right.slug)),
    },
    {
      label: "Connected problems",
      leftValue: joinOrNone(getProblemSlugsForSurface(left.slug)),
      rightValue: joinOrNone(getProblemSlugsForSurface(right.slug)),
    },
  ];
}

function buildProblemRows(
  left: AuthorityProblemPageData,
  right: AuthorityProblemPageData,
): AuthorityComparisonRow[] {
  return [
    {
      label: "Problem category",
      leftValue: left.category,
      rightValue: right.category,
    },
    {
      label: "Typical symptoms",
      leftValue: joinOrNone(left.symptoms),
      rightValue: joinOrNone(right.symptoms),
    },
    {
      label: "Typical causes",
      leftValue: joinOrNone(left.causes),
      rightValue: joinOrNone(right.causes),
    },
    {
      label: "Connected methods",
      leftValue: joinOrNone(getMethodSlugsForProblem(left.slug)),
      rightValue: joinOrNone(getMethodSlugsForProblem(right.slug)),
    },
    {
      label: "Connected surfaces",
      leftValue: joinOrNone(getSurfaceSlugsForProblem(left.slug)),
      rightValue: joinOrNone(getSurfaceSlugsForProblem(right.slug)),
    },
  ];
}

export function buildMethodComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("method_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getMethodPageBySlug(seed.leftSlug);
  const right = getMethodPageBySlug(seed.rightSlug);
  if (!left || !right) return null;

  return {
    type: "method_comparison",
    slug: normalizeComparisonSlug(left.slug, right.slug),
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.title} vs ${right.title}`,
    description: `A structured comparison of ${left.title.toLowerCase()} and ${right.title.toLowerCase()}, including connected surfaces, problems, and cleaning role.`,
    intro: `${left.title} and ${right.title} solve different kinds of cleaning problems. Comparing them helps clarify where each method fits, what it connects to, and where misuse can create bad outcomes.`,
    quickAnswer: `${left.title} and ${right.title} target different soil chemistry and risk profiles—pick based on whether you need lipid removal, mineral work, disinfection, or daily safe maintenance, not whichever sounds stronger.`,
    rows: buildMethodRows(left, right),
    relatedMethods: methodsViaSurfacesForPair(left.slug, right.slug),
    relatedSurfaces: uniqueSorted([
      ...getSurfaceSlugsForMethod(left.slug),
      ...getSurfaceSlugsForMethod(right.slug),
    ]),
    relatedProblems: uniqueSorted([
      ...getProblemSlugsForMethod(left.slug),
      ...getProblemSlugsForMethod(right.slug),
    ]),
    commonMistake: `People often use ${left.title.toLowerCase()} when ${right.title.toLowerCase()} is closer to the soil story (or the opposite), then blame the surface instead of the mismatch.`,
    whenNeitherWorks: `Neither method replaces labeled chemistry for moisture-trapped assemblies, unknown coatings, or jobs with no supported graph edge—escalate to manufacturer guidance or specialists.`,
  };
}

export function buildSurfaceComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("surface_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getSurfacePageBySlug(seed.leftSlug);
  const right = getSurfacePageBySlug(seed.rightSlug);
  if (!left || !right) return null;

  return {
    type: "surface_comparison",
    slug: normalizeComparisonSlug(left.slug, right.slug),
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.title} vs ${right.title}`,
    description: `A structured comparison of ${left.title.toLowerCase()} and ${right.title.toLowerCase()}, including linked methods, common problems, and surface risk patterns.`,
    intro: `${left.title} and ${right.title} do not respond to cleaning the same way. Comparing them clarifies what risks matter, what methods connect to each one, and why one surface should not be treated like the other.`,
    quickAnswer: `${left.title} and ${right.title} differ in abrasion tolerance, moisture limits, and chemistry sensitivity—copying a product or pressure level from one to the other is a common source of finish damage.`,
    rows: buildSurfaceRows(left, right),
    relatedMethods: uniqueSorted([
      ...getMethodSlugsForSurface(left.slug),
      ...getMethodSlugsForSurface(right.slug),
    ]),
    relatedSurfaces: uniqueSorted([], [left.slug, right.slug]),
    relatedProblems: uniqueSorted([
      ...getProblemSlugsForSurface(left.slug),
      ...getProblemSlugsForSurface(right.slug),
    ]),
    commonMistake: `People often treat ${left.title.toLowerCase()} like ${right.title.toLowerCase()} (same bottle, same pressure), then interpret finish damage as “needs stronger cleaner.”`,
    whenNeitherWorks: `When the assembly is mixed-material, sealed unknown, or failing structurally, neither surface playbook replaces a label-specific or professional assessment.`,
  };
}

export function buildProductComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("product_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getProductBySlug(seed.leftSlug);
  const right = getProductBySlug(seed.rightSlug);
  if (!left || !right) return null;

  const productScenarioWinners = buildProductComparisonScenarioWinners(left.slug, right.slug, {
    maxRows: 8,
  }).map((r) => ({
    scenarioLabel: r.scenarioLabel,
    playbookHref: r.playbookHref,
    winnerSlug: r.winnerSlug,
    winnerName: r.winnerName,
    runnerUp: r.runnerUp,
    note: r.note,
  }));

  let topSharedProblemSlug: string | undefined;
  let topSharedSurfaceSlug: string | undefined;
  for (const w of productScenarioWinners) {
    const m = w.playbookHref.match(/^\/surfaces\/([^/]+)\/([^/]+)$/);
    if (m) {
      topSharedSurfaceSlug = m[1];
      topSharedProblemSlug = m[2];
      break;
    }
  }

  const slug = normalizeComparisonSlug(left.slug, right.slug);
  const routing = mergeExpertProductRouting(slug, buildProductComparisonRouting(left, right));

  return {
    type: "product_comparison",
    slug,
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.name} vs ${right.name}`,
    description: `Side-by-side cleaning product comparison: chemistry, best fits, and safety cues from the Servelink product library.`,
    intro: `Both products appear in the same decision system, but they win in different lanes. Use this page to see chemistry class, labeled use cases, and where each SKU is intentionally weaker—then jump into the full dossiers for implementation detail.`,
    quickAnswer:
      routing.quickAnswer ??
      `Choose between ${left.name} and ${right.name} by matching visible soil to each product’s labeled lane—if the failure is mineral scale, hidden moisture, or an off-label surface, neither SKU is the right next step until the problem hub names the issue.`,
    rows: buildProductRows(left, right),
    relatedProblems: [],
    relatedSurfaces: [],
    relatedMethods: [],
    productScenarioWinners,
    topSharedProblemSlug,
    topSharedSurfaceSlug,
    notInterchangeable: routing.notInterchangeable,
    quickDecision: routing.quickDecision,
    commonMistake: routing.commonMistake,
    whenNeitherWorks: routing.whenNeitherWorks,
  };
}

export function buildProblemComparisonPage(comparisonSlug: string): AuthorityComparisonPageData | null {
  const seed = getComparisonSeedBySlug("problem_comparison", comparisonSlug);
  if (!seed) return null;

  const left = getProblemPageBySlug(seed.leftSlug);
  const right = getProblemPageBySlug(seed.rightSlug);
  if (!left || !right) return null;

  return {
    type: "problem_comparison",
    slug: normalizeComparisonSlug(left.slug, right.slug),
    leftSlug: left.slug,
    rightSlug: right.slug,
    title: `${left.title} vs ${right.title}`,
    description: `A structured comparison of ${left.title.toLowerCase()} and ${right.title.toLowerCase()}, including category, symptoms, causes, and connected cleaning methods.`,
    intro: `${left.title} and ${right.title} can look similar at first, but they often come from different causes and require different decisions. Comparing them reduces misidentification and helps route users toward the right playbooks.`,
    quickAnswer: `${left.title} and ${right.title} are different problem classes—treating one like the other usually wastes chemistry and can damage finishes; confirm symptoms and surface before picking a playbook.`,
    rows: buildProblemRows(left, right),
    relatedMethods: uniqueSorted([
      ...getMethodSlugsForProblem(left.slug),
      ...getMethodSlugsForProblem(right.slug),
    ]),
    relatedSurfaces: uniqueSorted([
      ...getSurfaceSlugsForProblem(left.slug),
      ...getSurfaceSlugsForProblem(right.slug),
    ]),
    relatedProblems: uniqueSorted([], [left.slug, right.slug]),
    commonMistake: `People often fight ${left.title.toLowerCase()} with tools meant for ${right.title.toLowerCase()} (or vice versa), which wastes time and can damage finishes.`,
    whenNeitherWorks: `When the mark is permanent damage, structural moisture, or a third chemistry class (outside both hubs), neither comparison side is the right next click—use guides or specialists.`,
  };
}

export function getMethodComparisonStaticParams() {
  return getComparisonSeedsByType("method_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}

export function getSurfaceComparisonStaticParams() {
  return getComparisonSeedsByType("surface_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}

export function getProblemComparisonStaticParams() {
  return getComparisonSeedsByType("problem_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}

export function getProductComparisonStaticParams() {
  return getComparisonSeedsByType("product_comparison").map((seed) => ({
    comparisonSlug: normalizeComparisonSlug(seed.leftSlug, seed.rightSlug),
  }));
}
