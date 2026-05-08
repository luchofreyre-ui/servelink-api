import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runMigrationHistoryIntegrityCheck } from "../scripts/migration-history-integrity.lib";

function git(cwd: string, args: string[]): void {
  const r = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed: ${r.stderr || r.stdout || r.status}`,
    );
  }
}

describe("migration history integrity guard", () => {
  it("fails when an existing migration file content changes between base and head", () => {
    const root = mkdtempSync(join(tmpdir(), "servelink-mig-guard-"));
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.email", "ci@example.local"]);
    git(root, ["config", "user.name", "ci"]);

    const landed = join(
      root,
      "services/api/prisma/migrations/20990101000000_fixture_landmark",
    );
    mkdirSync(landed, { recursive: true });
    writeFileSync(join(landed, "migration.sql"), "-- original fixture\n", "utf8");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "landed migration"]);

    const baseSha =
      spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      })
        .stdout?.trim() ?? "";

    writeFileSync(join(landed, "migration.sql"), "-- tampered\n", "utf8");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "mutate landed migration"]);

    const headSha =
      spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      })
        .stdout?.trim() ?? "";

    const result = runMigrationHistoryIntegrityCheck({
      repoRoot: root,
      base: baseSha,
      head: headSha,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0].reason).toContain("content differs");
    }
  });

  it("passes when only a new migration folder is added (forward-only)", () => {
    const root = mkdtempSync(join(tmpdir(), "servelink-mig-guard-"));
    git(root, ["init", "-b", "main"]);
    git(root, ["config", "user.email", "ci@example.local"]);
    git(root, ["config", "user.name", "ci"]);

    const oldDir = join(
      root,
      "services/api/prisma/migrations/20990101000000_fixture_landmark",
    );
    mkdirSync(oldDir, { recursive: true });
    writeFileSync(join(oldDir, "migration.sql"), "-- keep\n", "utf8");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "v1"]);

    const baseSha =
      spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      })
        .stdout?.trim() ?? "";

    const newDir = join(
      root,
      "services/api/prisma/migrations/20990102000000_fixture_forward",
    );
    mkdirSync(newDir, { recursive: true });
    writeFileSync(join(newDir, "migration.sql"), "-- new\n", "utf8");
    git(root, ["add", "."]);
    git(root, ["commit", "-m", "v2 add migration"]);

    const headSha =
      spawnSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      })
        .stdout?.trim() ?? "";

    const result = runMigrationHistoryIntegrityCheck({
      repoRoot: root,
      base: baseSha,
      head: headSha,
    });

    expect(result.ok).toBe(true);
  });
});
