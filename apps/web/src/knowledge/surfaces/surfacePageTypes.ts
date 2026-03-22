import type {
  MethodEntity,
  SoilEntity,
  SurfaceEntity,
  ToolEntity,
} from "../entities";

export type SurfacePageData = {
  surface: SurfaceEntity;
  commonProblems: SoilEntity[];
  safeMethods: MethodEntity[];
  avoidMethods: MethodEntity[];
  safeTools: ToolEntity[];
  avoidTools: ToolEntity[];
};
