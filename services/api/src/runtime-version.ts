export type RuntimeVersionSource = "env" | "package" | "unknown";

export type RuntimeVersionResponse = {
  service: string;
  version: {
    gitSha: string;
    shortGitSha: string;
    buildTime: string;
    source: {
      gitSha: RuntimeVersionSource;
      buildTime: "env" | "unknown";
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
  "SOURCE_VERSION",
  "COMMIT_SHA",
] as const;

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

export function buildApiRuntimeVersion(
  env: NodeJS.ProcessEnv = process.env,
): RuntimeVersionResponse {
  const gitSha =
    API_GIT_SHA_ENV_KEYS.map((key) => normalizeGitSha(env[key])).find(Boolean) ??
    "unknown";
  const buildTime = normalizeBuildTime(env.BUILD_TIME) ?? "unknown";

  return {
    service: "servelink-api",
    version: {
      gitSha,
      shortGitSha: gitSha === "unknown" ? "unknown" : gitSha.slice(0, 7),
      buildTime,
      source: {
        gitSha: gitSha === "unknown" ? "unknown" : "env",
        buildTime: buildTime === "unknown" ? "unknown" : "env",
      },
    },
    runtime: {
      nodeEnv: normalizeNodeEnv(env.NODE_ENV),
    },
  };
}
