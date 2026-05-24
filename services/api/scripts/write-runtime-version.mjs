import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SHA_ENV_KEYS = [
  "RAILWAY_GIT_COMMIT_SHA",
  "GIT_COMMIT_SHA",
  "COMMIT_SHA",
  "GITHUB_SHA",
  "SOURCE_VERSION",
];

function normalizeGitSha(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  return /^[a-f0-9]{7,64}$/i.test(candidate) ? candidate : null;
}

function normalizeBuildTime(value) {
  const candidate = typeof value === "string" ? value.trim() : "";
  if (!candidate || candidate.length > 64) return null;
  return Number.isNaN(Date.parse(candidate)) ? null : candidate;
}

function readGitShaFromEnv() {
  for (const key of SHA_ENV_KEYS) {
    const value = normalizeGitSha(process.env[key]);
    if (value) return value;
  }
  return null;
}

function readGitShaFromGit() {
  try {
    return normalizeGitSha(
      execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../.."),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }),
    );
  } catch {
    return null;
  }
}

const outputPath = path.resolve(
  process.cwd(),
  process.argv[2] ?? "dist/runtime-version.generated.json",
);

const gitSha = readGitShaFromEnv() ?? readGitShaFromGit() ?? "unknown";
const buildTime = normalizeBuildTime(process.env.BUILD_TIME) ?? new Date().toISOString();

const metadata = {
  gitSha,
  shortGitSha: gitSha === "unknown" ? "unknown" : gitSha.slice(0, 7),
  buildTime,
  source: {
    gitSha: gitSha === "unknown" ? "unknown" : "generated",
    buildTime: "generated",
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(metadata, null, 2)}\n`);
