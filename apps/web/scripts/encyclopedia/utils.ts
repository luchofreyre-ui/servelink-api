import fs from "node:fs";
import path from "node:path";

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function readJsonFile<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function writeTextFile(filePath: string, contents: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, contents, "utf8");
}

export function yamlList(values: string[]): string {
  return values
    .map((value) => `  - ${value.replace(/\n/g, " ").trim()}`)
    .join("\n");
}

export function normalizeParagraphBlock(value: string): string {
  return value.trim().replace(/\r\n/g, "\n");
}

export function walkFiles(dirPath: string, extension: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath, extension));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(extension)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

export function parseYamlListBlock(
  lines: string[],
  startIndex: number,
): { values: string[]; nextIndex: number } {
  const values: string[] = [];
  let index = startIndex + 1;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.startsWith("  - ")) {
      break;
    }

    values.push(line.slice(4).trim());
    index += 1;
  }

  return { values, nextIndex: index };
}

export function parseSimpleFrontmatter(raw: string): {
  record: Record<string, string | string[]>;
  body: string;
} {
  if (!raw.startsWith("---\n")) {
    throw new Error("Markdown file is missing opening frontmatter fence.");
  }

  const closingIndex = raw.indexOf("\n---\n", 4);

  if (closingIndex === -1) {
    throw new Error("Markdown file is missing closing frontmatter fence.");
  }

  const frontmatterRaw = raw.slice(4, closingIndex);
  const body = raw.slice(closingIndex + 5).trim();
  const lines = frontmatterRaw.split("\n");
  const record: Record<string, string | string[]> = {};

  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (value.length > 0) {
      record[key] = value;
      index += 1;
      continue;
    }

    const { values, nextIndex } = parseYamlListBlock(lines, index);
    record[key] = values;
    index = nextIndex;
  }

  return { record, body };
}
