export type GeneratedRuntimeVersionMetadata = {
  gitSha: string;
  shortGitSha: string;
  buildTime: string;
  source: {
    gitSha: "generated" | "unknown";
    buildTime: "generated" | "unknown";
  };
};

export const generatedRuntimeVersionMetadata: GeneratedRuntimeVersionMetadata = {
  gitSha: "unknown",
  shortGitSha: "unknown",
  buildTime: "unknown",
  source: {
    gitSha: "unknown",
    buildTime: "unknown",
  },
};
