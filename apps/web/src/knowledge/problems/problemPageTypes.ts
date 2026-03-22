import type {
  MethodEntity,
  SoilEntity,
  SurfaceEntity,
  ToolEntity,
} from "../entities";

export type ProblemPageData = {
  problem: SoilEntity;
  relatedSurfaces: SurfaceEntity[];
  recommendedMethods: MethodEntity[];
  avoidMethods: MethodEntity[];
  recommendedTools: ToolEntity[];
  avoidTools: ToolEntity[];
};
