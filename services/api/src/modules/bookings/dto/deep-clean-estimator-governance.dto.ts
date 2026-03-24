import type { DeepCleanEstimatorConfigStatus } from "@prisma/client";
import type { DeepCleanEstimatorConfigPayload } from "../deep-clean-estimator-config.types";

export type DeepCleanEstimatorVersionHistoryRowDto = {
  id: string;
  version: number;
  status: DeepCleanEstimatorConfigStatus;
  label: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdByUserId: string | null;
  publishedByUserId: string | null;
};

export type DeepCleanEstimatorVersionDetailDto = DeepCleanEstimatorVersionHistoryRowDto & {
  config: DeepCleanEstimatorConfigPayload;
};

export type DeepCleanEstimatorRestoreDraftResponseDto = {
  draft: DeepCleanEstimatorVersionDetailDto;
  restoredFromVersion: number;
};

export type DeepCleanEstimatorGovernanceResponseDto = {
  rows: DeepCleanEstimatorVersionHistoryRowDto[];
};
