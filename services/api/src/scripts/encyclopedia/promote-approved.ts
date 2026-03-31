import { promoteApprovedReviewRecords } from "../../modules/encyclopedia/review/reviewPromotion.server";

async function run() {
  const result = await promoteApprovedReviewRecords();

  console.log("PROMOTION RESULT");
  console.log(JSON.stringify(result, null, 2));
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
