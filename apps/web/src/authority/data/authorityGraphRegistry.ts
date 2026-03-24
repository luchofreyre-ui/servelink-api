import type {
  AuthorityGraphEdge,
  AuthorityMethodProblemEdge,
  AuthorityMethodSurfaceEdge,
  AuthorityRelationshipDisposition,
  AuthorityRelationshipStrength,
  AuthoritySurfaceProblemEdge,
} from "@/authority/types/authorityGraphTypes";
import { validateAuthorityGraphOrThrow } from "@/authority/data/authorityGraphValidation";

type MS = readonly [
  methodSlug: string,
  surfaceSlug: string,
  strength: AuthorityRelationshipStrength,
  disposition: AuthorityRelationshipDisposition,
  notes?: readonly string[],
];

type MP = readonly [
  methodSlug: string,
  problemSlug: string,
  strength: AuthorityRelationshipStrength,
  disposition: AuthorityRelationshipDisposition,
  notes?: readonly string[],
];

type SP = readonly [
  surfaceSlug: string,
  problemSlug: string,
  strength: AuthorityRelationshipStrength,
  disposition: AuthorityRelationshipDisposition,
  notes?: readonly string[],
];

const METHOD_SURFACE_SEED: MS[] = [
  ["degreasing", "stainless-steel", "primary", "preferred", ["oil removal", "high-touch zones"]],
  ["degreasing", "laminate", "primary", "preferred", ["kitchen film"]],
  ["degreasing", "quartz-countertops", "primary", "compatible", ["spill cleanup"]],
  ["degreasing", "painted-walls", "secondary", "compatible", ["edges near cooking zones"]],
  ["degreasing", "granite-countertops", "primary", "compatible", ["kitchen grease"]],
  ["degreasing", "tile", "primary", "compatible", ["backsplash zones"]],
  ["soap-scum-removal", "shower-glass", "primary", "preferred", ["soap and mineral film"]],
  ["soap-scum-removal", "tile", "primary", "preferred", ["bath residue"]],
  ["soap-scum-removal", "grout", "secondary", "caution", ["gentle agitation", "porous grout"]],
  ["neutral-surface-cleaning", "quartz-countertops", "primary", "preferred", ["daily maintenance"]],
  ["neutral-surface-cleaning", "laminate", "primary", "preferred", ["routine wipe-down"]],
  ["neutral-surface-cleaning", "vinyl-flooring", "primary", "preferred", ["floor maintenance"]],
  ["neutral-surface-cleaning", "tile", "primary", "preferred", ["ceramic maintenance"]],
  ["neutral-surface-cleaning", "granite-countertops", "primary", "preferred", ["sealed stone daily"]],
  ["neutral-surface-cleaning", "finished-wood", "primary", "compatible", ["low-moisture passes"]],
  ["neutral-surface-cleaning", "painted-walls", "primary", "compatible", ["washable paints"]],
  ["detail-dusting", "painted-walls", "primary", "preferred", ["dry soil removal first"]],
  ["detail-dusting", "finished-wood", "primary", "preferred", ["grain-aware dusting"]],
  ["touchpoint-sanitization", "stainless-steel", "primary", "preferred", ["handles and fronts"]],
  ["touchpoint-sanitization", "laminate", "secondary", "compatible", ["cabinet touchpoints"]],
  ["touchpoint-sanitization", "tile", "secondary", "compatible", ["bathroom fixtures and surrounds"]],
  ["glass-cleaning", "shower-glass", "primary", "preferred", ["streak control"]],
  ["glass-cleaning", "grout", "secondary", "avoid", ["abrasion and film risk in joints"]],
  ["hard-water-deposit-removal", "shower-glass", "primary", "preferred", ["spotting and scale"]],
  ["hard-water-deposit-removal", "grout", "secondary", "caution", ["acid sensitivity context"]],
  ["hard-water-deposit-removal", "stainless-steel", "secondary", "compatible", ["fixtures and fronts"]],
  ["dwell-and-lift-cleaning", "laminate", "primary", "compatible", ["dried spills"]],
  ["dwell-and-lift-cleaning", "quartz-countertops", "primary", "compatible", ["residue lift"]],
  ["dwell-and-lift-cleaning", "vinyl-flooring", "secondary", "compatible", ["controlled moisture"]],
];

