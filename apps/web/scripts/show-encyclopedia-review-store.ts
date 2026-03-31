/* eslint-disable no-console */

import { getReviewStoreFilePath, getStoredReviewRecords } from "../src/lib/encyclopedia/reviewPersistence.server";

function main() {
  const path = getReviewStoreFilePath();
  const records = getStoredReviewRecords();

  console.log(`Review store: ${path}`);
  console.log(JSON.stringify(records, null, 2));
}

main();
