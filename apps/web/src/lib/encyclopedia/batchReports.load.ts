import fs from "node:fs";
import path from "node:path";

import {
  sortBatchPipelineRuns,
  tryParsePipelineSummaryJson,
  type EncyclopediaBatchPipelineRun,
} from "./batchReports.model";

function reportsDirFromRepoRoot(repoRoot: string): string {
  return path.join(repoRoot, "content-batches", "encyclopedia", "reports");
}

/**
 * Load all `*.pipeline-summary.json` files from the encyclopedia reports directory.
 */
export function loadEncyclopediaBatchPipelineRuns(repoRoot: string = process.cwd()): EncyclopediaBatchPipelineRun[] {
  const dir = reportsDirFromRepoRoot(repoRoot);
  if (!fs.existsSync(dir)) {
    return [];
  }
  const names = fs.readdirSync(dir).filter((n) => n.endsWith(".pipeline-summary.json"));
  const out: EncyclopediaBatchPipelineRun[] = [];

  for (const fileName of names) {
    const abs = path.join(dir, fileName);
    let content: string;
    try {
      content = fs.readFileSync(abs, "utf8");
    } catch {
      continue;
    }
    const rel = `content-batches/encyclopedia/reports/${fileName}`;
    const parsed = tryParsePipelineSummaryJson(content, fileName, rel);
    if (parsed) {
      out.push(parsed);
    }
  }

  return sortBatchPipelineRuns(out);
}