const METHOD_PROBLEM_SEED: MP[] = [
  ["degreasing", "grease-buildup", "primary", "preferred", ["lipid soils"]],
  ["degreasing", "touchpoint-contamination", "secondary", "compatible", ["after soil removal"]],
  ["degreasing", "stuck-on-residue", "secondary", "compatible", ["cured kitchen films"]],
  ["soap-scum-removal", "soap-scum", "primary", "preferred", ["bath films"]],
  ["soap-scum-removal", "general-soil", "secondary", "compatible", ["dingy grout context"]],
  ["soap-scum-removal", "light-mildew", "secondary", "caution", ["ventilation matters"]],
  ["neutral-surface-cleaning", "dust-buildup", "primary", "preferred", ["maintenance loop"]],
  ["neutral-surface-cleaning", "general-soil", "primary", "preferred", ["mixed-finish rooms"]],
  ["neutral-surface-cleaning", "soap-scum", "secondary", "compatible", ["light maintenance only"]],
  ["neutral-surface-cleaning", "stuck-on-residue", "secondary", "compatible", ["after dwell products"]],
  ["neutral-surface-cleaning", "light-mildew", "secondary", "caution", ["surface-limited context"]],
  ["neutral-surface-cleaning", "fingerprints-and-smudges", "secondary", "compatible", ["gentle wipe passes"]],
  ["neutral-surface-cleaning", "grease-buildup", "secondary", "compatible", ["mild detergent line first"]],
  ["detail-dusting", "dust-buildup", "primary", "preferred", ["capture-first"]],
  ["detail-dusting", "general-soil", "supporting", "compatible", ["before damp wiping"]],
  ["touchpoint-sanitization", "touchpoint-contamination", "primary", "preferred", ["label-directed dwell"]],
  ["touchpoint-sanitization", "fingerprints-and-smudges", "secondary", "compatible", ["post-clean passes"]],
  ["glass-cleaning", "streaking-on-glass", "primary", "preferred", ["technique-sensitive"]],
  ["glass-cleaning", "fingerprints-and-smudges", "primary", "compatible", ["high-gloss surfaces"]],
  ["glass-cleaning", "soap-scum", "secondary", "compatible", ["light films only"]],
  ["hard-water-deposit-removal", "hard-water-deposits", "primary", "preferred", ["mineral focus"]],
  ["hard-water-deposit-removal", "soap-scum", "primary", "compatible", ["mineral-linked film"]],
  ["dwell-and-lift-cleaning", "stuck-on-residue", "primary", "preferred", ["dwell then lift"]],
  ["dwell-and-lift-cleaning", "grease-buildup", "secondary", "compatible", ["when mild line first"]],
];

const SURFACE_PROBLEM_SEED: SP[] = [
  ["shower-glass", "soap-scum", "primary", "preferred", ["film pattern"]],
  ["shower-glass", "hard-water-deposits", "primary", "preferred", ["spotting"]],
  ["shower-glass", "light-mildew", "secondary", "caution", ["corners and runners"]],
  ["tile", "general-soil", "primary", "preferred", ["haze and traffic"]],
  ["tile", "light-mildew", "secondary", "caution", ["damp environments"]],
  ["tile", "soap-scum", "primary", "compatible", ["bath context"]],
  ["tile", "grease-buildup", "primary", "compatible", ["backsplash context"]],
  ["grout", "light-mildew", "secondary", "caution", ["porous line"]],
  ["grout", "general-soil", "primary", "preferred", ["embedded line soil"]],
  ["grout", "soap-scum", "primary", "compatible", ["bath film in joints"]],
  ["stainless-steel", "grease-buildup", "primary", "preferred", ["range-adjacent"]],
  ["stainless-steel", "fingerprints-and-smudges", "primary", "preferred", ["high gloss"]],
  ["stainless-steel", "hard-water-deposits", "secondary", "compatible", ["fixture spotting"]],
  ["quartz-countertops", "stuck-on-residue", "primary", "compatible", ["sealed tops"]],
  ["quartz-countertops", "general-soil", "primary", "preferred", ["daily soil"]],
  ["granite-countertops", "grease-buildup", "primary", "compatible", ["kitchen use"]],
  ["granite-countertops", "general-soil", "primary", "preferred", ["routine"]],
  ["granite-countertops", "hard-water-deposits", "secondary", "caution", ["stone-specific chemistry"]],
  ["laminate", "grease-buildup", "primary", "compatible", ["kitchen films"]],
  ["laminate", "stuck-on-residue", "primary", "compatible", ["edges and dried spills"]],
  ["finished-wood", "dust-buildup", "primary", "preferred", ["open grain"]],
  ["finished-wood", "general-soil", "secondary", "compatible", ["low-moisture only"]],
  ["vinyl-flooring", "general-soil", "primary", "preferred", ["mop and rinse discipline"]],
  ["vinyl-flooring", "stuck-on-residue", "secondary", "compatible", ["heel marks and spills"]],
  ["vinyl-flooring", "dust-buildup", "secondary", "compatible", ["dry soil before damp"]],
  ["painted-walls", "stuck-on-residue", "secondary", "compatible", ["scuff context"]],
  ["painted-walls", "general-soil", "primary", "compatible", ["washable paints"]],
  ["painted-walls", "fingerprints-and-smudges", "secondary", "compatible", ["hall traffic"]],
  ["painted-walls", "touchpoint-contamination", "secondary", "compatible", ["switches and rails"]],
];

function toMethodSurface(row: MS): AuthorityMethodSurfaceEdge {
  const [methodSlug, surfaceSlug, strength, disposition, notes] = row;
  return { type: "method_surface", methodSlug, surfaceSlug, strength, disposition, notes: notes ? [...notes] : undefined };
}

function toMethodProblem(row: MP): AuthorityMethodProblemEdge {
  const [methodSlug, problemSlug, strength, disposition, notes] = row;
  return { type: "method_problem", methodSlug, problemSlug, strength, disposition, notes: notes ? [...notes] : undefined };
}

function toSurfaceProblem(row: SP): AuthoritySurfaceProblemEdge {
  const [surfaceSlug, problemSlug, strength, disposition, notes] = row;
  return { type: "surface_problem", surfaceSlug, problemSlug, strength, disposition, notes: notes ? [...notes] : undefined };
}

export const AUTHORITY_GRAPH_EDGES: AuthorityGraphEdge[] = [
  ...METHOD_SURFACE_SEED.map(toMethodSurface),
  ...METHOD_PROBLEM_SEED.map(toMethodProblem),
  ...SURFACE_PROBLEM_SEED.map(toSurfaceProblem),
];

validateAuthorityGraphOrThrow(AUTHORITY_GRAPH_EDGES);
