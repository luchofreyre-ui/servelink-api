/* eslint-disable no-console */

import {
  getAttachedEvidenceFilePath,
  getAttachedEvidenceRecords,
} from "../src/lib/encyclopedia/evidenceAttachment.server";

function main() {
  console.log(`Attached evidence: ${getAttachedEvidenceFilePath()}`);
  console.log(JSON.stringify(getAttachedEvidenceRecords(), null, 2));
}

main();
