/**
 * Ensures files under services/api/prisma/migrations that existed at --base
 * are byte-identical and still present at --head. New migration folders only.
 *
 * Usage:
 *   npm run check:migration-history -- --base <sha>
 *   npm run check:migration-history -- --base origin/main --head HEAD
 *
 * CI sets --base to the PR merge-base parent or push event "before" SHA.
 */

import { execFileSync, spawnSync } from "node:child_process";

const MIGRATIONS_PREFIX = "services/api/prisma/migrations";

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

function pathExistsAtRef(repoRoot: string, ref: string, path: string): boolean {
  const r = spawnSync("git", ["cat-file", "-e", `${ref}:${path}`], {
    cwd: repoRoot,
    stdio: "ignore",
  });
  return r.status === 0;
}

function parseArgs(): { base: string; head: string } {
  let base = process.env.MIGRATION_INTEGRITY_BASE_REF?.trim() || "";
  let head = process.env.MIGRATION_INTEGRITY_HEAD_REF?.trim() || "HEAD";

  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a === "--base") {
      base = process.argv[++i] ?? "";
    } else if (a === "--head") {
      head = process.argv[++i] ?? "";
    } else if (a === "--help" || a === "-h") {
      console.log(`Usage: check-migration-history-integrity.ts --base <ref> [--head <ref>]\n`);
      process.exit(0);
    }
  }

  if (!base) {
    console.error(
      "Missing --base (or MIGRATION_INTEGRITY_BASE_REF). Example: --base origin/main",
    );
    process.exit(2);
  }

  if (!head) {
    console.error("Missing --head (or MIGRATION_INTEGRITY_HEAD_REF).");
    process.exit(2);
  }

  return { base, head };
}

function resolveRef(repoRoot: string, ref: string): string {
  const out = gitOrNull(["rev-parse", "--verify", `${ref}^{commit}`], repoRoot);
  if (!out) {
    console.error(
      `Could not resolve ref "${ref}" to a commit. Fetch with depth or check ref name.`,
    );
    process.exit(2);
  }
  return out;
}

function listMigrationFiles(repoRoot: string, ref: string): string[] {
  const out = git(
    ["ls-tree", "-r", "--name-only", ref, "--", `${MIGRATIONS_PREFIX}/`],
    repoRoot,
  );
  if (!out) {
    return [];
  }
  return out.split("\n").map((l) => l.trim()).filter(Boolean);
}

function main(): void {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();

  const { base, head } = parseArgs();
  const baseSha = resolveRef(repoRoot, base);
  const headSha = resolveRef(repoRoot, head);

  if (baseSha === headSha) {
    console.log(
      `check-migration-history-integrity: base and head identical (${baseSha}); nothing to compare.`,
    );
    return;
  }

  const baseFiles = listMigrationFiles(repoRoot, baseSha);
  const violations: { path: string; reason: string }[] = [];

  for (const file of baseFiles) {
    if (!file.startsWith(`${MIGRATIONS_PREFIX}/`)) {
      continue;
    }

    if (!pathExistsAtRef(repoRoot, headSha, file)) {
      violations.push({ path: file, reason: "missing at head (deleted or renamed away)" });
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
    console.error(
      "Migration history integrity FAILED: landed migration paths must not change.\n",
    );
    for (const v of violations) {
      console.error(`  - ${v.path}\n    ${v.reason}\n`);
    }
    console.error(
      "Fix: revert edits under prisma/migrations that pre-existed on main, or add a new migration folder instead.\n" +
        "Policy: docs/engineering/prisma-migration-governance-v1.md\n",
    );
    process.exit(1);
  }

  console.log(
    `check-migration-history-integrity: OK (${baseFiles.length} path(s) preserved from ${base} → ${head}).`,
  );
}

main();
