import type {
  MethodEntity,
  SoilEntity,
  SurfaceEntity,
  ToolEntity,
} from "../entities";

export type MethodPageData = {
  method: MethodEntity;
  idealForSoils: SoilEntity[];
  compatibleSurfaces: SurfaceEntity[];
  incompatibleSurfaces: SurfaceEntity[];
  recommendedTools: ToolEntity[];
};
