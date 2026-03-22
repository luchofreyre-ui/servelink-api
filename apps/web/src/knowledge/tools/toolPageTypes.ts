import type {
  SoilEntity,
  SurfaceEntity,
  ToolEntity,
} from "../entities";

export type ToolPageData = {
  tool: ToolEntity;
  idealForSoils: SoilEntity[];
  idealForSurfaces: SurfaceEntity[];
  notRecommendedForSurfaces: SurfaceEntity[];
};
