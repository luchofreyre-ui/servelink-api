/** Admin deep clean estimator tuning API */

export type DeepCleanEstimatorConfigPayloadApi = {
  globalDurationMultiplier: number;
  singleVisitDurationMultiplier: number;
  threeVisitDurationMultiplier: number;
  visitDurationMultipliers: { visit1: number; visit2: number; visit3: number };
  bedroomAdditiveMinutes: number;
  bathroomAdditiveMinutes: number;
  petAdditiveMinutes: number;
  kitchenHeavySoilAdditiveMinutes: number;
  minimumVisitDurationMinutes: number;
  minimumProgramDurationMinutes: number;
};

export type DeepCleanEstimatorConfigRowApi = {
  id: string;
  version: number;
  status: string;
  label: string;
  config: DeepCleanEstimatorConfigPayloadApi;
  publishedAt: string | null;
  createdByUserId: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DeepCleanEstimatorActiveResponseApi = {
  kind: "deep_clean_estimator_config_active";
  row: DeepCleanEstimatorConfigRowApi;
};

export type DeepCleanEstimatorDraftResponseApi = {
  kind: "deep_clean_estimator_config_draft";
  row: DeepCleanEstimatorConfigRowApi;
};

export type DeepCleanEstimatorDraftUpdatedResponseApi = {
  kind: "deep_clean_estimator_config_draft_updated";
  row: DeepCleanEstimatorConfigRowApi;
};

export type DeepCleanEstimatorPublishedResponseApi = {
  kind: "deep_clean_estimator_config_published";
  published: DeepCleanEstimatorConfigRowApi;
  newDraft: DeepCleanEstimatorConfigRowApi;
};

export type DeepCleanEstimatorPreviewSideApi = {
  id: string;
  version: number;
  label: string;
  totalEstimatedDurationMinutes: number;
  perVisitDurationMinutes: number[];
  estimatedPriceCents: number;
};

export type DeepCleanEstimatorPreviewResponseApi = {
  kind: "deep_clean_estimator_preview";
  active: DeepCleanEstimatorPreviewSideApi;
  draft: DeepCleanEstimatorPreviewSideApi;
  deltaMinutes: number;
  deltaPercent: number | null;
};
