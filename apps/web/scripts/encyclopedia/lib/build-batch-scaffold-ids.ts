import fs from "node:fs";
import path from "node:path";

export function dedupeIdsPreserveOrder(ids: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) {
      continue;
    }
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Load IDs from a .json (array or `{ "ids": [] }`) or line-delimited text file.
 * Paths are resolved relative to `repoRoot` when not absolute.
 */
export function loadIdsFromFile(filePath: string, repoRoot: string): string[] {
  const abs = path.isAbsolute(filePath) ? filePath : path.resolve(repoRoot, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`IDs file not found: ${filePath} (resolved: ${abs})`);
  }
  const ext = path.extname(abs).toLowerCase();
  const raw = fs.readFileSync(abs, "utf8");

  let extracted: string[];

  if (ext === ".json") {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch (e) {
      throw new Error(`IDs file is not valid JSON: ${filePath} (${e instanceof Error ? e.message : e})`);
    }
    if (Array.isArray(parsed)) {
      extracted = parsed.map((x) => String(x).trim()).filter(Boolean);
    } else if (parsed && typeof parsed === "object" && "ids" in parsed) {
      const ids = (parsed as { ids: unknown }).ids;
      if (!Array.isArray(ids)) {
        throw new Error(`IDs file JSON object must have an "ids" array: ${filePath}`);
      }
      extracted = ids.map((x) => String(x).trim()).filter(Boolean);
    } else {
      throw new Error(`JSON IDs file must be a string array or { "ids": string[] }: ${filePath}`);
    }
  } else {
    extracted = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  const deduped = dedupeIdsPreserveOrder(extracted);
  if (deduped.length === 0) {
    throw new Error(`IDs file produced an empty ID list after parsing: ${filePath}`);
  }
  return deduped;
}

export function parseCommaSeparatedIds(idsArgValue: string): string[] {
  return dedupeIdsPreserveOrder(
    idsArgValue
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean),
  );
}

export type ResolvedScaffoldIds =
  | { source: "none"; ids: readonly [] }
  | { source: "cli"; ids: string[] }
  | { source: "file"; ids: string[]; idsFilePath: string };

/**
 * Resolves `--ids` vs `--ids-file` (mutually exclusive) vs neither (no ID filter).
 */
export function resolveScaffoldIds(argv: string[], repoRoot: string): ResolvedScaffoldIds {
  const idsArg = argv.find((arg) => arg.startsWith("--ids="));
  const idsFileArg = argv.find((arg) => arg.startsWith("--ids-file="));
  if (idsArg && idsFileArg) {
    throw new Error("Cannot use both --ids and --ids-file; pass one or neither.");
  }
  if (idsFileArg) {
    const p = idsFileArg.slice("--ids-file=".length).trim();
    if (!p) {
      throw new Error("Empty --ids-file path.");
    }
    const ids = loadIdsFromFile(p, repoRoot);
    return { source: "file", ids, idsFilePath: p };
  }
  if (idsArg) {
    const raw = idsArg.slice("--ids=".length);
    const ids = parseCommaSeparatedIds(raw);
    if (ids.length === 0) {
      throw new Error("--ids= produced an empty ID list after parsing.");
    }
    return { source: "cli", ids };
  }
  return { source: "none", ids: [] };
}
