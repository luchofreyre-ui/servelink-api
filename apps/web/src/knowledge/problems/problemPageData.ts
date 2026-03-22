import {
  getMethodEntity,
  getSoilEntity,
  getSoilSurfaceEntities,
  getSoilToolEntities,
  getToolEntity,
  SOIL_ENTITIES,
} from "../entities";
import type { MethodEntity, ToolEntity } from "../entities";
import type { ProblemPageData } from "./problemPageTypes";

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

export function getAllProblemSlugs(): string[] {
  return SOIL_ENTITIES.map((problem) => problem.slug);
}

export function getProblemPageData(problemSlug: string): ProblemPageData | null {
  const problem = getSoilEntity(problemSlug);

  if (!problem) {
    return null;
  }

  return {
    problem,
    relatedSurfaces: getSoilSurfaceEntities(problem.slug),
    recommendedMethods: mapMethodSlugs(problem.recommendedMethodSlugs),
    avoidMethods: mapMethodSlugs(problem.avoidMethodSlugs),
    recommendedTools: getSoilToolEntities(problem.slug),
    avoidTools: mapToolSlugs(problem.avoidToolSlugs),
  };
}
