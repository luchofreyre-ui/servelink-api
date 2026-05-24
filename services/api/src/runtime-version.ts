import fs from "fs";
import path from "path";

import {
  generatedRuntimeVersionMetadata,
  type GeneratedRuntimeVersionMetadata,
} from "./runtime-version.generated";

export type RuntimeVersionSource = "env" | "generated" | "package" | "unknown";

export type RuntimeVersionResponse = {
  service: string;
  version: {
    gitSha: string;
    shortGitSha: string;
    buildTime: string;
    source: {
      gitSha: RuntimeVersionSource;
      buildTime: "env" | "generated" | "unknown";
    };
  };
  runtime: {
    nodeEnv: "production" | "development" | "test" | "unknown";
  };
};

const API_GIT_SHA_ENV_KEYS = [
  "RAILWAY_GIT_COMMIT_SHA",
  "VERCEL_GIT_COMMIT_SHA",
  "GIT_COMMIT_SHA",
  "GIT_SHA",
  "GITHUB_SHA",
  "SOURCE_VERSION",
  "COMMIT_SHA",
] as const;

const GENERATED_RUNTIME_VERSION_FILENAME = "runtime-version.generated.json";

function normalizeGitSha(value: string | undefined): string | null {
  const candidate = value?.trim() ?? "";
  if (!/^[a-f0-9]{7,64}$/i.test(candidate)) return null;
  return candidate;
}

function normalizeBuildTime(value: string | undefined): string | null {
  const candidate = value?.trim() ?? "";
  if (!candidate || candidate.length > 64) return null;
  if (Number.isNaN(Date.parse(candidate))) return null;
  return candidate;
}

function normalizeNodeEnv(
  value: string | undefined,
): RuntimeVersionResponse["runtime"]["nodeEnv"] {
  if (value === "production" || value === "development" || value === "test") {
    return value;
  }
  return "unknown";
}

function readGeneratedRuntimeVersionMetadata(): GeneratedRuntimeVersionMetadata {
  try {
    const generatedPath = path.join(__dirname, GENERATED_RUNTIME_VERSION_FILENAME);
    const raw = fs.readFileSync(generatedPath, "utf8");
    return JSON.parse(raw) as GeneratedRuntimeVersionMetadata;
  } catch {
    return generatedRuntimeVersionMetadata;
  }
}

export function buildApiRuntimeVersion(
  env: NodeJS.ProcessEnv = process.env,
  generatedMetadata: GeneratedRuntimeVersionMetadata = readGeneratedRuntimeVersionMetadata(),
): RuntimeVersionResponse {
  const envGitSha = API_GIT_SHA_ENV_KEYS.map((key) =>
    normalizeGitSha(env[key]),
  ).find(Boolean);
  const generatedGitSha = normalizeGitSha(generatedMetadata.gitSha);
  const gitSha = envGitSha ?? generatedGitSha ?? "unknown";

  const envBuildTime = normalizeBuildTime(env.BUILD_TIME);
  const generatedBuildTime = normalizeBuildTime(generatedMetadata.buildTime);
  const buildTime = envBuildTime ?? generatedBuildTime ?? "unknown";

  return {
    service: "servelink-api",
    version: {
      gitSha,
      shortGitSha: gitSha === "unknown" ? "unknown" : gitSha.slice(0, 7),
      buildTime,
      source: {
        gitSha: envGitSha ? "env" : generatedGitSha ? "generated" : "unknown",
        buildTime: envBuildTime
          ? "env"
          : generatedBuildTime
            ? "generated"
            : "unknown",
      },
    },
    runtime: {
      nodeEnv: normalizeNodeEnv(env.NODE_ENV),
    },
  };
}
