import {
  getSurfaceEntity,
  getToolEntity,
  getToolSoilEntities,
  getToolSurfaceEntities,
  TOOL_ENTITIES,
} from "../entities";
import type { SurfaceEntity } from "../entities";
import type { ToolPageData } from "./toolPageTypes";

function mapSurfaceSlugs(surfaceSlugs: string[]): SurfaceEntity[] {
  return surfaceSlugs
    .map((slug) => getSurfaceEntity(slug))
    .filter((entity): entity is SurfaceEntity => Boolean(entity));
}

export function getAllToolSlugs(): string[] {
  return TOOL_ENTITIES.map((tool) => tool.slug);
}

export function getToolPageData(toolSlug: string): ToolPageData | null {
  const tool = getToolEntity(toolSlug);

  if (!tool) {
    return null;
  }

  return {
    tool,
    idealForSoils: getToolSoilEntities(tool.slug),
    idealForSurfaces: getToolSurfaceEntities(tool.slug),
    notRecommendedForSurfaces: mapSurfaceSlugs(tool.notRecommendedForSurfaceSlugs),
  };
}
