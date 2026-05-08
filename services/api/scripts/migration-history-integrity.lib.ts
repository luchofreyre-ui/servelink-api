/**
 * Core migration-folder immutability check (no I/O except git subprocess).
 * Used by the CLI and by tests.
 */

import { spawnSync } from "node:child_process";

export const MIGRATIONS_PREFIX = "services/api/prisma/migrations";

export type MigrationHistoryViolation = { path: string; reason: string };

export type MigrationHistoryIntegrityResult =
  | { ok: true; detail: string }
  | { ok: false; violations: MigrationHistoryViolation[] };

function strip(s: string): string {
  return s.replace(/\r\n/g, "\n").trimEnd();
}

function git(args: string[], cwd: string): string {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) {
    throw r.error;
  }
  if (r.status !== 0) {
    const stderr = r.stderr?.trim() || "";
    throw new Error(
      stderr || `git ${args.join(" ")} failed with exit ${r.status ?? "unknown"}`,
    );
  }
  return strip(r.stdout ?? "");
}

function gitOrNull(args: string[], cwd: string): string | null {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.status !== 0) {
    return null;
  }
  return strip(r.stdout ?? "");
}

export function pathExistsAtRef(
  repoRoot: string,
  ref: string,
  path: string,
): boolean {
  const r = spawnSync("git", ["cat-file", "-e", `${ref}:${path}`], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return r.status === 0;
}

export function resolveRefToSha(repoRoot: string, ref: string): string | null {
  return gitOrNull(["rev-parse", "--verify", `${ref}^{commit}`], repoRoot);
}

function listMigrationFiles(repoRoot: string, refSha: string): string[] {
  const out = git(
    ["ls-tree", "-r", "--name-only", refSha, "--", `${MIGRATIONS_PREFIX}/`],
    repoRoot,
  );
  if (!out) {
    return [];
  }
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * Compare migration tree at base vs head. Files present at base must still exist at head
 * with identical content. New files on head are allowed.
 */
export function runMigrationHistoryIntegrityCheck(args: {
  repoRoot: string;
  base: string;
  head: string;
}): MigrationHistoryIntegrityResult {
  const { repoRoot, base, head } = args;
  const baseSha = resolveRefToSha(repoRoot, base);
  const headSha = resolveRefToSha(repoRoot, head);

  if (!baseSha) {
    throw new Error(`Could not resolve base ref "${base}" to a commit.`);
  }
  if (!headSha) {
    throw new Error(`Could not resolve head ref "${head}" to a commit.`);
  }

  if (baseSha === headSha) {
    return {
      ok: true,
      detail: `base and head identical (${baseSha}); nothing to compare.`,
    };
  }

  const baseFiles = listMigrationFiles(repoRoot, baseSha);
  const violations: MigrationHistoryViolation[] = [];

  for (const file of baseFiles) {
    if (!file.startsWith(`${MIGRATIONS_PREFIX}/`)) {
      continue;
    }

    if (!pathExistsAtRef(repoRoot, headSha, file)) {
      violations.push({
        path: file,
        reason: "missing at head (deleted or renamed away)",
      });
      continue;
    }

    const diff = spawnSync(
      "git",
      ["diff", "--quiet", baseSha, headSha, "--", file],
      { cwd: repoRoot, stdio: "ignore" },
    );
    if (diff.status !== 0) {
      violations.push({ path: file, reason: "content differs from base" });
    }
  }

  if (violations.length > 0) {
    return { ok: false, violations };
  }

  return {
    ok: true,
    detail: `OK (${baseFiles.length} path(s) preserved from ${base} → ${head}).`,
  };
}
