import {
  getMethodEntity,
  getMethodCompatibleSurfaceEntities,
  getMethodSoilEntities,
  getSurfaceEntity,
  getToolEntity,
  METHOD_ENTITIES,
} from "../entities";
import type { SurfaceEntity, ToolEntity } from "../entities";
import type { MethodPageData } from "./methodPageTypes";

function mapSurfaceSlugs(surfaceSlugs: string[]): SurfaceEntity[] {
  return surfaceSlugs
    .map((slug) => getSurfaceEntity(slug))
    .filter((entity): entity is SurfaceEntity => Boolean(entity));
}

function mapToolSlugs(toolSlugs: string[]): ToolEntity[] {
  return toolSlugs
    .map((slug) => getToolEntity(slug))
    .filter((entity): entity is ToolEntity => Boolean(entity));
}

export function getAllMethodSlugs(): string[] {
  return METHOD_ENTITIES.map((method) => method.slug);
}

export function getMethodPageData(methodSlug: string): MethodPageData | null {
  const method = getMethodEntity(methodSlug);

  if (!method) {
    return null;
  }

  return {
    method,
    idealForSoils: getMethodSoilEntities(method.slug),
    compatibleSurfaces: getMethodCompatibleSurfaceEntities(method.slug),
    incompatibleSurfaces: mapSurfaceSlugs(method.incompatibleSurfaceSlugs),
    recommendedTools: mapToolSlugs(method.recommendedToolSlugs),
  };
}
