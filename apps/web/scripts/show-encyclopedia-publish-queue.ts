/* eslint-disable no-console */

import {
  getPublishQueueFilePath,
  getPublishQueueRecords,
} from "../src/lib/encyclopedia/publishQueue.server";

function main() {
  const filePath = getPublishQueueFilePath();
  const records = getPublishQueueRecords();

  console.log(`Publish queue: ${filePath}`);
  console.log(JSON.stringify(records, null, 2));
}

main();
