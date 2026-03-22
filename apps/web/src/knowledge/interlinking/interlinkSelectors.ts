import {
  METHOD_ENTITIES,
  SOIL_ENTITIES,
  SURFACE_ENTITIES,
  TOOL_ENTITIES,
} from "../entities";
import {
  normalizeSlugList,
  safeEntityName,
  safeEntitySummary,
} from "./interlinkScoring";
import type {
  AuthorityEntityKind,
  AuthorityEntityRecord,
} from "./interlinkTypes";

type GenericEntity = Record<string, unknown>;

const RELATION_KEYS_BY_KIND: Record<
  AuthorityEntityKind,
  Record<AuthorityEntityKind, string[]>
> = {
  problem: {
    problem: [],
    surface: ["affectedSurfaceSlugs"],
    method: ["recommendedMethodSlugs"],
    tool: ["recommendedToolSlugs"],
  },
  surface: {
    problem: ["commonProblemSlugs"],
    surface: [],
    method: ["safeMethodSlugs"],
    tool: ["safeToolSlugs"],
  },
  method: {
    problem: ["idealForSoilSlugs"],
    surface: ["compatibleSurfaceSlugs"],
    method: [],
    tool: ["recommendedToolSlugs"],
  },
  tool: {
    problem: ["idealForSoilSlugs"],
    surface: ["idealForSurfaceSlugs"],
    method: [],
    tool: [],
  },
};

export function getHrefForKind(kind: AuthorityEntityKind, slug: string): string {
  switch (kind) {
    case "problem":
      return `/cleaning-problems/${slug}`;
    case "surface":
      return `/cleaning-surfaces/${slug}`;
    case "method":
      return `/cleaning-methods/${slug}`;
    case "tool":
      return `/cleaning-tools/${slug}`;
    default:
      return "/";
  }
}

export function getRegistryForKind(kind: AuthorityEntityKind): GenericEntity[] {
  switch (kind) {
    case "problem":
      return SOIL_ENTITIES as GenericEntity[];
    case "surface":
      return SURFACE_ENTITIES as GenericEntity[];
    case "method":
      return METHOD_ENTITIES as GenericEntity[];
    case "tool":
      return TOOL_ENTITIES as GenericEntity[];
    default:
      return [];
  }
}

export function normalizeRegistryEntity(
  kind: AuthorityEntityKind,
  entity: GenericEntity
): AuthorityEntityRecord | null {
  const slug = entity.slug;

  if (typeof slug !== "string" || !slug.trim()) {
    return null;
  }

  return {
    kind,
    slug: slug.trim(),
    name: safeEntityName(entity),
    summary: safeEntitySummary(entity),
    href: getHrefForKind(kind, slug.trim()),
  };
}

export function getAllEntitiesForKind(
  kind: AuthorityEntityKind
): AuthorityEntityRecord[] {
  return getRegistryForKind(kind)
    .map((entity) => normalizeRegistryEntity(kind, entity))
    .filter((entity): entity is AuthorityEntityRecord => Boolean(entity));
}

export function getEntityByKindAndSlug(
  kind: AuthorityEntityKind,
  slug: string
): AuthorityEntityRecord | null {
  const found = getAllEntitiesForKind(kind).find((item) => item.slug === slug);
  return found ?? null;
}

export function getEntityRelationSlugs(
  kind: AuthorityEntityKind,
  targetKind: AuthorityEntityKind,
  entity: GenericEntity
): string[] {
  const keys = RELATION_KEYS_BY_KIND[kind][targetKind] ?? [];
  const collected: string[] = [];

  for (const key of keys) {
    const value = entity[key];
    collected.push(...normalizeSlugList(value));
  }

  return Array.from(new Set(collected));
}

export function getRegistryEntityBySlug(
  kind: AuthorityEntityKind,
  slug: string
): GenericEntity | null {
  const entity = getRegistryForKind(kind).find((item) => item.slug === slug);
  return (entity as GenericEntity | undefined) ?? null;
}

export function getInverseReferenceSlugs(params: {
  sourceKind: AuthorityEntityKind;
  sourceSlug: string;
  targetKind: AuthorityEntityKind;
  candidateSlug: string;
}): string[] {
  const { sourceKind, sourceSlug, targetKind, candidateSlug } = params;
  const candidateEntity = getRegistryEntityBySlug(targetKind, candidateSlug);

  if (!candidateEntity) {
    return [];
  }

  const relationSlugs = getEntityRelationSlugs(targetKind, sourceKind, candidateEntity);

  if (relationSlugs.includes(sourceSlug)) {
    return [sourceSlug];
  }

  return [];
}

export function getCandidateContextRelationSlugs(params: {
  candidateKind: AuthorityEntityKind;
  candidateSlug: string;
  sourceKind: AuthorityEntityKind;
}): string[] {
  const { candidateKind, candidateSlug, sourceKind } = params;
  const entity = getRegistryEntityBySlug(candidateKind, candidateSlug);

  if (!entity) {
    return [];
  }

  const relationKinds: AuthorityEntityKind[] = ["problem", "surface", "method", "tool"];

  const collected: string[] = [];

  for (const relationKind of relationKinds) {
    if (relationKind === candidateKind || relationKind === sourceKind) {
      continue;
    }

    collected.push(...getEntityRelationSlugs(candidateKind, relationKind, entity));
  }

  return Array.from(new Set(collected));
}
