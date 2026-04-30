export type LearningGovernanceSource = "REAL" | "SYNTHETIC";
export type LearningGovernanceEnvironment = "PRODUCTION" | "SANDBOX";

export type LearningGovernanceMetadata = {
  source: LearningGovernanceSource;
  environment: LearningGovernanceEnvironment;
  eligibleForTraining: boolean;
  governanceReason: string;
  createdBy: string;
};

export const REAL_COMPLETION_LEARNING_GOVERNANCE: LearningGovernanceMetadata = {
  source: "REAL",
  environment: "PRODUCTION",
  eligibleForTraining: true,
  governanceReason: "real_completion_learning_event",
  createdBy: "system",
};

export const CONTROLLED_ADMIN_LEARNING_GOVERNANCE: LearningGovernanceMetadata = {
  source: "SYNTHETIC",
  environment: "SANDBOX",
  eligibleForTraining: false,
  governanceReason: "controlled_admin_validation",
  createdBy: "admin",
};

export function assertValidLearningGovernance(
  metadata: LearningGovernanceMetadata,
): LearningGovernanceMetadata {
  if (
    metadata.source === "REAL" &&
    metadata.environment === "PRODUCTION" &&
    metadata.eligibleForTraining === true
  ) {
    return metadata;
  }

  if (
    metadata.source === "SYNTHETIC" &&
    metadata.environment === "SANDBOX" &&
    metadata.eligibleForTraining === false
  ) {
    return metadata;
  }

  throw new Error(
    `INVALID_LEARNING_GOVERNANCE:${metadata.source}:${metadata.environment}:${metadata.eligibleForTraining}`,
  );
}
