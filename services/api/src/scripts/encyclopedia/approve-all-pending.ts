import { approveReview } from "../../modules/encyclopedia/review/reviewActions.server";
import { getAllReviewRecords } from "../../modules/encyclopedia/review/reviewStore.server";

async function run() {
  const rows = getAllReviewRecords();

  for (const row of rows) {
    if (row.reviewStatus === "pending") {
      await approveReview(row.slug);
    }
  }

  console.log("Approved all pending rows");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
