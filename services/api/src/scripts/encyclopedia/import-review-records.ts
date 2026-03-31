import { importReviewRecordsFromFile } from "../../modules/encyclopedia/review/reviewImport.server";

function run() {
  const result = importReviewRecordsFromFile();

  console.log("REVIEW RECORD IMPORT RESULT");
  console.log(JSON.stringify(result, null, 2));
}

run();
