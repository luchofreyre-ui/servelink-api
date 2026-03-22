import { METHOD_ENTITIES } from "./methods";
import { SOIL_ENTITIES } from "./soils";
import { SURFACE_ENTITIES } from "./surfaces";
import { TOOL_ENTITIES } from "./tools";
import type {
  EntitySlugMap,
  KnowledgeEntity,
  MethodEntity,
  SoilEntity,
  SurfaceEntity,
  ToolEntity,
} from "./types";

export { METHOD_ENTITIES } from "./methods";
export { SOIL_ENTITIES } from "./soils";
export { SURFACE_ENTITIES } from "./surfaces";
export { TOOL_ENTITIES } from "./tools";
export type * from "./types";

export const KNOWLEDGE_ENTITY_SLUGS: EntitySlugMap = {
  soils: SOIL_ENTITIES.map((entity) => entity.slug),
  surfaces: SURFACE_ENTITIES.map((entity) => entity.slug),
  methods: METHOD_ENTITIES.map((entity) => entity.slug),
  tools: TOOL_ENTITIES.map((entity) => entity.slug),
};

export const ALL_KNOWLEDGE_ENTITIES: KnowledgeEntity[] = [
  ...SOIL_ENTITIES,
  ...SURFACE_ENTITIES,
  ...METHOD_ENTITIES,
  ...TOOL_ENTITIES,
];

function indexBySlug<T extends { slug: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.slug] = item;
    return acc;
  }, {});
}

export const SOIL_ENTITY_MAP = indexBySlug<SoilEntity>(SOIL_ENTITIES);
export const SURFACE_ENTITY_MAP = indexBySlug<SurfaceEntity>(SURFACE_ENTITIES);
export const METHOD_ENTITY_MAP = indexBySlug<MethodEntity>(METHOD_ENTITIES);
export const TOOL_ENTITY_MAP = indexBySlug<ToolEntity>(TOOL_ENTITIES);
export const ALL_KNOWLEDGE_ENTITY_MAP = indexBySlug<KnowledgeEntity>(ALL_KNOWLEDGE_ENTITIES);

export function getSoilEntity(slug: string): SoilEntity | undefined {
  return SOIL_ENTITY_MAP[slug];
}

export function getSurfaceEntity(slug: string): SurfaceEntity | undefined {
  return SURFACE_ENTITY_MAP[slug];
}

export function getMethodEntity(slug: string): MethodEntity | undefined {
  return METHOD_ENTITY_MAP[slug];
}

export function getToolEntity(slug: string): ToolEntity | undefined {
  return TOOL_ENTITY_MAP[slug];
}

export function getKnowledgeEntity(slug: string): KnowledgeEntity | undefined {
  return ALL_KNOWLEDGE_ENTITY_MAP[slug];
}

export function listSoilEntities(): SoilEntity[] {
  return SOIL_ENTITIES;
}

export function listSurfaceEntities(): SurfaceEntity[] {
  return SURFACE_ENTITIES;
}

export function listMethodEntities(): MethodEntity[] {
  return METHOD_ENTITIES;
}

export function listToolEntities(): ToolEntity[] {
  return TOOL_ENTITIES;
}

export function getSoilSurfaceEntities(soilSlug: string): SurfaceEntity[] {
  const soil = getSoilEntity(soilSlug);
  if (!soil) return [];
  return soil.affectedSurfaceSlugs
    .map((slug) => getSurfaceEntity(slug))
    .filter((entity): entity is SurfaceEntity => Boolean(entity));
}

export function getSoilMethodEntities(soilSlug: string): MethodEntity[] {
  const soil = getSoilEntity(soilSlug);
  if (!soil) return [];
  return soil.recommendedMethodSlugs
    .map((slug) => getMethodEntity(slug))
    .filter((entity): entity is MethodEntity => Boolean(entity));
}

export function getSoilToolEntities(soilSlug: string): ToolEntity[] {
  const soil = getSoilEntity(soilSlug);
  if (!soil) return [];
  return soil.recommendedToolSlugs
    .map((slug) => getToolEntity(slug))
    .filter((entity): entity is ToolEntity => Boolean(entity));
}

export function getSurfaceProblemEntities(surfaceSlug: string): SoilEntity[] {
  const surface = getSurfaceEntity(surfaceSlug);
  if (!surface) return [];
  return surface.commonProblemSlugs
    .map((slug) => getSoilEntity(slug))
    .filter((entity): entity is SoilEntity => Boolean(entity));
}

export function getSurfaceSafeMethodEntities(surfaceSlug: string): MethodEntity[] {
  const surface = getSurfaceEntity(surfaceSlug);
  if (!surface) return [];
  return surface.safeMethodSlugs
    .map((slug) => getMethodEntity(slug))
    .filter((entity): entity is MethodEntity => Boolean(entity));
}

export function getSurfaceSafeToolEntities(surfaceSlug: string): ToolEntity[] {
  const surface = getSurfaceEntity(surfaceSlug);
  if (!surface) return [];
  return surface.safeToolSlugs
    .map((slug) => getToolEntity(slug))
    .filter((entity): entity is ToolEntity => Boolean(entity));
}

export function getMethodSoilEntities(methodSlug: string): SoilEntity[] {
  const method = getMethodEntity(methodSlug);
  if (!method) return [];
  return method.idealForSoilSlugs
    .map((slug) => getSoilEntity(slug))
    .filter((entity): entity is SoilEntity => Boolean(entity));
}

export function getMethodCompatibleSurfaceEntities(methodSlug: string): SurfaceEntity[] {
  const method = getMethodEntity(methodSlug);
  if (!method) return [];
  return method.compatibleSurfaceSlugs
    .map((slug) => getSurfaceEntity(slug))
    .filter((entity): entity is SurfaceEntity => Boolean(entity));
}

export function getMethodToolEntities(methodSlug: string): ToolEntity[] {
  const method = getMethodEntity(methodSlug);
  if (!method) return [];
  return method.recommendedToolSlugs
    .map((slug) => getToolEntity(slug))
    .filter((entity): entity is ToolEntity => Boolean(entity));
}

export function getToolSoilEntities(toolSlug: string): SoilEntity[] {
  const tool = getToolEntity(toolSlug);
  if (!tool) return [];
  return tool.idealForSoilSlugs
    .map((slug) => getSoilEntity(slug))
    .filter((entity): entity is SoilEntity => Boolean(entity));
}

export function getToolSurfaceEntities(toolSlug: string): SurfaceEntity[] {
  const tool = getToolEntity(toolSlug);
  if (!tool) return [];
  return tool.idealForSurfaceSlugs
    .map((slug) => getSurfaceEntity(slug))
    .filter((entity): entity is SurfaceEntity => Boolean(entity));
}
