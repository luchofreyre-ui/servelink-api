import {
  getMethodEntity,
  getSurfaceEntity,
  getSurfaceProblemEntities,
  getSurfaceSafeMethodEntities,
  getSurfaceSafeToolEntities,
  getToolEntity,
  SURFACE_ENTITIES,
} from "../entities";
import type { MethodEntity, ToolEntity } from "../entities";
import type { SurfacePageData } from "./surfacePageTypes";

function mapMethodSlugs(methodSlugs: string[]): MethodEntity[] {
  return methodSlugs
    .map((slug) => getMethodEntity(slug))
    .filter((entity): entity is MethodEntity => Boolean(entity));
}

function mapToolSlugs(toolSlugs: string[]): ToolEntity[] {
  return toolSlugs
    .map((slug) => getToolEntity(slug))
    .filter((entity): entity is ToolEntity => Boolean(entity));
}

export function getAllSurfaceSlugs(): string[] {
  return SURFACE_ENTITIES.map((surface) => surface.slug);
}

export function getSurfacePageData(surfaceSlug: string): SurfacePageData | null {
  const surface = getSurfaceEntity(surfaceSlug);

  if (!surface) {
    return null;
  }

  return {
    surface,
    commonProblems: getSurfaceProblemEntities(surface.slug),
    safeMethods: getSurfaceSafeMethodEntities(surface.slug),
    avoidMethods: mapMethodSlugs(surface.avoidMethodSlugs),
    safeTools: getSurfaceSafeToolEntities(surface.slug),
    avoidTools: mapToolSlugs(surface.avoidToolSlugs),
  };
}
