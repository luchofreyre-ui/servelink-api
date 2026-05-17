export type WebRuntimeVersionResponse = {
  service: string;
  version: {
    gitSha: string;
    shortGitSha: string;
    buildTime: string;
    source: {
      gitSha: "env" | "unknown";
      buildTime: "env" | "unknown";
    };
  };
};

const WEB_GIT_SHA_ENV_KEYS = [
  "VERCEL_GIT_COMMIT_SHA",
  "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA",
  "NEXT_PUBLIC_GIT_COMMIT_SHA",
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

export function buildWebRuntimeVersion(
  env: NodeJS.ProcessEnv = process.env,
): WebRuntimeVersionResponse {
  const gitSha =
    WEB_GIT_SHA_ENV_KEYS.map((key) => normalizeGitSha(env[key])).find(Boolean) ??
    "unknown";
  const buildTime = normalizeBuildTime(env.NEXT_PUBLIC_BUILD_TIME) ?? "unknown";

  return {
    service: "servelink-web",
    version: {
      gitSha,
      shortGitSha: gitSha === "unknown" ? "unknown" : gitSha.slice(0, 7),
      buildTime,
      source: {
        gitSha: gitSha === "unknown" ? "unknown" : "env",
        buildTime: buildTime === "unknown" ? "unknown" : "env",
      },
    },
  };
}
