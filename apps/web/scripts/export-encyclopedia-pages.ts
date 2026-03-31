/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";
import { exportPublishedPages } from "../src/lib/encyclopedia/exportPublishedPages";

function main() {
  const output = exportPublishedPages();
  const outDir = path.join(process.cwd(), "content-batches", "encyclopedia");
  const outFile = path.join(outDir, "published-pages.json");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), "utf8");

  console.log(`Exported ${output.length} published pages to ${outFile}`);
}

main();
