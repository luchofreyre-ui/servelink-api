/**
 * Ensures files under services/api/prisma/migrations that existed at --base
 * are byte-identical and still present at --head. New migration folders only.
 *
 * Usage:
 *   npm run check:migration-history -- --base <sha>
 *   npm run check:migration-history -- --base origin/main --head HEAD
 *
 * CI sets --base to the PR base SHA or push "before" SHA (see pr-ci.yml).
 */

import { execFileSync } from "node:child_process";

import {
  runMigrationHistoryIntegrityCheck,
  resolveRefToSha,
} from "./migration-history-integrity.lib";

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
      console.log(
        `Usage: check-migration-history-integrity.ts --base <ref> [--head <ref>]\n`,
      );
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

function main(): void {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim();

  const { base, head } = parseArgs();

  if (!resolveRefToSha(repoRoot, base)) {
    console.error(
      `Could not resolve ref "${base}" to a commit. Fetch with depth or check ref name.`,
    );
    process.exit(2);
  }
  if (!resolveRefToSha(repoRoot, head)) {
    console.error(
      `Could not resolve ref "${head}" to a commit. Fetch with depth or check ref name.`,
    );
    process.exit(2);
  }

  let result;
  try {
    result = runMigrationHistoryIntegrityCheck({ repoRoot, base, head });
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(2);
  }

  if (!result.ok) {
    console.error(
      "Migration history integrity FAILED: landed migration paths must not change.\n",
    );
    for (const v of result.violations) {
      console.error(`  - ${v.path}\n    ${v.reason}\n`);
    }
    console.error(
      "Fix: revert edits under prisma/migrations that pre-existed on main, or add a new migration folder instead.\n" +
        "Policy: docs/engineering/prisma-migration-governance-v1.md\n",
    );
    process.exit(1);
  }

  console.log(`check-migration-history-integrity: ${result.detail}`);
}

main();
