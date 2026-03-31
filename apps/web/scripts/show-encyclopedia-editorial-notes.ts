/* eslint-disable no-console */

import fs from "node:fs";
import path from "node:path";

const file = path.join(
  process.cwd(),
  "content-batches/encyclopedia/editorial-notes.json"
);

if (!fs.existsSync(file)) {
  console.log([]);
} else {
  const data = JSON.parse(fs.readFileSync(file, "utf-8")) as {
    records: unknown[];
  };
  console.log(data.records);
}
