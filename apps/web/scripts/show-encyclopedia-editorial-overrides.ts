/* eslint-disable no-console */

import {
  getEditorialOverrideFilePath,
  getEditorialOverrides,
} from "../src/lib/encyclopedia/editorialOverride.server";

function main() {
  console.log(`Editorial overrides: ${getEditorialOverrideFilePath()}`);
  console.log(JSON.stringify(getEditorialOverrides(), null, 2));
}

main();
